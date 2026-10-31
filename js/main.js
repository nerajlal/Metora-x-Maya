/* Dishyooom v2 — interactions
   No libraries (GSAP is gone: the hero entrance is CSS). Respects prefers-reduced-motion.
   The owl section below is unchanged from v1; js/owl3d.js is unchanged too. */
(() => {
  window.__dyReady = true;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // CONTACT: the WhatsApp number (country code, no +). It also appears in index.html and en.html.
  const WA_NUMBER = '918547470675';

  /* ---------- copy: index.html is Malayalam, en.html is English ------------- */
  const COPY = {
    ml: {
      hello: 'ഹലോ Metora! എനിക്കൊരു വെബ്സൈറ്റ് വേണം.',
      menu: 'മെനു', close: 'അടയ്ക്കാം',
      listHead: 'ലിസ്റ്റിൽ:',
      onList: n => `${n}: ലിസ്റ്റിലുണ്ട്`, addTo: n => `${n}: ലിസ്റ്റിൽ ചേർക്കാം`,
      remove: 'മാറ്റാം', removeLabel: n => `${n} ലിസ്റ്റിൽ നിന്ന് മാറ്റാം`,
      added: n => `${n} ലിസ്റ്റിൽ ചേർത്തു.`, removed: n => `${n} ലിസ്റ്റിൽ നിന്ന് മാറ്റി.`,
      goodPick: 'വൗ, അടിപൊളി ചോയ്സ്!',
      owl: {
        hero: 'ഹലോ! ഞാൻ Maya. സ്വാഗതം!',
        about: 'നിങ്ങൾക്ക് വേണ്ടിയുള്ള പ്രീമിയം വെബ്സൈറ്റുകൾ.',
        services: 'നിങ്ങൾക്ക് അനുയോജ്യമായ സർവീസ് തിരഞ്ഞെടുക്കാം.',
        process: 'ആശയങ്ങൾ മുതൽ ലോഞ്ച് വരെ കൃത്യമായ പ്ലാനിങ്.',
        faq: 'ഏത് സംശയവും ചോദിക്കാം ട്ടോ.',
        contact: 'WhatsApp-ൽ സംസാരിക്കാം. ഞാൻ റെഡിയാണ്!',
      },
      pokes: ['ഹലോ!', 'എന്തൊക്കെയുണ്ട്?', 'ഞാൻ കൂടെയുണ്ട് ട്ടോ.', 'സ്വാഗതം!'],
      idle: ['ഇവിടെ ഇരുന്ന് മടുത്തു.', 'താഴോട്ട് ഇനിയും ഉണ്ട്.', 'ഞാൻ ഇവിടെ ഉണ്ട് ട്ടോ.', 'ചുമ്മാ ഒന്ന് പറന്നതാ.'],
      sleep: 'മതി! ഞാൻ ഉറങ്ങട്ടെ.',
    },
    en: {
      hello: 'Hi Metora! I need a website.',
      menu: 'Menu', close: 'Close',
      listHead: 'On my list:',
      onList: n => `${n}: on your list`, addTo: n => `${n}: add to your list`,
      remove: 'Remove', removeLabel: n => `Remove ${n} from your list`,
      added: n => `${n} added to your list.`, removed: n => `${n} removed from your list.`,
      goodPick: 'Awesome choice!',
      owl: {
        hero: "Hi there! I'm Maya. Welcome!",
        about: "Brand ambassador for Metora. Crafted for you.",
        services: 'Five focused services. Tailored for you.',
        process: "Strategy to launch. Let's build your vision.",
        faq: "Any questions about our process? I'm here.",
        contact: "Ready to elevate your digital presence?",
      },
      pokes: ['Hi there!', "How can Metora assist you?", "Glad you're exploring!", "Let's build something exceptional."],
      idle: ['Explore our work.', "Take a look below.", 'We craft with purpose.', 'Ready when you are.'],
      sleep: "Recharging for tomorrow's builds!",
    },
    hi: {
      hello: 'नमस्ते Metora! मुझे एक वेबसाइट चाहिए।',
      menu: 'मेनू', close: 'बंद करें',
      listHead: 'आपकी सूची:',
      onList: n => `${n}: सूची में है`, addTo: n => `${n}: सूची में जोड़ें`,
      remove: 'हटाएं', removeLabel: n => `${n} को सूची से हटाएं`,
      added: n => `${n} सूची में जोड़ा गया।`, removed: n => `${n} सूची से हटाया गया।`,
      goodPick: 'शानदार पसंद!',
      owl: {
        hero: 'नमस्ते! मैं माया हूँ। मेटोरा में आपका स्वागत है!',
        about: 'ब्रांड एंबेसडर माया। आपके व्यवसाय के लिए समर्पित।',
        services: 'अपने व्यवसाय के अनुकूल सेवा चुनें।',
        process: 'रणनीति से लेकर लॉन्च तक पूर्ण योजना।',
        faq: 'कोई भी प्रश्न हो, बेझिझक पूछें।',
        contact: 'व्हाट्सएप पर बात करें, हम तैयार हैं!',
      },
      pokes: ['नमस्ते!', 'कैसा चल रहा है?', 'मैं आपकी मदद के लिए यहाँ हूँ।', 'मेटोरा में आपका स्वागत है!'],
      idle: ['नीचे और भी विवरण हैं।', 'आपकी डिजिटल प्रगति के लिए तैयार।', 'शानदार वेबसाइट्स बनाएं।', 'जब भी आप चाहें बात करें।'],
      sleep: 'अब आराम का समय है! कल फिर मिलते हैं।',
    },
  };
  const T = COPY[document.documentElement.lang] || COPY.en;

  /* ---------- nav ---------------------------------------------------------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav__links a');
  const linkFor = id => navLinks.find(a => a.getAttribute('href') === `#${id}`);
  // highlight the nav link of the section crossing the middle of the screen (none for unlinked sections)
  const sectionSpy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(l => l.removeAttribute('aria-current'));
      const a = linkFor(e.target.id);
      if (a) a.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(s => sectionSpy.observe(s));

  /* ---------- mobile menu --------------------------------------------------- */
  const menuBtn = $('.nav__menu');
  const menu = $('#menu');
  let onMenu = () => {};          // set by the owl below
  const setMenu = open => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? T.close : T.menu;
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', menu).focus();
    onMenu();
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

  /* ---------- reveal on scroll -------------------------------------------- */
  const revealer = new IntersectionObserver(entries => {
    let n = 0;
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = `${Math.min(n++ * 70, 350)}ms`;
      e.target.classList.add('is-in');
      revealer.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  const observeReveals = () => $$('.reveal:not(.is-in)').forEach(el => revealer.observe(el));

  /* ---------- hero entrance: CSS animations; the owl waits until they settle -- */
  const playIntro = () => new Promise(r => setTimeout(r, reduced ? 0 : 1100));

  /* ---------- toast ---------------------------------------------------------- */
  const toastEl = $('.toast');
  let toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }

  /* ---------- ticker (scroll speeds it up and sets its direction) ------------ */
  const tpl = $('#tape-words');
  const tracks = $$('.ticker__track');
  tracks.forEach(t => {
    const chunk = () => tpl.content.cloneNode(true);
    t.appendChild(chunk());
    // repeat until one copy spans the viewport, then duplicate for a seamless loop
    for (let i = 0; i < 12 && t.scrollWidth < innerWidth * 1.4; i++) t.appendChild(chunk());
    [...t.childNodes].forEach(n => t.appendChild(n.cloneNode(true)));
    t._x = 0;
  });
  if (!reduced && tracks.length) {
    let dir = 1, lastY = scrollY, boost = 0;
    addEventListener('scroll', () => {
      const dy = scrollY - lastY;
      if (Math.abs(dy) > 1) dir = dy > 0 ? 1 : -1;
      boost = Math.min(Math.abs(dy) * 0.3, 10);
      lastY = scrollY;
    }, { passive: true });
    const tick = () => {
      tracks.forEach(t => {
        const half = t.scrollWidth / 2;
        t._x -= (0.5 + boost) * dir * parseFloat(t.dataset.speed || 1);
        if (t._x <= -half) t._x += half;
        if (t._x > 0) t._x -= half;
        t.style.transform = `translate3d(${t._x}px,0,0)`;
      });
      boost *= 0.92;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- services: Ello follows the cursor over the rows ---------------- */
  // Hover-capable screens only; phones show each row's own small image (CSS).
  const svc = $('.svc');
  if (svc && matchMedia('(hover: hover) and (min-width: 960px)').matches) {
    const rows = $$('.svc__row', svc);
    const float = document.createElement('img');
    float.className = 'svc__float';
    float.alt = '';
    float.setAttribute('aria-hidden', 'true');
    float.decoding = 'async';
    svc.appendChild(float);
    let tx = 0, ty = 0, x = 0, y = 0, tilt = 0, raf = 0, active = null;
    const place = () => { float.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-62%) rotate(${tilt}deg)`; };
    const tick = () => {
      const dx = tx - x;
      x += dx * 0.16; y += (ty - y) * 0.16;
      tilt += (Math.max(-12, Math.min(12, dx * 0.06)) - tilt) * 0.2;
      place();
      raf = Math.abs(dx) + Math.abs(ty - y) + Math.abs(tilt) > 0.1 ? requestAnimationFrame(tick) : 0;
    };
    const moveTo = (nx, ny, jump) => {
      tx = nx; ty = ny;
      if (jump || reduced) { x = tx; y = ty; tilt = 0; place(); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const show = row => {
      if (active === row) return true;
      const wasOn = !!active;
      active = row;
      float.src = $('.svc__img', row).src;     // the full-size file: the srcset's small one is for phones
      float.classList.add('is-on');
      return wasOn;
    };
    const hide = () => { active = null; float.classList.remove('is-on'); };
    rows.forEach(row => {
      row.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse') return;
        const r = svc.getBoundingClientRect();
        const wasOn = show(row);
        moveTo(e.clientX - r.left, e.clientY - r.top, !wasOn);
      });
      // keyboard: park Ello over the middle of the focused row
      $('.svc__pick', row).addEventListener('focus', () => {
        if (!row.matches(':has(:focus-visible)')) return;
        const wasOn = show(row);
        moveTo(svc.clientWidth * 0.55, row.offsetTop + row.offsetHeight / 2, !wasOn);
      });
      $('.svc__pick', row).addEventListener('blur', () => { if (!svc.matches(':hover')) hide(); });
    });
    svc.addEventListener('pointermove', e => {
      if (!active) return;
      const r = svc.getBoundingClientRect();
      moveTo(e.clientX - r.left, e.clientY - r.top);
    });
    svc.addEventListener('pointerleave', hide);
  }

  /* ---------- the list: picked services go into the WhatsApp message ------- */
  // stored by data-id, so a pick survives switching between the Malayalam and English pages
  const adds = $$('.svc__pick');
  const nameOf = id => adds.find(b => b.dataset.id === id)?.dataset.name || id;
  const billList = $('#bill-list');
  const billEmpty = $('#bill-empty');
  const waCta = $('#wa-cta');
  let bill = [];
  try { bill = JSON.parse(localStorage.getItem('dy-list') || '[]').filter(id => adds.some(b => b.dataset.id === id)); } catch { bill = []; }

  function waHref() {
    let text = T.hello;
    if (bill.length) text += `\n\n${T.listHead}\n${bill.map((id, i) => `${i + 1}. ${nameOf(id)}`).join('\n')}`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  }
  function renderBill() {
    adds.forEach(b => {
      const on = bill.includes(b.dataset.id);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? T.onList(b.dataset.name) : T.addTo(b.dataset.name));
    });
    billList.replaceChildren(...bill.map(id => {
      const name = nameOf(id);
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = name;
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.textContent = T.remove;
      rm.setAttribute('aria-label', T.removeLabel(name));
      rm.addEventListener('click', () => toggle(id));
      li.append(label, rm);
      return li;
    }));
    billEmpty.hidden = bill.length > 0;
    waCta.href = waHref();
    try { localStorage.setItem('dy-list', JSON.stringify(bill)); } catch { /* private mode */ }
  }
  function toggle(id) {
    const had = bill.includes(id);
    bill = had ? bill.filter(n => n !== id) : bill.concat(id);
    renderBill();
    toast(had ? T.removed(nameOf(id)) : T.added(nameOf(id)));
    if (!had && bill.length === 1 && typeof say === 'function') say(T.goodPick, 2400);
  }
  adds.forEach(b => b.addEventListener('click', () => toggle(b.dataset.id)));
  renderBill();

  /* ---------- process: pinned; the cards rise in one by one on scroll (v1's comic strip) ---------- */
  // v1 did this with a GSAP ScrollTrigger pin + scrub; here the pin is CSS sticky and the scrub is below.
  const procSec = $('.process');
  const cards = $$('.card', procSec);
  const pinOk = () => !reduced && matchMedia('(min-width: 1101px) and (min-height: 680px)').matches;
  if (procSec && cards.length) {
    const backOut = t => { const c = 1.6, c3 = c + 1; return 1 + c3 * (t - 1) ** 3 + c * (t - 1) ** 2; };
    const clamp01 = v => Math.max(0, Math.min(1, v));
    // each card animates over 1 unit, starting 0.5 after the previous (GSAP's stagger: 0.5)
    const STAGGER = 0.5, total = STAGGER * (cards.length - 1) + 1;
    let shown = 0, target = 0, raf = 0, pinned = false;
    const paint = p => cards.forEach((c, i) => {
      const t = clamp01((p * total - i * STAGGER));
      const e = backOut(t);
      const rot = (i % 2 ? 9 : -9) * (1 - e);
      c.style.opacity = String(clamp01(t * 2.2));
      c.style.transform = `translateY(${140 * (1 - e)}px) rotate(${rot}deg) scale(${0.85 + 0.15 * e})`;
    });
    const measure = () => {
      const r = procSec.getBoundingClientRect();
      const run = procSec.offsetHeight - innerHeight;
      target = clamp01(-r.top / Math.max(run, 1));
    };
    const tick = () => {
      shown += (target - shown) * 0.14;           // scrub smoothing
      if (Math.abs(target - shown) < 0.0005) shown = target;
      paint(shown);
      raf = shown === target ? 0 : requestAnimationFrame(tick);
    };
    const onScrollPin = () => { if (!pinned) return; measure(); if (!raf) raf = requestAnimationFrame(tick); };
    const setup = () => {
      const want = pinOk();
      if (want === pinned) return;
      pinned = want;
      procSec.classList.toggle('is-pinned', pinned);
      cards.forEach(c => {
        c.classList.toggle('reveal', !pinned);
        if (!pinned) { c.style.opacity = ''; c.style.transform = ''; c.classList.add('is-in'); }
      });
      if (pinned) { measure(); shown = target; paint(shown); }
    };
    setup();
    addEventListener('scroll', onScrollPin, { passive: true });
    addEventListener('resize', () => { setup(); onScrollPin(); });
  }

  /* ---------- FAQ: one open at a time ------------------------------------- */
  const qas = $$('.qa');
  qas.forEach(d => d.addEventListener('toggle', () => { if (d.open) qas.forEach(o => { if (o !== d) o.open = false; }); }));

  /* ---------- floating owl (മൂ) ------------------------------------- */
  const OWL = {
    hero:     { pose: 'peek',    line: T.owl.hero },
    about:    { pose: 'crossed', line: T.owl.about },
    services: { pose: 'magnify', line: T.owl.services },
    process:  { pose: 'hover',   line: T.owl.process },
    faq:      { pose: 'crossed', line: T.owl.faq },
    contact:  { pose: 'wave',    line: T.owl.contact },
  };
  const POKES = T.pokes;
  let idleLine = 0;
  const owl = $('#owl');
  const owlImg = $('.owl__body img', owl);
  const bubble = $('.owl__bubble', owl);
  let current = 'hero', bubbleTimer = 0, pokes = 0, sleeping = false, introDone = false;

  const poseSrc = p => `img/owl/owl-${p}-sm.webp`;   // half-size: the 2D owl is ~110px tall
  function setPose(p) {
    if (owl.dataset.pose === p) return;
    owl.dataset.pose = p;
    owlImg.src = poseSrc(p);
    owl.classList.remove('is-swapping'); void owl.offsetWidth; owl.classList.add('is-swapping');
  }
  // let the idle bob resume after the squash
  owl.addEventListener('animationend', e => { if (e.animationName === 'squash') owl.classList.remove('is-swapping'); });
  const smallScreen = matchMedia('(max-width: 640px)').matches;
  function say(text, ms = smallScreen ? 3000 : 4200) {
    clearTimeout(bubbleTimer);
    bubble.classList.remove('is-on');
    requestAnimationFrame(() => { bubble.textContent = text; bubble.classList.add('is-on'); owl.classList.add('has-bubble'); });
    bubbleTimer = setTimeout(() => { bubble.classList.remove('is-on'); owl.classList.remove('has-bubble'); }, ms);
  }

  // The owl is driven through an "actor": the 2D pose images below, or the 3D owl from
  // js/owl3d.js once it has loaded (same interface; it flies to a perch in each section).
  const actor2d = {
    kind: '2d',
    goTo(section) {
      const s = OWL[section];
      if (s) setPose(s.pose);
      return Promise.resolve(!!s);
    },
    react(what) {
      if (what === 'sleep') setPose('sleep');
      if (what === 'wake') owl.dataset.pose = '';
    },
    setVisible(show) { owl.classList.toggle('is-hidden', !show); },
  };
  let actor = actor2d;
  // Keep the interactive Maya avatar visible across the entire page, including the footer
  const owlVisible = () => menu.hidden;

  function enter(section) {
    current = section;
    if (sleeping) return;
    actor.setVisible(owlVisible());
    actor.goTo(section).then(arrived => {
      if (arrived && introDone && current === section && !sleeping && OWL[section]) say(OWL[section].line);
    });
  }

  const owlSpy = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) enter(e.target.dataset.owl); });
  }, { rootMargin: '-48% 0px -48% 0px' });
  $$('main [data-owl]').forEach(s => owlSpy.observe(s));
  
  let lastSection = 'contact', footerTimer = 0;
  new IntersectionObserver(([e]) => {
    clearTimeout(footerTimer);
    if (e.isIntersecting) {
      if (current !== 'footer') lastSection = current;
      enter('contact');
    }
  }, { threshold: 0.25 }).observe($('.footer'));

  const CLICK_POSES = ['hover', 'magnify', 'wave', 'crossed', 'peek'];
  function triggerAvatarClick() {
    if (sleeping) return;
    pokes++;
    // Cycle through exciting expressions on each click:
    const clickPose = CLICK_POSES[pokes % CLICK_POSES.length];
    setPose(clickPose);
    actor.react('poke');
    say(POKES[(pokes - 1) % POKES.length], 2400);

    // Revert back to the section's dedicated expression after 3 seconds
    clearTimeout(actor._revertTimer);
    actor._revertTimer = setTimeout(() => {
      if (!sleeping && OWL[current]) {
        setPose(OWL[current].pose);
      }
    }, 3000);
  }

  $('.owl__body', owl).addEventListener('click', triggerAvatarClick);
  onMenu = () => actor.setVisible(owlVisible(), { instant: true });
  $('#wa-cta').addEventListener('click', () => actor.react('cta'));

  // warm the cache for the other poses once the page is idle
  const idle = window.requestIdleCallback || (cb => setTimeout(cb, 1500));
  idle(() => Object.values(OWL).concat({ pose: 'sleep' }).forEach(({ pose }) => { const i = new Image(); i.src = poseSrc(pose); }));

  /* ---------- 3D owl (loaded lazily; the 2D owl stays as the fallback) ------- */
  // ?owl=2d or ?owl=3d overrides the checks below (handy for testing)
  function webgl2Ok(forced) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2', forced ? {} : { failIfMajorPerformanceCaveat: true });
      if (!gl) return false;
      if (forced) return true;
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return !/swiftshader|llvmpipe|software/i.test(gpu);
    } catch { return false; }
  }
  function want3D() {
    const force = new URLSearchParams(location.search).get('owl');
    if (force === '2d') return false;
    if (!(window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('importmap'))) return false;
    if (force === '3d') return webgl2Ok(true);
    if (reduced) return false;
    const c = navigator.connection;
    if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return false;
    if ((navigator.deviceMemory || 8) < 4 || (navigator.hardwareConcurrency || 8) < 4) return false;
    try { if (sessionStorage.getItem('dy-owl-2d')) return false; } catch { /* private mode */ }
    return webgl2Ok();
  }
  let loading3D = false;
  function load3D() {
    if (loading3D || actor.kind === '3d') return;
    loading3D = true;
    import(new URL('js/owl3d.js?v=9', document.baseURI).href)
      .then(m => m.createOwl3D({
        owl,
        // he flew out of the corner for a look around: sometimes he says something
        onIdle: () => { if (!sleeping && menu.hidden && Math.random() < 0.6) say(T.idle[idleLine++ % T.idle.length], 2600); },
        onFail: () => { actor = actor2d; loading3D = false; owl.dataset.pose = ''; enter(current); },
      }))
      .then(a => { actor = a; enter(current); })
      .catch(err => { console.warn('[owl3d] staying 2D:', err); loading3D = false; });
  }

  /* ---------- start ---------------------------------------------------------- */
  observeReveals();
  playIntro().then(() => {
    introDone = true;
    if (current !== 'footer' && OWL[current]) setTimeout(() => say(OWL[current].line), 300);
    // the 3D owl waits for the intro, the load event and an idle moment, so it never slows the hero
    if (want3D()) {
      const go = () => (window.requestIdleCallback ? requestIdleCallback(load3D, { timeout: 3000 }) : setTimeout(load3D, 1500));
      document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
    }
  });
})();
