(() => {
  'use strict';
  const root=document.querySelector('.pr-profile');
  if(!root||root.dataset.prReady)return;
  root.dataset.prReady='true';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const running=new Set();
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      observer.unobserve(entry.target);
      if(reduced.matches||typeof entry.target.animate!=='function')return;
      const animation=entry.target.animate([
        {opacity:0,transform:'translateY(1.5rem)'},
        {opacity:1,transform:'translateY(0)'}
      ],{duration:650,delay:entry.target.classList.contains('pr-copy')?100:0,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
      running.add(animation);animation.finished.then(()=>running.delete(animation),()=>running.delete(animation));
    });
  },{threshold:.15});
  root.querySelectorAll('[data-pr-enter]').forEach(el=>observer.observe(el));
  reduced.addEventListener('change',()=>{if(reduced.matches){running.forEach(a=>a.cancel());running.clear();}});
})();
