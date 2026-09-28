(() => {
  'use strict';
  // ===== 여기에서 이미지와 설명, 이동 속도를 바꾸세요. =====
  const settings = {
    pixelsPerSecond: 30, // 낮출수록 느리게 이동합니다.
    hoverMultiplier: 0.3, // 호버 시 평소 속도의 4% (거의 정지)
    endHold: 2.5, // 맨 아래에서 머무는 시간(초)
    fadeDuration: 0.65 // 다시 상단으로 돌아올 때 페이드 시간(초)
  };
  const projects = [
    {
      image: './assets/images/product-detail/tomato.jpg',
      title: '오늘도 멋진 한 입',
      category: 'FOOD · 토마토 상세페이지',
      description: '탐스럽게 익은 토마토의 색과 질감을 크게 담아 신선한 첫인상을 만들었습니다. 빨강과 초록으로 제품의 개성을 살리고, 파란색 구간으로 정보의 흐름을 구분했습니다. 제품 소개부터 활용 레시피, 포장 안내까지 자연스럽게 읽히도록 구성한 상세페이지입니다.'
    },
    {
      image: './assets/images/product-detail/lotion.jpg',
      title: '구름같이 편하고 촉촉한 하루',
      category: 'BEAUTY · 바디로션 상세페이지',
      description: '차분한 하늘색과 깨끗한 여백으로 바디로션의 부드러운 인상을 표현했습니다. 제품 사진과 크림의 질감, 사용 장면을 연결하고 곡선과 물결 형태로 화면의 흐름을 이어갔습니다. 제품의 특징과 성분 정보를 단계적으로 읽을 수 있도록 정리했습니다.'
    },
    {
      // 세 번째 작업이 완성되면 아래 4개 항목만 바꾸세요.
      image: './assets/images/product-detail/plate.jpg',
      title: '오늘의 식탁에 취향 한 접시',
      category: 'TABLEWARE · 접시 상세페이지',
      description: '부드러운 파스텔 컬러와 도톰한 테두리의 매력을 담은 테이블웨어 상세페이지입니다. 크림 톤 배경과 자연광이 드는 사진으로 따뜻한 분위기를 만들고, 컬러별 음식 연출을 통해 식탁 위 활용 모습을 보여줍니다. 제품의 질감부터 색상, 크기와 관리 방법까지 차례로 배치해 감성적인 이미지와 구매에 필요한 정보를 함께 전달했습니다.'
    }
  ];
  const root = document.querySelector('#product-detail-design');
  if (!root || root.dataset.dpReady) return;
  root.dataset.dpReady = 'true';
  const works = root.querySelector('[data-dp-works]');
  const dialog = root.querySelector('.dp-dialog');
  const toggle = root.querySelector('[data-dp-toggle]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  let frame = 0;
  let previousTime = 0;
  let opener = null;
  let oldOverflow = '';
  let ownsScrollLock = false;

  const cards = projects.map((project, index) => {
    const button = document.createElement('button');
    button.className = 'dp-card';
    button.type = 'button';
    button.setAttribute('aria-label', `${project.title} — 상세 설명과 전체 이미지 보기`);
    button.setAttribute('aria-haspopup', 'dialog');
    const image = document.createElement('img');
    image.className = 'dp-card__image';
    image.alt = project.category;
    image.decoding = 'async';
    image.draggable = false;
    const state = { button, image, offset: 0, max: 0, factor: 1, hover: false, focused: false, visible: false, phase: 'travel', elapsed: 0 };
    image.addEventListener('load', () => measure(state));
    image.src = project.image;
    button.append(image);
    const cue=document.createElement('span');cue.className='dp-card__cue';cue.textContent='자세히 보기 ↗';cue.setAttribute('aria-hidden','true');button.append(cue);
    works.append(button);
    button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') state.hover = true; });
    button.addEventListener('pointerleave', () => { state.hover = false; });
    button.addEventListener('focus', () => { state.focused = button.matches(':focus-visible'); });
    button.addEventListener('pointerdown', () => { state.focused = false; });
    button.addEventListener('blur', () => { state.focused = false; });
    button.addEventListener('click', () => openProject(index, button));
    return state;
  });

  const mobile=matchMedia('(max-width: 768px)');
  let drag=null,suppressClick=false,suppressTimer=0;
  works.addEventListener('pointerdown',e=>{
    if(!mobile.matches||e.button!==0)return;
    clearTimeout(suppressTimer);suppressClick=false;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:works.scrollLeft,moved:false,mouse:e.pointerType==='mouse'};
  });
  works.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(Math.hypot(dx,dy)>8){drag.moved=true;suppressClick=true;}
    if(drag.mouse&&drag.moved){
      if(!works.hasPointerCapture(e.pointerId))works.setPointerCapture(e.pointerId);
      works.classList.add('is-dragging');works.scrollLeft=drag.left-dx;e.preventDefault();
    }
  });
  const cardLeft=card=>card.button.offsetLeft-works.clientLeft;
  function finishDrag(e){
    if(!drag||drag.id!==e.pointerId)return;
    if(drag.mouse&&drag.moved){
      const nearest=cards.reduce((best,item)=>Math.abs(cardLeft(item)-works.scrollLeft)<Math.abs(cardLeft(best)-works.scrollLeft)?item:best,cards[0]);
      works.classList.remove('is-dragging');works.scrollTo({left:cardLeft(nearest),behavior:reduced.matches?'instant':'smooth'});
    }
    if(works.hasPointerCapture(e.pointerId))works.releasePointerCapture(e.pointerId);
    drag=null;suppressTimer=setTimeout(()=>{suppressClick=false;},400);
  }
  window.addEventListener('pointerup',finishDrag);window.addEventListener('pointercancel',finishDrag);
  works.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);
  works.addEventListener('keydown',e=>{
    if(!mobile.matches||!['ArrowLeft','ArrowRight'].includes(e.key))return;
    const index=cards.findIndex(item=>item.button===document.activeElement);if(index<0)return;
    e.preventDefault();const next=Math.max(0,Math.min(cards.length-1,index+(e.key==='ArrowRight'?1:-1)));
    cards[next].button.focus({preventScroll:true});works.scrollTo({left:cardLeft(cards[next]),behavior:reduced.matches?'instant':'smooth'});
  });

  function measure(state) {
    const progress = state.max > 0 ? state.offset / state.max : 0;
    state.max = Math.max(0, state.image.getBoundingClientRect().height - state.button.clientHeight);
    state.offset = progress * state.max;
    paint(state);
  }
  function paint(state) {
    state.image.style.transform = `translate3d(0, ${-state.offset}px, 0)`;
  }
  // 상단 → 하단 이동. 끝에서는 페이드로 상단에 복귀하므로 역방향으로 빠르게 튀지 않습니다.
  function advance(state, dt) {
    const target = state.hover || state.focused ? settings.hoverMultiplier : 1;
    state.factor += (target - state.factor) * (1 - Math.exp(-dt * 9));
    const time = dt * state.factor;
    if (state.phase === 'travel') {
      state.offset = Math.min(state.max, state.offset + settings.pixelsPerSecond * time);
      if (state.offset >= state.max) { state.phase = 'hold'; state.elapsed = 0; }
      paint(state);
    } else {
      state.elapsed += time;
      if (state.phase === 'hold' && state.elapsed >= settings.endHold) {
        state.phase = 'out'; state.elapsed = 0;
      } else if (state.phase === 'out') {
        state.image.style.opacity = String(Math.max(0, 1 - state.elapsed / settings.fadeDuration));
        if (state.elapsed >= settings.fadeDuration) {
          state.offset = 0; paint(state); state.phase = 'in'; state.elapsed = 0;
        }
      } else if (state.phase === 'in') {
        state.image.style.opacity = String(Math.min(1, state.elapsed / settings.fadeDuration));
        if (state.elapsed >= settings.fadeDuration) { state.phase = 'travel'; state.elapsed = 0; }
      }
    }
  }
  function tick(time) {
    frame = 0;
    const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    if (!root.closest('[inert]') && !document.querySelector('dialog[open]')) {
      cards.forEach(state => { if (state.visible && state.max > 0) advance(state, dt); });
    }
    schedule();
  }
  function schedule() {
    if (!frame && !paused && !reduced.matches && !document.hidden && cards.some(state => state.visible)) {
      frame = requestAnimationFrame(tick);
    }
  }
  function refresh() {
    cancelAnimationFrame(frame); frame = 0; previousTime = 0;
    toggle.disabled = reduced.matches;
    toggle.textContent = reduced.matches ? '동작 줄이기 설정 적용 중' : paused ? '자동 이동 재생' : '자동 이동 정지';
    toggle.setAttribute('aria-pressed', String(paused || reduced.matches));
    schedule();
  }
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const state = cards.find(item => item.button === entry.target);
      if (state) state.visible = entry.isIntersecting;
    });
    refresh();
  }, { threshold: 0.05 });
  const resize = new ResizeObserver(() => cards.forEach(measure));
  cards.forEach(state => { visibility.observe(state.button); resize.observe(state.button); resize.observe(state.image); });
  toggle.addEventListener('click', () => { paused = !paused; refresh(); });
  document.addEventListener('visibilitychange', refresh);
  reduced.addEventListener('change', () => {
    if (reduced.matches) cards.forEach(state => {
      state.offset = 0; state.phase = 'travel'; state.elapsed = 0; state.image.style.opacity = '1'; paint(state);
    });
    refresh();
  });

  function openProject(index, button) {
    if (dialog.open) return;
    const project = projects[index];
    root.querySelector('#dp-dialog-title').textContent = project.title;
    root.querySelector('#dp-dialog-description').textContent = project.description;
    root.querySelector('[data-dp-category]').textContent = project.category;
    const image = root.querySelector('[data-dp-image]');
    image.src = project.image;
    image.alt = project.category + ' 전체 디자인';
    opener = button;
    oldOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    ownsScrollLock = true;
    dialog.scrollTop = 0;
  }
  root.querySelector('[data-dp-close]').addEventListener('click', () => dialog.close());
  let backdropDown = false;
  function outside(event) {
    const box = dialog.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  }
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => {
    if (backdropDown && event.target === dialog && outside(event)) dialog.close();
    backdropDown = false;
  });
  // Esc는 dialog의 기본 동작을 사용합니다. 모든 닫기 경로가 이곳에서 정리됩니다.
  dialog.addEventListener('close', () => {
    if (ownsScrollLock) document.documentElement.style.overflow = oldOverflow;
    ownsScrollLock = false;
    previousTime = 0;
    opener?.focus({ preventScroll: true });
  });
  refresh();
})();
