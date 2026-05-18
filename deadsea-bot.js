// ──────────────────────────────────────────────────────────
// הוסיפו את הקוד הזה ל-server.js
// ──────────────────────────────────────────────────────────

import cors from 'cors';

// אפשרו לאתר שלכם לדבר עם השרת
app.use(cors({
  origin: [
    'https://deadsearider.com',
    'https://www.deadsearider.com',
    'http://localhost:3000', // לפיתוח
  ],
}));

// Endpoint לצ'אט מהאתר (לא Webhook של WhatsApp)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages required' });
    }

    // הגבלת מספר ההודעות (anti-abuse)
    const trimmed = messages.slice(-20);

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5',
      max_tokens: 700,
      system:     SYSTEM_PROMPT,
      messages:   trimmed,
    });

    res.json({ reply: response.content[0].text });

  } catch (err) {
    console.error('❌ /api/chat error:', err.message);
    res.status(500).json({
      error: 'מצטערים, הייתה בעיה זמנית.',
    });
  }
});
