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

  // GET — проверка, что функция задеплоена (откройте в браузере ваш-сайт.vercel.app/api/telegram)
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>API</title></head><body style="font-family:sans-serif;padding:2rem;background:#f5f5f5;color:#111;">' +
      '<h1>API работает</h1>' +
      '<p>Функция Telegram задеплоена. Отправьте форму на главной странице — заявка придёт в Telegram.</p>' +
      '<p><a href="/">Вернуться на сайт</a></p>' +
      '</body></html>'
    );
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

  // Готовое сообщение или данные формы — собираем текст для Telegram
  let message = body.message || body.text || '';
  if (!message.trim() && (body.name || body.phone)) {
    const date = new Date().toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const esc = (t) => (t == null || t === '') ? '' : String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    message = '🔔 <b>Новая заявка с сайта</b>\n\n📅 <b>Дата:</b> ' + date + '\n\n';
    if (body.name) message += '👤 <b>ФИО:</b> ' + esc(body.name) + '\n';
    if (body.phone) message += '📞 <b>Телефон:</b> ' + esc(body.phone) + '\n';
    if (body.address) message += '📍 <b>Адрес:</b> ' + esc(body.address) + '\n';
    if (body.boiler_model) message += '🔥 <b>Модель котла:</b> ' + esc(body.boiler_model) + '\n';
    if (body.best_time) message += '⏰ <b>Удобное время:</b> ' + esc(body.best_time) + '\n';
    if (body.description) message += '\n📝 <b>Описание:</b>\n' + esc(body.description) + '\n';
  }
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

  return res.status(200).json({ ok: true, sent, status: 'success' });
};
