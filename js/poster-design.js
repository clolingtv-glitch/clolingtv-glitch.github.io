(() => {
  'use strict';

  // 제목과 설명은 디자인을 보고 작성한 초안입니다. 이 배열에서 수정하세요.
  const posters = [
    {
      image: './assets/images/poster-design/running-shoes.jpg',
      brand: 'ASICS', title: 'RUN BEYOND',
      description: '푸른 하늘과 선명한 옐로 타이포그래피를 대비시킨 러닝 포스터입니다.\n전경의 운동화를 크게 배치하고 손으로 그린 듯한 그래픽을 더해 달리는 순간의 에너지를 표현했습니다.',
      alt: '푸른 하늘 배경에 러너와 아식스 운동화, 노란 RUN BEYOND 문구가 배치된 포스터'
    },
    {
      image: './assets/images/poster-design/crystal-jelly-pot.jpg',
      brand: 'FWEE', title: 'Crystal Jelly Pot',
      description: '핑크 톤의 인물 이미지와 광택이 느껴지는 제형 이미지를 조합한 뷰티 포스터입니다.\n청록색 타이포그래피로 대비를 주고, 제품의 촉촉하고 투명한 인상을 시각적으로 담았습니다.',
      alt: '핑크 화장품을 든 모델과 광택 있는 제형 이미지, 청록색 제목이 있는 퓌 포스터'
    },
    {
      image: './assets/images/poster-design/jelly-Ribbon-Balm.jpg',
      brand: 'COLORGRAM', title: 'Jelly Ribbon Balm',
      description: '리본 모티브와 통통한 타이포그래피를 중심으로 구성한 핑크 톤의 포스터입니다.\n모델 이미지와 리본 모양 제품, 컬러별 이미지를 함께 배치해 발랄하고 사랑스러운 분위기를 만들었습니다.',
      alt: '핑크 리본을 단 모델과 리본 모양 립 제품이 배치된 컬러그램 포스터'
    },
    {
      image: './assets/images/poster-design/deco.jpg',
      brand: 'DECÒ', title: 'MARACANÀ',
      description: '민트와 피치 컬러의 조명을 머스터드 격자 배경에 배치한 포스터입니다.\n원과 곡선, 가느다란 선을 조합하고 청록색 프레임으로 화면을 정리해 복고적인 분위기를 표현했습니다.',
      alt: '머스터드 격자 위에 민트와 피치 조명, 기하학적인 도형이 배치된 데코 포스터'
    },
    {
      image: './assets/images/poster-design/nokia6070.jpg',
      brand: 'NOKIA', title: 'Nokia 6070',
      description: '블루와 오렌지의 강한 색 대비에 거친 질감을 더한 레트로 포스터입니다.\n전화기를 사용하는 인물과 제품 이미지를 겹쳐 배치하고, 큰 타이포그래피로 Y2K 무드를 강조했습니다.',
      alt: '파랑과 주황 배경에 선글라스를 쓴 모델과 노키아 휴대전화 두 대가 있는 포스터'
    },
    {
      image: './assets/images/poster-design/horoyoi.jpg',
      brand: 'SUNTORY',
      title: 'HOROYOI',
      description: '청록색 배경과 핑크색 캔 일러스트를 대비시켜 산뜻하고 경쾌한 분위기를 표현한 포스터입니다.\n제품을 대각선으로 크게 배치하고 손글씨 형태의 타이포그래피와 기포 그래픽을 더해 생동감을 살렸습니다.\n해시태그 문구와 원형 배지로 제품의 특징을 강조했습니다.',
      alt: '청록색 배경에 핑크색 캔 일러스트를 대각선으로 배치한 일본 하이볼 포스터'
    },
    {
      image: './assets/images/poster-design/exhibition.jpg',
      brand: '국립중앙박물관',
      title: '金冠(금관)',
      description: '금관 이미지와 굵은 한자 타이포그래피를 겹쳐 전통 유물의 조형미를 현대적으로 표현한 전시 포스터입니다.\n종이 질감의 밝은 배경과 검은 글자로 금관의 황금빛을 부각하고, 이미지와 글자가 서로 교차하도록 구성해 시각적인 깊이감을 더했습니다. 전시 정보는 화면 양옆에 배치해 중앙의 금관에 시선이 집중되도록 했습니다.',
      alt: '금관이미지와 한자 타이포그래피를 겹쳐 현대적으로 표현한 전시회 포스터'
    }
  ];

  // 한 장 이동 시간(ms). 자동 재생 타이머는 없습니다.
  const moveDuration = 650;
  const wrap = (value, size) => ((value % size) + size) % size;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  document.querySelectorAll('.pd-gallery').forEach((root) => {
    if (root.dataset.pdReady) return;
    root.dataset.pdReady = 'true';
    const stage = root.querySelector('.pd-gallery__stage');
    const previous = root.querySelector('[data-pd-prev]');
    const next = root.querySelector('[data-pd-next]');
    const counter = root.querySelector('[data-pd-counter]');
    const name = root.querySelector('[data-pd-name]');
    const dialog = root.querySelector('.pd-dialog');
    let index = 0;
    let position = 0;
    let frame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let drag = null;
    let suppressClickUntil = 0;
    let savedOverflow = '';
    let opener = null;

    const cards = posters.map((poster, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pd-card';
      button.dataset.pdIndex = i;
      button.setAttribute('aria-label', `${i + 1} / ${posters.length}: ${poster.title}, 상세 보기`);
      const img = document.createElement('img');
      img.src = poster.image;
      img.alt = poster.alt;
      img.draggable = false;
      img.decoding = 'async';
      button.append(img);
      stage.append(button);
      return button;
    });

    const step = () => cards[0].offsetWidth * 1.06;
    function render(value = position) {
      position = value;
      const width = cards[0].offsetWidth;
      const spacing = step();
      cards.forEach((card, i) => {
        // 화면 밖의 카드만 재배치하므로 마지막 → 처음도 같은 방향으로 이어집니다.
        const distance = wrap(i - position + 1.4, posters.length) - 1.4;
        const folded = clamp(-distance, 0, 1);
        const right = clamp(distance, 0, 1);
        const x = distance < 0
          ? -width * .68 * (1 - Math.pow(1 - folded, 2))
          : distance * spacing;
        const angle = distance < 0 ? folded * 84 : -right * 40;
        // 이전 카드는 접히면서 사라집니다. 정지 상태에 왼쪽 잔상이 남지 않습니다.
        const opacity = distance < 0
          ? clamp(1 + distance / .72, 0, 1)
          : clamp((3.45 - distance) / .25, 0, 1);
        const visible = opacity > .01;
        card.style.transform = `translate3d(${x}px,0,0) perspective(${width * 2.4}px) rotateY(${angle}deg)`;
        card.style.filter = `grayscale(${clamp(Math.abs(distance), 0, 1)})`;
        card.style.opacity = String(opacity);
        card.style.zIndex = String(20 - Math.round(Math.abs(distance) * 4));
        card.style.pointerEvents = visible ? '' : 'none';
        card.tabIndex = distance >= -.05 && distance * spacing < stage.clientWidth - width * .25 ? 0 : -1;
      });
    }
    function updateLabels() {
      const active = wrap(index, posters.length);
      previous.disabled = false;
      next.disabled = false;
      counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(posters.length).padStart(2, '0')}`;
      name.textContent = `${posters[active].brand} — ${posters[active].title}`;
    }
    function stopAnimation() {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    function goTo(target, immediate = false) {
      stopAnimation();
      index = Math.round(target);
      updateLabels();
      const from = position;
      if (immediate || reducedMotion.matches || Math.abs(index - from) < .0001) {
        render(index);
        return;
      }
      const started = performance.now();
      function tick(now) {
        const progress = clamp((now - started) / moveDuration, 0, 1);
        // 빠르게 펼쳐진 뒤 끝에서 길게 감속합니다.
        const eased = 1 - Math.pow(1 - progress, 4);
        render(from + (index - from) * eased);
        frame = progress < 1 ? requestAnimationFrame(tick) : 0;
      }
      frame = requestAnimationFrame(tick);
    }
    reducedMotion.addEventListener('change', () => goTo(index, true));
    previous.addEventListener('click', () => goTo(index - 1));
    next.addEventListener('click', () => goTo(index + 1));
    stage.addEventListener('keydown', (event) => {
      const targets = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: index - wrap(index, posters.length), End: index + posters.length - 1 - wrap(index, posters.length) };
      if (!(event.key in targets)) return;
      event.preventDefault();
      goTo(targets[event.key]);
      // 방향키로 넘긴 뒤 Enter로 현재 포스터를 열 수 있게 합니다.
      cards[wrap(index, posters.length)].focus({ preventScroll: true });
    });

    stage.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0 || drag) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, active: false, start: index };
    });
    stage.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        if (Math.abs(dx) < 8) return;
        stopAnimation();
        drag.start = position;
        drag.active = true;
        stage.setPointerCapture(event.pointerId);
        stage.classList.add('is-dragging');
      }
      drag.dx = dx;
      render(drag.start - dx / step());
    });
    function finishDrag(event, canceled = false) {
      if (!drag || event.pointerId !== drag.id) return;
      const finished = drag;
      drag = null;
      stage.classList.remove('is-dragging');
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      if (finished.active) {
        suppressClickUntil = performance.now() + 400;
        const traveled = -finished.dx / step();
        const amount = Math.abs(traveled) > .15 ? Math.sign(traveled) * Math.max(1, Math.round(Math.abs(traveled))) : 0;
        goTo(canceled ? finished.start : finished.start + amount);
      }
    }
    stage.addEventListener('pointerup', (event) => finishDrag(event));
    stage.addEventListener('pointercancel', (event) => finishDrag(event, true));
    stage.addEventListener('lostpointercapture', (event) => {
      // 터치한 카드에서 stage로 캡처가 옮겨질 때 올라오는 이벤트는 무시합니다.
      // stage 자체가 캡처를 잃은 경우에만 드래그를 취소합니다.
      if (event.target !== stage) return;
      finishDrag(event, true);
    });
    stage.addEventListener('pointerleave', () => { if (drag && !drag.active) drag = null; });
    stage.addEventListener('dragstart', (event) => event.preventDefault());

    stage.addEventListener('click', (event) => {
      if (event.detail !== 0 && performance.now() < suppressClickUntil) { event.preventDefault(); return; }
      const button = event.target.closest('.pd-card');
      if (!button || dialog.open) return;
      const poster = posters[Number(button.dataset.pdIndex)];
      root.querySelector('[data-pd-brand]').textContent = poster.brand;
      root.querySelector('#pd-detail-title').textContent = poster.title;
      root.querySelector('#pd-detail-description').textContent = poster.description;
      const img = root.querySelector('[data-pd-detail-image]');
      img.src = poster.image;
      img.alt = poster.alt;
      opener = button;
      savedOverflow = document.body.style.overflow;
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.style.overflow = 'hidden';
    });
    root.querySelector('.pd-dialog__close').addEventListener('click', () => dialog.close());
    let backdropDown = false;
    function isOutside(event) {
      const r = dialog.getBoundingClientRect();
      return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
    }
    dialog.addEventListener('pointerdown', (event) => { backdropDown = event.target === dialog && isOutside(event); });
    dialog.addEventListener('click', (event) => {
      if (backdropDown && event.target === dialog && isOutside(event)) dialog.close();
      backdropDown = false;
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = savedOverflow;
      opener?.focus({ preventScroll: true });
    });
    new ResizeObserver(() => {
      if (drag) finishDrag({ pointerId: drag.id }, true);
      render();
    }).observe(stage);
    goTo(0, true);
  });
})();
