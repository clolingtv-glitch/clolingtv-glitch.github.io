(() => {
 'use strict';
 const projects = window.websiteProjects || [];
 const dialog = document.querySelector('.ws-dialog');
 if (!dialog) return;
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const fine = matchMedia('(hover: hover) and (pointer: fine)');
 const q = s => dialog.querySelector(s);
 let current, page = 'main', device = 'pc', opener, previousOverflow;
 const source = (p, key, size) => `./assets/images/website/${p.id}/${key}-${size}.png`;
 const pressed = (root, selector, value, key) => root.querySelectorAll(selector).forEach(b => b.setAttribute('aria-pressed', String(b.dataset[key] === value)));
 function renderDetail() {
  const label = current.pages.find(p => p[0] === page)[1];
  const img = q('[data-ws-detail]');
  img.alt = `${current.name} ${label} ${device.toUpperCase()} 디자인`;
  img.dataset.device = device;
  img.src = source(current,page,device);
  pressed(dialog,'[data-modal-page]',page,'modalPage');
  pressed(dialog,'[data-device]',device,'device');
  q('[data-ws-caption]').textContent = `${current.name} / ${label} / ${device.toUpperCase()}`;
 }
 function open(project, selectedPage, trigger) {
  current = project; page = selectedPage; device = 'pc'; opener = trigger;
  q('#ws-dialog-title').textContent = project.name;
  q('[data-ws-category]').textContent = project.type;
  q('#ws-dialog-description').textContent = project.description;
  q('[data-ws-dialog-role]').textContent = project.role;
  q('[data-ws-dialog-status]').textContent = project.status;
  const list=q('[data-ws-dialog-pages]');list.replaceChildren();
  project.pages.forEach(([key,label]) => {
   const b=document.createElement('button');b.type='button';b.dataset.modalPage=key;b.textContent=label;
   b.addEventListener('click',()=>{page=key;renderDetail();});list.append(b);
  });
  renderDetail();
  previousOverflow = [document.documentElement.style.overflow, document.body.style.overflow];
  dialog.showModal(); document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';dialog.scrollTop=0;
 }
 q('.design-dialog__close').addEventListener('click',()=>dialog.close());
 let outside=false;
 const isOutside=e=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
 dialog.addEventListener('pointerdown',e=>{outside=e.target===dialog&&isOutside(e);});
 dialog.addEventListener('click',e=>{if(outside&&e.target===dialog&&isOutside(e))dialog.close();outside=false;});
 dialog.addEventListener('close',()=>{
  if(previousOverflow){[document.documentElement.style.overflow,document.body.style.overflow]=previousOverflow;previousOverflow=null;}
  opener?.focus({preventScroll:true});
 });
 q('[data-ws-dialog-devices]').addEventListener('click',e=>{const b=e.target.closest('[data-device]');if(b){device=b.dataset.device;renderDetail();}});
 projects.forEach(project => {
  const root=document.querySelector(`[data-website="${project.id}"]`);if(!root)return;
  root.querySelector('[data-ws-role]').textContent=project.role;
  root.querySelector('[data-ws-status]').textContent=project.status;
  const link=root.querySelector('[data-ws-link]');
  if(/^https?:\/\//i.test(project.url)){
   const a=document.createElement('a');a.href=project.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='실제 사이트 보기 ↗';a.setAttribute('aria-label',`${project.name} 실제 사이트 보기 (새 탭)`);link.append(a);
  }else{const s=document.createElement('span');s.className='ws-unavailable';s.textContent='사이트 준비 중';link.append(s);}
  const win=root.querySelector('.ws-window'), phone=root.querySelector('.ws-phonewindow');
  let touching=false;
  const hoverScreens=new Set(), focusScreens=new Set();
  let selected='main', hovered=false,focused=false,visible=false,frame=0,last=0,position=0,writing=false;
  function tick(time){
   frame=0;
   const active=!hovered&&!focused&&!touching&&visible&&!document.hidden&&!reduced.matches&&!document.querySelector('dialog[open]');
   if(!active){last=0;return;}
   const delta=last?Math.min((time-last)/1000,.05):0;last=time;
   const max=Math.max(0,win.scrollHeight-win.clientHeight);
   position=Math.min(max,position+delta*24);
   writing=true;win.scrollTop=position;
   const ratio=max?position/max:0;phone.scrollTop=ratio*Math.max(0,phone.scrollHeight-phone.clientHeight);writing=false;
   if(position<max)frame=requestAnimationFrame(tick);else last=0;
  }
  function resume(){if(!frame)frame=requestAnimationFrame(tick);}
  [win,phone].forEach(screen=>{
   screen.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){hoverScreens.add(screen);hovered=true;}});
   screen.addEventListener('pointerleave',()=>{hoverScreens.delete(screen);hovered=hoverScreens.size>0;resume();});
   screen.addEventListener('focus',()=>{focusScreens.add(screen);focused=true;});
   screen.addEventListener('blur',()=>{focusScreens.delete(screen);focused=focusScreens.size>0;resume();});
   screen.addEventListener('pointerdown',()=>{touching=true;});
  });
  const release=()=>{touching=false;resume();};
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
  win.addEventListener('scroll',()=>{if(!writing&&Math.abs(win.scrollTop-position)>1){position=win.scrollTop;resume();}},{passive:true});
  root.querySelector('[data-ws-pc]').addEventListener('load',()=>{position=0;win.scrollTop=0;resume();});
  root.querySelectorAll('[data-ws-page]').forEach(b=>b.addEventListener('click',()=>{
   selected=b.dataset.wsPage;pressed(root,'[data-ws-page]',selected,'wsPage');
   const label=project.pages.find(p=>p[0]===selected)[1];
   for(const [selector,size] of [['[data-ws-pc]','pc'],['[data-ws-mo]','mo']]){
    const img=root.querySelector(selector);img.removeAttribute('height');img.removeAttribute('width');img.src=source(project,selected,size);img.alt=`${project.name} ${label} ${size==='pc'?'PC':'모바일'} 디자인`;
   }
   position=0;win.scrollTop=phone.scrollTop=0;last=0;resume();
  }));
  root.querySelector('[data-ws-open]').addEventListener('click',e=>open(project,selected,e.currentTarget));
  let entered=false;
  const observer=new IntersectionObserver(entries=>{
   visible=entries[0].isIntersecting;
   if(visible&&!entered){entered=true;if(!reduced.matches){
    root.querySelector('.ws-browser').animate([{opacity:0,transform:'translateY(2rem)'},{opacity:1,transform:'translateY(0)'}],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'});
    root.querySelector('.ws-phone').animate([{opacity:0,transform:'translateY(2rem)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay:120,fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'});
   }}resume();
  },{threshold:.1});observer.observe(root);
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);fine.addEventListener('change',resume);
  new MutationObserver(resume).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 });
})();
