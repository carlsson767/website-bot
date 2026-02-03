/**
 * Vercel Serverless Function: отправка уведомления в Telegram.
 * Токен и Chat ID берутся из переменных окружения (безопасно).
 *
 * Переменные в Vercel: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS (через запятую)
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsStr = process.env.TELEGRAM_CHAT_IDS || '';

  if (!token || !chatIdsStr.trim()) {
    return res.status(500).json({
      ok: false,
      error: 'TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_IDS должны быть заданы в настройках проекта',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  const message = body.message || body.text || '';
  if (!message.trim()) {
    return res.status(400).json({ ok: false, error: 'message is required' });
  }

  const chatIds = chatIdsStr
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (chatIds.length === 0) {
    return res.status(500).json({
      ok: false,
      error: 'TELEGRAM_CHAT_IDS должен содержать хотя бы один ID',
    });
  }

  const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  let sent = 0;

  for (const chatId of chatIds) {
    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (data.ok) sent++;
    } catch (e) {
      console.error('Telegram send error:', e);
    }
  }

  return res.status(200).json({ ok: true, sent });
};
