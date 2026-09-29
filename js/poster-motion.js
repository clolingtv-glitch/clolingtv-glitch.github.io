(() => {
  const gallery = document.querySelector('.poster-gallery');
  if (!gallery || gallery.dataset.ready) return;
  gallery.dataset.ready = 'true';

  // 제목과 설명은 이 배열에서 수정하세요. 파일 경로는 HTML 기준입니다.
  const posters = [
    {
      file: 'netflix.jpg', brand: 'Netflix', title: '귀환 — SF 영화 공개 팝업',
      description: `푸른 지구와 우주인의 대비, 헬멧에 비친 가족의 모습을 중심으로 구성한 영화 공개 팝업입니다.\n어두운 우주 배경과 빛의 대비로 귀환에 대한 기대와 그리움을 표현했습니다.`
    },
    {
      file: 'oliveyoung.jpg', brand: 'After blow × OLIVE YOUNG', title: 'Love Potion — 원데이 프로모션',
      description: '향수와 체리 오브제를 파스텔 핑크 톤으로 구성한 할인 프로모션 팝업입니다.\n제품의 질감과 반사 표현을 살리고, 할인 문구와 버튼을 핑크 포인트로 강조했습니다.'
    },
    {
      file: 'twosome1.jpg', brand: 'Twosome', title: 'Matcha Strawberry — 시즌 음료 팝업',
      description: '딸기와 말차의 핑크·그린 대비를 활용한 시즌 음료 팝업입니다.\n음료의 층이 돋보이도록 배치하고, 굵은 영문 제목과 필기체를 조합해 산뜻한 분위기를 담았습니다.'
    },
    {
      file: 'twosome2.jpg', brand: 'Twosome', title: 'Coconut Caramel Latte — 신메뉴 팝업',
      description: '블루 배경에 브라운 타이포그래피와 크림색 체크 패턴을 더한 신메뉴 팝업입니다.\n음료를 오려 붙인 듯한 형태와 리본 버튼으로 따뜻하고 경쾌한 분위기를 구성했습니다.'
    },
    {
      file: 'nike1.jpg', brand: 'Nike', title: 'Summer Sale — 여름 세일 팝업',
      description: '청량한 블루 배경과 제품의 펄 질감을 중심으로 구성한 여름 세일 팝업입니다.\n대각선 제품 배치와 세로 타이포그래피로 움직임을 주고, 노란 할인율로 시선을 모았습니다.'
    },
    {
      file: 'nike2.jpg', brand: 'Nike', title: 'Just Do It — 스니커즈 세일 팝업',
      description: '그린·화이트 제품 색상에 맞춰 콘크리트 질감과 큰 타이포그래피를 조합한 팝업입니다.\n두 개의 스니커즈를 대각선으로 배치해 제품의 형태와 스포티한 분위기를 강조했습니다.'
    }
  ];

  const stage = gallery.querySelector('.poster-stage');
  const ring = gallery.querySelector('.poster-ring');
  const playButton = gallery.querySelector('[data-poster-play]');
  const dialog = gallery.querySelector('.poster-dialog');
  const detailImage = dialog.querySelector('.poster-dialog__image');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  // 초 단위: 이동 시간과 정지 시간을 각각 조절합니다.
  const moveDuration = 0.95;
  const holdDuration = 1.15;
  const count = posters.length * 4;
  const step = 360 / count;
  const cards = [];

  let rotation = 0;
  let frame = 0;
  let lastTime = null;
  let paused = motionPreference.matches;
  let keyboardPaused = false;
  let inView = true;
  let opener = null;
  let detailActive = false;
  let restoringFocus = false;
  let previousOverflow = '';
  let phaseTime = 0;
  let moving = false;
  let moveStart = 0;
  let manualTarget = null;
  let drag = null;
  let suppressClickUntil = 0;

  function resetMotion() {
    phaseTime = 0;
    moving = false;
    manualTarget = null;
    lastTime = null;
  }

  // 빠르게 밀려 나간 뒤 긴 감속으로 부드럽게 자리 잡습니다.
  function easeMotion(t) {
    return t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;
  }

  // 6장을 네 번 이어서 15도 간격의 완만한 원형 배열을 만듭니다.
  for (let index = 0; index < count; index++) {
    const poster = posters[index % posters.length];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'poster-card';
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `${poster.title} 크게 보기`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.style.setProperty('--card-angle', `${index * step}deg`);

    // 복제본은 마우스로만 선택하고 키보드 목록은 6개로 유지합니다.
    if (index >= posters.length) {
      button.tabIndex = -1;
      button.setAttribute('aria-hidden', 'true');
    }

    const image = document.createElement('img');
    image.src = `./assets/images/popup/${poster.file}`;
    image.alt = '';
    image.width = 500;
    image.height = 750;
    image.draggable = false;
    button.append(image);
    ring.append(button);
    cards.push(button);
  }

  function paint() {
    ring.style.setProperty('--rotation', `${rotation}deg`);
  }

  function canPlay() {
    return !drag && (manualTarget !== null || (!paused && !keyboardPaused)) && !detailActive && inView && !document.hidden;
  }

  function tick(time) {
    frame = 0;
    if (!canPlay()) return;
    if (lastTime !== null) {
      phaseTime += Math.min((time - lastTime) / 1000, 0.05);
      if (manualTarget === null && !moving && phaseTime >= holdDuration) {
        moving = true;
        phaseTime = 0;
        moveStart = rotation;
      }
      if (moving) {
        const progress = Math.min(phaseTime / moveDuration, 1);
        rotation = moveStart + ((manualTarget ?? (moveStart - step)) - moveStart) * easeMotion(progress);
        if (progress === 1) {
          rotation %= 360;
          manualTarget = null;
          moving = false;
          phaseTime = 0;
        }
      }
    }
    lastTime = time;
    paint();
    if (canPlay()) frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    playButton.textContent = paused ? '자동 재생' : '일시정지';
    if (!canPlay()) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
    } else if (!frame) {
      lastTime = null;
      frame = requestAnimationFrame(tick);
    }
  }

  function layout() {
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const gap = parseFloat(getComputedStyle(stage).columnGap) || 0;
    // 원 안쪽의 포스터 모서리 사이에도 간격이 남도록 반지름을 계산합니다.
    const radius = cards[0].offsetHeight / 2 +
      (cards[0].offsetWidth + gap) / (2 * Math.tan(Math.PI / count));
    ring.style.setProperty('--orbit-radius', `${radius / rootSize}rem`);
  }

  function openPoster(button) {
    const poster = posters[Number(button.dataset.index) % posters.length];
    opener = button;
    detailActive = true;
    detailImage.src = button.querySelector('img').src;
    detailImage.alt = `${poster.brand} — ${poster.title}`;
    dialog.querySelector('.poster-dialog__brand').textContent = poster.brand;
    dialog.querySelector('h3').textContent = poster.title;
    dialog.querySelector('#poster-detail-description').textContent = poster.description;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    dialog.scrollTop = 0;
    syncPlayback();
  }

  ring.addEventListener('click', (event) => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); return; }
    const button = event.target.closest('.poster-card');
    if (button) openPoster(button);
  });

  // 키보드로 접근한 포스터는 정면으로 보내고 회전을 멈춥니다.
  ring.addEventListener('focusin', (event) => {
    const button = event.target.closest('.poster-card');
    if (!button || detailActive || restoringFocus || !button.matches(':focus-visible')) return;
    keyboardPaused = true;
    rotation = -Number(button.dataset.index) * step;
    resetMotion();
    paint();
    syncPlayback();
  });

  ring.addEventListener('focusout', (event) => {
    if (!ring.contains(event.relatedTarget)) {
      keyboardPaused = false;
      syncPlayback();
    }
  });

  playButton.addEventListener('click', () => {
    paused = !paused;
    keyboardPaused = false;
    syncPlayback();
  });

  function moveOne(direction) {
    paused = true;
    keyboardPaused = false;
    const target = (Math.round((manualTarget ?? rotation) / step) + direction) * step;
    resetMotion();
    if (motionPreference.matches) { rotation = target; paint(); }
    else { manualTarget = target; moveStart = rotation; moving = true; }
    syncPlayback();
  }

  // 모바일: 가로 이동만 갤러리가 처리하고 세로 스크롤은 브라우저에 맡깁니다.
  const mobileDrag = matchMedia('(max-width: 768px)');
  stage.addEventListener('pointerdown', event => {
    if (!mobileDrag.matches || !event.isPrimary || event.button !== 0 || detailActive || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, rotation, active: false };
    syncPlayback();
  });
  stage.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) >= Math.abs(dx)) { drag = null; syncPlayback(); return; }
      drag.active = true;
      resetMotion();
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
    }
    event.preventDefault();
    const spacing = cards[0].offsetWidth + (parseFloat(getComputedStyle(stage).columnGap) || 0);
    rotation = drag.rotation + dx / Math.max(spacing, 1) * step;
    paint();
  }, { passive: false });
  function finishDrag(event) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const ended = drag;
    drag = null;
    stage.classList.remove('is-dragging');
    if (ended.active) {
      suppressClickUntil = performance.now() + 500;
      const target = Math.round(rotation / step) * step;
      resetMotion();
      if (motionPreference.matches) { rotation = target; paint(); }
      else { manualTarget = target; moveStart = rotation; moving = true; }
    }
    if (stage.hasPointerCapture(ended.id)) stage.releasePointerCapture(ended.id);
    syncPlayback();
  }
  window.addEventListener('pointerup', finishDrag);
  window.addEventListener('pointercancel', finishDrag);
  stage.addEventListener('lostpointercapture', finishDrag);
  mobileDrag.addEventListener('change', () => finishDrag());

  gallery.querySelector('[data-poster-prev]').addEventListener('click', () => moveOne(1));
  gallery.querySelector('[data-poster-next]').addEventListener('click', () => moveOne(-1));
  dialog.querySelector('.poster-dialog__close').addEventListener('click', () => dialog.close());

  // dialog 기본 Escape 닫기와 배경 클릭 닫기를 모두 지원합니다.
  let pointerStartedOutside = false;
  const outsideDialog = (event) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', (event) => {
    pointerStartedOutside = outsideDialog(event);
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && pointerStartedOutside && outsideDialog(event)) dialog.close();
    pointerStartedOutside = false;
  });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    restoringFocus = true;
    // 복제본 대신 같은 포스터의 원본 버튼으로 초점을 돌립니다.
    const original = opener && cards[Number(opener.dataset.index) % posters.length];
    if (original) {
      if (opener !== original) {
        const shift = (Number(opener.dataset.index) - Number(original.dataset.index)) * step;
        rotation += shift;
        moveStart += shift;
        if (manualTarget !== null) manualTarget += shift;
        paint();
      }
      original.focus({ preventScroll: true });
    }
    restoringFocus = false;
    detailActive = false;
    opener = null;
    keyboardPaused = false;
    syncPlayback();
  });

  document.addEventListener('visibilitychange', syncPlayback);
  motionPreference.addEventListener('change', (event) => {
    paused = event.matches;
    if (event.matches && manualTarget !== null) { rotation = manualTarget; resetMotion(); paint(); }
    syncPlayback();
  });

  new ResizeObserver(layout).observe(stage);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncPlayback();
  }).observe(stage);

  layout();
  paint();
  syncPlayback();
})();
