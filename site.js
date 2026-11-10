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
}, {threshold:.3, rootMargin:'0px 0px -10% 0px'});
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
const cards = [...gallery.querySelectorAll('figure')];
let activeCard = 0;
let galleryVisible = false;
let galleryTimer;
let manualUntil = 0;
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
  centerCard((activeCard + direction + count) % count);
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
let galleryTouching = false;
let galleryFingerDown = false;
let gallerySnapTimer;
function focusNearestGalleryCard() {
  if (!galleryTouching) return;
  galleryTouching = false;
  const midpoint = gallery.getBoundingClientRect().left + gallery.clientWidth / 2;
  const nearest = cards.reduce((best, card, index) => {
    const box = card.getBoundingClientRect();
    const distance = Math.abs(box.left + box.width / 2 - midpoint);
    return distance < best.distance ? {index, distance} : best;
  }, {index:activeCard, distance:Infinity});
  centerCard(nearest.index);
}
gallery.addEventListener('touchstart', () => {galleryTouching=true;galleryFingerDown=true;clearTimeout(gallerySnapTimer);manualUntil=Date.now()+8000;}, {passive:true});
gallery.addEventListener('touchend', () => {galleryFingerDown=false;gallerySnapTimer=setTimeout(focusNearestGalleryCard,65);}, {passive:true});
gallery.addEventListener('touchcancel', () => {galleryTouching=false;galleryFingerDown=false;clearTimeout(gallerySnapTimer);}, {passive:true});
gallery.addEventListener('scroll', () => {
  if (galleryTouching && !galleryFingerDown) {clearTimeout(gallerySnapTimer);gallerySnapTimer=setTimeout(focusNearestGalleryCard,65);}
}, {passive:true});
gallery.addEventListener('scrollend', () => {
  if (galleryTouching && !galleryFingerDown) {
    clearTimeout(gallerySnapTimer);
    focusNearestGalleryCard();
  }
}, {passive:true});
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
requestAnimationFrame(() => centerCard(0, false));

const dial = document.querySelector('.dial');
const dialCards = [...dial.querySelectorAll('.dial-wheel button')];
let dialIndex = 0;
let dialTimer;
let dialManualUntil = 0;
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
dial.querySelector('.dial-prev').addEventListener('click', () => {dialManualUntil=Date.now()+9000;dialIndex=(dialIndex-1+dialCards.length)%dialCards.length;renderDial()});
dial.querySelector('.dial-next').addEventListener('click', () => {dialManualUntil=Date.now()+9000;dialIndex=(dialIndex+1)%dialCards.length;renderDial()});
dialCards.forEach((card,index) => card.addEventListener('click', () => {dialManualUntil=Date.now()+9000;dialIndex=index;renderDial()}));
dial.querySelector('.dial-stage').addEventListener('wheel', event => {event.preventDefault();if(Date.now()-dial.lastWheel<500)return;dial.lastWheel=Date.now();dialManualUntil=Date.now()+9000;dialIndex=(dialIndex+(event.deltaY>0?1:-1)+dialCards.length)%dialCards.length;renderDial()}, {passive:false});
const dialStage = dial.querySelector('.dial-stage');
let dialTouchStart = null;
let dialSwipeAt = 0;
dialStage.addEventListener('touchstart', event => {
  if (event.touches.length !== 1) { dialTouchStart = null; return; }
  dialTouchStart = {x:event.touches[0].clientX, y:event.touches[0].clientY};
}, {passive:true});
dialStage.addEventListener('touchend', event => {
  if (!dialTouchStart || event.changedTouches.length !== 1) return;
  const dx = event.changedTouches[0].clientX - dialTouchStart.x;
  const dy = event.changedTouches[0].clientY - dialTouchStart.y;
  dialTouchStart = null;
  if (Math.abs(dx) < 28 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
  dialSwipeAt = Date.now();
  dialManualUntil = dialSwipeAt + 9000;
  const steps = Math.min(3, Math.max(1, Math.round(Math.abs(dx) / 115)));
  dialIndex = (dialIndex + (dx < 0 ? steps : -steps) + dialCards.length) % dialCards.length;
  renderDial();
}, {passive:true});
dialStage.addEventListener('touchcancel', () => { dialTouchStart = null; }, {passive:true});
dialStage.addEventListener('click', event => {
  if (Date.now() - dialSwipeAt < 450) { event.preventDefault(); event.stopPropagation(); }
}, true);
new IntersectionObserver(entries => {
  clearInterval(dialTimer);
  if (entries[0].isIntersecting && !reducedMotion.matches) {
    dialTimer=setInterval(() => {
      if (document.hidden || Date.now()<dialManualUntil) return;
      dialIndex=(dialIndex+1)%dialCards.length;
      renderDial();
    },3600);
  }
},{threshold:.45}).observe(dial);
addEventListener('resize', renderDial, {passive:true});
renderDial();

const lesson = document.querySelector('.education');
const lessonPages = [...lesson.querySelectorAll('.lesson-page')];
let lessonIndex = 0, lessonTimer;
function showLesson(index) {
  lessonIndex = (index + lessonPages.length) % lessonPages.length;
  lessonPages.forEach((page, i) => {
    const distance = (i - lessonIndex + lessonPages.length) % lessonPages.length;
    page.classList.toggle('is-active', i === lessonIndex);
    page.style.setProperty('--lesson-x', distance === 0 ? '0px' : distance === 1 ? '24%' : '-24%');
    page.style.setProperty('--lesson-r', distance === 0 ? '0deg' : distance === 1 ? '9deg' : '-9deg');
    page.style.zIndex = String(distance === 0 ? 3 : distance === 1 ? 2 : 1);
    page.setAttribute('aria-pressed', String(i === lessonIndex));
  });
}
lessonPages.forEach((page,i) => page.addEventListener('click', () => {showLesson(i);clearInterval(lessonTimer);lessonTimer=setInterval(()=>showLesson(lessonIndex+1),3400)}));
new IntersectionObserver(entries => {
  clearInterval(lessonTimer);
  if(entries[0].isIntersecting && !reducedMotion.matches) lessonTimer=setInterval(()=>showLesson(lessonIndex+1),3400);
}, {threshold:.55}).observe(lesson);
showLesson(0);

const retouch = document.querySelector('.retouch');
const photoCards = [...retouch.querySelectorAll('.photo-card')];
let photoIndex = 0, photoTimer;
function showPhoto(index) {
  photoIndex = (index + photoCards.length) % photoCards.length;
  photoCards.forEach((card,i) => {
    const d=(i-photoIndex+photoCards.length)%photoCards.length;
    card.classList.toggle('is-active',d===0);
    card.style.setProperty('--card-x',`${Math.min(d,3)*18}px`);
    card.style.setProperty('--card-y',`${Math.min(d,3)*-14}px`);
    card.style.setProperty('--card-r',`${Math.min(d,3)*4-3}deg`);
    card.style.zIndex=String(photoCards.length-d);
    card.style.opacity=d>3?'0':'1';
    card.setAttribute('aria-pressed',String(d===0));
  });
}
photoCards.forEach((card,i)=>card.addEventListener('click',()=>{showPhoto(i===photoIndex?photoIndex+1:i);clearInterval(photoTimer);photoTimer=setInterval(()=>showPhoto(photoIndex+1),4100)}));
new IntersectionObserver(entries=>{
  clearInterval(photoTimer);
  if(entries[0].isIntersecting&&!reducedMotion.matches)photoTimer=setInterval(()=>showPhoto(photoIndex+1),4100);
},{threshold:.5}).observe(retouch);
showPhoto(0);

const portraitSources = [...document.querySelectorAll('.photo-track img')];
document.querySelectorAll('.photo-track').forEach(track => {
  [...track.children].forEach(photo => {
    const copy = photo.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.alt = '';
    copy.loading = 'eager';
    track.appendChild(copy);
  });
});
Promise.all(portraitSources.map(photo => photo.decode ? photo.decode().catch(() => {}) : new Promise(resolve => {
  if (photo.complete) resolve();
  else { photo.addEventListener('load', resolve, {once:true}); photo.addEventListener('error', resolve, {once:true}); }
}))).then(() => document.querySelector('.photo-strip').classList.add('is-ready'));

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
