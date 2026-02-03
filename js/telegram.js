/**
 * Telegram-уведомления через ваш хостинг (Vercel или Netlify).
 * Токен и Chat ID настраиваются только на сервере — в коде сайта их нет.
 *
 * Настройка:
 * 1. Хостите сайт на Vercel или Netlify (см. TELEGRAM_SETUP.md).
 * 2. В настройках проекта добавьте переменные: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS.
 * 3. Ниже укажите notifyEndpoint и включите уведомления.
 */

const TELEGRAM_CONFIG = {
  // Включить/выключить уведомления
  enabled: true,

  // Куда отправлять запрос с текстом уведомления (тот же домен, без CORS):
  // — Vercel:  '/api/telegram'
  // — Netlify: '/.netlify/functions/telegram'
  notifyEndpoint: '/api/telegram',
};

/**
 * Отправляет уведомление в Telegram через ваш бэкенд (Vercel/Netlify).
 * @param {string} message — готовый текст сообщения (HTML)
 * @returns {Promise<boolean>}
 */
async function sendTelegramNotification(message) {
  if (!TELEGRAM_CONFIG.enabled) {
    console.log('Telegram уведомления отключены');
    return false;
  }

  const endpoint = (TELEGRAM_CONFIG.notifyEndpoint || '').trim();
  if (!endpoint) {
    console.error('Укажите TELEGRAM_CONFIG.notifyEndpoint (например /api/telegram для Vercel)');
    return false;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Ошибка отправки уведомления в Telegram:', data);
      return false;
    }

    if (data.ok) {
      console.log('Уведомление отправлено в Telegram');
      return true;
    }

    console.error('Ответ сервера:', data);
    return false;
  } catch (err) {
    console.error('Ошибка при отправке в Telegram:', err);
    return false;
  }
}

/**
 * Форматирует данные заявки в сообщение для Telegram.
 * @param {Object} formData — поля формы (name, phone, address, …)
 * @returns {string}
 */
function formatApplicationMessage(formData) {
  const date = new Date().toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `🔔 <b>Новая заявка с сайта</b>\n\n`;
  message += `📅 <b>Дата:</b> ${date}\n\n`;

  if (formData.name) {
    message += `👤 <b>ФИО:</b> ${escapeHtml(formData.name)}\n`;
  }
  if (formData.phone) {
    message += `📞 <b>Телефон:</b> ${escapeHtml(formData.phone)}\n`;
  }
  if (formData.address) {
    message += `📍 <b>Адрес:</b> ${escapeHtml(formData.address)}\n`;
  }
  if (formData.boiler_model) {
    message += `🔥 <b>Модель котла:</b> ${escapeHtml(formData.boiler_model)}\n`;
  }
  if (formData.best_time) {
    message += `⏰ <b>Удобное время:</b> ${escapeHtml(formData.best_time)}\n`;
  }
  if (formData.description) {
    message += `\n📝 <b>Описание:</b>\n${escapeHtml(formData.description)}\n`;
  }

  return message;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sendTelegramNotification, formatApplicationMessage };
}
