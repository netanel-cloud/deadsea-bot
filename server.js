import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ── Clients ──────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WA_TOKEN     = process.env.META_WA_TOKEN;
const PHONE_ID     = process.env.META_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const META_URL     = `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`;

// ── System Prompt (loaded from file — easy to update) ────
const SYSTEM_PROMPT = fs.readFileSync(
  join(__dirname, 'SYSTEM_PROMPT.md'), 'utf8'
);

// ── Conversation memory ──────────────────────────────────
// Key: phone number  |  Value: [{role, content}, ...]
// NOTE: In-memory only — restarts clear history.
// For production persistence, replace with Redis.
const conversations = new Map();
const MAX_MESSAGES  = 20; // keep last 20 messages per user

// ── Helpers ──────────────────────────────────────────────
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

async function sendTypingIndicator(to) {
  // Mark message as "read" → shows typing bubble on user side
  // (Meta doesn't support explicit typing indicator via Cloud API yet)
}

async function getAIReply(from, userText) {
  if (!conversations.has(from)) conversations.set(from, []);
  const history = conversations.get(from);

  history.push({ role: 'user', content: userText });

  // Trim old messages to stay within token limits
  if (history.length > MAX_MESSAGES) history.splice(0, 2);

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 700,
    system:     SYSTEM_PROMPT,
    messages:   history,
  });

  const reply = response.content[0].text;
  history.push({ role: 'assistant', content: reply });
  return reply;
}

// ── Webhook: GET — Meta verification ─────────────────────
app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified by Meta');
    res.status(200).send(challenge);
  } else {
    console.warn('⚠️  Webhook verification failed');
    res.sendStatus(403);
  }
});

// ── Webhook: POST — incoming messages ────────────────────
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Ack immediately to Meta (< 5s required)

  try {
    const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!entry?.messages) return; // status updates, etc.

    const msg = entry.messages[0];
    if (msg.type !== 'text') {
      // Handle non-text (image, audio, etc.)
      await sendWhatsApp(msg.from,
        'שלום! כרגע אני מטפל בהודעות טקסט בלבד. ' +
        'לעזרה מהירה — כתבו לי טקסט או התקשרו: 054-331-6613 🙏');
      return;
    }

    const from      = msg.from;
    const userText  = msg.text.body.trim();
    const name      = entry.contacts?.[0]?.profile?.name || 'לקוח';

    console.log(`📩 [${name} | ${from}]: ${userText}`);

    // Ignore empty
    if (!userText) return;

    // Get AI reply
    const reply = await getAIReply(from, userText);
    await sendWhatsApp(from, reply);

    console.log(`✅ Replied to ${name}: ${reply.slice(0, 60)}...`);

  } catch (err) {
    console.error('❌ Webhook handler error:', err.message);
    // Try to notify user of error (best-effort)
    const from = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
    if (from) {
      await sendWhatsApp(from,
        'מצטערים, הייתה בעיה טכנית רגעית. נסו שוב בעוד רגע, ' +
        'או התקשרו ישירות: 054-331-6613 🙏');
    }
  }
});

// ── Health check ─────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  bot: 'תיירות ים המלח',
  time: new Date().toISOString(),
}));

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌊 Dead Sea Rider Bot — פועל על port ${PORT}`);
  console.log(`📋 System Prompt: ${SYSTEM_PROMPT.length} תווים`);
  console.log(`🔗 Webhook URL: https://YOUR_DOMAIN/webhook`);
});
