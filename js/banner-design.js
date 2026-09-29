(() => {
  'use strict';

  // 제목과 설명은 이미지에 맞춰 작성한 초안입니다. 이 목록에서 수정하세요.
  const banners = [
    {
      image: './assets/images/banner-design/our-Bakery.jpg',
      brand: 'OUR Bakery', category: 'FOOD & LIFESTYLE', title: 'CROISSANT',
      description: '크림색 배경 위에 크루아상을 크게 배치해 겹겹의 결과 바삭한 질감을 강조한 배너입니다. 검은 세리프 타이포그래피와 노란 필기체를 겹쳐 제품에 시선을 모으고, 작은 라벨과 바코드 그래픽으로 감각적인 패키지 같은 인상을 더했습니다.',
      alt: '크림색 배경에 크루아상과 검은 CROISSANT 글자, 노란 Butter Layer 필기체가 겹쳐진 아우어 베이커리 배너'
    },
    {
      image: './assets/images/banner-design/gentle-monster.jpg',
      brand: 'GENTLE MONSTER', category: 'EYEWEAR & FASHION', title: 'BEYOND THE FRAME',
      description: '차가운 회보라색 배경과 메탈릭한 스타일링의 모델 이미지를 조합한 아이웨어 배너입니다. 얼굴과 안경이 중심에 놓이도록 구성하고 양옆에 문구와 브랜드명을 배치해, 여백 속에서도 제품과 모델의 인상이 선명하게 전달되도록 했습니다.',
      alt: '회보라색 배경에 안경과 금속 장식을 착용한 모델, Beyond the Frame 문구가 있는 젠틀몬스터 배너'
    },
    {
      image: './assets/images/banner-design/jacquemus.jpg',
      brand: 'JACQUEMUS', category: 'FASHION COLLECTION', title: 'LA COULEUR',
      description: '옐로 컬러의 의상과 가방을 아치형 배경 안에 배치해 밝은 여름 분위기를 표현한 패션 배너입니다. 크림색 여백과 야자수 그림자로 따뜻한 공간감을 만들고, 왼쪽의 간결한 타이포그래피로 컬렉션의 메시지를 정리했습니다.',
      alt: '크림색 배경과 노란 아치 앞에 노란 의상과 가방을 든 모델이 서 있는 자크뮈스 배너'
    },
    {
      image: './assets/images/banner-design/kurly.jpg',
      brand: 'Kurly', category: 'SEASONAL PROMOTION', title: '여름을 더 시원하게',
      description: '선명한 파란색 배경에 라임색과 흰색 타이포그래피를 대비시켜 여름 프로모션의 활기를 표현한 배너입니다. 과일과 아이스크림을 담은 카트 이미지로 시원하고 풍성한 인상을 주고, 할인 배지와 상품 카테고리를 더해 혜택을 한눈에 볼 수 있도록 구성했습니다.',
      alt: '파란 배경에 과일과 아이스크림이 담긴 흰 카트, 라임색 할인 배지가 있는 컬리 여름 행사 배너'
    }
  ];

  const settings = {
    moveDuration: 900, // 한 장이 올라오는 시간(ms)
    holdDuration: 800, // 이동 후 멈춰 있는 시간(ms)
    tilt: 65,          // 위아래 카드가 뒤로 기울어지는 각도
    centerBoost: 0.12, // 가운데 배너 확대 비율 (0.12 = 12%)
    dragDuration: 420  // 드래그를 놓은 뒤 자리잡는 시간(ms)
  };
  const wrap = (value, size) => ((value % size) + size) % size;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function init(root) {
    if (root.dataset.bdReady) return;
    const stage = root.querySelector('[data-bd-stage]');
    const dialog = root.querySelector('.bd-dialog');
    const counter = root.querySelector('[data-bd-counter]');
    const toggle = root.querySelector('[data-bd-toggle]');
    if (!stage || !dialog) return;
    root.dataset.bdReady = 'true';

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const brand = root.querySelector('[data-bd-brand]');
    const name = root.querySelector('[data-bd-name]');
    const category = root.querySelector('[data-bd-category]');
    const count = banners.length;
    let index = 0, position = 0, width = 0;
    let frame = 0, timer = 0, moving = false;
    let visible = false, hovered = false, userPaused = false;
    let announced = -1, opener = null, scrollState = null;
    let keyboardFocus = false;
    let drag = null, suppressClickUntil = 0;

    // 3주기 분량의 카드를 만들어 4작품도 위아래 두 장씩 끊김 없이 표시합니다.
    const cards = Array.from({ length: count * 3 }, (_, i) => {
      const item = banners[i % count];
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'bd-card'; card.tabIndex = -1;
      card.setAttribute('aria-label', `${item.brand} / ${item.title}: 상세 보기`);
      const img = document.createElement('img');
      img.src = item.image; img.alt = ''; img.width = 1920; img.height = 970;
      img.draggable = false; img.decoding = 'async';
      card.append(img); stage.append(card);
      card.addEventListener('click', event => {
        if (event.detail !== 0 && performance.now() < suppressClickUntil) {
          event.preventDefault(); return;
        }
        openDetail(i % count);
      });
      return card;
    });

    function updateCopy(active) {
      if (announced === active) return;
      const changed = announced !== -1;
      announced = active;
      const item = banners[active];
      brand.textContent = item.brand;
      name.textContent = item.title;
      category.textContent = item.category;
      if (changed && !reduced.matches) {
        root.querySelectorAll('.bd-gallery__side').forEach(side => {
          side.animate?.([{ opacity: 0, transform: 'translateY(.4rem)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260, easing: 'ease-out' });
        });
      }
      if (counter) counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
    }

    function render(value) {
      position = value;
      const span = cards.length;
      const h = width * 970 / 1920;
      const center = wrap(Math.round(value), span);
      cards.forEach((card, i) => {
        const d = wrap(i - value + span / 2, span) - span / 2;
        const a = Math.abs(d);
        const direction = Math.sign(d);
        const y = direction * h * (a <= 1 ? .94 * a : .94 + (a - 1) * .46);
        const z = -width * (Math.min(a, 1) * .23 + Math.max(a - 1, 0) * .18);
        const angle = direction * settings.tilt * Math.min(a, 1);
        const opacity = a <= 2 ? 1 : Math.max(0, 1 - (a - 2) / .65);
        const scale = 1 + settings.centerBoost * (1 - Math.min(a, 1));
        card.style.transform = `translate(-50%, -50%) translate3d(0, ${y}px, ${z}px) rotateX(${angle}deg) scale(${scale})`;
        card.style.filter = `grayscale(${Math.min(a, 1)})`;
        card.style.opacity = String(opacity);
        card.style.zIndex = String(Math.round((span - a) * 100));
        card.style.setProperty('--bd-shade', String(Math.min(.45, a * .16)));
        card.style.visibility = opacity > 0 ? 'visible' : 'hidden';
        card.style.pointerEvents = opacity > .25 && !moving ? 'auto' : 'none';
        const selected = i === center;
        card.tabIndex = selected && !moving ? 0 : -1;
        card.setAttribute('aria-hidden', selected ? 'false' : 'true');
      });
      updateCopy(wrap(Math.round(value), count));
    }

    function focusInside() {
      return keyboardFocus && root.contains(document.activeElement) && document.activeElement !== toggle;
    }
    function canPlay() {
      return !drag && !reduced.matches && !userPaused && visible && !document.hidden && !hovered &&
        !focusInside() && !root.closest('[inert]') && !document.querySelector('dialog[open]');
    }
    function schedule() {
      clearTimeout(timer); timer = 0;
      const running = canPlay();
      counter?.setAttribute('aria-live', running ? 'off' : 'polite');
      // 동작 줄이기 설정에서는 자동 재생을 끄고 수동 이동을 제공합니다.
      if (toggle) toggle.disabled = reduced.matches;
      if (toggle) toggle.textContent = reduced.matches ? '자동 재생 꺼짐' : userPaused ? '재생' : '일시정지';
      toggle?.setAttribute('aria-label', reduced.matches ? '동작 줄이기 설정으로 자동 재생 꺼짐' : userPaused ? '배너 자동 재생 시작' : '배너 자동 재생 일시정지');
      if (running && !moving && count > 1) timer = setTimeout(() => { timer = 0; if (canPlay()) go(1); }, settings.holdDuration);
    }
    function finishMotion() {
      cancelAnimationFrame(frame); frame = 0; moving = false;
      const restoreCardFocus = keyboardFocus && stage.contains(document.activeElement);
      index = wrap(index, count);
      render(index);
      if (restoreCardFocus) currentCard().focus({ preventScroll: true });
    }
    function animateTo(target, duration = settings.moveDuration) {
      clearTimeout(timer); timer = 0;
      cancelAnimationFrame(frame); frame = 0;
      const from = position;
      index = target;
      if (reduced.matches || Math.abs(index - from) < .0001) {
        finishMotion(); schedule(); return;
      }
      moving = true;
      const began = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - began) / duration);
        render(from + (index - from) * ease(t));
        if (t < 1) frame = requestAnimationFrame(tick);
        else { finishMotion(); schedule(); }
      }
      frame = requestAnimationFrame(tick);
    }
    function go(direction) {
      if (moving || drag || dialog.open) return;
      animateTo(Math.round(position) + direction);
    }

    // 마우스는 스테이지에서 위아래로 드래그할 수 있습니다.
    // 터치는 배너 이미지 위에서만 세로 스와이프를 받습니다.
    // 이미지 바깥에서는 페이지를 평소대로 세로 스크롤할 수 있습니다.
    stage.addEventListener('pointerdown', event => {
      if (drag && !event.isPrimary) { endDrag(null, true); return; }
      if (!event.isPrimary || event.button !== 0 || moving || dialog.open || root.closest('[inert]')) return;
      if (event.pointerType !== 'mouse' && !event.target.closest('.bd-card')) return;
      if (drag) return;
      suppressClickUntil = 0;
      keyboardFocus = false;
      drag = {
        id: event.pointerId,
        x: event.clientX, y: event.clientY,
        origin: Math.round(position),
        step: Math.max(80, width * 970 / 1920 * .94),
        delta: 0, active: false,
        threshold: event.pointerType === 'mouse' ? 6 : 10
      };
      schedule();
    });
    stage.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.active) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < drag.threshold) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          suppressClickUntil = performance.now() + 500;
          endDrag(null, true);
          return;
        }
        drag.active = true;
        stage.classList.add('is-dragging');
        // 터치 카드의 암묵적 캡처를 stage로 옮깁니다.
        stage.setPointerCapture(event.pointerId);
      }
      if (event.cancelable) event.preventDefault();
      drag.delta = -dy;
      const progress = Math.max(-1, Math.min(1, drag.delta / drag.step));
      render(drag.origin + progress);
    }, { passive: false });
    function endDrag(event, canceled = false) {
      if (!drag || (event && event.pointerId !== drag.id)) return;
      const previous = drag;
      drag = null; // 캡처 해제 이벤트가 다시 들어와도 중복으로 종료하지 않습니다.
      stage.classList.remove('is-dragging');
      if (stage.hasPointerCapture(previous.id)) stage.releasePointerCapture(previous.id);
      if (!previous.active) { schedule(); return; }
      suppressClickUntil = performance.now() + 500;
      const enough = Math.abs(previous.delta) >= Math.max(18, previous.step * .15);
      const target = previous.origin + (!canceled && enough ? Math.sign(previous.delta) : 0);
      animateTo(target, settings.dragDuration);
    }
    stage.addEventListener('pointerup', event => endDrag(event));
    stage.addEventListener('pointercancel', event => endDrag(event, true));
    stage.addEventListener('lostpointercapture', event => {
      // 자식 카드에서 올라오는 캡처 이동 이벤트로 드래그를 취소하지 않습니다.
      if (event.target === stage) endDrag(event, true);
    });
    window.addEventListener('pointerup', event => endDrag(event));
    window.addEventListener('pointercancel', event => endDrag(event, true));
    window.addEventListener('blur', () => endDrag(null, true));
    stage.addEventListener('dragstart', event => event.preventDefault());
    function currentCard() { return cards[wrap(Math.round(position), cards.length)]; }
    function openDetail(i) {
      if (moving || drag || dialog.open) return;
      opener = currentCard();
      const item = banners[i];
      root.querySelector('[data-bd-detail-brand]').textContent = item.brand;
      root.querySelector('#bd-detail-title').textContent = item.title;
      root.querySelector('#bd-detail-description').textContent = item.description;
      const img = root.querySelector('[data-bd-detail-image]');
      img.src = item.image; img.alt = item.alt;
      dialog.scrollTop = 0;
      dialog.showModal();
      scrollState = [document.documentElement.style.overflow, document.body.style.overflow];
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      schedule();
    }
    root.querySelector('[data-bd-close]').addEventListener('click', () => dialog.close());
    let backdropDown = false;
    const outside = e => {
      const b = dialog.getBoundingClientRect();
      return e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom;
    };
    dialog.addEventListener('pointerdown', e => { backdropDown = e.target === dialog && outside(e); });
    dialog.addEventListener('click', e => { if (backdropDown && e.target === dialog && outside(e)) dialog.close(); backdropDown = false; });
    dialog.addEventListener('close', () => {
      if (scrollState) {
        [document.documentElement.style.overflow, document.body.style.overflow] = scrollState;
        scrollState = null;
      }
      // 자동재생은 클릭 전 사용자가 선택한 재생/정지 상태를 유지합니다.
      if (opener?.isConnected && !root.closest('[inert]')) opener.focus({ preventScroll: true });
      if (fine.matches && !root.matches(':hover')) hovered = false;
      schedule();
    });
    // 캐러셀의 방향키가 부모 가로 섹션 이동까지 실행하지 않도록 합니다.
    root.addEventListener('keydown', e => {
      if (dialog.open) { e.stopPropagation(); return; }
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation();
      go(['ArrowUp', 'ArrowLeft'].includes(e.key) ? -1 : 1);
    });
    root.querySelector('[data-bd-prev]')?.addEventListener('click', () => go(-1));
    root.querySelector('[data-bd-next]')?.addEventListener('click', () => go(1));
    toggle?.addEventListener('click', () => { userPaused = !userPaused; schedule(); });
    stage.addEventListener('pointerenter', e => { if (fine.matches && e.pointerType === 'mouse') { hovered = true; schedule(); } });
    stage.addEventListener('pointerleave', () => { hovered = false; schedule(); });
    document.addEventListener('keydown', e => { if (e.key === 'Tab') keyboardFocus = true; }, true);
    document.addEventListener('pointerdown', () => { keyboardFocus = false; schedule(); }, { passive: true });
    root.addEventListener('focusin', schedule);
    root.addEventListener('focusout', () => queueMicrotask(schedule));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { endDrag(null, true); if (moving) finishMotion(); }
      schedule();
    });
    reduced.addEventListener('change', () => { endDrag(null, true); if (moving) finishMotion(); schedule(); });
    fine.addEventListener('change', () => { hovered = false; schedule(); });
    new ResizeObserver(() => {
      if (drag) endDrag(null, true);
      width = cards[0].offsetWidth;
      render(position);
    }).observe(stage);
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .35;
      if (!visible) { endDrag(null, true); if (moving) finishMotion(); }
      schedule();
    }, { threshold: [0, .35] }).observe(stage);
    new MutationObserver(() => {
      if (root.closest('[inert]') || document.querySelector('dialog[open]')) {
        endDrag(null, true); if (moving) finishMotion();
      }
      schedule();
    }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['inert', 'open'] });
    const header = root.querySelector('.bd-gallery__header');
    if (header) {
      const measureHeader = () => root.style.setProperty('--bd-header-height', `${header.getBoundingClientRect().height}px`);
      new ResizeObserver(measureHeader).observe(header);
      measureHeader();
    }
    width = cards[0].offsetWidth;
    render(0); schedule();
  }
  function start() { document.querySelectorAll('.bd-gallery').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
