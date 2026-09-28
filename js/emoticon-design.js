(() => {
  'use strict';
  const root = document.querySelector('#emoticon-design');
  if (!root || root.dataset.emReady) return;
  root.dataset.emReady = 'true';

  // 이름 / 상대방 질문 / 연결할 GIF 번호. GIF가 없는 항목은 정지형에서만 표시합니다.
  // 이미지 파일 번호는 원본 그대로입니다. 문구는 여기에서 수정하세요.
  const items = [
    { id: 1, name: '터벅터벅 나의 일상', question: '오늘도 학교가?', motion: 1 },
    { id: 2, name: '수혈 중…', question: '아침 먹었어?', motion: 2 },
    { id: 3, name: '이해한 사람?', question: '교수님이 뭐라셔?' },
    { id: 4, name: '오늘 과제입니다', question: '오늘 과제 하나 더 나왔대' },
    { id: 5, name: '속으로만 하는 말', question: '과제 다음 주까지라는데?' },
    { id: 6, name: '낼 하면 돼~', question: '과제 언제 할 거야?', motion: 3 },
    { id: 7, name: '진짜 휴강한다', question: '힘들다 휴강하고싶다', motion: 4 },
    { id: 8, name: '어디가 구린 거지', question: '디자인 그거 맞아?' },
    { id: 9, name: '돌아와', question: '작업파일 날아갔다고?', motion: 5 },
    { id: 10, name: '잠깐, Ctrl+S!', question: '저장하는거 잊지말자' },
    { id: 11, name: '디자인이란 뭘까', question: '디자인 그거 뭔데 어떻게하는건데', motion: 6 },
    { id: 12, name: '하얗게 불태웠다', question: '과제 제출 다 했어?', motion: 7 },
    { id: 13, name: '저의 디자인입니다', question: '이번 작업한거 보여줘', motion: 8 },
    { id: 14, name: '구린데(굿~)', question: '내가 만든거 어때?' },
    { id: 15, name: '재수강의 기운', question: '이번 학기 성적 잘나왔어?' },
    { id: 16, name: 'A+의 기운', question: '이번 학기 성적 잘나왔어?' },
    { id: 17, name: '드디어 종강', question: '드디어 종강이다!' },
    { id: 18, name: '벌써 개강', question: '벌써 개강이라고?' },
    { id: 19, name: '광광 울기', question: 'USB 고장났다고?', motion: 9 },
    { id: 20, name: '집에 갈래', question: 'MT 어때 재밌어?', motion: 10 },
    { id: 21, name: '감삼다', question: '이거 참고하면 도움 될 거야!' },
    { id: 22, name: '그럴 리가', question: '이번 과제는 진짜 쉽대' },
    { id: 23, name: '번뜩!', question: '혹시 좋은 아이디어 떠올랐어?', motion: 11 },
    { id: 24, name: '몰래 폰하는 중', question: '너 지금 안자고있지', motion: 12 }
  ];
  const assetRoot = './assets/images/emoticon/';
  const png = item => `${assetRoot}emoticon${item.id}.png`;
  const gif = item => `${assetRoot}emoticon-motion${item.motion}.gif`;
  const lists = { static: items, motion: items.filter(item => item.motion) };
  const mobile = matchMedia('(max-width: 768px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tabs = Array.from(root.querySelectorAll('[data-em-tab]'));
  const panels = Object.fromEntries(['overview', 'static', 'motion'].map(mode => [mode, root.querySelector(`#em-panel-${mode}`)]));
  const pages = { static: 0, motion: 0 };
  let pageSize = 12;
  let activeTab = 'overview';
  let selected = { item: items[0], mode: 'static' };
  let userPaused = false;
  let chatVisible = false;
  let sectionVisible = false;
  let opener = null;
  let savedOverflow = null;
  let currentSource = png(items[0]);
  const failedGIFs = new Set();
  const chat = root.querySelector('.em-chat');
  const reply = root.querySelector('[data-em-reply]');
  const chatImage = root.querySelector('[data-em-image]');
  const motionButton = root.querySelector('[data-em-motion]');
  const backButton = root.querySelector('[data-em-back]');
  const announcement = root.querySelector('[data-em-announcement]');
  const dialog = root.querySelector('.em-dialog');

  function animate(element, keyframes, duration) {
    if (reduced.matches) return;
    element.getAnimations?.().forEach(animation => animation.cancel());
    element.animate?.(keyframes, { duration, easing: 'cubic-bezier(.2,.75,.25,1)' });
  }
  function markSelected() {
    root.querySelectorAll('[data-em-item]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.emItem) === selected.item.id && button.dataset.emKind === selected.mode));
    });
  }
  function syncPlayback() {
    const motion = selected.mode === 'motion';
    const blocked = reduced.matches || failedGIFs.has(selected.item.id);
    const play = motion && !blocked && !userPaused && chatVisible && !document.hidden &&
      !root.closest('[inert]') && !document.querySelector('dialog[open]');
    const source = play ? gif(selected.item) : png(selected.item);
    if (source !== currentSource) { currentSource = source; chatImage.src = source; }
    motionButton.hidden = !motion;
    motionButton.disabled = blocked;
    motionButton.setAttribute('aria-pressed', String(userPaused || blocked));
    motionButton.textContent = blocked ? '정지 미리보기' : userPaused ? '움직임 재생' : '움직임 멈추기';
  }
  function choose(item, mode) {
    selected = { item, mode };
    userPaused = false;
    root.querySelector('[data-em-question]').textContent = item.question;
    root.querySelector('[data-em-name]').textContent = item.name;
    chatImage.alt = item.name;
    chatImage.loading = 'eager';
    markSelected();
    syncPlayback();
    backButton.hidden = false;
    announcement.textContent = `친구: ${item.question} 답장: ${item.name}. ${mode === 'motion' ? '움직이는' : '정지형'} 이모티콘을 선택했습니다.`;
    animate(reply, [
      { opacity: 0, transform: 'translateY(.5rem) scale(.90)' },
      { opacity: 1, transform: 'translateY(0) scale(1.04)', offset: .65 },
      { opacity: 1, transform: 'translateY(0) scale(1)' }
    ], 360);
  }
  function renderGrid(mode) {
    const grid = root.querySelector(`[data-em-grid="${mode}"]`);
    const list = lists[mode];
    const pageCount = Math.ceil(list.length / pageSize);
    pages[mode] = Math.max(0, Math.min(pages[mode], pageCount - 1));
    const fragment = document.createDocumentFragment();
    list.slice(pages[mode] * pageSize, (pages[mode] + 1) * pageSize).forEach(item => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'em-option';
      button.dataset.emItem = String(item.id); button.dataset.emKind = mode;
      button.setAttribute('aria-label', `${item.name} — ${mode === 'motion' ? '움직이는' : '정지형'} 이모티콘을 대화에 넣기`);
      button.setAttribute('aria-controls', 'em-chat');
      const media = document.createElement('span'); media.className = 'em-option__image';
      const image = document.createElement('img');
      // 썸네일에는 PNG만 표시합니다. 원본 GIF는 채팅창 한 곳에서만 재생합니다.
      image.src = png(item); image.alt = ''; image.width = 1000; image.height = 1000;
      image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
      media.append(image);
      const caption = document.createElement('span'); caption.className = 'em-option__name'; caption.textContent = item.name;
      button.append(media, caption);
      button.addEventListener('click', () => choose(item, mode));
      fragment.append(button);
    });
    grid.replaceChildren(fragment);
    root.querySelector(`[data-em-page="${mode}"]`).textContent = `${pages[mode] + 1} / ${pageCount}`;
    root.querySelector(`[data-em-prev="${mode}"]`).disabled = pages[mode] === 0;
    root.querySelector(`[data-em-next="${mode}"]`).disabled = pages[mode] === pageCount - 1;
    markSelected();
  }
  function activateTab(mode, focus = false) {
    const changed = activeTab !== mode;
    activeTab = mode;
    tabs.forEach(tab => {
      const active = tab.dataset.emTab === mode;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== mode; });
    if (mode !== 'overview') renderGrid(mode);
    if (changed) animate(panels[mode], [{ opacity: 0 }, { opacity: 1 }], 200);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.emTab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      activateTab(tabs[next].dataset.emTab, true);
    });
  });
  for (const mode of ['static', 'motion']) {
    for (const [direction, delta] of [['prev', -1], ['next', 1]]) {
      root.querySelector(`[data-em-${direction}="${mode}"]`).addEventListener('click', () => {
        pages[mode] += delta; renderGrid(mode);
      });
    }
  }
  mobile.addEventListener('change', () => {
    const previousSize = pageSize;
    pageSize = 12;
    for (const mode of ['static', 'motion']) {
      pages[mode] = Math.floor(pages[mode] * previousSize / pageSize);
      renderGrid(mode);
    }
  });
  motionButton.addEventListener('click', () => { userPaused = !userPaused; syncPlayback(); });
  backButton.addEventListener('click', () => {
    chat.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'instant' : 'smooth' });
    chat.focus({ preventScroll: true });
  });
  chatImage.addEventListener('error', () => {
    if (currentSource.endsWith('.gif')) { failedGIFs.add(selected.item.id); syncPlayback(); }
  });
  function refreshVisibility() {
    if (sectionVisible && !root.closest('[inert]')) root.classList.add('is-entered');
    syncPlayback();
  }
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target === root) sectionVisible = entry.isIntersecting;
      if (entry.target === chat) chatVisible = entry.isIntersecting;
    });
    refreshVisibility();
  }, { threshold: 0 });
  visibility.observe(root); visibility.observe(chat);
  new MutationObserver(refreshVisibility).observe(document.body, {
    subtree: true, attributes: true, attributeFilter: ['inert', 'open']
  });
  document.addEventListener('visibilitychange', syncPlayback);
  reduced.addEventListener('change', () => {
    if (reduced.matches) [reply, ...Object.values(panels)].forEach(element => element.getAnimations?.().forEach(animation => animation.cancel()));
    syncPlayback();
  });

  root.querySelectorAll('[data-em-open]').forEach(button => button.addEventListener('click', () => {
    if (dialog.open) return;
    opener = button;
    root.querySelector('[data-em-full-image]').src = `${assetRoot}emoticon-blue.jpg`;
    dialog.showModal(); dialog.scrollTop = 0;
    savedOverflow = [document.documentElement.style.overflow, document.body.style.overflow];
    document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
    syncPlayback();
  }));
  root.querySelector('[data-em-close]').addEventListener('click', () => dialog.close());
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
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('close', () => {
    if (savedOverflow) {
      [document.documentElement.style.overflow, document.body.style.overflow] = savedOverflow;
      savedOverflow = null;
    }
    if (opener?.isConnected && !root.closest('[inert]')) opener.focus({ preventScroll: true });
    syncPlayback();
  });
  // 전체 모음이 첫 화면입니다. 선택판은 해당 탭을 열 때 생성합니다.
  activateTab('overview');
  syncPlayback();
})();
