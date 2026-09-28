(() => {
  'use strict';

  // React나 GSAP 없이 스크롤 위치에 따라 움직이는 독립 구현입니다.
  // 이 파일은 한 번만 연결하세요. 기존 hero-warp.js는 유지합니다.
  const settings = {
    start: 0.80,       // 화면 위에서 92% 지점에 들어오면 시작
    end: 0.38,         // 48% 지점까지 올라오면 완성
    stagger: 0.38,     // 글자 사이의 진행 차이: 0 ~ 0.8
    textRise: 120,     // 글자 높이 대비 시작 위치(%)
    stretch: 2.0,     // 시작할 때 글자의 세로 늘어남
    blockRise: 2.5,    // 이미지와 카드가 올라오는 거리(rem)
    smoothing: 5     // 스크롤을 따라잡는 속도
  };

  const textSelector = [
    '.skills__title',
    '.skills__headline',
    '#poster-gallery-title',
    '[data-scroll-float]'
  ].join(',');

  const blockSelector = [
    '.profile-section__figure',
    '.skills__number',
    '.skills__description',
    '.skill-card',
    '.poster-gallery__eyebrow',
    '.poster-gallery__intro',
    '[data-scroll-reveal]'
  ].join(',');

  const clamp = value => value <= 0.000001 ? 0 : value >= 0.999999 ? 1 : value;
  const easeOut = value => 1 - Math.pow(1 - value, 3);

  async function init() {
    const root = document.documentElement;
    if (root.dataset.scrollFloatReady) return;
    root.dataset.scrollFloatReady = 'true';

    await document.fonts.ready;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const groups = [];
    const excluded = '.hero, .floating-nav, dialog, .poster-ring';
    const segmenter = typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter('ko', { granularity: 'grapheme' })
      : null;

    // 큰 제목을 글자 단위로 나눕니다. 기존 span과 br은 보존합니다.
    document.querySelectorAll(textSelector).forEach(element => {
      if (element.closest(excluded) || element.closest('.sf-text')) return;
      const label = element.innerText.replace(/\s+/g, ' ').trim();
      if (!label) return;

      const visual = document.createElement('span');
      visual.className = 'sf-visual';
      visual.setAttribute('aria-hidden', 'true');
      visual.append(...Array.from(element.childNodes));

      const reader = document.createElement('span');
      reader.className = 'sf-reader';
      reader.textContent = label;
      element.append(reader, visual);
      element.classList.add('sf-text');

      const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      const chars = [];

      nodes.forEach(node => {
        if (!node.textContent.trim()) return;
        const fragment = document.createDocumentFragment();

        // 단어와 띄어쓰기를 분리해 작은 화면의 줄바꿈을 유지합니다.
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.append(document.createTextNode(part));
            return;
          }
          const word = document.createElement('span');
          word.className = 'sf-word';
          const letters = segmenter
            ? Array.from(segmenter.segment(part), item => item.segment)
            : Array.from(part);
          letters.forEach(letter => {
            const char = document.createElement('span');
            char.className = 'sf-char';
            char.textContent = letter;
            word.append(char);
            chars.push(char);
          });
          fragment.append(word);
        });
        node.replaceWith(fragment);
      });
      groups.push({ element, chars, progress: null, y: 0 });
    });

    document.querySelectorAll(blockSelector).forEach(element => {
      if (element.closest(excluded) || element.closest('.sf-text')) return;
      // 부모와 자식의 중복 이동을 방지합니다.
      if (element.parentElement?.closest(blockSelector)) return;
      element.classList.add('sf-block');
      groups.push({ element, chars: null, progress: null, y: 0 });
    });

    let frame = 0;
    let previousTime = 0;

    function paint(group, progress, rem) {
      if (group.chars) {
        const count = group.chars.length;
        group.chars.forEach((char, index) => {
          const offset = count > 1
            ? index / (count - 1) * settings.stagger
            : 0;
          const local = clamp((progress - offset) / (1 - settings.stagger));
          const eased = easeOut(local);
          if (local === 1) {
            char.style.removeProperty('opacity');
            char.style.removeProperty('transform');
            return;
          }
          const y = (1 - eased) * settings.textRise;
          const scaleX = 0.78 + 0.22 * eased;
          const scaleY = 1 + (settings.stretch - 1) * (1 - eased);
          char.style.opacity = String(eased);
          char.style.transform = `translate3d(0, ${y}%, 0) scale(${scaleX}, ${scaleY})`;
        });
      } else {
        const eased = easeOut(progress);
        group.y = (1 - eased) * settings.blockRise * rem;
        if (progress === 1) {
          group.element.style.removeProperty('opacity');
          group.element.style.removeProperty('transform');
        } else {
          group.element.style.opacity = String(eased);
          group.element.style.transform = `translate3d(0, ${group.y}px, 0)`;
        }
      }
    }

    function tick(now) {
      frame = 0;
      const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 1 / 60;
      previousTime = now;
      const blend = 1 - Math.exp(-settings.smoothing * dt);
      const vh = window.innerHeight;
      const rem = parseFloat(getComputedStyle(root).fontSize) || 16;

      // 위치를 먼저 읽고 스타일을 한꺼번에 갱신합니다.
      const targets = groups.map(group => {
        if (reduced.matches) return 1;
        const rect = group.element.getBoundingClientRect();
        // 직접 더한 이동량을 빼서 기준 위치가 흔들리지 않도록 합니다.
        const top = rect.top - group.y;
        return clamp((vh * settings.start - top) / (vh * (settings.start - settings.end)));
      });

      let settling = false;
      groups.forEach((group, index) => {
        const target = targets[index];
        const before = group.progress;
        let next = before === null || reduced.matches
          ? target
          : before + (target - before) * blend;
        if (Math.abs(target - next) < 0.0005) next = target;
        else settling = true;
        group.progress = next;
        if (before !== next) paint(group, next, rem);
      });

      if (settling && !document.hidden) frame = requestAnimationFrame(tick);
      else previousTime = 0;
    }

    function requestUpdate() {
      if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', () => {
      groups.forEach(group => { group.progress = null; });
      requestUpdate();
    });
    window.addEventListener('pageshow', requestUpdate);
    document.addEventListener('visibilitychange', requestUpdate);
    reduced.addEventListener('change', requestUpdate);
    document.fonts.addEventListener('loadingdone', requestUpdate);
    document.addEventListener('load', requestUpdate, true);
    new ResizeObserver(requestUpdate).observe(document.body);

    // 중간 섹션에서 새로고침해도 현재 스크롤 위치에 맞춥니다.
    requestUpdate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
