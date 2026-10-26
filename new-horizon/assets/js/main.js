const toggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}
const video = document.querySelector('.hero-video');
if (video) {
  video.playbackRate = 0.85;
  video.addEventListener('error', () => document.querySelector('.hero').classList.add('video-unavailable'));
}
