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
const originals = [...gallery.querySelectorAll('figure')];
const count = originals.length;
originals.forEach(card => gallery.append(card.cloneNode(true)));
originals.slice().reverse().forEach(card => gallery.prepend(card.cloneNode(true)));
const cards = [...gallery.querySelectorAll('figure')];
let activeCard = count;
let galleryVisible = false;
let galleryTimer;
let manualUntil = 0;
let wrapTimer;
function centerCard(index, smooth = true) {
  activeCard = index;
  const card = cards[index];
  if (!card) return;
  cards.forEach((item, i) => item.classList.toggle('is-center', i === index));
  const box = card.getBoundingClientRect();
  const host = gallery.getBoundingClientRect();
  const left = gallery.scrollLeft + box.left - host.left - (gallery.clientWidth - box.width) / 2;
  gallery.scrollTo({left, behavior:smooth && !reducedMotion.matches ? 'smooth' : 'instant'});
}
function stepGallery(direction) {
  clearTimeout(wrapTimer);
  const next = activeCard + direction;
  centerCard(next);
  if (next >= count * 2 || next < count) {
    wrapTimer = setTimeout(() => centerCard(next >= count * 2 ? count : count * 2 - 1, false), reducedMotion.matches ? 30 : 850);
  }
}
function startGallery() {
  clearInterval(galleryTimer);
  if (reducedMotion.matches || !galleryVisible) return;
  galleryTimer = setInterval(() => {
    if (Date.now() < manualUntil || document.hidden) return;
    stepGallery(1);
  }, 3600);
}
gallery.addEventListener('pointerdown', () => {manualUntil = Date.now() + 8000;}, {passive:true});
gallery.addEventListener('focusin', () => {manualUntil = Date.now() + 8000;});
gallery.addEventListener('click', event => {
  const card = event.target.closest('figure');
  if (!card) return;
  manualUntil = Date.now() + 8000;
  centerCard(cards.indexOf(card));
});
gallery.addEventListener('wheel', event => {
  if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
  event.preventDefault();
  if (Date.now() - gallery.lastWheel < 550) return;
  gallery.lastWheel = Date.now();
  manualUntil = Date.now() + 8000;
  stepGallery(event.deltaY > 0 ? 1 : -1);
}, {passive:false});
gallery.tabIndex = 0;
gallery.addEventListener('keydown', event => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  event.preventDefault(); manualUntil = Date.now() + 8000;
  stepGallery(event.key === 'ArrowRight' ? 1 : -1);
});
const galleryObserver = new IntersectionObserver(entries => {
  galleryVisible = entries[0].isIntersecting;
  startGallery();
}, {threshold:.2});
galleryObserver.observe(gallery);
reducedMotion.addEventListener('change', startGallery);
requestAnimationFrame(() => centerCard(count, false));

const dial = document.querySelector('.dial');
const dialCards = [...dial.querySelectorAll('.dial-wheel button')];
let dialIndex = 0;
function renderDial() {
  const narrow = innerWidth < 600;
  const radius = narrow ? 150 : Math.min(385, innerWidth * .28);
  dialCards.forEach((card, index) => {
    let distance = (index - dialIndex + dialCards.length) % dialCards.length;
    if (distance > dialCards.length / 2) distance -= dialCards.length;
    const angle = distance * (narrow ? 34 : 31);
    const x = Math.sin(angle * Math.PI / 180) * radius;
    const y = -Math.cos(angle * Math.PI / 180) * (narrow ? 188 : 340);
    card.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle * .26}deg) scale(${distance === 0 ? 1.08 : .78})`;
    card.style.opacity = Math.abs(distance) > 2 ? '0' : distance === 0 ? '1' : '.66';
    card.style.filter = distance === 0 ? 'none' : 'brightness(.76)';
    card.style.zIndex = String(5 - Math.abs(distance));
    card.classList.toggle('is-active', distance === 0);
    card.setAttribute('aria-pressed', String(distance === 0));
  });
}
dial.querySelector('.dial-prev').addEventListener('click', () => {dialIndex=(dialIndex-1+dialCards.length)%dialCards.length;renderDial()});
dial.querySelector('.dial-next').addEventListener('click', () => {dialIndex=(dialIndex+1)%dialCards.length;renderDial()});
dialCards.forEach((card,index) => card.addEventListener('click', () => {dialIndex=index;renderDial()}));
dial.addEventListener('wheel', event => {event.preventDefault();if(Date.now()-dial.lastWheel<500)return;dial.lastWheel=Date.now();dialIndex=(dialIndex+(event.deltaY>0?1:-1)+dialCards.length)%dialCards.length;renderDial()}, {passive:false});
addEventListener('resize', renderDial, {passive:true});
renderDial();

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
