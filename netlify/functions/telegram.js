/**
 * Netlify Function: отправка уведомления в Telegram.
 * Токен и Chat ID задаются в настройках сайта Netlify (Environment variables).
 *
 * Переменные: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS (через запятую)
 */

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsStr = process.env.TELEGRAM_CHAT_IDS || '';

  if (!token || !chatIdsStr.trim()) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_IDS должны быть заданы в настройках сайта',
      }),
    };
  }

  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON body' }),
    };
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
    const esc = (t) =>
      t == null || t === ''
        ? ''
        : String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    message = '🔔 <b>Новая заявка с сайта</b>\n\n📅 <b>Дата:</b> ' + date + '\n\n';
    if (body.name) message += '👤 <b>ФИО:</b> ' + esc(body.name) + '\n';
    if (body.phone) message += '📞 <b>Телефон:</b> ' + esc(body.phone) + '\n';
    if (body.address) message += '📍 <b>Адрес:</b> ' + esc(body.address) + '\n';
    if (body.boiler_model) message += '🔥 <b>Модель котла:</b> ' + esc(body.boiler_model) + '\n';
    if (body.best_time) message += '⏰ <b>Удобное время:</b> ' + esc(body.best_time) + '\n';
    if (body.description) message += '\n📝 <b>Описание:</b>\n' + esc(body.description) + '\n';
  }

  if (body.request_topic && message.trim()) {
    const topic = String(body.request_topic).trim();
    if (topic) {
      message = '📌 <b>Заявка на ' + topic.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</b>\n\n' + message;
    }
  }

  if (body.request_type === 'urgent' && message.trim()) {
    message =
      '‼️‼️‼️ <b>СРОЧНЫЙ ВЫЗОВ</b> ‼️‼️‼️\n<b>Свяжитесь с человеком для обсуждения деталей.</b>\n\n' +
      message;
  }

  if (!message.trim()) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'message is required' }),
    };
  }

  const chatIds = chatIdsStr
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (chatIds.length === 0) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'TELEGRAM_CHAT_IDS должен содержать хотя бы один ID',
      }),
    };
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

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ ok: true, sent, status: 'success' }),
  };
};
