(() => {
  'use strict';
  // 이 두 값만 바꾸면 ABOUT의 이메일과 이력서 버튼이 변경됩니다.
  const ABOUT = {
    email: 'clolingtv@gmail.com',
    resumeUrl: './assets/resume.pdf' // 예: './assets/resume.pdf' — 파일 추가 후 입력하면 버튼이 표시됩니다.
  };
  const section = document.querySelector('#about');
  if (!section) return;
  const email = section.querySelector('[data-about-email]');
  email.href = 'mailto:' + ABOUT.email;
  email.replaceChildren(document.createTextNode(ABOUT.email + ' '));
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  email.append(arrow);
  const resume = section.querySelector('[data-about-resume]');
  if (ABOUT.resumeUrl.trim()) {
    const url = new URL(ABOUT.resumeUrl, location.href);
    if (['http:', 'https:', 'file:'].includes(url.protocol)) {
      resume.href = url.href;
      resume.hidden = false;
    }
  }
  section.querySelector('[data-about-year]').textContent = new Date().getFullYear();
  const copy = section.querySelector('[data-about-copy]');
  const status = section.querySelector('[data-about-feedback]');
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(ABOUT.email);
      status.textContent = '이메일 주소를 복사했습니다.';
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(email);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = '자동 복사가 제한되어 있습니다. 선택된 주소를 직접 복사해주세요.';
    }
  });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    // 숨김 클래스를 사용하지 않아 JS가 없거나 모션이 중단돼도 내용을 읽을 수 있습니다.
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reducedMotion.matches) entry.target.animate([
          { opacity: 0, transform: 'translateY(1.5rem)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)' });
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    section.querySelectorAll('[data-about-reveal]').forEach(el => observer.observe(el));
  }
})();
