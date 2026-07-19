const glow=document.querySelector('.mouse-glow');
const dot=document.createElement('div'),ring=document.createElement('div');
dot.className='cursor-dot';ring.className='cursor-ring';document.body.append(dot,ring);
let rx=innerWidth/2,ry=innerHeight/2;
window.addEventListener('pointermove',e=>{
  if(glow) glow.animate({left:e.clientX+'px',top:e.clientY+'px'},{duration:420,fill:'forwards'});
  dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px';rx=e.clientX;ry=e.clientY;
  const cert=document.querySelector('.certificate-image-wrap');
  if(cert&&innerWidth>900){const r=cert.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;cert.style.transform=`translateY(-2px) rotateX(${-y*5}deg) rotateY(${x*7}deg)`;}
});
(function follow(){const x=parseFloat(ring.style.left)||rx,y=parseFloat(ring.style.top)||ry;ring.style.left=x+(rx-x)*.16+'px';ring.style.top=y+(ry-y)*.16+'px';requestAnimationFrame(follow)})();
document.querySelectorAll('a,button,.glass').forEach(el=>{el.addEventListener('pointerenter',()=>ring.classList.add('is-hovering'));el.addEventListener('pointerleave',()=>ring.classList.remove('is-hovering'))});
document.querySelectorAll('.btn,.nav-cta,button').forEach(el=>el.addEventListener('click',e=>{const r=el.getBoundingClientRect(),s=document.createElement('span'),d=Math.max(r.width,r.height);s.className='ripple';s.style.width=s.style.height=d+'px';s.style.left=e.clientX-r.left-d/2+'px';s.style.top=e.clientY-r.top-d/2+'px';el.appendChild(s);setTimeout(()=>s.remove(),650)}));
const menu=document.querySelector('.menu-btn'),links=document.querySelector('.nav-links');menu?.addEventListener('click',()=>links.classList.toggle('open'));document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));
const reveals=[...document.querySelectorAll('.reveal')];const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.animate([{opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,fill:'both',easing:'cubic-bezier(.2,.7,.2,1)'});io.unobserve(e.target)}}),{threshold:.12});reveals.forEach(el=>io.observe(el));
const counters=[...document.querySelectorAll('[data-counter]')];const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,target=+el.dataset.counter,suffix=el.dataset.suffix||'',start=performance.now(),duration=1500;function tick(t){const p=Math.min((t-start)/duration,1),v=Math.round(target*(1-Math.pow(1-p,3)));el.textContent=v.toLocaleString('en-US')+suffix;if(p<1)requestAnimationFrame(tick)}requestAnimationFrame(tick);cio.unobserve(el)}),{threshold:.5});counters.forEach(c=>cio.observe(c));
