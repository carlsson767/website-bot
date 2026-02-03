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

      // На Vercel заявка уходит в /api/telegram — там отправка в Telegram и ответ «успех»
      const apiUrl = '/api/telegram';

      fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
         if (!response.ok) {
             throw new Error('Ошибка связи с сервером');
         }
         return response.json();
      })
      .then(result => {
        if (result.status === 'success' || result.ok) {
             form.reset();
             showFormMessage(
               form,
               'Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.',
               'success',
             );
        } else {
             showFormMessage(form, 'Ошибка: ' + (result.error || result.message || 'Не удалось отправить заявку'), 'error');
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


