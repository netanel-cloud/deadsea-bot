import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ── CORS: allow website widget to call the bot ────────────
app.use(cors({
  origin: true,
}));

// ── Static files: serve the widget JS ────────────────────
app.use(express.static(__dirname));

// ── Clients ──────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WA_TOKEN     = process.env.META_WA_TOKEN;
const PHONE_ID     = process.env.META_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const META_URL     = `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`;

const SYSTEM_PROMPT = fs.readFileSync(
  join(__dirname, 'SYSTEM_PROMPT.md'), 'utf8'
);

const conversations = new Map();
const MAX_MESSAGES  = 20;

async function sendWhatsApp(to, text) {
  try {
    await axios.post(META_URL, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text, preview_url: false },
    }, {
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('❌ sendWhatsApp error:', err.response?.data || err.message);
  }
}

// ── ENDPOINT FOR WEBSITE WIDGET ───────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages required' });
    }

    const trimmed = messages.slice(-MAX_MESSAGES);

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5',
      max_tokens: 700,
      system:     SYSTEM_PROMPT,
      messages:   trimmed,
    });

    const reply = response.content[0].text;
    console.log(`💬 Website chat: ${trimmed[trimmed.length-1].content.slice(0,40)}...`);
    res.json({ reply });

  } catch (err) {
    console.error('❌ /api/chat error:', err.message);
    res.status(500).json({ error: 'מצטערים, הייתה בעיה זמנית.' });
  }
});

// ── WhatsApp Webhook ─────────────────────────────────────
app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified by Meta');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!entry?.messages) return;

    const msg = entry.messages[0];
    if (msg.type !== 'text') {
      await sendWhatsApp(msg.from,
        'שלום! כרגע אני מטפל בהודעות טקסט בלבד. ' +
        'התקשרו: 054-331-6613 🙏');
      return;
    }

    const from     = msg.from;
    const userText = msg.text.body.trim();
    if (!userText) return;

    if (!conversations.has(from)) conversations.set(from, []);
    const history = conversations.get(from);
    history.push({ role: 'user', content: userText });
    if (history.length > MAX_MESSAGES) history.splice(0, 2);

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5',
      max_tokens: 700,
      system:     SYSTEM_PROMPT,
      messages:   history,
    });
    const reply = response.content[0].text;
    history.push({ role: 'assistant', content: reply });

    await sendWhatsApp(from, reply);

  } catch (err) {
    console.error('❌ Webhook error:', err.message);
  }
});

app.get('/health', (_, res) => res.json({
  status: 'ok',
  bot: 'תיירות ים המלח',
  time: new Date().toISOString(),
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌊 Dead Sea Rider Bot — running on port ${PORT}`);
});
