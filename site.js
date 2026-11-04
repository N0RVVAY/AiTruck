const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const progress = document.querySelector('.progress');
let scrollTicking = false;
function updateProgress() {
  const range = document.documentElement.scrollHeight - innerHeight;
  const value = range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0;
  progress.style.transform = `scaleX(${value})`;
  scrollTicking = false;
}
addEventListener('scroll', () => {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(updateProgress);
  }
}, {passive:true});
updateProgress();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    } else entry.target.classList.remove('is-visible');
  });
}, {threshold:.12, rootMargin:'0px 0px -4% 0px'});
document.querySelectorAll('.reveal,.reveal-media').forEach(el => revealObserver.observe(el));

const films = document.querySelectorAll('.motion-film');
const filmObserver = new IntersectionObserver(entries => {
  entries.forEach(({target,isIntersecting}) => {
    if (isIntersecting && !reducedMotion.matches) {
      const attempt = target.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    } else target.pause();
  });
}, {threshold:.15});
films.forEach(video => filmObserver.observe(video));
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) films.forEach(video => video.pause());
});

const gallery = document.querySelector('.gallery');
const cards = [...gallery.querySelectorAll('figure')];
let activeCard = 0;
let galleryVisible = false;
let galleryTimer;
let manualUntil = 0;
function centerCard(index, smooth = true) {
  activeCard = (index + cards.length) % cards.length;
  cards.forEach((card, i) => card.classList.toggle('is-center', i === activeCard));
  const card = cards[activeCard];
  const left = card.offsetLeft - gallery.offsetLeft - (gallery.clientWidth - card.clientWidth) / 2;
  gallery.scrollTo({left, behavior:smooth && !reducedMotion.matches ? 'smooth' : 'instant'});
}
function startGallery() {
  clearInterval(galleryTimer);
  if (reducedMotion.matches || !galleryVisible) return;
  galleryTimer = setInterval(() => {
    if (Date.now() < manualUntil || document.hidden) return;
    centerCard(activeCard + 1);
  }, 3600);
}
gallery.addEventListener('pointerdown', () => {manualUntil = Date.now() + 8000;}, {passive:true});
gallery.addEventListener('focusin', () => {manualUntil = Date.now() + 8000;});
const galleryObserver = new IntersectionObserver(entries => {
  galleryVisible = entries[0].isIntersecting;
  startGallery();
}, {threshold:.2});
galleryObserver.observe(gallery);
reducedMotion.addEventListener('change', startGallery);
centerCard(0, false);

if (!reducedMotion.matches && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const art = document.querySelector('.hero-art');
  const disc = document.querySelector('.hero-disc');
  let tx=0,ty=0,x=0,y=0;
  addEventListener('pointermove', event => {
    tx=(event.clientX/innerWidth-.5)*2;
    ty=(event.clientY/innerHeight-.5)*2;
  }, {passive:true});
  function move() {
    x+=(tx-x)*.055; y+=(ty-y)*.055;
    art.style.setProperty('--px', `${-x*15}px`);
    art.style.setProperty('--py', `${-y*12}px`);
    disc.style.setProperty('--ry', `${-5+x*5}deg`);
    disc.style.setProperty('--rx', `${2-y*4}deg`);
    requestAnimationFrame(move);
  }
  move();
}

