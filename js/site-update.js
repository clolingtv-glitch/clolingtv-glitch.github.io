(() => {
  'use strict';
  const original = document.querySelector('.hero-nav');
  if (!original) return;
  const mobile = matchMedia('(max-width: 768px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const host = document.createElement('div');
  host.className = 'mobile-menu';
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'mobile-menu__toggle';
  toggle.setAttribute('aria-controls', 'mobile-menu-panel');
  toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', '메뉴 열기');
  toggle.innerHTML = '<img class="mobile-menu__open-icon" src="./assets/images/icn-menu.svg" alt=""><img class="mobile-menu__close-icon" src="./assets/images/icn-close.svg" alt="">';
  const panel = document.createElement('div');
  panel.className = 'mobile-menu__panel'; panel.id = 'mobile-menu-panel'; panel.inert = true;
  panel.setAttribute('aria-hidden', 'true');
  const nav = original.cloneNode(true);
  nav.className = 'mobile-menu__nav'; nav.setAttribute('aria-label', '모바일 포트폴리오 메뉴');
  nav.removeAttribute('id');
  nav.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  const links = [...nav.querySelectorAll('a')];
  links.forEach((a, i) => { a.style.setProperty('--menu-index', i); });
  panel.append(nav); host.append(toggle, panel); document.body.append(host);
  document.documentElement.classList.add('mobile-menu-ready');
  let open = false;
  function setOpen(value, restore = false) {
    open = value && mobile.matches;
    host.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    panel.inert = !open; panel.setAttribute('aria-hidden', String(!open));
    if (restore) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => setOpen(!open));
  host.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) { e.preventDefault(); setOpen(false, true); }
    if (e.key === 'ArrowDown' && e.target === toggle && open) { e.preventDefault(); links[0]?.focus(); }
  });
  nav.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    e.preventDefault(); setOpen(false);
    links.forEach(a => {
      a.classList.toggle('is-active', a === link);
      if (a === link) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    history.pushState(null, '', link.hash);
    const hadTabindex = target.hasAttribute('tabindex');
    if (!hadTabindex) { target.tabIndex = -1; target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true }); }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  });
  document.addEventListener('pointerdown', e => { if (open && !host.contains(e.target)) setOpen(false); });
  document.addEventListener('focusin', e => { if (open && !host.contains(e.target)) setOpen(false); });
  mobile.addEventListener('change', () => {
    const focusInside = host.contains(document.activeElement);
    setOpen(false);
    if (!mobile.matches && focusInside) original.querySelector('a')?.focus({ preventScroll: true });
  });
  const art = document.querySelector('.about-art');
  if (art) new IntersectionObserver(([entry]) => {
    art.classList.toggle('is-in-view', entry.isIntersecting);
  }).observe(art);
})();
