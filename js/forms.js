document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('.js-lead-form');
  if (!forms.length) return;

  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const phoneInput = form.querySelector('input[name="phone"]');
      if (!(phoneInput instanceof HTMLInputElement)) return;

      clearFormState(form, phoneInput);

      const phone = phoneInput.value.trim();
      if (!isValidPhone(phone)) {
        phoneInput.classList.add('form__input--error');
        showFormMessage(form, 'Пожалуйста, укажите корректный номер телефона.', 'error');
        return;
      }

      phoneInput.disabled = true;
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Отправить';
      
      if (submitBtn) {
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;
      }

      // Сбор данных
      const formData = new FormData(form);
      const data = {
          name: formData.get('full_name'),
          phone: formData.get('phone'),
          address: formData.get('address'),
          boiler_model: formData.get('boiler_model'),
          best_time: formData.get('best_time'),
          description: formData.get('description')
      };

      // Определяем URL API
      // ВАЖНО: Если бот и сайт на разных серверах, укажите здесь прямой IP адреса бота
      // Например: const apiUrl = 'http://123.45.67.89:8000/submit';
      const apiHost = window.location.hostname || 'localhost';
      const apiUrl = `http://${apiHost}:8000/submit`;

      fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
         if (!response.ok) {
             throw new Error('Network response was not ok');
         }
         return response.json();
      })
      .then(result => {
        if (result.status === 'success') {
             form.reset();
             showFormMessage(
               form,
               'Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.',
               'success',
             );
             
             // Отправка уведомления в Telegram
             if (typeof sendTelegramNotification !== 'undefined' && typeof formatApplicationMessage !== 'undefined') {
               const telegramMessage = formatApplicationMessage(data);
               sendTelegramNotification(telegramMessage).catch(err => {
                 console.error('Ошибка отправки уведомления в Telegram:', err);
                 // Не показываем ошибку пользователю, так как основная заявка уже отправлена
               });
             }
        } else {
             showFormMessage(form, 'Ошибка: ' + (result.message || 'Не удалось сохранить заявку'), 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showFormMessage(form, 'Ошибка связи с сервером. Попробуйте позже или позвоните нам.', 'error');
      })
      .finally(() => {
        phoneInput.disabled = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
      });
    });
  });
});

function isValidPhone(phone) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

function clearFormState(form, input) {
  input.classList.remove('form__input--error');
  const msg = form.querySelector('.form__message');
  if (msg && msg.parentElement === form) {
    msg.remove();
  }
}

function showFormMessage(form, text, type) {
  let msg = form.querySelector('.form__message');
  if (!msg) {
    msg = document.createElement('div');
    msg.className = 'form__message';
    form.appendChild(msg);
  }

  msg.textContent = text;
  msg.classList.toggle('form__message--success', type === 'success');
  msg.classList.toggle('form__message--error', type === 'error');
}


