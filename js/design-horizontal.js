(() => {
  'use strict';
  const clamp = (n, low, high) => Math.min(high, Math.max(low, n));
  const panelSelector = '.dh-popup-panel, #popup-posters, #poster-design, [data-design-panel]';

  function init() {
    if (document.documentElement.dataset.designHorizontalReady === 'grouped-v4') return;
    // 이 파일은 기존 design-horizontal.js를 교체해 한 번만 연결하세요.
    if (document.querySelector('.design-horizontal')) {
      console.warn('design-horizontal.js: 기존 가로 래퍼 또는 중복 스크립트를 확인해주세요.');
      return;
    }
    const popup = document.getElementById('popup-posters');
    let first = document.querySelector('.design-intro');
    if (!first && !document.getElementById('design') && popup) {
      first = document.createElement('section');
      first.className = 'design-intro';
      first.id = 'design';
      first.setAttribute('aria-labelledby', 'dh-intro-title');
      const title = document.createElement('h2');
      title.id = 'dh-intro-title';
      title.className = 'design-intro__title';
      title.textContent = 'MY DESIGN';
      first.append(title);
      popup.before(first);
    }
    // 가로 트랙을 만들기 전에 제목 + 팝업을 하나의 확정된 패널로 만듭니다.
    // 사이의 주석/스크립트나 형제 순서에 의존하지 않습니다.
    let combined = document.querySelector('.dh-popup-panel');
    if (popup && first && !first.contains(popup)) {
      if (!combined) {
        combined = document.createElement('div');
        combined.className = 'dh-popup-panel';
        first.before(combined);
      }
      combined.append(first, popup);
      first = combined;
    } else if (combined) {
      first = combined;
    }
    first ||= popup || document.getElementById('poster-design');
    if (!first) return;

    // 연속된 디자인 섹션만 묶습니다. PROJECT/ABOUT 등은 바깥에 유지됩니다.
    const sections = [];
    let node = first;
    while (node) {
      if (node.matches(panelSelector)) sections.push(node);
      else if (!node.matches('script, style, link')) break;
      node = node.nextElementSibling;
    }
    if (sections.length < 2) return;
    const host = first.parentElement;
    const shell = document.createElement('div');
    shell.className = 'design-horizontal';
    const viewport = document.createElement('div');
    viewport.className = 'dh-viewport';
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', '디자인 작업물. 스크롤하면 가로로 이동합니다.');
    const track = document.createElement('div');
    track.className = 'dh-track';
    first.before(shell);
    shell.append(viewport);
    viewport.append(track);
    const panels = sections;
    panels.forEach(panel => {
      panel.classList.add('dh-panel');
      track.append(panel);
    });
    document.documentElement.dataset.designHorizontalReady = 'grouped-v4';

    const vertical = matchMedia('(max-width: 1024px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, distance = 0, start = 0;
    let frame = 0, active = -1;
    let firstMeasure = true;
    let snapTimer = 0, snapFrame = 0;
    let pointerHeld = false, programmaticUntil = 0;
    const snapDelay = 180;
    const snapDuration = 450;
    const speed = 1; // 숫자가 클수록 가로 이동에 더 긴 세로 스크롤이 필요합니다.

    function panelAt(y) {
      return clamp(Math.round((y - start) / (Math.max(width, 1) * speed)), 0, panels.length - 1);
    }
    function paint() {
      frame = 0;
      if (vertical.matches) {
        track.style.removeProperty('transform');
        panels.forEach(panel => { panel.inert = false; });
        return;
      }
      // 앞 섹션의 높이가 바뀌어도 실제 문서 위치를 기준으로 계산합니다.
      start = shell.getBoundingClientRect().top + window.scrollY;
      const traveled = clamp((window.scrollY - start) / speed, 0, distance);
      track.style.transform = `translate3d(${-traveled}px, 0, 0)`;
      // 가로 트랙에서 브라우저가 focus로 만든 자체 스크롤은 사용하지 않습니다.
      viewport.scrollLeft = 0;
      const next = panelAt(window.scrollY);
      if (next !== active) {
        active = next;
        panels.forEach((panel, i) => {
          if (i !== active && panel.contains(document.activeElement)) viewport.focus({ preventScroll: true });
          panel.inert = i !== active;
        });
      }
    }
    function requestPaint() { if (!frame) frame = requestAnimationFrame(paint); }
    function measure() {
      if (vertical.matches) {
        cancelSnap();
        clearTimeout(wheelTimer);
        wheelLocked = false;
        wheelAmount = 0;
        active = -1;
        distance = 0;
        width = 0;
        firstMeasure = true;
        shell.style.removeProperty('--dh-height');
        shell.style.removeProperty('--dh-width');
        shell.style.removeProperty('--dh-offset');
        track.style.removeProperty('transform');
        panels.forEach(panel => { panel.inert = false; });
        viewport.tabIndex = -1;
        viewport.setAttribute('aria-label', '디자인 작업물');
        return;
      }
      viewport.tabIndex = 0;
      viewport.setAttribute('aria-label', '디자인 작업물. 스크롤하면 가로로 이동합니다.');
      const oldWidth = width;
      const oldStart = start;
      const oldDistance = distance;
      const pageY = window.scrollY;
      const wasInside = oldWidth > 0 && pageY >= oldStart && pageY <= oldStart + oldDistance * speed;
      const progress = oldWidth ? (pageY - oldStart) / (oldWidth * speed) : 0;
      width = document.documentElement.clientWidth;
      height = viewport.clientHeight || window.innerHeight;
      distance = Math.max(0, (panels.length - 1) * width);
      const hostStyle = getComputedStyle(host);
      shell.style.setProperty('--dh-width', `${width}px`);
      shell.style.setProperty('--dh-offset', `-${parseFloat(hostStyle.paddingLeft) || 0}px`);
      shell.style.setProperty('--dh-height', `${height + distance * speed}px`);
      start = shell.getBoundingClientRect().top + window.scrollY;
      if (!firstMeasure && wasInside && oldWidth !== width) {
        window.scrollTo({ top: start + progress * width * speed, behavior: 'instant' });
      }
      firstMeasure = false;
      paint();
    }
    function scrollToPanel(panel, focus = false, smooth = true) {
      if (vertical.matches) {
        panel.scrollIntoView({ behavior: smooth && !reduced.matches ? 'smooth' : 'instant', block: 'start' });
        return;
      }
      const i = panels.indexOf(panel);
      if (i < 0) return;
      start = shell.getBoundingClientRect().top + window.scrollY;
      cancelSnap();
      programmaticUntil = performance.now() + 1000;
      window.scrollTo({ top: start + i * width * speed, behavior: smooth && !reduced.matches ? 'smooth' : 'instant' });
      if (focus) viewport.focus({ preventScroll: true });
    }
    // DESIGN 메뉴와 해시 링크는 변형된 요소의 top이 아닌 해당 가로 페이지로 이동합니다.
    function findHashPanel(hash) {
      if (!hash || hash === '#') return null;
      let target;
      try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return null; }
      return panels.find(panel => panel === target || panel.contains(target)) || null;
    }
    document.addEventListener('click', event => {
      if (vertical.matches) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href]');
      if (!link || link.download || (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
      const panel = findHashPanel(url.hash);
      if (!panel) return;
      event.preventDefault();
      if (location.hash !== url.hash) history.pushState(null, '', url.hash);
      scrollToPanel(panel, true);
    });
    function onHash() {
      const panel = findHashPanel(location.hash);
      if (vertical.matches) return;
      if (panel) scrollToPanel(panel, false, false);
    }
    viewport.addEventListener('keydown', event => {
      // 카드의 좌우 방향키 및 버튼 조작을 가로 페이지 전환과 분리합니다.
      if (vertical.matches || event.target !== viewport) return;
      if (!['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = active + (['ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1);
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = panels.length - 1;
      scrollToPanel(panels[clamp(next, 0, panels.length - 1)]);
    });
    function cancelSnap() {
      clearTimeout(snapTimer);
      cancelAnimationFrame(snapFrame);
      snapTimer = 0;
      snapFrame = 0;
    }
    function queueSnap() {
      clearTimeout(snapTimer);
      if (vertical.matches || snapFrame || pointerHeld) return;
      snapTimer = setTimeout(snapToCenter, snapDelay);
    }
    function snapToCenter() {
      snapTimer = 0;
      if (vertical.matches) return;
      if (pointerHeld || performance.now() < programmaticUntil || document.querySelector('dialog[open]')) return;
      start = shell.getBoundingClientRect().top + window.scrollY;
      const from = window.scrollY;
      const end = start + distance * speed;
      // 디자인 영역 바깥에서는 잡아당기지 않아 세로 영역으로 자유롭게 나갑니다.
      if (from < start || from > end) return;
      const target = start + panelAt(from) * width * speed;
      if (Math.abs(target - from) < 1) return;
      if (reduced.matches) {
        window.scrollTo({ top: target, behavior: 'instant' });
        return;
      }
      const began = performance.now();
      function settle(now) {
        const t = clamp((now - began) / snapDuration, 0, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        window.scrollTo({ top: from + (target - from) * ease, behavior: 'instant' });
        snapFrame = t < 1 ? requestAnimationFrame(settle) : 0;
      }
      snapFrame = requestAnimationFrame(settle);
    }
    function interruptSnap() { cancelSnap(); programmaticUntil = 0; }
    let wheelLocked = false;
    let wheelTimer = 0;
    let wheelAmount = 0;
    let wheelLastTime = 0;
    let wheelLockUntil = 0;

    function releaseWheelLater() {
      clearTimeout(wheelTimer);

      // 휠 입력이 끝나고, 이동 대기 시간도 지났을 때 해제
      const delay = Math.max(
        180,
        wheelLockUntil - performance.now()
      );

      wheelTimer = setTimeout(() => {
        wheelLocked = false;
        wheelAmount = 0;
      }, delay);
    }

    window.addEventListener('wheel', (event) => {
      if (vertical.matches) return;
      // 확대/축소와 팝업 내부 스크롤은 그대로 사용
      if (
        event.ctrlKey ||
        document.querySelector('dialog[open]') ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ) return;

      const now = performance.now();

      // 한 번의 휠 동작으로 여러 섹션을 건너뛰지 않게 처리
      if (wheelLocked) {
        event.preventDefault();
        releaseWheelLater();
        return;
      }

      start = shell.getBoundingClientRect().top + window.scrollY;
      const end = start + distance * speed;
      const y = window.scrollY;

      // 디자인 영역 밖에서는 일반 세로 스크롤
      if (y < start - 1 || y > end + 1) return;

      const direction = Math.sign(event.deltaY);
      if (!direction) return;

      // 긴 섹션의 내부 내용은 먼저 스크롤
      const panel = event.target.closest?.('.dh-panel');

      if (panel && panel.scrollHeight > panel.clientHeight + 1) {
        const canScrollDown =
          panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1;

        const canScrollUp = panel.scrollTop > 1;

        if (
          (direction > 0 && canScrollDown) ||
          (direction < 0 && canScrollUp)
        ) return;
      }

      // 처음에서 위로, 마지막에서 아래로 움직이면 세로 영역으로 나가기
      if (
        (direction < 0 && y <= start + 1) ||
        (direction > 0 && y >= end - 1)
      ) {
        interruptSnap();
        return;
      }

      event.preventDefault();
      interruptSnap();

      // 트랙패드의 아주 작은 입력은 누적해서 처리
      if (
        now - wheelLastTime > 180 ||
        Math.sign(wheelAmount) !== direction
      ) {
        wheelAmount = 0;
      }

      wheelLastTime = now;

      const unit =
        event.deltaMode === 1 ? 16 :
          event.deltaMode === 2 ? window.innerHeight : 1;

      wheelAmount += event.deltaY * unit;

      if (Math.abs(wheelAmount) < 20) return;

      const targetIndex = clamp(
        panelAt(y) + direction,
        0,
        panels.length - 1
      );

      wheelAmount = 0;
      wheelLocked = true;
      wheelLockUntil = now + 750;

      scrollToPanel(panels[targetIndex]);
      releaseWheelLater();

    }, { passive: false });
    document.addEventListener('pointerdown', () => { pointerHeld = true; interruptSnap(); }, { passive: true });
    const release = () => { pointerHeld = false; queueSnap(); };
    document.addEventListener('pointerup', release, { passive: true });
    document.addEventListener('pointercancel', release, { passive: true });
    document.addEventListener('keydown', interruptSnap, true);
    window.addEventListener('resize', cancelSnap);
    // 세로 휠/터치 스크롤은 막지 않습니다. 실제 문서 스크롤이 트랙 이동을 구동합니다.
    window.addEventListener('scroll', () => { requestPaint(); queueSnap(); }, { passive: true });
    window.addEventListener('resize', measure);
    vertical.addEventListener('change', measure);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    window.addEventListener('pageshow', requestPaint);
    document.addEventListener('load', requestPaint, true);
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    observer.observe(viewport);
    measure();
    requestAnimationFrame(onHash);
    document.fonts?.ready.then(() => { measure(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
