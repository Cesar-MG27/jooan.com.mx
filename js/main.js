/* ============================================================
   joan — estudio digital · main.js
   Port en JavaScript vanilla del componente original.
   Sin React, sin Babel, sin runtime de builder.
   Dependencias externas (vía CDN en index.html): Lenis, GSAP, ScrollTrigger.
   ============================================================ */
(function () {
  'use strict';

  /** Atajo de referencia: <el data-ref="nombre"> → ref('nombre') */
  const ref = (name) => document.querySelector('[data-ref="' + name + '"]');
  const reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {}; // guarda timers / instancias para limpieza si hiciera falta

  /* ----------------------------------------------------------
     PUNTOS DE CORTE
     Los mismos números que css/styles.css. Cuando se cruza uno,
     las secciones que dependen de JS (trabajo, proceso) cambian
     de modo en caliente, sin recargar.
     ---------------------------------------------------------- */
  const MQ_WORK = window.matchMedia('(max-width:860px)');  // carrusel táctil
  const MQ_PROC = window.matchMedia('(max-width:1024px)'); // proceso sin pin
  const MQ_NAV  = window.matchMedia('(max-width:900px)');  // nav de hamburguesa

  const onMQ = (mq, fn) => {
    mq.addEventListener ? mq.addEventListener('change', fn) : mq.addListener(fn);
  };

  /** Alto real de la nav fija: lo que hay que descontar al saltar a un ancla.
      Para #inicio el destino queda en negativo y Lenis lo recorta a 0. */
  function navOffset() {
    const nav = ref('navEl');
    if (!nav) return 0;
    return Math.round(nav.getBoundingClientRect().height);
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  function init() {
    const root = ref('root');
    if (!root) return;

    initPreloader();
    initReveal(root);
    initManifestoSplit();
    initTheme();
    initClock();
    initLiquidHover();
    initCursor();
    initMobileMenu();
    initWorkCarousel();

    // Motor de scroll (rAF throttle)
    state.onScroll = onScroll;
    window.addEventListener('scroll', state.onScroll, { passive: true });
    onScroll();

    initLenis();
  }

  /* ----------------------------------------------------------
     MENÚ MÓVIL — panel a pantalla completa
     Bloquea el scroll (y Lenis) mientras está abierto, se cierra
     al elegir un destino, con Escape o al volver a escritorio.
     ---------------------------------------------------------- */
  function initMobileMenu() {
    const burger = ref('navBurger');
    const sheet = ref('navSheet');
    if (!burger || !sheet) return;

    const open = () => {
      if (state.menuOpen) return;
      state.menuOpen = true;
      sheet.hidden = false;
      // Un frame para que la transición arranque desde el estado cerrado
      requestAnimationFrame(() => sheet.classList.add('is-open'));
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Cerrar menú');
      document.documentElement.classList.add('menu-open');
      if (state.lenis) state.lenis.stop();
    };

    const close = () => {
      if (!state.menuOpen) return;
      state.menuOpen = false;
      sheet.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menú');
      document.documentElement.classList.remove('menu-open');
      if (state.lenis) state.lenis.start();
      clearTimeout(state.menuHide);
      state.menuHide = setTimeout(() => { if (!state.menuOpen) sheet.hidden = true; }, 520);
    };

    state.closeMenu = close;

    burger.addEventListener('click', () => (state.menuOpen ? close() : open()));

    // El destino se navega con el handler global de anclas (Lenis);
    // aquí solo cerramos para que el scroll suave ocurra ya visible.
    sheet.querySelectorAll('[data-sheet-link]').forEach((a) => {
      a.addEventListener('click', close);
    });
    const cta = sheet.querySelector('.nav-sheet-cta');
    if (cta) cta.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.menuOpen) close();
    });

    // Al pasar a escritorio el panel deja de tener sentido
    onMQ(MQ_NAV, (e) => { if (!e.matches) close(); });
  }

  /* ----------------------------------------------------------
     PRELOADER — una frase que anticipa lo que viene y un telón corto
     (~1.2 s). Un sitio que vende velocidad no puede hacer esperar.
     Se salta sin pintarse cuando el <head> marcó html.intro-visto: ya
     se vio en esta sesión, se llegó con ancla o se pidió menos
     movimiento.
     ---------------------------------------------------------- */
  function initPreloader() {
    const pre = ref('preloader');

    // Sin telón: se retira el nodo para que initTracking() no espere a
    // un preloader que nunca se mostró y cuente las vistas desde ya.
    if (!pre || reducedMotion || document.documentElement.classList.contains('intro-visto')) {
      if (pre) pre.remove();
      revealHero();
      return;
    }

    try { sessionStorage.setItem('joan-intro', '1'); } catch (e) { /* sin storage: se verá otra vez */ }

    // Palabra por palabra, como el manifiesto. El retardo de cada una
    // sale de --i (el color y la transición viven en css/styles.css).
    const line = ref('preloaderLine');
    if (line) {
      line.innerHTML = line.textContent.trim().split(/\s+/)
        .map((w, i) => '<span class="pl-w" style="--i:' + i + '">' + w + '</span>').join(' ');
    }
    // El telón sube a ~1.3 s de la navegación, no del arranque de este
    // script (que espera a Lenis/GSAP de la CDN), pero la frase queda en
    // pantalla al menos 0.9 s. La línea de progreso dura exactamente eso.
    const espera = Math.max(900, 1300 - performance.now());
    pre.style.setProperty('--pl-dur', espera + 'ms');
    requestAnimationFrame(() => requestAnimationFrame(() => pre.classList.add('is-on')));

    const lift = () => {
      if (state.preLifted) return;
      state.preLifted = true;
      clearTimeout(state.preTimer);
      clearTimeout(state.safety);
      pre.style.transition = 'transform 0.8s cubic-bezier(0.76,0,0.24,1)';
      pre.style.transform = 'translateY(-100%)';
      revealHero();
      setTimeout(() => pre.remove(), 900);
    };
    state.preTimer = setTimeout(lift, espera);

    // Seguridad: nunca dejar al usuario atrapado tras el preloader
    state.safety = setTimeout(lift, 2500);
  }

  /* ----------------------------------------------------------
     SISTEMA DE REVELADO (IntersectionObserver)
     ---------------------------------------------------------- */
  function initReveal(root) {
    // El estado inicial (oculto + transición) lo pone el CSS bajo html.js,
    // así no hay parpadeo entre el pintado y la ejecución de este script.
    const reveals = root.querySelectorAll('[data-reveal]');
    if (!reveals.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  /* ----------------------------------------------------------
     MANIFESTO — split por palabras para iluminado en scroll
     ---------------------------------------------------------- */
  function initManifestoSplit() {
    const mtext = ref('manifestoText');
    if (mtext) {
      const phrase = 'Tú conoces tu negocio. Yo lo convierto en un sitio que trabaja por ti.';
      // El color/transición de .mw viven en css/styles.css
      mtext.innerHTML = phrase.split(' ').map((w) => '<span class="mw">' + w + '</span>').join(' ');
    }
    state.mwords = mtext ? Array.from(mtext.querySelectorAll('.mw')) : [];
  }

  /* ----------------------------------------------------------
     TEMA (claro / oscuro / dispositivo)
     ---------------------------------------------------------- */
  function initTheme() {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      try { return localStorage.getItem('joan-theme') || 'device'; }
      catch (e) { return 'device'; }
    };
    const resolve = (pref) =>
      (pref === 'dark' || (pref === 'device' && mq.matches)) ? 'dark' : 'light';

    const paint = () => {
      const pref = read();
      root.dataset.theme = resolve(pref);
      document.querySelectorAll('[data-theme-opt]').forEach((btn) => {
        const on = btn.getAttribute('data-theme-opt') === pref;
        btn.style.opacity = on ? '1' : '0.4';
        btn.style.background = on ? 'color-mix(in srgb, currentColor 14%, transparent)' : 'transparent';
      });
    };

    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('[data-theme-opt]');
      if (!btn) return;
      e.preventDefault();
      try { localStorage.setItem('joan-theme', btn.getAttribute('data-theme-opt')); }
      catch (err) {}
      paint();
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });

    const onMqChange = () => { if (read() === 'device') paint(); };
    mq.addEventListener ? mq.addEventListener('change', onMqChange) : mq.addListener(onMqChange);
    paint();
  }

  /* ----------------------------------------------------------
     HOVER LÍQUIDO — distorsión SVG sobre las imágenes de trabajo
     Un feTurbulence + feDisplacementMap por tarjeta: al entrar el
     cursor hay un "chapoteo" que decae hacia una ondulación suave,
     y al salir la distorsión vuelve a cero y el filtro se retira.
     ---------------------------------------------------------- */
  function initLiquidHover() {
    if (reducedMotion) return;
    const medias = Array.from(document.querySelectorAll('.wk-media'));
    if (!medias.length) return;

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    const defs = document.createElementNS(NS, 'defs');
    svg.appendChild(defs);
    document.body.appendChild(svg);

    let raf = null;
    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const items = medias.map((media, i) => {
      const img = media.querySelector('.wk-img');
      if (!img) return null;

      const id = 'wk-liquid-' + i;
      const filter = document.createElementNS(NS, 'filter');
      filter.setAttribute('id', id);
      filter.setAttribute('x', '-14%');
      filter.setAttribute('y', '-14%');
      filter.setAttribute('width', '128%');
      filter.setAttribute('height', '128%');
      filter.setAttribute('color-interpolation-filters', 'sRGB');

      const turb = document.createElementNS(NS, 'feTurbulence');
      turb.setAttribute('type', 'fractalNoise');
      turb.setAttribute('baseFrequency', '0.009 0.016');
      turb.setAttribute('numOctaves', '2');
      turb.setAttribute('seed', String(3 + i * 7));
      turb.setAttribute('result', 'noise');

      const disp = document.createElementNS(NS, 'feDisplacementMap');
      disp.setAttribute('in', 'SourceGraphic');
      disp.setAttribute('in2', 'noise');
      disp.setAttribute('scale', '0');
      disp.setAttribute('xChannelSelector', 'R');
      disp.setAttribute('yChannelSelector', 'G');

      filter.appendChild(turb);
      filter.appendChild(disp);
      defs.appendChild(filter);

      const it = {
        img, turb, disp, id,
        amp: 0, target: 0, burst: 0, applied: false,
        on: false, phase: Math.random() * Math.PI * 2,
      };

      const enter = () => { it.on = true; it.target = 1; it.burst = performance.now(); start(); };
      const leave = () => { it.on = false; it.target = 0; start(); };
      media.addEventListener('mouseenter', enter);
      media.addEventListener('mouseleave', leave);
      media.addEventListener('focus', enter);
      media.addEventListener('blur', leave);
      return it;
    }).filter(Boolean);

    const PEAK = 30; // pico de distorsión al entrar el cursor
    const IDLE = 11; // ondulación de fondo mientras sigue encima

    function frame(t) {
      let alive = false;
      items.forEach((it) => {
        // Suavizado exponencial: sube rápido, se relaja despacio
        it.amp += (it.target - it.amp) * (it.target > it.amp ? 0.16 : 0.085);

        if (!it.on && it.amp < 0.004) {
          it.amp = 0;
          if (it.applied) { it.img.style.filter = ''; it.applied = false; }
          return;
        }
        alive = true;

        const burst = it.on ? Math.exp(-(t - it.burst) / 270) : 0;
        const wobble = 0.55 + 0.45 * Math.sin(t / 620 + it.phase);
        const scale = it.amp * (IDLE * wobble + PEAK * burst);
        it.disp.setAttribute('scale', scale.toFixed(2));

        const f = 0.009 + 0.004 * Math.sin(t / 1500 + it.phase);
        it.turb.setAttribute('baseFrequency', f.toFixed(4) + ' ' + (f * 1.75).toFixed(4));

        if (!it.applied) { it.img.style.filter = 'url(#' + it.id + ')'; it.applied = true; }
      });
      raf = alive ? requestAnimationFrame(frame) : null;
    }
  }

  /* ----------------------------------------------------------
     CURSOR — micro punto con estela de un solo trazo
     El punto se dibuja EXACTAMENTE en clientX/clientY (sustituye
     al cursor del sistema, así que no puede ir con retraso); la
     estela y el anillo sí flotan detrás, con suavizado independiente
     de los fps. Sobre superficies naranjas el color se invierte.
     ---------------------------------------------------------- */
  function initCursor() {
    if (reducedMotion) return;
    // Solo con puntero de precisión (ratón / trackpad)
    if (!window.matchMedia || !window.matchMedia('(pointer:fine)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;z-index:300;pointer-events:none';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Solo ahora ocultamos el cursor nativo: si el follower no arranca,
    // el usuario conserva su puntero de siempre.
    document.documentElement.classList.add('cursor-none');

    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    /* --- Color: naranja de acento y su inverso sobre naranja --- */
    const cssVar = (name, fallback) => {
      const v = (getComputedStyle(document.documentElement)
        .getPropertyValue(name) || '').trim();
      return v || fallback;
    };
    const parseColor = (str) => {
      const s = String(str).trim();
      const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (hex) {
        const v = hex[1];
        const f = v.length === 3
          ? [v[0] + v[0], v[1] + v[1], v[2] + v[2]]
          : [v.slice(0, 2), v.slice(2, 4), v.slice(4, 6)];
        return { r: parseInt(f[0], 16), g: parseInt(f[1], 16), b: parseInt(f[2], 16), a: 1 };
      }
      const m = s.match(/rgba?\(([^)]+)\)/i);
      if (!m) return null;
      const n = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
      if (n.length < 3 || n.some(isNaN)) return null;
      return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 };
    };

    const ACCENT = parseColor(cssVar('--accent', '#E5541F')) || { r: 229, g: 84, b: 31, a: 1 };
    const INVERT = parseColor(cssVar('--on-ink', '#EBE5D7')) || { r: 235, g: 229, b: 215, a: 1 };

    // ¿Este color es un naranja de marca? (tono cálido, saturado, ni muy claro ni muy oscuro)
    const isOrangeColor = (c) => {
      if (!c || c.a < 0.55) return false;
      const r = c.r / 255, g = c.g / 255, b = c.b / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const l = (max + min) / 2;
      if (l < 0.22 || l > 0.72) return false;
      const d = max - min;
      if (!d) return false;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (s < 0.45) return false;
      if (max !== r) return false;               // el rojo debe dominar
      let hue = ((g - b) / d) * 60;
      if (hue < 0) hue += 360;
      return hue >= 4 && hue <= 48;
    };

    // Sube por el árbol hasta el primer fondo opaco y lo evalúa
    const overOrange = (el) => {
      let n = el;
      let guard = 0;
      while (n && n.nodeType === 1 && guard++ < 12) {
        if (n.hasAttribute('data-cursor-invert')) return true;
        const c = parseColor(getComputedStyle(n).backgroundColor);
        if (c && c.a > 0.55) return isOrangeColor(c);
        n = n.parentElement;
      }
      return false;
    };

    const HOT = 'a,button,[role="button"],[data-theme-opt],label,summary';
    const TEXT = 'input:not([type="submit"]):not([type="button"]),textarea,[contenteditable="true"]';

    const TRAIL = 20;                  // posiciones que forman el trazo
    const pts = [];
    const at = { x: -200, y: -200 };   // posición real del puntero
    const last = { x: -200, y: -200 }; // última posición registrada en el trazo
    const halo = { x: -200, y: -200 }; // anillo: flota por detrás del punto
    let inside = false, down = false, mode = 'default';

    // Valores animados
    let ring = 0, ringTo = 0;          // anillo sobre enlaces
    let dotR = 2.6, dotRTo = 2.6;      // radio del punto
    let bar = 0, barTo = 0;            // barra sobre campos de texto
    const col = { r: ACCENT.r, g: ACCENT.g, b: ACCENT.b };
    let colTo = ACCENT;

    let raf = null, idle = 0, prevT = 0, hovered = null;
    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const setMode = (el) => {
      colTo = overOrange(el) ? INVERT : ACCENT;
      let next = 'default';
      if (el && el.closest) {
        if (el.closest(TEXT)) next = 'text';
        else if (el.closest(HOT)) next = 'link';
      }
      if (next === mode) return;
      mode = next;
      dotRTo = mode === 'link' ? 2.2 : 2.6;
      ringTo = mode === 'link' ? 15 : 0;
      barTo  = mode === 'text' ? 11 : 0;
    };

    window.addEventListener('mousemove', (e) => {
      at.x = e.clientX;
      at.y = e.clientY;
      if (!inside) {
        inside = true;
        pts.length = 0;
        halo.x = at.x; halo.y = at.y;   // el anillo no entra volando
      }
      // El árbol solo se consulta cuando cambia el elemento bajo el puntero
      if (e.target !== hovered) { hovered = e.target; setMode(e.target); }
      idle = 0;
      start();
    }, { passive: true });

    // El puntero cambia de elemento sin moverse (scroll): re-consultamos
    // qué hay debajo, como mucho cada 120 ms para no encarecer el scroll.
    let lastHit = 0;
    window.addEventListener('scroll', () => {
      if (!inside) return;
      const now = performance.now();
      if (now - lastHit < 120) return;
      lastHit = now;
      hovered = document.elementFromPoint(at.x, at.y);
      setMode(hovered);
      idle = 0;
      start();
    }, { passive: true });

    document.addEventListener('mouseleave', () => { inside = false; idle = 0; start(); });
    document.addEventListener('mouseenter', () => { inside = true; idle = 0; start(); });
    window.addEventListener('blur', () => { inside = false; idle = 0; start(); });
    window.addEventListener('mousedown', () => { down = true; idle = 0; start(); });
    window.addEventListener('mouseup', () => { down = false; idle = 0; start(); });

    const rgba = (a) =>
      'rgba(' + Math.round(col.r) + ',' + Math.round(col.g) + ',' + Math.round(col.b) + ',' + a + ')';

    function frame(now) {
      // Suavizado normalizado a 60 fps: mismo tacto en 60 y en 120 Hz
      const dt = prevT ? Math.min(64, now - prevT) : 16.67;
      prevT = now;
      const k = (base) => 1 - Math.pow(1 - base, dt / 16.667);

      ring += (ringTo - ring) * k(0.16);
      dotR += (dotRTo - dotR) * k(0.16);
      bar  += (barTo - bar) * k(0.2);
      col.r += (colTo.r - col.r) * k(0.2);
      col.g += (colTo.g - col.g) * k(0.2);
      col.b += (colTo.b - col.b) * k(0.2);

      // El anillo persigue al punto con inercia: el punto es exacto,
      // lo que se percibe como "suave" es este retardo.
      const hk = k(0.22);
      halo.x += (at.x - halo.x) * hk;
      halo.y += (at.y - halo.y) * hk;

      // Solo crece el trazo si el puntero se movió de verdad; si está
      // quieto (o fuera), la cola se recoge hasta desaparecer.
      if (inside && (at.x !== last.x || at.y !== last.y)) {
        pts.push({ x: at.x, y: at.y });
        if (pts.length > TRAIL) pts.shift();
        last.x = at.x; last.y = at.y;
      } else if (pts.length) {
        pts.shift();
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Estela: curva suave (cuadráticas por los puntos medios) en vez
      // de una polilínea, para que no se vean los quiebres del muestreo.
      if (pts.length > 2) {
        let mx = (pts[0].x + pts[1].x) / 2;
        let my = (pts[0].y + pts[1].y) / 2;
        for (let i = 1; i < pts.length - 1; i++) {
          const t = i / pts.length;
          const nx = (pts[i].x + pts[i + 1].x) / 2;
          const ny = (pts[i].y + pts[i + 1].y) / 2;
          ctx.strokeStyle = rgba(0.42 * t * t);
          ctx.lineWidth = 1.7 * t;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, nx, ny);
          ctx.stroke();
          mx = nx; my = ny;
        }
      }

      if (inside) {
        const press = down ? 0.78 : 1;

        // Anillo sobre enlaces y botones (flotando detrás del punto)
        if (ring > 0.4) {
          ctx.strokeStyle = rgba(0.55 * Math.min(1, ring / 15));
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(halo.x, halo.y, ring * press, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Barra sobre campos de texto
        if (bar > 0.4) {
          ctx.strokeStyle = rgba(0.9);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(at.x, at.y - bar);
          ctx.lineTo(at.x, at.y + bar);
          ctx.stroke();
        }

        // El punto, siempre en la coordenada exacta del puntero
        if (bar < 6) {
          ctx.fillStyle = rgba(1 - bar / 6);
          ctx.beginPath();
          ctx.arc(at.x, at.y, Math.max(0.1, dotR * press), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Todo asentado: apagamos el bucle hasta la próxima interacción
      const settled =
        Math.abs(ringTo - ring) < 0.05 &&
        Math.abs(dotRTo - dotR) < 0.02 &&
        Math.abs(barTo - bar) < 0.05 &&
        Math.abs(colTo.r - col.r) < 0.6 &&
        Math.abs(colTo.g - col.g) < 0.6 &&
        Math.abs(colTo.b - col.b) < 0.6 &&
        Math.abs(at.x - halo.x) < 0.3 &&
        Math.abs(at.y - halo.y) < 0.3 &&
        pts.length <= 1;
      idle = settled ? idle + 1 : 0;
      if (idle > 2) { raf = null; prevT = 0; } else { raf = requestAnimationFrame(frame); }
    }
  }

  /* ----------------------------------------------------------
     RELOJ EN VIVO (Ciudad de México)
     ---------------------------------------------------------- */
  function initClock() {
    const targets = [ref('navClock'), ref('navSheetClock')].filter(Boolean);
    if (!targets.length) return;
    const upd = () => {
      let txt = '';
      try {
        txt = 'MX ' + new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit', minute: '2-digit', hour12: false,
          timeZone: 'America/Mexico_City'
        });
      } catch (e) { txt = ''; }
      targets.forEach((el) => { el.textContent = txt; });
    };
    upd();
    state.clockInt = setInterval(upd, 1000 * 20);
  }

  /* ----------------------------------------------------------
     LENIS — smooth scroll + puente con GSAP
     ---------------------------------------------------------- */
  function initLenis() {
    if (reducedMotion) { connectGsap(null); return; }
    let tries = 0;
    const boot = () => {
      if (typeof Lenis === 'undefined') {
        if (++tries < 60) return void setTimeout(boot, 80);
        return;
      }
      const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
      });
      state.lenis = lenis;

      const raf = (time) => { lenis.raf(time); state.lenisRAF = requestAnimationFrame(raf); };
      state.lenisRAF = requestAnimationFrame(raf);

      connectGsap(lenis);

      // Los enlaces internos (#...) hacen scroll suave con Lenis.
      // El offset descuenta la nav fija: sin él, en móvil el título de
      // la sección aterriza justo debajo de la barra.
      document.addEventListener('click', (e) => {
        const a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a) return;
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -navOffset(), duration: 1.4 });
      });
    };
    boot();
  }

  function connectGsap(lenis) {
    let tries = 0;
    const wait = () => {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        if (++tries < 100) { setTimeout(wait, 80); return; }
        return;
      }
      if (lenis) {
        if (state.lenisRAF) { cancelAnimationFrame(state.lenisRAF); state.lenisRAF = null; }
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      }
      // Esperar a que el DOM se asiente (preloader) antes de medir el proceso
      setTimeout(() => {
        initProcess();
        initNavTheme();
        // Cruzar el corte de tablet cambia el modo del proceso por completo
        onMQ(MQ_PROC, () => {
          initProcess();
          ScrollTrigger.refresh();
        });
      }, 400);
    };
    wait();
  }

  /* ----------------------------------------------------------
     PROCESO — pin / scrub con GSAP ScrollTrigger
     ---------------------------------------------------------- */
  function initProcess() {
    const section = document.getElementById('proceso');
    const stepsWrap = section && section.querySelector('[data-proc-steps]');
    if (!section || !stepsWrap) return;

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach((s) => { if (s.vars && s.vars.id === 'procST') s.kill(); });
    }
    state.procST = null;
    if (state.procIO) { state.procIO.disconnect(); state.procIO = null; }

    const steps = Array.from(stepsWrap.querySelectorAll('[data-step]'));
    const bodies = steps.map((s) => s.querySelector('[data-step-body]'));
    const N = steps.length;
    if (!N) return;

    /* --- Móvil / tablet: sin pin. Los cuatro pasos se leen abiertos y
       el contador lo lleva un IntersectionObserver. El CSS ya neutraliza
       opacidad y transform; aquí solo hay que borrar los estilos inline
       que pudo dejar el scrub antes de cruzar el breakpoint. --- */
    if (MQ_PROC.matches) {
      steps.forEach((s) => {
        s.style.opacity = '';
        s.style.transform = '';
        const t = s.querySelector('h3');
        if (t) t.style.color = '';
      });
      bodies.forEach((b) => { if (b) { b.style.height = ''; b.style.opacity = ''; } });

      const cEl = ref('procCount');
      const barEl = ref('procBar');
      state.procIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = steps.indexOf(e.target);
          if (i < 0) return;
          if (cEl) cEl.textContent = String(i + 1).padStart(2, '0');
          if (barEl) barEl.style.width = (((i + 1) / N) * 100).toFixed(1) + '%';
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach((s) => state.procIO.observe(s));
      return;
    }

    // A partir de aquí: escritorio, con pin y scrub
    const natural = bodies.map((b) => b.scrollHeight);

    const apply = (p) => {
      for (let i = 0; i < N; i++) {
        const center = (i + 0.5) / N;
        const d = Math.abs(p - center) / (1 / N);
        const focus = Math.max(0, 1 - d);
        const e = focus * focus * (3 - 2 * focus); // smoothstep
        const step = steps[i];
        step.style.opacity = (0.22 + 0.78 * e).toFixed(3);
        step.style.transform = 'translateX(' + ((1 - e) * 16).toFixed(1) + 'px)';
        const title = step.querySelector('h3');
        if (title) title.style.color = 'rgba(235,229,215,' + (0.5 + 0.5 * e).toFixed(3) + ')';
        const body = bodies[i];
        if (body) { body.style.height = (natural[i] * e).toFixed(1) + 'px'; body.style.opacity = e.toFixed(3); }
      }
      const active = Math.max(1, Math.min(N, Math.floor(p * N) + 1));
      const cEl = ref('procCount');
      if (cEl) cEl.textContent = String(active).padStart(2, '0');
      const bar = ref('procBar');
      if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
    };

    if (reducedMotion) {
      bodies.forEach((b, i) => { if (b) { b.style.height = natural[i] + 'px'; b.style.opacity = '1'; } });
      steps.forEach((s) => { s.style.opacity = '1'; });
      return;
    }

    state.procST = ScrollTrigger.create({
      id: 'procST',
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => apply(self.progress),
    });
    ScrollTrigger.refresh();
    apply(0);

    const remeasure = () => {
      if (MQ_PROC.matches) return; // en móvil las alturas son automáticas
      bodies.forEach((b, i) => {
        if (!b) return;
        const prev = b.style.height; b.style.height = 'auto';
        natural[i] = b.scrollHeight; b.style.height = prev;
      });
      apply(state.procST ? state.procST.progress : 0);
      ScrollTrigger.refresh();
    };
    // initProcess puede reejecutarse al cruzar un breakpoint: un solo listener
    state.procRemeasure = remeasure;
    if (!state.procResizeBound) {
      state.procResizeBound = true;
      window.addEventListener('resize', () => {
        clearTimeout(state.procResizeT);
        state.procResizeT = setTimeout(() => {
          if (state.procRemeasure) state.procRemeasure();
        }, 160);
      });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTimeout(remeasure, 60));
    }
  }

  /* ----------------------------------------------------------
     NAV THEME — color de la nav según la sección visible
     ---------------------------------------------------------- */
  function initNavTheme() {
    let sheet = document.getElementById('__navtheme');
    if (!sheet) { sheet = document.createElement('style'); sheet.id = '__navtheme'; document.head.appendChild(sheet); }
    ScrollTrigger.getAll().forEach((s) => { if (s.vars && s.vars.id === 'navTheme') s.kill(); });

    let last = null;
    const updateNav = () => {
      const band = 46;
      let onDark = false;
      document.querySelectorAll('[data-nav-dark]').forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= band && r.bottom > band) onDark = true;
      });
      if (onDark !== last) {
        last = onDark;
        // Además del color del texto, el velo de fondo (--nav-bg) tiene
        // que seguir a la sección: las bandas oscuras son siempre --ink,
        // independientemente del tema claro/oscuro elegido.
        // !important también en la custom property: si no, el valor por
        // defecto de .nav (más específico que nav) se impondría.
        sheet.textContent = onDark
          ? 'nav{color:var(--on-ink) !important;--nav-bg:color-mix(in srgb, var(--ink) 86%, transparent) !important}'
          : 'nav{color:var(--tx) !important;--nav-bg:color-mix(in srgb, var(--paper) 86%, transparent) !important}';
      }
    };
    ScrollTrigger.create({ id: 'navTheme', trigger: document.body, start: 0, end: 'max', onUpdate: updateNav, onRefresh: updateNav });
    updateNav();
  }

  /* ----------------------------------------------------------
     REVELADO DEL HERO
     ---------------------------------------------------------- */
  function revealHero() {
    if (state.heroStarted) return;
    state.heroStarted = true;
    const hero = ref('hero');

    const flip = (el, transition, delay, apply) => {
      if (!el) return;
      el.style.transition = transition;
      el.style.transitionDelay = delay + 's';
      void el.offsetWidth; // fuerza reflow para tener frame inicial
      apply(el);
    };

    ['railTop', 'railBot'].forEach((r, i) => {
      flip(ref(r), 'transform 1.1s cubic-bezier(0.22,1,0.36,1)', 0.05 + 0.12 * i,
        (el) => { el.style.transform = 'scaleX(1)'; });
    });
    flip(ref('word'), 'clip-path 1.25s cubic-bezier(0.76,0,0.24,1)', 0.28,
      (el) => { el.style.clipPath = 'inset(0 0% 0 0)'; });

    // Escalonado corto: la promesa (H1) tiene que leerse en ~2 s.
    const ins = hero ? hero.querySelectorAll('[data-hero-in]') : [];
    ins.forEach((el, i) => {
      flip(el, 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)', 0.1 + 0.05 * i,
        (e) => { e.style.opacity = '1'; e.style.transform = 'translateY(0)'; });
    });

    // El telón ya subió: a partir de aquí una vista de CTA es una vista real.
    if (state.arrancarVistas) state.arrancarVistas();
  }

  /* ----------------------------------------------------------
     MOTOR DE SCROLL (rAF throttle)
     ---------------------------------------------------------- */
  function onScroll() {
    if (state.raf) return;
    state.raf = requestAnimationFrame(() => {
      state.raf = null;
      const y = window.scrollY || window.pageYOffset;
      const vh = window.innerHeight;

      // Logo central de la nav tras el hero
      const nl = ref('navLogo');
      if (nl) nl.style.opacity = y > vh * 0.75 ? '1' : '0';

      // Velo bajo la nav: en móvil el contenido pasa por debajo y sin
      // fondo se vuelve ilegible. Arriba del todo sigue flotando limpia.
      const solid = y > 24;
      if (solid !== state.navSolid) {
        state.navSolid = solid;
        document.documentElement.classList.toggle('nav-solid', solid);
      }

      // Parallax + fade del hero
      const hero = ref('hero');
      const wm = ref('wordmark');
      if (hero && wm && y < vh * 1.2) {
        const p = Math.min(1, y / vh);
        wm.style.transform = 'translateY(' + (y * 0.18) + 'px) scale(' + (1 - p * 0.04) + ')';
        wm.style.opacity = String(1 - p * 0.85);
      }

      // Iluminado de palabras del manifiesto
      const man = ref('manifesto');
      if (man && state.mwords && state.mwords.length) {
        const r = man.getBoundingClientRect();
        const total = r.height + vh;
        const prog = Math.min(1, Math.max(0, (vh - r.top) / total));
        const lit = Math.floor(prog * 1.7 * state.mwords.length);
        state.mwords.forEach((w, i) => {
          w.style.color = i < lit ? 'var(--tx)' : 'var(--tx-muted)';
        });
      }

      onScrollWork(y, vh);
    });
  }

  /* WORK — pin-scrub horizontal (solo escritorio)
     En móvil el CSS convierte la fila en un carrusel con scroll-snap
     nativo, así que aquí no se toca el transform: lo movería el dedo
     y el JS a la vez. */
  function onScrollWork(y, vh) {
    if (MQ_WORK.matches) return;
    const track = ref('workTrack');
    const row = ref('workRow');
    if (!track || !row) return;
    const r = track.getBoundingClientRect();
    const total = r.height - vh;
    if (total <= 0) return;
    const prog = Math.min(1, Math.max(0, -r.top / total));
    const maxX = Math.max(0, row.scrollWidth - window.innerWidth);
    row.style.transform = 'translate3d(' + (-prog * maxX) + 'px,0,0)';
    setWorkProgress(prog, row);
  }

  /* Indicador compartido por los dos modos */
  function setWorkProgress(prog, row) {
    const bar = ref('wkProgress');
    if (bar) bar.style.width = (prog * 100) + '%';
    const idx = ref('wkIndex');
    const count = (row && row.children.length) || 1;
    if (idx) idx.textContent = String(Math.min(count, Math.floor(prog * (count - 0.01)) + 1)).padStart(2, '0');
  }

  /* WORK — carrusel táctil (móvil)
     La misma barra de progreso, alimentada por el scroll real de la
     fila en lugar del scroll de la página. */
  function initWorkCarousel() {
    const row = ref('workRow');
    if (!row) return;

    const sync = () => {
      if (!MQ_WORK.matches) return;
      const max = row.scrollWidth - row.clientWidth;
      const prog = max > 0 ? Math.min(1, Math.max(0, row.scrollLeft / max)) : 0;
      setWorkProgress(prog, row);
    };

    row.addEventListener('scroll', () => {
      if (state.wkRAF) return;
      state.wkRAF = requestAnimationFrame(() => { state.wkRAF = null; sync(); });
    }, { passive: true });

    // Al cambiar de modo hay que limpiar lo que dejó el otro
    const swap = () => {
      if (MQ_WORK.matches) {
        row.style.transform = '';       // el pin ya no manda
        row.scrollLeft = 0;
        setWorkProgress(0, row);
      } else {
        row.scrollLeft = 0;             // el carrusel ya no manda
        onScroll();
      }
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    };
    onMQ(MQ_WORK, swap);
    swap();
  }

  /* ----------------------------------------------------------
     MEDICIÓN — GA4 sobre los CTAs marcados con data-cta
     Dos señales por CTA: cta_view (llegó a verse de verdad) y
     cta_click. Clics ÷ vistas es la tasa de conversión de cada
     llamada a la acción; los clics sueltos no distinguen un mal
     CTA de uno al que nadie llega.
     Los identificadores viven en el HTML (data-cta), así que los
     informes sobreviven a cualquier reescritura del copy.
     ---------------------------------------------------------- */

  /** Recorta al máximo que acepta GA4 en un valor de parámetro. */
  const corta = (v, n) => String(v == null ? '' : v).slice(0, n || 100);

  /** Página actual, declarada en <body data-pagina>. */
  const PAGINA = (document.body && document.body.getAttribute('data-pagina')) || 'otra';

  /** Depuración: en local siempre; en producción con ?ga_debug=1.
      Los eventos marcados así aparecen en el DebugView de GA4. */
  const GA_DEBUG = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ||
    location.search.indexOf('ga_debug') > -1;

  /** Envío a GA4. Si gtag no existe (bloqueador de anuncios, red caída)
      esto no hace nada y NO lanza: la medición jamás puede frenar una
      navegación ni tumbar la página. Sin event_callback a propósito —
      ninguna navegación se queda esperando a Google. */
  function track(evento, params) {
    try {
      if (typeof window.gtag !== 'function') return;
      const p = params || {};
      if (GA_DEBUG) { p.debug_mode = true; console.info('[ga]', evento, p); }
      window.gtag('event', evento, p);
    } catch (e) { /* silencio deliberado */ }
  }

  /** Canal del CTA: se deduce del destino salvo que el HTML lo declare. */
  function ctaCanal(el) {
    const dado = el.getAttribute('data-cta-canal');
    if (dado) return dado;
    const href = el.getAttribute('href');
    if (!href) return 'formulario';            // <button type="submit">
    if (href.charAt(0) === '#') return 'ancla';
    try {
      const u = new URL(href, location.href);
      if (u.protocol === 'mailto:') return 'email';
      if (u.host === 'wa.me' || u.host === 'api.whatsapp.com') return 'whatsapp';
      return u.host === location.host ? 'interno' : 'externo';
    } catch (e) { return 'otro'; }
  }

  /** Destino corto y legible: sin el ?text= de WhatsApp y sin correos.
      De los enlaces internos se conserva ?p=slug, que es la parte útil. */
  function ctaDestino(el) {
    const href = el.getAttribute('href');
    if (!href || href === '#') return '';
    if (href.charAt(0) === '#') return corta(href); // el ancla ya es el destino
    try {
      const u = new URL(href, location.href);
      if (u.protocol === 'mailto:') return 'mailto'; // nunca mandamos correos a GA
      const p = u.searchParams.get('p');
      const base = (u.host === location.host ? '' : u.host) + u.pathname.replace(/\/$/, '');
      return corta((base || '/') + (p ? '?p=' + p : '') + (u.hash || ''));
    } catch (e) { return corta(href); }
  }

  /** El juego de parámetros, idéntico para cta_view y cta_click: solo
      así las dos series se cruzan en la misma tabla de GA4. */
  function ctaDatos(el) {
    const id = corta(el.getAttribute('data-cta'));
    const p = {
      cta_id: id,
      cta_canal: ctaCanal(el),
      cta_seccion: el.getAttribute('data-cta-seccion') || id.split('_')[0],
      cta_pagina: PAGINA,
      cta_destino: ctaDestino(el),
    };
    const precio = parseInt(el.getAttribute('data-cta-precio') || '', 10);
    if (!isNaN(precio)) p.cta_precio = precio;
    const slug = document.documentElement.getAttribute('data-proyecto-slug');
    if (slug) p.proyecto_slug = corta(slug);
    return p;
  }

  function initTracking() {
    const ctas = document.querySelectorAll('[data-cta]');

    /* --- CLICS ---
       Delegación en document y en FASE DE CAPTURA. En burbujeo también
       funcionaría (preventDefault no detiene la propagación), pero la
       captura nos pone por delante del handler de anclas de Lenis y del
       cierre del menú móvil pase lo que pase, hoy y el día que alguno
       llame a stopPropagation. */
    document.addEventListener('click', (e) => {
      const el = e.target.closest && e.target.closest('[data-cta]');
      if (!el) return;
      track('cta_click', ctaDatos(el));
    }, true);

    // Página de error: la URL rota la da location, pero de dónde salió
    // el enlace muerto solo lo dice el referente.
    if (PAGINA === 'error_404') {
      track('error_404', {
        cta_pagina: PAGINA,
        url_rota: corta(location.pathname + location.search),
        origen: corta(document.referrer || '(directo)'),
      });
    }

    if (!ctas.length || typeof IntersectionObserver === 'undefined') return;

    /* --- VISTAS ---
       Un CTA cuenta como visto cuando la mitad de su superficie lleva un
       segundo en pantalla. Umbral y espera juntos evitan las dos formas
       de mentir: el CTA que asoma un píxel al frenar el scroll y el que
       pasa volando en mitad de un salto de ancla.
       Cada identificador se cuenta UNA vez por carga: al disparar se
       deja de observar. */
    const UMBRAL = 0.5;
    const ESPERA = 1000;
    const vistos = Object.create(null);
    const timers = new Map();

    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        const el = en.target;
        const id = el.getAttribute('data-cta');
        if (!en.isIntersecting) {
          clearTimeout(timers.get(el));
          timers.delete(el);
          return;
        }
        if (vistos[id]) { io.unobserve(el); return; }
        timers.set(el, setTimeout(() => {
          timers.delete(el);
          if (vistos[id]) return;
          vistos[id] = 1;
          io.unobserve(el);
          track('cta_view', ctaDatos(el));
        }, ESPERA));
      });
    }, { threshold: UMBRAL });

    /* IntersectionObserver no sabe nada de oclusión: un elemento tapado
       por el preloader intersecta igual que si estuviera a la vista. Sin
       esperar al telón, los CTAs del hero registrarían una vista que
       nadie vio y su tasa saldría hundida siempre.
       revealHero() nos avisa cuando el telón sube; el temporizador es la
       red por si ese camino no se recorre. */
    let arrancado = false;
    const arrancar = () => {
      if (arrancado) return;
      arrancado = true;
      clearTimeout(state.ctaEspera);
      ctas.forEach((el) => io.observe(el));
    };
    state.arrancarVistas = arrancar;
    if (ref('preloader')) state.ctaEspera = setTimeout(arrancar, 3000);
    else arrancar();
  }

  /* ----------------------------------------------------------
     FORMULARIO — envío real vía PHP (api/contact.php)
     ---------------------------------------------------------- */
  function initForm() {
    const form = ref('formEl');
    if (!form) return;
    form.addEventListener('submit', onSubmit);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = ref('formEl');
    const sent = ref('formSent');
    const errEl = form.querySelector('.form-error');
    const btn = form.querySelector('button[type="submit"]');
    const original = btn ? btn.innerHTML : '';

    if (errEl) errEl.classList.remove('is-visible');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Enviando…'; }

    let estado = 0; // 0 = no hubo respuesta (red caída / fetch abortado)

    try {
      const res = await fetch(form.getAttribute('action'), {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
      });
      estado = res.status;
      let data = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo enviar el mensaje.');
      }

      // Lead verificado. El honeypot de contact.php finge éxito para no
      // avisar al bot, pero solo el envío real trae acuse (data.id): sin
      // acuse no hay conversión que contar. Segundo cinturón: si el campo
      // trampa viene relleno en este navegador, tampoco.
      const trampa = form.querySelector('input[name="website"]');
      if (data.id && !(trampa && trampa.value)) {
        const sel = form.querySelector('select[name="producto"]');
        const op = sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
        const precio = op ? parseInt(op.getAttribute('data-precio') || '', 10) : NaN;
        track('generate_lead', {
          cta_id: 'contacto_formulario',
          cta_canal: 'formulario',
          cta_seccion: 'contacto',
          cta_pagina: PAGINA,
          form_producto: (op && op.getAttribute('data-producto')) || 'sin_definir',
          // Valor de OPORTUNIDAD, no de ingreso: es el precio publicado del
          // alcance que marcó el visitante, no dinero facturado.
          currency: 'MXN',
          value: isNaN(precio) ? 0 : precio,
        });
      }

      // Éxito → misma transición que el diseño original
      form.style.transition = 'opacity 0.4s ease';
      form.style.opacity = '0';
      setTimeout(() => {
        form.style.display = 'none';
        if (sent) {
          sent.style.display = 'block';
          sent.style.opacity = '0';
          sent.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          sent.style.transform = 'translateY(12px)';
          requestAnimationFrame(() => { sent.style.opacity = '1'; sent.style.transform = 'translateY(0)'; });
        }
      }, 400);
    } catch (err) {
      if (btn) { btn.disabled = false; btn.innerHTML = original; }
      if (errEl) {
        errEl.textContent = (err && err.message) || 'Error al enviar. Escríbeme por WhatsApp.';
        errEl.classList.add('is-visible');
      }
      // Distinguir "escribió mal el email" (422) de "el SMTP está caído"
      // (502) es la diferencia entre no hacer nada y llamar al hosting.
      track('form_error', {
        cta_id: 'contacto_formulario',
        cta_pagina: PAGINA,
        error_tipo: estado === 422 ? 'validacion'
                  : estado >= 500 ? 'servidor'
                  : estado === 0  ? 'red' : 'desconocido',
        error_codigo: estado,
        error_motivo: corta((err && err.message) || 'sin mensaje'),
      });
    }
  }

  /* ----------------------------------------------------------
     ARRANQUE
     ---------------------------------------------------------- */
  function boot() {
    init();
    initTracking(); // fuera de init(): en 404.html init() sale por falta de root
    initForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
