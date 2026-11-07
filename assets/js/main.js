/* =========================================================
   玉龍 Yù Lóng — interacciones y efectos de scroll
   JavaScript sin dependencias
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const range = (v, a, b) => clamp((v - a) / (b - a));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let vw = innerWidth, vh = innerHeight;

  /* ---------- 1. Partir texto en letras / palabras ---------- */
  $$('[data-split]').forEach((el) => {
    const mode = el.dataset.split;
    const walk = (node, counter) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const parts = mode === 'chars' ? [...n.textContent] : n.textContent.split(/(\s+)/);
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const s = document.createElement('span');
            s.className = mode === 'chars' ? 'ch' : 'w';
            s.textContent = p;
            s.style.setProperty('--i', counter.i++);
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n, n.hasAttribute('data-l') ? { i: 0 } : counter);
        }
      });
    };
    walk(el, { i: 0 });
  });

  /* ---------- 1b. Idioma (inglés por defecto, español opcional) ---------- */
  const i18nAttrs = [];
  $$('*').forEach((el) => {
    [...el.attributes].forEach((a) => {
      if (a.name.startsWith('data-es-')) {
        const target = a.name.slice(8);
        i18nAttrs.push({ el, target, en: el.getAttribute(target) || '', es: a.value });
      }
    });
  });
  const i18nText = $$('option[data-es]').map((el) => ({ el, en: el.textContent, es: el.dataset.es }));
  const langListeners = [];
  const getLang = () => (root.dataset.lang === 'es' ? 'es' : 'en');
  const setLang = (l, save = true) => {
    root.dataset.lang = l;
    root.lang = l;
    const t = root.dataset[l === 'es' ? 'titleEs' : 'titleEn'];
    if (t) document.title = t;
    i18nAttrs.forEach(({ el, target, en, es }) => el.setAttribute(target, l === 'es' ? es : en));
    i18nText.forEach(({ el, en, es }) => (el.textContent = l === 'es' ? es : en));
    $$('[data-set-lang]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.setLang === l));
    if (save) { try { localStorage.setItem('mrb-lang', l); } catch (e) {} }
    langListeners.forEach((fn) => fn(l));
  };
  $$('[data-set-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.setLang)));
  setLang(getLang(), false);

  /* ---------- 2. Loader ---------- */
  const loader = $('.loader');
  const finishLoad = () => {
    root.classList.remove('is-loading');
    root.classList.add('is-loaded');
    setTimeout(() => loader && loader.remove(), 1800);
  };
  if (loader) {
    const count = $('.loader__count', loader);
    const bar = $('.loader__bar', loader);
    const start = performance.now();
    const minTime = reduced ? 200 : 2300;
    let loaded = false;
    addEventListener('load', () => (loaded = true));
    setTimeout(() => (loaded = true), 6000); // por si algún recurso se atasca
    const tick = (now) => {
      const t = clamp((now - start) / minTime);
      const p = loaded ? t : Math.min(t, .9);
      count.textContent = String(Math.round(p * 100)).padStart(2, '0');
      bar.style.setProperty('--p', p);
      if (p >= 1) finishLoad(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else {
    finishLoad();
  }

  /* ---------- 3. Menú ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('.menu');
  const ghost = $('.menu__ghost');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    menuBtn && menuBtn.setAttribute('aria-expanded', open);
    menu && menu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn && menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  $$('.menu__item').forEach((a) => {
    a.addEventListener('mouseenter', () => { if (ghost) ghost.textContent = a.dataset.ghost || '玉'; });
    a.addEventListener('click', () => setMenu(false));
  });

  /* ---------- 4. Tema de color por sección ---------- */
  const themed = $$('[data-theme]');
  if (themed.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) root.dataset.theme = e.target.dataset.theme; });
    }, { rootMargin: '-50% 0px -50% 0px' });
    themed.forEach((s) => io.observe(s));
  }

  /* ---------- 5. Revelados al entrar en pantalla ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
  $$('[data-reveal], .ink').forEach((el) => revealIO.observe(el));

  /* ---------- 6. Cursor ---------- */
  const cursor = $('.cursor');
  const mouse = { x: vw / 2, y: vh / 2, cx: vw / 2, cy: vh / 2 };
  if (cursor && matchMedia('(hover: hover)').matches) {
    addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    const label = $('span', cursor);
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-big'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-big'));
    });
  }

  /* ---------- 7. Cabecera que se esconde ---------- */
  const header = $('.header');
  let lastY = scrollY;

  /* ---------- 8. Escenas de scroll ---------- */
  const sceneProgress = (el) => {
    const r = el.getBoundingClientRect();
    const total = r.height - vh;
    return total > 0 ? clamp(-r.top / total) : clamp((vh - r.top) / (vh + r.height));
  };

  // Hero
  const hero = $('.hero');
  const heroMedia = $('.hero__media');
  const heroContent = $('.hero__content');
  const heroSun = $('.hero__sun');

  // Galería de rollos
  const gallery = $('.gallery');
  const scrolls = $$('.gallery .hscroll');
  const intro = $('.gallery__intro');
  const postcards = $('.postcards');
  const cards = postcards ? $$('figure', postcards) : [];
  const mist = $('.mist');
  const gText = $('.gallery__text');
  const gPager = $('.gallery__pager');
  let gS = 0;

  // Carrusel de cócteles
  const sig = $('.signature');
  const track = $('.track');
  const sigCards = $$('.signature .card');
  const sigBar = $('.signature__bar');
  const sigNum = $('.signature__num');
  let trackW = 0, sS = 0;
  const sizeSignature = () => {
    if (!sig || !track) return;
    trackW = track.scrollWidth;
    sig.style.height = `${Math.max(trackW - vw, 0) + vh * 1.2}px`;
  };

  // Puerta de luna
  const moon = $('.moon');
  const moonStage = $('.moon__stage');
  let mS = 0;

  // Marquesina
  const mRow = $('.marquee__row');
  let mX = 0, mVel = 0;

  // Salón: columnas con parallax + tiles que se colorean
  const cols = $$('.salon__col');
  const tiles = $$('.tile');

  // Texto que se ilumina
  const scrubs = $$('[data-scrub]').map((el) => ({
    el,
    words: { en: $$('[data-l="en"] .w', el), es: $$('[data-l="es"] .w', el), all: $$('.w', el) },
  }));

  // Contadores
  const counters = $$('[data-count]');
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const end = +e.target.dataset.count;
      const t0 = performance.now();
      const step = (now) => {
        const t = clamp((now - t0) / 1800);
        e.target.textContent = Math.round(ease(t) * end);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .6 });
  counters.forEach((c) => countIO.observe(c));

  // Posiciones de los rollos (estado A: en fila, estado B: abanico 3D)
  const layoutA = (i, n) => ({ x: (i - (n - 1) / 2) * (vw < 720 ? 1.45 : 1.45), y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 });
  const layoutB = [
    { x: -1.75, y: -.16, z: -120, rx: 4, ry: 26, rz: -6, s: .92 },
    { x: -.35, y: -.22, z: 60, rx: 2, ry: -4, rz: 2, s: 1.04 },
    { x: .95, y: -.17, z: -200, rx: 4, ry: -28, rz: 7, s: .88 },
  ];

  const frame = () => {
    const y = scrollY;

    // cabecera
    if (header && !root.classList.contains('menu-open')) {
      if (y > vh * .6 && y > lastY + 2) header.classList.add('is-hidden');
      else if (y < lastY - 2 || y < vh * .6) header.classList.remove('is-hidden');
    }
    lastY = y;
    if (header) header.classList.toggle('is-scrolled', y > 40);

    // cursor
    if (cursor) {
      mouse.cx = lerp(mouse.cx, mouse.x, .2);
      mouse.cy = lerp(mouse.cy, mouse.y, .2);
      cursor.style.transform = `translate3d(${mouse.cx}px, ${mouse.cy}px, 0)`;
    }

    if (!reduced) {
      // hero: se disuelve como tinta en agua
      if (hero) {
        const h = clamp(y / vh);
        if (h < 1) {
          heroMedia.style.transform = `translate3d(0, ${h * 18}vh, 0) scale(${1 + h * .12})`;
          heroContent.style.transform = `translate3d(0, ${h * -10}vh, 0)`;
          heroContent.style.filter = `blur(${h * 14}px)`;
          heroContent.style.opacity = 1 - h * 1.2;
          heroSun.style.transform = `translate3d(${h * 30}vw, ${h * 40}vh, 0) scale(${1 + h * 1.6})`;
        }
      }

      // galería de rollos
      if (gallery) {
        gS = lerp(gS, sceneProgress(gallery), .1);
        const n = scrolls.length;
        const unroll = range(gS, .06, .46);
        const fan = easeIO(range(gS, .48, .72));
        const w = scrolls[0] ? scrolls[0].offsetWidth : 200;
        scrolls.forEach((el, i) => {
          const u = ease(range(unroll, i / n * .7, i / n * .7 + .45));
          el.style.setProperty('--u', u.toFixed(4));
          const a = layoutA(i, n), b = layoutB[i] || layoutA(i, n);
          const k = vw < 720 ? .85 : 1;
          const x = lerp(a.x, b.x, fan) * w * k;
          const yy = lerp(a.y, b.y, fan) * vh;
          const z = lerp(a.z, b.z, fan);
          const rx = lerp(a.rx, b.rx, fan), ry = lerp(a.ry, b.ry, fan), rz = lerp(a.rz, b.rz, fan);
          const s = lerp(a.s, b.s, fan);
          const enter = range(gS, i * .05, i * .05 + .12);
          el.style.opacity = enter;
          el.style.transform = `translate3d(${x}px, ${yy + (1 - enter) * 60}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
        });
        if (intro) {
          const o = 1 - range(gS, .44, .56);
          intro.style.opacity = o;
          intro.style.transform = `translateY(${(1 - o) * -40}px)`;
        }
        const mistP = ease(range(gS, .5, .8));
        if (mist) { mist.style.opacity = mistP; mist.style.transform = `translateY(${(1 - mistP) * 40}%)`; }
        const tP = range(gS, .66, .86);
        if (gText) {
          gText.style.opacity = tP;
          gText.style.transform = `translateY(${(1 - ease(tP)) * 50}px)`;
          gText.style.filter = `blur(${(1 - tP) * 8}px)`;
          gText.style.pointerEvents = tP > .5 ? 'auto' : 'none';
        }
        if (gPager) gPager.style.setProperty('--gp', range(gS, .66, 1).toFixed(3));
        if (postcards) {
          const pc = ease(range(gS, .6, .84));
          postcards.style.opacity = pc;
          cards.forEach((c, i) => {
            const rot = [-14, -5, 6][i] * pc;
            const tx = [-40, -10, 30][i] * pc;
            c.style.transform = `translate3d(${tx}px, ${(1 - pc) * 120}px, 0) rotate(${rot}deg) rotateY(${18 * pc}deg)`;
          });
        }
      }

      // cócteles: scroll horizontal
      if (sig && track) {
        const target = sceneProgress(sig);
        sS = lerp(sS, target, .12);
        const max = Math.max(trackW - vw, 0);
        track.style.transform = `translate3d(${-sS * max}px, 0, 0)`;
        if (sigBar) sigBar.style.setProperty('--sp', sS.toFixed(4));
        let current = 0;
        sigCards.forEach((c, i) => {
          const r = c.getBoundingClientRect();
          const center = r.left + r.width / 2;
          const d = (center - vw / 2) / vw; // -0.5 .. 0.5 en pantalla
          const rr = clamp(1 - (Math.abs(d) - .18) / .42);
          c.style.setProperty('--r', ease(rr).toFixed(3));
          c.style.setProperty('--px', `${d * -30}px`);
          if (center < vw * .7) current = i + 1;
        });
        if (sigNum) sigNum.textContent = String(Math.max(current, 1)).padStart(2, '0');
      }

      // puerta de luna
      if (moon && moonStage) {
        mS = lerp(mS, sceneProgress(moon), .12);
        const g = easeIO(range(mS, .08, .62));
        const minR = Math.min(vw, vh) * (vw < 720 ? .32 : .26);
        const maxR = Math.hypot(vw, vh) / 2 + 20;
        moonStage.style.setProperty('--cr', `${lerp(minR, maxR, g)}px`);
        moonStage.style.setProperty('--mo', g.toFixed(3));
        moonStage.style.setProperty('--mo2', range(mS, .6, .82).toFixed(3));
      }

      // marquesina con inercia según la velocidad del scroll
      if (mRow) {
        const dy = y - (frame.prevY ?? y);
        mVel = lerp(mVel, dy, .1);
        mX -= 0.6 + Math.abs(mVel) * .35;
        const half = mRow.scrollWidth / 2;
        if (-mX > half) mX += half;
        mRow.style.transform = `translate3d(${mX}px, 0, 0) skewX(${clamp(-mVel * .25, -10, 10)}deg)`;
      }

      // salón
      cols.forEach((c, i) => {
        const r = c.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const p = (vh - r.top) / (vh + r.height) - .5;
        const sp = [-90, 120, -40][i] || 0;
        c.style.transform = `translate3d(0, ${p * sp}px, 0)`;
      });
      tiles.forEach((t) => {
        const r = t.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const d = Math.abs((r.top + r.height / 2) - vh / 2) / (vh / 2);
        t.style.setProperty('--c', ease(clamp(1.25 - d)).toFixed(3));
      });
    }

    // texto que se ilumina (también con movimiento reducido)
    scrubs.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = reduced ? 1 : clamp((vh * .82 - r.top) / (r.height + vh * .25));
      const list = words[getLang()].length ? words[getLang()] : words.all;
      const lit = Math.floor(p * list.length * 1.05);
      list.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    });

    frame.prevY = y;
    requestAnimationFrame(frame);
  };

  const onResize = () => {
    vw = innerWidth; vh = innerHeight; sizeSignature();
    if (header) root.style.setProperty('--hh', `${header.offsetHeight}px`);
  };
  addEventListener('resize', onResize);
  langListeners.push(() => requestAnimationFrame(onResize));
  addEventListener('load', onResize);
  onResize();

  // con movimiento reducido: todo visible y sin fijar escenas
  if (reduced) {
    scrolls.forEach((s) => s.style.setProperty('--u', 1));
    $$('.card').forEach((c) => c.style.setProperty('--r', 1));
    $$('.tile').forEach((t) => t.style.setProperty('--c', 1));
    if (gText) gText.style.opacity = 1;
  }
  requestAnimationFrame(frame);

  /* ---------- 9. Formulario de reservas (demo) ---------- */
  const form = $('.form');
  if (form) {
    const date = $('#r-fecha', form);
    if (date) {
      const t = new Date();
      date.min = new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = new FormData(form);
      const name = (data.get('nombre') || '').toString().trim().split(' ')[0];
      const d = data.get('fecha') ? new Date(`${data.get('fecha')}T12:00`) : null;
      const es = getLang() === 'es';
      const nice = d ? new Intl.DateTimeFormat(es ? 'es-ES' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(d) : '';
      const n = data.get('personas');
      $('.form__done-name', form).textContent = name || (es ? 'amiga' : 'friend');
      $('.form__done-when', form).textContent = es
        ? `${nice} a las ${data.get('hora')} · ${n} ${n === '1' ? 'persona' : 'personas'}`
        : `${nice} at ${data.get('hora')} · ${n} ${n === '1' ? 'guest' : 'guests'}`;
      form.classList.add('is-done');
    });
    const again = $('.form__again', form);
    again && again.addEventListener('click', () => { form.reset(); form.classList.remove('is-done'); });
  }

  /* ---------- 10. Carta: pestañas, pintura que cambia y vista previa ---------- */
  const msecs = $$('.msec');
  if (msecs.length) {
    const tabs = $$('.tab');
    const arts = $$('.menu-art img');
    const cap = $('.menu-art__cap');
    let current = msecs[0].id;
    langListeners.push(() => setActive(current));
    const setActive = (id) => {
      tabs.forEach((t) => t.classList.toggle('is-active', t.getAttribute('href') === `#${id}`));
      arts.forEach((img) => img.classList.toggle('is-on', img.dataset.for === id));
      const on = arts.find((img) => img.dataset.for === id);
      current = id;
      if (cap && on) cap.textContent = on.dataset[getLang() === 'es' ? 'capEs' : 'capEn'] || '';
      const activeTab = tabs.find((t) => t.classList.contains('is-active'));
      if (activeTab && activeTab.parentElement.scrollWidth > activeTab.parentElement.clientWidth) {
        activeTab.parentElement.scrollTo({ left: activeTab.offsetLeft - 40, behavior: 'smooth' });
      }
    };
    const secIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    msecs.forEach((s) => secIO.observe(s));
    setActive(current);

    const peek = $('.peek');
    const peekImg = peek && $('img', peek);
    if (peek && matchMedia('(hover: hover)').matches) {
      let px = 0, py = 0, tx = 0, ty = 0;
      addEventListener('mousemove', (e) => { tx = e.clientX + 150; ty = e.clientY; }, { passive: true });
      const loop = () => {
        px = lerp(px, tx, .14); py = lerp(py, ty, .14);
        peek.style.left = `${px}px`; peek.style.top = `${py}px`;
        requestAnimationFrame(loop);
      };
      loop();
      $$('.item[data-img]').forEach((it) => {
        it.addEventListener('mouseenter', () => { peekImg.src = it.dataset.img; peekImg.alt = ''; peek.classList.add('is-on'); });
        it.addEventListener('mouseleave', () => peek.classList.remove('is-on'));
      });
    }
    const printBtn = $('[data-print]');
    printBtn && printBtn.addEventListener('click', () => print());
  }

  /* ---------- 11. Vídeos: solo se reproducen cuando se ven ---------- */
  const vids = $$('video[data-autoplay]');
  const vIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) { const p = v.play(); p && p.catch(() => {}); } else v.pause();
    });
  }, { threshold: .05 });
  vids.forEach((v) => { v.muted = true; vIO.observe(v); });

  /* ---------- 12. Año en el pie ---------- */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
