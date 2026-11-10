(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  // Progress of a tall section while its sticky child is pinned: 0 → 1
  const progress = (el) => {
    const r = el.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : 0;
  };

  /* ---------- Local nav border once stuck ---------- */
  const lnav = document.getElementById('lnav');

  /* ---------- Hero ---------- */
  const hero = document.getElementById('hero');
  const heroStick = hero.querySelector('.hero__stick');
  const heroOrb = hero.querySelector('.orb');

  /* ---------- Statement: split into words ---------- */
  const statement = document.querySelector('.statement');
  const text = statement.querySelector('[data-words]');
  const words = text.textContent.trim().split(/\s+/);
  text.textContent = '';
  const spans = words.map((w, i) => {
    const s = document.createElement('span');
    s.className = 'word';
    s.textContent = w;
    text.append(s, i < words.length - 1 ? ' ' : '');
    return s;
  });

  /* ---------- Inside: exploded view ---------- */
  const inside = document.querySelector('.inside');
  const explode = inside.querySelector('.explode');
  const callouts = [...inside.querySelectorAll('.callout')];

  let ticking = false;
  const update = () => {
    ticking = false;
    lnav.classList.toggle('is-stuck', scrollY > 44);

    // Hero: copy lifts away, orb grows and the halo brightens
    const hp = progress(hero);
    if (!reduce) {
      heroStick.style.setProperty('--copy-o', (1 - smooth(clamp(hp * 2.2))).toFixed(3));
      heroStick.style.setProperty('--copy-y', (-hp * 80).toFixed(1) + 'px');
      heroStick.style.setProperty('--cta-o', (1 - smooth(clamp(hp * 2.6))).toFixed(3));
      heroOrb.style.setProperty('--orb-s', (1 + smooth(hp) * .22).toFixed(4));
      heroOrb.style.setProperty('--orb-y', (-smooth(hp) * 40).toFixed(1) + 'px');
    }
    heroStick.style.setProperty('--halo-o', (.55 + smooth(clamp(hp * 1.4)) * .45).toFixed(3));

    // Statement: light words in reading order
    const sp = clamp((progress(statement) - .05) / .8);
    const lit = Math.round(sp * spans.length);
    spans.forEach((s, i) => s.classList.toggle('is-lit', i < lit));

    // Inside: tilt first, then spread layers apart
    const ip = progress(inside);
    const tilt = smooth(clamp(ip / .25));
    const spread = smooth(clamp((ip - .12) / .5));
    explode.style.setProperty('--t', tilt.toFixed(4));
    explode.style.setProperty('--spread', (spread * Math.min(innerHeight * .12, 90)).toFixed(1));
    let current = -1;
    callouts.forEach((c, i) => {
      const on = ip >= parseFloat(c.dataset.at);
      c.classList.toggle('is-on', on);
      if (on) current = i;
    });
    callouts.forEach((c, i) => c.classList.toggle('is-current', i === Math.max(current, 0)));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  /* ---------- Reveal on view ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  function countUp(el) {
    if (reduce) return;
    const to = +el.dataset.count;
    const t0 = performance.now();
    const dur = 1100;
    const step = (now) => {
      const t = clamp((now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Finishes ---------- */
  const finishes = {
    grafito: { name: 'Grafito', c1: '#5b5d63', c2: '#2b2c30', c3: '#0d0d0f', glow: '#9fc3ff' },
    arena:   { name: 'Arena',   c1: '#efe4d2', c2: '#bfae94', c3: '#5e5446', glow: '#ffd59a' },
    salvia:  { name: 'Salvia',  c1: '#b7c9b8', c2: '#73887a', c3: '#26302a', glow: '#b8ffcf' },
    coral:   { name: 'Coral',   c1: '#ffa48c', c2: '#d9573f', c3: '#5a1a12', glow: '#ff9a7a' },
  };
  const swatches = [...document.querySelectorAll('.swatch')];
  const finishName = document.querySelector('.finish-name');
  const pick = (btn) => {
    const f = finishes[btn.dataset.finish];
    swatches.forEach((s) => {
      const on = s === btn;
      s.setAttribute('aria-checked', on);
      s.tabIndex = on ? 0 : -1;
    });
    root.style.setProperty('--c1', f.c1);
    root.style.setProperty('--c2', f.c2);
    root.style.setProperty('--c3', f.c3);
    root.style.setProperty('--glow', f.glow);
    finishName.textContent = f.name;
  };
  swatches.forEach((s, i) => {
    s.tabIndex = i === 0 ? 0 : -1;
    s.addEventListener('click', () => pick(s));
    s.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const next = swatches[(i + d + swatches.length) % swatches.length];
      next.focus();
      pick(next);
    });
  });

  /* ---------- Listen demo: fake spectrum drives the ring ---------- */
  const eq = document.querySelector('.eq');
  const barsWrap = eq.querySelector('.eq__bars');
  const N = 15;
  const bars = Array.from({ length: N }, () => barsWrap.appendChild(document.createElement('span')));
  const play = document.querySelector('.play');
  const playLabel = play.querySelector('.play__label');
  let playing = false, raf = 0, lastBeat = 0;

  const frame = (now) => {
    const beat = (now % 500) / 500;                     // 120 BPM
    const kick = Math.pow(1 - beat, 3);
    let sum = 0;
    bars.forEach((b, i) => {
      const x = i / (N - 1);
      const env = Math.exp(-Math.pow((x - .5) * 2.2, 2)); // taller in the middle
      const wob = .5 + .5 * Math.sin(now / (180 + i * 23) + i * 1.7);
      const h = clamp(.1 + env * (.5 * kick + .55 * wob));
      b.style.setProperty('--h', h.toFixed(3));
      sum += h;
    });
    eq.style.setProperty('--lvl', clamp((sum / N) * 1.4 + kick * .3).toFixed(3));
    if (playing) raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    bars.forEach((b) => b.style.setProperty('--h', .08));
    eq.style.setProperty('--lvl', 0);
  };
  play.addEventListener('click', () => {
    playing = !playing;
    play.setAttribute('aria-pressed', playing);
    playLabel.textContent = playing ? 'Pausar demo' : 'Reproducir demo';
    if (playing) raf = requestAnimationFrame(frame);
    else { cancelAnimationFrame(raf); stop(); }
  });
  // Pause when the demo scrolls out of view
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting && playing) play.click();
  }).observe(eq);
})();
