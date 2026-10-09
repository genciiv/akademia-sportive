// @ts-nocheck
"use client";

import { useEffect } from "react";

/*
  Animacionet e faqes publike: parallax me mouse dhe scroll, reveal,
  numëruesit, spotlight/tilt në karta, kursori, taktika interaktive
  dhe butoni dark / light mode (ruhet në localStorage).
  Respekton "prefers-reduced-motion".
*/
function initHome(root){
let t;const rm=matchMedia('(prefers-reduced-motion:reduce)').matches,fine=matchMedia('(pointer:fine)').matches;
const $=(s,r=root)=>Array.from(r.querySelectorAll(s));const offs=[];
const on=(t,e,f,o)=>{t.addEventListener(e,f,o);offs.push(()=>t.removeEventListener(e,f,o))};
const I={bolt:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',check:'<path d="M20 6 9 17l-5-5"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',chart:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',heart:'<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.7 0-3 .8-4.5 2.5C10.5 3.8 9.2 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',building:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>'};
$('[data-ic]').forEach(e=>{e.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+(I[e.dataset.ic]||'')+'</svg>'});
root.classList.add('js');
const tbs=$('[data-theme-btn]');let tm='dark';try{const v=localStorage.getItem('ph-theme');if(v==='light'||v==='dark')tm=v}catch(e){}
const applyT=t=>{tm=t;root.dataset.theme=t;tbs.forEach(b=>{b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+(t==='light'?I.moon:I.sun)+'</svg>';b.setAttribute('aria-label',t==='light'?'Kalo në modalitetin e errët':'Kalo në modalitetin e çelët')})};
applyT(tm);tbs.forEach(b=>on(b,'click',()=>{applyT(tm==='light'?'dark':'light');try{localStorage.setItem('ph-theme',tm)}catch(e){}}));
$('.mq div').forEach(m=>{if(!m.dataset.d){m.dataset.d='1';m.innerHTML+=m.innerHTML}});
const nav=$('.nav')[0],prog=$('.prog')[0],mob=$('[data-mob]')[0],bg=$('[data-burger]')[0];
if(bg)on(bg,'click',()=>{const o=mob.classList.toggle('o');bg.firstElementChild.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">'+(o?I.x:I.menu)+'</svg>'});
if(mob)on(mob,'click',e=>{if(e.target.closest('a'))mob.classList.remove('o')});
/* reveal + counters + bars */
const count=e=>{const n=+e.dataset.count,s=e.dataset.s||'',t0=performance.now();const f=t=>{const k=Math.min(1,(t-t0)/1500),v=Math.round(n*(1-Math.pow(1-k,4)));e.textContent=v+s;if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)};
const io=new IntersectionObserver(es=>es.forEach(x=>{if(!x.isIntersecting)return;const e=x.target;io.unobserve(e);if(e.dataset.w)e.style.setProperty('--w',e.dataset.w);e.classList.add('in');
 if(e.dataset.count)count(e);
 if(e.dataset.bars)Array.from(e.children).forEach((b,i)=>{b.style.transitionDelay=i*70+'ms';b.style.height=e.dataset.bars.split(',')[i]+'%'});
 if(e.dataset.ring){const t=+e.dataset.ring,t0=performance.now();const f=n=>{const k=Math.min(1,(n-t0)/1600);e.style.setProperty('--v',t*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)}
}),{threshold:.2});
$('[data-r],[data-count],[data-bars],[data-ring],[data-pb]').forEach(e=>io.observe(e));
/* parallax + mouse */
let tx=0,ty=0,mx=0,my=0,cx=-100,cy=-100,px=-100,py=-100;const hero=$('[data-hero]')[0];
on(window,'pointermove',e=>{tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5;px=e.clientX;py=e.clientY;if(cur)cur.classList.add('on')},{passive:true});
if(hero)on(hero,'pointermove',e=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--mx',e.clientX-r.left+'px');hero.style.setProperty('--my',e.clientY-r.top+'px')});
const cur=fine&&!rm?$('.cur')[0]:null;if(cur)on(root,'pointerover',e=>cur.classList.toggle('h',!!e.target.closest('a,button')));
const dp=$('[data-depth]'),pl=$('[data-p]'),steps=$('[data-steps]')[0];let raf;
const tick=()=>{mx+=(tx-mx)*.08;my+=(ty-my)*.08;
 dp.forEach(e=>{const d=+e.dataset.depth;e.style.transform='translate3d('+(-mx*d).toFixed(2)+'px,'+(-my*d).toFixed(2)+'px,0)'});
 pl.forEach(e=>{const r=e.parentElement.getBoundingClientRect();if(r.bottom<-200||r.top>innerHeight+200)return;e.style.transform='translate3d(0,'+((r.top+r.height/2-innerHeight/2)*-+e.dataset.p).toFixed(1)+'px,0)'});
 if(cur){cx+=(px-cx)*.18;cy+=(py-cy)*.18;cur.style.transform='translate3d('+cx+'px,'+cy+'px,0)'}
 raf=requestAnimationFrame(tick)};
const sc=()=>{const h=document.documentElement,m=h.scrollHeight-innerHeight;prog.style.setProperty('--sp',m>0?scrollY/m:0);nav.classList.toggle('s',scrollY>20);
 if(steps){const r=steps.getBoundingClientRect();steps.style.setProperty('--pr',Math.max(0,Math.min(1,(innerHeight*.75-r.top)/(r.height+innerHeight*.1))))}};
on(window,'scroll',sc,{passive:true});sc();
if(!rm){tick();
/* tilt, spotlight, magnetic */
$('[data-sp]').forEach(e=>on(e,'pointermove',v=>{const r=e.getBoundingClientRect();e.style.setProperty('--x',v.clientX-r.left+'px');e.style.setProperty('--y',v.clientY-r.top+'px')}));
$('[data-tilt]').forEach(e=>{on(e,'pointermove',v=>{const r=e.getBoundingClientRect(),x=(v.clientX-r.left)/r.width-.5,y=(v.clientY-r.top)/r.height-.5;e.style.transform='perspective(900px) rotateY('+x*9+'deg) rotateX('+-y*9+'deg)'});on(e,'pointerleave',()=>{e.style.transform=''})});
$('.mag').forEach(e=>{on(e,'pointermove',v=>{const r=e.getBoundingClientRect();e.style.transform='translate('+(v.clientX-r.left-r.width/2)*.22+'px,'+(v.clientY-r.top-r.height/2)*.3+'px)'});on(e,'pointerleave',()=>{e.style.transform=''})})}
/* tactic board */
const F={'4-3-3':[[50,91],[14,73],[38,77],[62,77],[86,73],[28,53],[50,57],[72,53],[18,27],[50,20],[82,27]],'4-4-2':[[50,91],[14,73],[38,77],[62,77],[86,73],[12,50],[38,55],[62,55],[88,50],[38,25],[62,25]],'3-5-2':[[50,91],[24,74],[50,78],[76,74],[10,50],[30,57],[50,45],[70,57],[90,50],[38,23],[62,23]]};
const pitch=$('[data-pitch]')[0];
if(pitch){$('.pl,.ball',pitch).forEach(n=>n.remove());const P=F['4-3-3'].map((_,i)=>{const s=document.createElement('span');s.className='pl'+(i?'':' gk');s.textContent=i+1;pitch.appendChild(s);return s});
 const ball=document.createElement('span');ball.className='ball';pitch.appendChild(ball);let cf='4-3-3',bi=9;
 const set=k=>{cf=k;F[k].forEach((p,i)=>{P[i].style.left=p[0]+'%';P[i].style.top=p[1]+'%'});$('[data-f]').forEach(b=>b.classList.toggle('a',b.dataset.f===k))};
 const pass=()=>{let n;do{n=Math.floor(Math.random()*11)}while(n===bi);bi=n;const p=F[cf][n];ball.style.left=p[0]+'%';ball.style.top=p[1]+'%'};
 $('[data-f]').forEach(b=>on(b,'click',()=>{set(b.dataset.f);pass()}));
 const to=new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){o.disconnect();set('4-3-3');ball.style.left='50%';ball.style.top='20%';if(!rm)t=setInterval(pass,1500)}},{threshold:.35});to.observe(pitch);offs.push(()=>to.disconnect())}
return()=>{cancelAnimationFrame(raf);clearInterval(t);offs.forEach(f=>f());io.disconnect()}}

export function PublicHomeFX() {
  useEffect(() => {
    const root = document.querySelector(".ph");

    if (!root) {
      return;
    }

    return initHome(root);
  }, []);

  return null;
}
