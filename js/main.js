document.addEventListener('DOMContentLoaded', () => {
  initBurgerMenu();
  initSmoothScroll();
  initGalleryModal();
  initRequestModal();
  initScrollAnimations();
});

function initRequestModal() {
  const modalId = 'request-modal';
  const modalBackdrop = document.getElementById(modalId);
  if (!modalBackdrop) return;

  const triggers = document.querySelectorAll('.js-open-modal');
  const closeBtns = modalBackdrop.querySelectorAll('.js-close-modal');

  // Open
  triggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (btn.getAttribute('data-modal') === modalId) {
        applyRequestType(modalBackdrop, btn);
        modalBackdrop.classList.add('is-visible');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
      }
    });
  });

  // Close
  const closeModal = () => {
    modalBackdrop.classList.remove('is-visible');
    document.body.style.overflow = '';
  };

  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('is-visible')) {
      closeModal();
    }
  });
}

function applyRequestType(modalBackdrop, triggerButton) {
  const form = modalBackdrop.querySelector('.js-lead-form');
  if (!(form instanceof HTMLFormElement)) return;

  const requestType = triggerButton.getAttribute('data-request-type') || '';
  const requestTopic = triggerButton.getAttribute('data-request-topic') || '';

  upsertHiddenInput(form, 'request_type', requestType);
  upsertHiddenInput(form, 'request_topic', requestTopic);
}

function upsertHiddenInput(form, name, value) {
  let hiddenInput = form.querySelector(`input[name="${name}"]`);
  if (!(hiddenInput instanceof HTMLInputElement)) {
    hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = name;
    form.appendChild(hiddenInput);
  }

  hiddenInput.value = value;
}

function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('.hero__card, .card, .work-card, .testimonial-card, .section__title');
  animatedElements.forEach(el => {
    el.classList.add('fade-in-up');
    observer.observe(el);
  });
}

function initBurgerMenu() {
  const burger = document.querySelector('.nav__burger');
  const navList = document.querySelector('.nav__list');

  if (!burger || !navList) return;

  burger.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('nav__list--open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  navList.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.matches('.nav__link')) {
      navList.classList.remove('nav__list--open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

function initSmoothScroll() {
  const triggers = document.querySelectorAll('.js-scroll-to');
  if (!triggers.length) return;

  const scrollToTarget = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    const header = document.querySelector('.header');
    const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0;
    const rect = el.getBoundingClientRect();
    const offset = window.pageYOffset + rect.top - headerHeight - 8;

    window.scrollTo({
      top: offset < 0 ? 0 : offset,
      behavior: 'smooth',
    });
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const target = trigger.getAttribute('data-target') || trigger.getAttribute('href');
      if (!target || !target.startsWith('#')) return;
      scrollToTarget(target);
    });
  });
}

function initGalleryModal() {
  const items = document.querySelectorAll('.js-gallery-item');
  if (!items.length) return;

  const modal = createGalleryModal();
  if (!modal) return;

  const modalImage = modal.querySelector('.gallery-modal__image');
  const modalTitle = modal.querySelector('.gallery-modal__title');
  const modalText = modal.querySelector('.gallery-modal__text');

  items.forEach((item) => {
    item.addEventListener('click', () => {
      const title = item.querySelector('.work-card__title')?.textContent?.trim() || '';
      const text = item.querySelector('.work-card__text')?.textContent?.trim() || '';

      if (modalTitle) modalTitle.textContent = title;
      if (modalText) modalText.textContent = text;
      if (modalImage) {
        modalImage.className = 'gallery-modal__image';
      }

      openGalleryModal(modal);
    });
  });
}

function createGalleryModal() {
  if (document.querySelector('.gallery-modal-backdrop')) return document.querySelector('.gallery-modal-backdrop');

  const backdrop = document.createElement('div');
  backdrop.className = 'gallery-modal-backdrop';
  backdrop.innerHTML = `
    <div class="gallery-modal" role="dialog" aria-modal="true">
      <button class="gallery-modal__close" type="button" aria-label="Закрыть">×</button>
      <div class="gallery-modal__image"></div>
      <h3 class="gallery-modal__title"></h3>
      <p class="gallery-modal__text"></p>
    </div>
  `;

  document.body.appendChild(backdrop);

  const closeBtn = backdrop.querySelector('.gallery-modal__close');
  closeBtn?.addEventListener('click', () => closeGalleryModal(backdrop));
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      closeGalleryModal(backdrop);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeGalleryModal(backdrop);
    }
  });

  return backdrop;
}

function openGalleryModal(backdrop) {
  backdrop.classList.add('gallery-modal-backdrop--visible');
}

function closeGalleryModal(backdrop) {
  backdrop.classList.remove('gallery-modal-backdrop--visible');
}


