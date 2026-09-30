/* ============================================================
   SPACE ELEVATOR — Behaviour
   Sections:
   1. Starfield background (canvas)
   2. Sound effects (Web Audio API) + mute toggle
   3. Random cosmic fact toast
   4. Level slider (nav, swipe, keyboard)
   5. Elevator lobby (floor panel + door travel animation)
   6. Click-to-follow pan + pinch-to-zoom on level photos
   7. Solar System planet buttons
   8. Mini astronomy quiz
   ============================================================ */

/* ---------- 1. Starfield background ---------- */
const c = document.getElementById('stars');
const ctx = c.getContext('2d');

function resize(){ c.width = innerWidth; c.height = innerHeight; }
resize();
addEventListener('resize', resize);

// Gently twinkling background stars
let stars = Array.from({ length: 180 }, () => ({
  x: Math.random() * innerWidth,
  y: Math.random() * innerHeight,
  r: Math.random() * 1.4 + 0.2,
  s: Math.random() * 0.5 + 0.1,
  a: Math.random()
}));

// Occasional shooting stars (visual bonus effect)
let shooters = [];
function spawnShooter(){
  shooters.push({
    x: Math.random() * innerWidth * 0.6 + innerWidth * 0.2,
    y: -10,
    vx: 6 + Math.random() * 3,
    vy: 3 + Math.random() * 2,
    life: 1
  });
}

function draw(){
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillStyle = '#fff';
  stars.forEach(st => {
    st.a += 0.01 * st.s;
    ctx.globalAlpha = 0.4 + Math.abs(Math.sin(st.a)) * 0.6;
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, 7);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (Math.random() < 0.006) spawnShooter();
  shooters.forEach(s => {
    ctx.strokeStyle = `rgba(255,255,255,${s.life})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 6, s.y - s.vy * 6);
    ctx.stroke();
    s.x += s.vx; s.y += s.vy; s.life -= 0.02;
  });
  shooters = shooters.filter(s => s.life > 0 && s.y < innerHeight + 20);

  requestAnimationFrame(draw);
}
draw();

/* ---------- 2. Sound effects + mute toggle ---------- */
let muted = false;
try { muted = localStorage.getItem('se_muted') === '1'; } catch (e) { /* storage unavailable — default to unmuted */ }

let audioCtx;
/**
 * Play a short synthesized tone. Used for nav clicks, planet taps,
 * quiz feedback, and elevator travel. No audio files needed.
 */
function beep(freq = 440, dur = 0.09, type = 'sine'){
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.09, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* Web Audio unsupported — fail silently */ }
}

function toggleMute(){
  muted = !muted;
  document.getElementById('muteBtn').textContent = muted ? '🔇' : '🔊';
  try { localStorage.setItem('se_muted', muted ? '1' : '0'); } catch (e) {}
}
// Sync the mute button's icon with the saved preference on page load
document.getElementById('muteBtn').textContent = muted ? '🔇' : '🔊';

/* ---------- 3. Random cosmic fact toast ---------- */
const bonusFacts = [
  'A day on Venus is longer than its year.',
  'Neutron stars can spin over 600 times per second.',
  'The footprints on the Moon will likely last millions of years — there is no wind to erode them.',
  "Saturn would float in water, if you could find a bathtub big enough.",
  'One million Earths could fit inside the Sun.',
  'Space is completely silent — there is no medium for sound to travel through.',
  "The largest known star, if placed where our Sun is, would engulf Saturn's orbit."
];
let toastTimer;
function randomFact(){
  const el = document.getElementById('factToast');
  el.textContent = '🌟 ' + bonusFacts[Math.floor(Math.random() * bonusFacts.length)];
  el.classList.add('show');
  beep(660, 0.12, 'sine');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
}

/* ---------- 4. Level slider (nav, swipe, keyboard) ---------- */
// Order here drives everything: the slider, the progress dots,
// the scale readout, and the elevator floor panel below.
const levels = ['Quantum Foam', 'Micro World', 'Earth', 'Solar System', 'Milky Way', 'Universe', 'Multiverse'];
const scales = ['10⁻³⁵ m', '10⁻⁹ m', '10⁷ m', '10¹³ m', '10²¹ m', '10²⁶ m', '∞ ?'];
let idx = 0;

const slider = document.getElementById('slider');
const dotsEl = document.getElementById('dots');

// Build one progress dot per level
levels.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = 'dot' + (i === 0 ? ' active' : '');
  d.onclick = () => { idx = i; update(); };
  dotsEl.appendChild(d);
});

/** Re-render the slider position, dots, scale readout, and nav buttons for the current `idx`. */
function update(){
  slider.style.transform = `translateX(-${idx * 100}vw)`;
  [...dotsEl.children].forEach((d, i) => d.classList.toggle('active', i === idx));
  document.getElementById('scaleTag').textContent = 'SCALE: ' + scales[idx];
  document.getElementById('prevBtn').disabled = idx === 0;
  document.getElementById('nextBtn').disabled = idx === levels.length - 1;
}

/** Move one level forward (dir=1) or back (dir=-1), if possible. */
function go(dir){
  const n = idx + dir;
  if (n >= 0 && n < levels.length){
    idx = n;
    update();
    beep(dir > 0 ? 520 : 340, 0.09, 'triangle');
  }
}

addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') go(1);
  if (e.key === 'ArrowLeft') go(-1);
});

// Basic swipe support for touch devices
let touchX = null;
addEventListener('touchstart', e => touchX = e.touches[0].clientX);
addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (dx > 50) go(-1);
  else if (dx < -50) go(1);
  touchX = null;
});

update();

/* ---------- 5. Elevator lobby (floor panel + door travel animation) ---------- */
// Floor labels line up 1:1 with the `levels` array above (B2 = smallest scale, PH = largest)
const floorLabels = ['B2', 'B1', 'G', '1', '2', '3', 'PH'];
let currentFloor = 2; // journey starts on "G" (Earth)

// Build one call-panel button per level
const panelEl = document.getElementById('panel');
levels.forEach((name, i) => {
  const b = document.createElement('button');
  b.className = 'floorBtn';
  b.innerHTML = `<span class="floorNum">${floorLabels[i]}</span><span>${name}</span>`;
  b.onclick = () => selectFloor(i);
  panelEl.appendChild(b);
});

/**
 * Plays the full elevator travel sequence (doors close → floor counter
 * ticks from the current floor to `target` → doors open) and calls
 * `onArrive` once the doors have closed, so the caller can swap
 * whatever content is behind them.
 */
function rideTo(target, onArrive){
  const overlay = document.getElementById('doorOverlay');
  const travelDisplay = document.getElementById('travelDisplay');

  overlay.style.pointerEvents = 'auto';
  overlay.classList.add('closed'); // doors shut
  beep(420, 0.12, 'triangle');

  setTimeout(() => {
    const dir = target > currentFloor ? 1 : (target < currentFloor ? -1 : 0);
    let f = currentFloor;
    const steps = Math.abs(target - currentFloor);
    let count = 0;

    const finish = () => {
      currentFloor = target;
      onArrive();
      setTimeout(() => {
        overlay.classList.remove('closed'); // doors open
        setTimeout(() => { overlay.style.pointerEvents = 'none'; }, 650);
      }, 200);
    };

    if (steps === 0){
      travelDisplay.textContent = floorLabels[f];
      setTimeout(finish, 500);
      return;
    }

    const iv = setInterval(() => {
      f += dir; count++;
      travelDisplay.textContent = floorLabels[f];
      beep(300 + f * 22, 0.05, 'sine');
      if (count >= steps){ clearInterval(iv); finish(); }
    }, 260);
  }, 650);
}

/** Called when the user picks a floor in the lobby. */
function selectFloor(target){
  rideTo(target, () => {
    document.getElementById('landing').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    idx = target;
    update();
  });
}

/** Called from the header's 🛗 button to return to the lobby. */
function showLanding(){
  rideTo(idx, () => {
    document.getElementById('app').style.display = 'none';
    document.getElementById('landing').style.display = 'flex';
    document.getElementById('floorDisplay').textContent = floorLabels[idx];
  });
}

/* ---------- 6. Click-to-follow pan + pinch-to-zoom on level photos ---------- */
// Applied to every `.visual` circle. Desktop: click once to activate,
// then move the mouse to pan around the (zoomed-in) photo; click again
// to reset. Touch: pinch with two fingers to zoom, clipped to the circle.
document.querySelectorAll('.visual').forEach(v => {
  let active = false, scale = 1, x = 0, y = 0, pinch = null, justPinched = false;
  const FOLLOW_SCALE = 1.6, MAX_SCALE = 2.5;

  function apply(){ v.style.transform = `translate(${x}px,${y}px) scale(${scale})`; }
  function dist(a, b){ return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }

  v.addEventListener('click', () => {
    if (justPinched){ justPinched = false; return; } // ignore the click a pinch-end can trigger
    active = !active;
    v.classList.toggle('active', active);
    if (active){
      if (scale === 1) scale = FOLLOW_SCALE;
    } else {
      scale = 1; x = 0; y = 0;
      v.classList.add('resetting');
      setTimeout(() => v.classList.remove('resetting'), 300);
    }
    apply();
  });

  v.addEventListener('mousemove', e => {
    if (!active) return;
    const r = v.getBoundingClientRect();
    const relX = (e.clientX - r.left) / r.width - 0.5;
    const relY = (e.clientY - r.top) / r.height - 0.5;
    const maxOffset = (r.width * (scale - 1)) / 2;
    x = -relX * 2 * maxOffset;
    y = -relY * 2 * maxOffset;
    apply();
  });

  v.addEventListener('touchstart', e => {
    if (e.touches.length === 2) pinch = { d: dist(e.touches[0], e.touches[1]), scale };
  }, { passive: true });

  v.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && pinch){
      e.preventDefault();
      const d = dist(e.touches[0], e.touches[1]);
      scale = Math.min(MAX_SCALE, Math.max(1, pinch.scale * (d / pinch.d)));
      if (scale === 1){ x = 0; y = 0; }
      apply();
    }
  }, { passive: false });

  v.addEventListener('touchend', e => {
    if (e.touches.length < 2){
      if (pinch) justPinched = true;
      pinch = null;
    }
  });
});

/* ---------- 7. Solar System planet buttons ---------- */
const planets = [
  { e: '☿️', n: 'Mercury', f: 'Closest to the Sun, with no atmosphere to trap heat.' },
  { e: '♀️', n: 'Venus',   f: 'Hottest planet — a runaway greenhouse effect.' },
  { e: '🌍', n: 'Earth',   f: 'The only known planet with liquid water oceans and life.' },
  { e: '♂️', n: 'Mars',    f: 'Home to Olympus Mons, the largest volcano in the Solar System.' },
  { e: '🟠', n: 'Jupiter', f: 'The largest planet — its Great Red Spot is a storm bigger than Earth.' },
  { e: '🪐', n: 'Saturn',  f: 'Its rings are made mostly of ice and rock.' },
  { e: '🔵', n: 'Uranus',  f: 'Spins on its side, so its poles take turns facing the Sun.' },
  { e: '🔷', n: 'Neptune', f: 'The windiest planet, with storms reaching over 2,000 km/h.' }
];
const row = document.getElementById('planetRow');
planets.forEach(p => {
  const b = document.createElement('div');
  b.className = 'pl';
  b.textContent = p.e;
  b.title = p.n;
  b.onclick = () => {
    document.getElementById('planetInfo').textContent = p.n + ': ' + p.f;
    beep(480, 0.08, 'square');
  };
  row.appendChild(b);
});

/* ---------- 8. Mini astronomy quiz ---------- */
const quiz = [
  { q: 'Which planet is known as the Red Planet?', opts: ['Venus', 'Mars', 'Jupiter'], a: 1 },
  { q: 'How long does sunlight take to reach Earth?', opts: ['~8 minutes', '~8 seconds', '~8 hours'], a: 0 },
  { q: 'Roughly how many stars are in the Milky Way?', opts: ['~4 million', '100–400 billion', '~10,000'], a: 1 },
  { q: 'What is the "multiverse" idea?', opts: ['A NASA space station', 'Our universe as one of many possible universes', 'A type of black hole'], a: 1 }
];
let qi = 0, score = 0;

function openQuiz(){
  qi = 0; score = 0;
  document.getElementById('quizModal').classList.add('open');
  renderQ();
}
function closeQuiz(){ document.getElementById('quizModal').classList.remove('open'); }

function renderQ(){
  const body = document.getElementById('qBody');
  const scoreEl = document.getElementById('qScore');

  if (qi >= quiz.length){
    document.getElementById('qTitle').textContent = 'Quiz Complete!';
    body.innerHTML = '';
    scoreEl.textContent = `You scored ${score} / ${quiz.length}`;
    return;
  }

  document.getElementById('qTitle').textContent = `Question ${qi + 1} of ${quiz.length}`;
  scoreEl.textContent = '';
  const item = quiz[qi];
  body.innerHTML = `<p style="margin-bottom:12px;">${item.q}</p>`;

  item.opts.forEach((o, i) => {
    const btn = document.createElement('button');
    btn.className = 'qopt';
    btn.textContent = o;
    btn.onclick = () => {
      [...body.querySelectorAll('.qopt')].forEach(b => b.onclick = null);
      if (i === item.a){
        btn.classList.add('correct');
        score++;
        beep(720, 0.12, 'sine');
      } else {
        btn.classList.add('wrong');
        body.querySelectorAll('.qopt')[item.a].classList.add('correct');
        beep(160, 0.16, 'sawtooth');
      }
      setTimeout(() => { qi++; renderQ(); }, 900);
    };
    body.appendChild(btn);
  });
}
