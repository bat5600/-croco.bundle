/* croco.bundle.js
 * Flags: window.__CROCO_BUNDLE_RUNNING__, window.__CROCO_GLOBAL__, window.__CROCO_SPA__
 * Cache bust: append ?v=YYYYMMDD (or similar) to /croco.bundle.js URL when needed.
 */
(() => {
  "use strict";

  // ============================================================
  // BOOT / CTX
  // ============================================================
  if (window.__CROCO_BUNDLE_RUNNING__) return;
  window.__CROCO_BUNDLE_RUNNING__ = true;

  const ctx = (window.__CROCO_CTX__ ||= {
    email: "",
    name: "",
    userId: "",
    phone: "",
    createdAtSec: 0,
    locale: "fr",
    debug: false,
  });

  const log = (...a) => ctx.debug && console.log("[CROCO]", ...a);
  const warn = (...a) => console.warn("[CROCO]", ...a);
  const INIT_STATE = (window.__CROCO_INIT__ ||= {});

  // ============================================================
  // HELPERS
  // ============================================================
  const GLOBAL = (window.__CROCO_GLOBAL__ ||= { once: new Set(), scriptPromises: new Map() });

  function once(key, fn, tag = "core") {
    if (GLOBAL.once.has(key)) return;
    GLOBAL.once.add(key);
    try {
      return fn();
    } catch (e) {
      warn(`${tag} error:`, e);
    }
  }

  function loadScriptOnce(src, { id, async = true, defer = true } = {}) {
    const key = id || src;
    if (GLOBAL.scriptPromises.has(key)) return GLOBAL.scriptPromises.get(key);

    const absoluteSrc = new URL(src, location.href).href;
    const promise = new Promise((resolve, reject) => {
      const existingById = id ? document.getElementById(id) : null;
      if (existingById) return resolve(true);

      const existingBySrc = [...document.scripts].find((s) => {
        if (!s.src) return false;
        try {
          return new URL(s.src, location.href).href === absoluteSrc;
        } catch {
          return false;
        }
      });
      if (existingBySrc) return resolve(true);

      const s = document.createElement("script");
      if (id) s.id = id;
      s.src = absoluteSrc;
      s.async = async;
      s.defer = defer;
      s.onload = () => resolve(true);
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });

    GLOBAL.scriptPromises.set(key, promise);
    promise.catch(() => GLOBAL.scriptPromises.delete(key));
    return promise;
  }

  const SPA = (window.__CROCO_SPA__ ||= { listeners: new Set(), patched: false, lastHref: location.href, scheduled: false });
  function notifyRouteChange() {
    if (SPA.scheduled) return;
    SPA.scheduled = true;
    requestAnimationFrame(() => {
      SPA.scheduled = false;
      const href = location.href;
      if (href === SPA.lastHref) return;
      SPA.lastHref = href;
      SPA.listeners.forEach((fn) => {
        try {
          fn(href);
        } catch (e) {
          warn("route listener error:", e);
        }
      });
    });
  }
  function ensureSpaHooks() {
    if (SPA.patched) return;
    SPA.patched = true;
    ["pushState", "replaceState"].forEach((fn) => {
      const orig = history[fn];
      history[fn] = function () {
        const r = orig.apply(this, arguments);
        queueMicrotask(() => notifyRouteChange());
        return r;
      };
    });
    window.addEventListener("popstate", notifyRouteChange);
    window.addEventListener("hashchange", notifyRouteChange);
    window.addEventListener("load", notifyRouteChange);
  }
  function onRouteChange(fn) {
    SPA.listeners.add(fn);
    ensureSpaHooks();
  }

  function safeISOFromSec(sec) {
    const n = Number(sec || 0);
    if (!n) return new Date().toISOString();
    try {
      return new Date(n * 1000).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  // ============================================================
  // 1) FEATUREBASE (SDK + identify + UI widgets)
  // ============================================================
  const FEATUREBASE_ORG = "crococlick";
  const FEATUREBASE_APP_ID = "69102e66c7b42c0ae48fbfaa";

  // UI ids
  const CHANGELOG_BTN_ID = "croco-fb-changelog-btn";
  const CHAT_BTN_ID = "croco-chat-toggle";
  const BADGE_ID = "fb-update-badge-top";
  const STYLE_ID_FB = "croco-featurebase-style";

  // state (persist across reinjections)
  const FB_STATE = (window.__CROCO_FEATUREBASE__ ||= {
    launcherVisible: true,
    messengerBooted: false,
    changelogInitialized: false,
    surveyWidgetInitialized: false,
    changelogInitializing: false,
    surveyWidgetInitializing: false,
    observer: null,
    mountScheduled: false,
  });

  function ensureFeaturebaseQueueStub() {
    if (typeof window.Featurebase === "function") return;
    window.Featurebase = function () {
      (window.Featurebase.q = window.Featurebase.q || []).push(arguments);
    };
  }

  async function initFeaturebaseSDK() {
    if (FB_STATE.sdkPromise) return FB_STATE.sdkPromise;
    FB_STATE.sdkPromise = (async () => {
      try {
        ensureFeaturebaseQueueStub();
        await loadScriptOnce("https://do.featurebase.app/js/sdk.js", { id: "featurebase-sdk" });

        // identify (safe)
        window.Featurebase?.("identify", {
          organization: FEATUREBASE_ORG,
          email: ctx.email,
          name: ctx.name,
          userId: ctx.userId,
          phone: ctx.phone,
          locale: ctx.locale || "fr",
        });

        log("Featurebase SDK loaded + identify ok");
      } catch (e) {
        warn("Featurebase SDK load error:", e);
      }
    })();
    return FB_STATE.sdkPromise;
  }

  function injectFeaturebaseStyles() {
    if (document.getElementById(STYLE_ID_FB)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID_FB;
    style.textContent = `
      .croco-btn{
        width:36px;height:36px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-size:16px;line-height:1;
        margin-left:8px;cursor:pointer;border:0;outline:0;
        box-shadow:0 2px 6px rgba(0,0,0,.15);
        transition:transform .08s ease, box-shadow .2s ease, opacity .15s ease;
        position:relative;
      }
      .croco-btn:hover{
        transform:translateY(-1px);
        opacity:.95;
        box-shadow:0 0 12px rgba(34,197,94,.35);
      }
      .croco-btn svg{ width:18px;height:18px; fill:currentColor; }
      #${BADGE_ID}{
        position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;
        padding:0 5px;border-radius:9px;background:#ef4444;color:#fff;
        font-size:11px;line-height:18px;text-align:center;display:none;
      }
      #${CHAT_BTN_ID}{ margin-right:16px; }
      #${BADGE_ID}._show{ display:inline-block; }
    `;
    document.head.appendChild(style);
  }

  function getHeaderControls() {
    return (
      document.querySelector("header.hl_header .hl_header--controls") ||
      document.querySelector(".hl_header--controls")
    );
  }

  function bootMessenger() {
    if (FB_STATE.messengerBooted || !FB_STATE.launcherVisible) return;
    if (typeof window.Featurebase !== "function") return;

    try {
      window.Featurebase("boot", {
        appId: FEATUREBASE_APP_ID,
        email: ctx.email,
        userId: ctx.userId,
        createdAt: safeISOFromSec(ctx.createdAtSec),
        theme: "light",
        language: ctx.locale || "fr",
      });
      FB_STATE.messengerBooted = true;
    } catch (e) {
      warn("Featurebase boot error:", e);
    }
  }

  function initChangelog() {
    if (FB_STATE.changelogInitialized) return;
    if (typeof window.Featurebase !== "function") return;

    try {
      window.Featurebase(
        "init_changelog_widget",
        {
          organization: FEATUREBASE_ORG,
          dropdown: { enabled: true, placement: "right" },
          popup: {
            enabled: true,
            usersName: ctx.name || "Utilisateur",
            autoOpenForNewUpdates: true,
          },
          theme: "light",
          locale: ctx.locale || "fr",
        },
        (error, data) => {
          if (error) return;
          if (data?.action === "unreadChangelogsCountChanged") {
            const badge = document.getElementById(BADGE_ID);
            if (!badge) return;
            const n = Number(data.unreadCount || 0);
            badge.textContent = n > 0 ? (n > 99 ? "99+" : String(n)) : "";
            badge.classList.toggle("_show", n > 0);
          }
        }
      );
      FB_STATE.changelogInitialized = true;
    } catch (e) {
      warn("Featurebase changelog init error:", e);
    }
  }

  function initSurveyWidget() {
    if (FB_STATE.surveyWidgetInitialized || FB_STATE.surveyWidgetInitializing) return;
    if (typeof window.Featurebase !== "function") return;

    FB_STATE.surveyWidgetInitializing = true;

    try {
      window.Featurebase(
        "initialize_survey_widget",
        { organization: FEATUREBASE_ORG, placement: "bottom-right", theme: "light", email: ctx.email, locale: ctx.locale || "fr" },
        (err) => {
          FB_STATE.surveyWidgetInitializing = false;
          if (!err) FB_STATE.surveyWidgetInitialized = true;
        }
      );
    } catch (e) {
      FB_STATE.surveyWidgetInitializing = false;
      warn("Featurebase survey init error:", e);
    }
  }


  function addChangelogButton(controls) {
    if (document.getElementById(CHANGELOG_BTN_ID)) return;

    const btn = document.createElement("button");
    btn.id = CHANGELOG_BTN_ID;
    btn.className = "croco-btn";
    btn.style.background = "#22c55e";
    btn.setAttribute("data-featurebase-changelog", "");
    btn.title = "Nouveautés";
    btn.innerHTML = `
      <span id="${BADGE_ID}"></span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
      </svg>
    `;
    controls.appendChild(btn);
  }

  function addChatButton(controls) {
    if (document.getElementById(CHAT_BTN_ID)) return;

    const btn = document.createElement("button");
    btn.id = CHAT_BTN_ID;
    btn.className = "croco-btn";
    btn.style.background = "#b45309";
    btn.title = "Masquer le launcher";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 1C6.48 1 2 5.48 2 11v8c0 1.1.9 2 2 2h4v-6H5v-4c0-3.86 3.14-7 7-7s7 3.14 7 7v4h-3v6h4c1.1 0 2-.9 2-2v-8c0-5.52-4.48-10-10-10zm-1 18h2v2h-2z"/>
      </svg>
    `;

    btn.onclick = () => {
      if (FB_STATE.launcherVisible) {
        try {
          window.Featurebase?.("shutdown");
        } catch (_) {}

        FB_STATE.launcherVisible = false;
        FB_STATE.messengerBooted = false;

        // autoriser un vrai "re-init" après shutdown
        FB_STATE.changelogInitialized = false;
        FB_STATE.surveyWidgetInitialized = false;

        btn.title = "Afficher le launcher";
        btn.style.background = "#9ca3af";
      } else {
        FB_STATE.launcherVisible = true;

        bootMessenger();
        initChangelog();
        initSurveyWidget();

        btn.title = "Masquer le launcher";
        btn.style.background = "#b45309";
      }
    };

    controls.appendChild(btn);
  }

  // Mount (SPA safe + throttled)
  const scheduleFeaturebaseMount = () => {
    if (FB_STATE.mountScheduled) return;
    FB_STATE.mountScheduled = true;
    requestAnimationFrame(() => {
      FB_STATE.mountScheduled = false;

      injectFeaturebaseStyles();
      const controls = getHeaderControls();
      if (!controls) return;

      addChangelogButton(controls);
      addChatButton(controls);

      if (!FB_STATE.launcherVisible) return;

      bootMessenger();
      initChangelog();
      initSurveyWidget();
    });
  };

  function initFeaturebaseUI() {
    scheduleFeaturebaseMount();

    if (!FB_STATE.observer) {
      FB_STATE.observer = new MutationObserver(scheduleFeaturebaseMount);
      FB_STATE.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    onRouteChange(() => scheduleFeaturebaseMount());
  }

  // ============================================================
  // 2) LOCALIZE
  // ============================================================
  function ensureLocalizeStub() {
    if (window.Localize) return;
    window.Localize = {};
    [
      "translate",
      "untranslate",
      "phrase",
      "initialize",
      "translatePage",
      "setLanguage",
      "getLanguage",
      "getSourceLanguage",
      "detectLanguage",
      "getAvailableLanguages",
      "untranslatePage",
      "bootstrap",
      "prefetch",
      "on",
      "off",
      "hideWidget",
      "showWidget",
    ].forEach((fn) => {
      window.Localize[fn] = function () {};
    });
  }

  async function initLocalize() {
    if (INIT_STATE.localizePromise) return INIT_STATE.localizePromise;
    INIT_STATE.localizePromise = (async () => {
      try {
        ensureLocalizeStub();
        await loadScriptOnce("https://global.localizecdn.com/localize.js", { id: "localize-sdk" });

        window.Localize?.initialize?.({
          key: "d4s5PHXt6AYW1",
          rememberLanguage: true,
        });

        log("Localize initialized");
      } catch (e) {
        warn("Localize init error:", e);
      }
    })();
    return INIT_STATE.localizePromise;
  }

  // ============================================================
  // 3) PROFITWELL
  // ============================================================
  async function initProfitwell() {
    if (INIT_STATE.profitwellPromise) return INIT_STATE.profitwellPromise;

    INIT_STATE.profitwellPromise = (async () => {
      const AUTH = "7786303f0a2d4c8e3fd646711ca0c1b4";

      try {
        // 0) Anchor tag requis par ProfitWell Engagement (IMPORTANT)
        // Doit exister dans le DOM avec id=profitwell-js + data-pw-auth
        let anchor = document.getElementById("profitwell-js");
        if (!anchor) {
          anchor = document.createElement("script");
          anchor.id = "profitwell-js";
          document.head.appendChild(anchor);
        }
        anchor.setAttribute("data-pw-auth", AUTH);

        // 1) Stub officiel (queue)
        // (ta version est OK — on la garde simple)
        window.profitwell =
          window.profitwell ||
          function () {
            (window.profitwell.q = window.profitwell.q || []).push(arguments);
          };

        // 2) Charger la lib dans un tag DIFFERENT (sinon tu remplaces l’anchor)
        await loadScriptOnce(
          `https://public.profitwell.com/js/profitwell.js?auth=${encodeURIComponent(AUTH)}`,
          {
            id: "profitwell-lib", // <-- surtout PAS "profitwell-js"
            async: true,
            defer: false,
          }
        );

        // 3) Start quand on a une identité
        if (ctx?.email) {
          window.profitwell("start", { user_email: ctx.email });
          log("Profitwell started", ctx.email);
        } else if (ctx?.userId) {
          // option si tu préfères user_id (ex: Stripe customer id)
          // window.profitwell("start", { user_id: ctx.userId });
          log("Profitwell loaded but no email yet");
        } else {
          log("Profitwell loaded but no identity yet");
        }
      } catch (e) {
        warn("Profitwell init error:", e);
      }
    })();

    return INIT_STATE.profitwellPromise;
  }


  // ============================================================
  // 4) AMPLITUDE (core + replay + engagement)
  // ============================================================
  async function initAmplitude() {
    if (INIT_STATE.amplitudePromise) return INIT_STATE.amplitudePromise;
    INIT_STATE.amplitudePromise = (async () => {
      try {
        const API_KEY = "ad1137f2178733c908603358ed257639";

        const corePromise = loadScriptOnce(`https://cdn.amplitude.com/script/${API_KEY}.js`, { id: "amplitude-core" });
        const engagementPromise = loadScriptOnce(`https://cdn.amplitude.com/script/${API_KEY}.engagement.js`, {
          id: "amplitude-engagement",
        });

        await corePromise;

        // session replay plugin
        try {
          if (window.sessionReplay?.plugin && window.amplitude?.add) {
            window.amplitude.add(window.sessionReplay.plugin({ sampleRate: 1 }));
          }
        } catch (e) {
          warn("Amplitude sessionReplay plugin error:", e);
        }

        // init
        if (window.amplitude?.init) {
          window.amplitude.init(API_KEY, ctx.userId || undefined, {
            autocapture: true,
            fetchRemoteConfig: true,
          });
        }

        // identify
        try {
          if (window.amplitude?.Identify && window.amplitude?.identify) {
            const id = new window.amplitude.Identify();
            if (ctx.name) id.set("name", ctx.name);
            if (ctx.email) id.set("email", ctx.email);
            if (ctx.phone) id.set("phone", ctx.phone);
            id.setOnce("created_at", safeISOFromSec(ctx.createdAtSec));
            window.amplitude.identify(id);
          }
        } catch (e) {
          warn("Amplitude identify error:", e);
        }

        await engagementPromise;
        try {
          if (window.engagement?.plugin && window.amplitude?.add) {
            window.amplitude.add(window.engagement.plugin());
          }
        } catch (e) {
          warn("Amplitude engagement plugin error:", e);
        }

        log("Amplitude initialized");
      } catch (e) {
        warn("Amplitude init error:", e);
      }
    })();
    return INIT_STATE.amplitudePromise;
  }

  // ============================================================
  // 5) FUN FLAGS
  // ============================================================
  window.__CROCO_FUN__ = window.__CROCO_FUN__ || { licorne: false, matrix: false };

  // ============================================================
  // 6) LICORNE MODE
  // ============================================================
  (() => {
    "use strict";

    const MODE_CLASS = "croco-licorne";
    const OVERLAY_ID = "croco-licorne-overlay";
    const STYLE_ID = "croco-licorne-style";

    const SPARKLE_MIN_INTERVAL_MS = 16; // ~60fps max
    const SPARKLE_MAX_PER_SEC = 60;

    let enabled = false;
    let styleEl = null;
    let overlayEl = null;
    let flyerTimer = null;
    let sparkleHandler = null;

    let lastSparkleTs = 0;
    let sparkleCountWindowStart = 0;
    let sparkleCountInWindow = 0;

    const css = `
      body.${MODE_CLASS} {
        --cl-accent: #ff4dd2;
        --cl-rainbow: linear-gradient(90deg,#ff4dd2,#ffa94d,#ffff4d,#4dff88,#4dd2ff,#b84dff,#ff4dd2);
        background: linear-gradient(135deg, #ffe3ff 0%, #d9b4ff 25%, #b8ffe3 50%, #fff88a 75%, #ffb08a 100%);
        background-size: 200% 200%;
        animation: bgShift 16s linear infinite;
        color: #141414;
      }
      @keyframes bgShift {
        0% { background-position: 0% 0%; }
        100% { background-position: 100% 100%; }
      }
      body.${MODE_CLASS},
      body.${MODE_CLASS} * {
        font-family: 'Comic Sans MS', cursive !important;
        transition: all .25s ease;
        text-shadow: none !important;
      }
      body.${MODE_CLASS} h1,
      body.${MODE_CLASS} h2,
      body.${MODE_CLASS} h3,
      body.${MODE_CLASS} h4,
      body.${MODE_CLASS} h5,
      body.${MODE_CLASS} h6,
      body.${MODE_CLASS} button,
      body.${MODE_CLASS} .btn,
      body.${MODE_CLASS} [role="button"] {
        text-shadow: 1px 1px rgba(255,0,255,.45);
      }
      body.${MODE_CLASS} img { filter: none; }
      body.${MODE_CLASS} .cc-toolbar,
      body.${MODE_CLASS} header,
      body.${MODE_CLASS} .topbar,
      body.${MODE_CLASS} [class*="header"] {
        background-image: var(--cl-rainbow);
        background-size: 300% 100%;
        animation: cl-rainbow-shift 10s linear infinite;
        color: #141414 !important;
      }
      @keyframes cl-rainbow-shift { to { background-position: 300% 0; } }
      body.${MODE_CLASS} .card,
      body.${MODE_CLASS} .panel,
      body.${MODE_CLASS} [class*="card"],
      body.${MODE_CLASS} [class*="panel"] {
        border: 2px solid transparent !important;
        background-clip: padding-box, border-box;
        background-image: linear-gradient(#ffffffee,#ffffffee), var(--cl-rainbow);
        background-origin: border-box;
        box-shadow: 0 6px 16px rgba(255,77,210,.12);
      }
      body.${MODE_CLASS} button,
      body.${MODE_CLASS} .btn,
      body.${MODE_CLASS} [role="button"] {
        transform-origin: center;
        transition: transform .15s ease, box-shadow .15s ease;
      }
      body.${MODE_CLASS} button:hover,
      body.${MODE_CLASS} .btn:hover,
      body.${MODE_CLASS} [role="button"]:hover {
        transform: rotate(-1.2deg) scale(1.02);
        box-shadow: 0 6px 18px rgba(255,77,210,.18);
      }
      #${OVERLAY_ID} {
        position: fixed; inset: 0; pointer-events: none; z-index: 999999;
        overflow: hidden;
      }
      .cl-unicorn {
        position: absolute; top: 20%; left: -200px; font-size: 64px;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,.2));
        animation: cl-fly 8s linear forwards;
        will-change: transform;
      }
      @keyframes cl-fly {
        0%   { transform: translateX(0) rotate(0deg); }
        100% { transform: translateX(calc(100vw + 400px)) rotate(3deg); }
      }
      .cl-sparkle {
        position: absolute; width: 10px; height: 10px; border-radius: 50%;
        background: radial-gradient(circle, #fff, var(--cl-accent));
        opacity: .9; transform: translate(-50%, -50%);
        animation: cl-spark 600ms ease-out forwards;
        will-change: transform, opacity;
      }
      @keyframes cl-spark {
        0%   { opacity: .9; transform: translate(-50%,-50%) scale(1); }
        100% { opacity: 0;  transform: translate(-50%,-120%) scale(0.2); }
      }
      .cl-emoji {
        position: absolute; top: -40px; font-size: 28px;
        animation: cl-fall 2.5s linear forwards;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,.18));
        will-change: transform;
      }
      @keyframes cl-fall { to { transform: translateY(120vh) rotate(360deg); opacity: .9; } }
      .cl-badge {
        position: fixed; right: 10px; top: 10px;
        background: #111; color:#fff; font: 12px/1.2 system-ui, sans-serif;
        padding: 6px 10px; border-radius: 999px; opacity: .9;
        pointer-events: auto; cursor: pointer; z-index: 1000000;
      }
      body.${MODE_CLASS} .cl-badge{ display:block; }
      body:not(.${MODE_CLASS}) .cl-badge{ display:none; }
      .cl-marquee {
        position: fixed; bottom: 0; left: 0; width: 100%;
        white-space: nowrap;
        background: linear-gradient(90deg, #ffffffaa, #ffffffdd);
        font-size: 2rem;
        padding: 4px 0;
        animation: cl-marquee-move 22s linear infinite;
        z-index: 1000001;
        pointer-events: none;
        will-change: transform;
      }
      @keyframes cl-marquee-move {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @media (prefers-reduced-motion: reduce) {
        body.${MODE_CLASS} { animation: none; }
        .cl-unicorn, .cl-emoji, .cl-marquee { animation: none !important; }
      }
    `;

    function injectCSS() {
      if (styleEl) return;
      styleEl = document.getElementById(STYLE_ID);
      if (styleEl) return;
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }

    function ensureOverlay() {
      overlayEl = document.getElementById(OVERLAY_ID);
      if (!overlayEl) {
        overlayEl = document.createElement("div");
        overlayEl.id = OVERLAY_ID;
        document.body.appendChild(overlayEl);
      }
    }

    function flyUnicorn() {
      if (!enabled) return;
      ensureOverlay();
      const u = document.createElement("div");
      u.className = "cl-unicorn";
      u.textContent = Math.random() > 0.5 ? "🦄" : "🐊";
      u.style.top = Math.floor(10 + Math.random() * 70) + "vh";
      overlayEl.appendChild(u);
      setTimeout(() => u.remove(), 8500);
    }

    function emojiBurst() {
      if (!enabled) return;
      ensureOverlay();
      const emojis = ["🦄", "🐊", "✨", "🌈", "💎", "🔥"];
      for (let i = 0; i < 28; i++) {
        const e = document.createElement("div");
        e.className = "cl-emoji";
        e.textContent = emojis[(Math.random() * emojis.length) | 0];
        e.style.left = ((Math.random() * 100) | 0) + "vw";
        e.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
        overlayEl.appendChild(e);
        setTimeout(() => e.remove(), 2800);
      }
    }

    function addBadge() {
      let badge = document.querySelector(".cl-badge");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "cl-badge";
        badge.textContent = "WTF: click = 🌈";
        badge.addEventListener("click", emojiBurst);
        document.body.appendChild(badge);
      }
    }

    function addMarquee() {
      let marquee = document.querySelector(".cl-marquee");
      if (!marquee) {
        marquee = document.createElement("div");
        marquee.className = "cl-marquee";
        marquee.textContent = "🦄 🐊 ".repeat(30);
        document.body.appendChild(marquee);
      }
    }

    function removeMarquee() {
      const m = document.querySelector(".cl-marquee");
      if (m) m.remove();
    }

    function startSparkles() {
      stopSparkles();
      sparkleCountWindowStart = performance.now();
      sparkleCountInWindow = 0;

      sparkleHandler = (ev) => {
        if (!enabled) return;

        const now = performance.now();

        if (now - sparkleCountWindowStart >= 1000) {
          sparkleCountWindowStart = now;
          sparkleCountInWindow = 0;
        }
        if (sparkleCountInWindow >= SPARKLE_MAX_PER_SEC) return;

        if (now - lastSparkleTs < SPARKLE_MIN_INTERVAL_MS) return;
        lastSparkleTs = now;
        sparkleCountInWindow++;

        ensureOverlay();
        const s = document.createElement("div");
        s.className = "cl-sparkle";
        s.style.left = ev.clientX + "px";
        s.style.top = ev.clientY + "px";
        overlayEl.appendChild(s);
        setTimeout(() => s.remove(), 700);
      };

      window.addEventListener("mousemove", sparkleHandler, { passive: true });
    }

    function stopSparkles() {
      if (sparkleHandler) {
        window.removeEventListener("mousemove", sparkleHandler);
        sparkleHandler = null;
      }
    }

    function enable() {
      // coupe Matrix si actif
      window.__CROCO_MATRIX_DISABLE__?.();
      window.__CROCO_FUN__.licorne = true;

      injectCSS();
      enabled = true;
      document.body.classList.add(MODE_CLASS);

      ensureOverlay();
      startSparkles();
      addBadge();
      addMarquee();

      flyUnicorn();
      clearInterval(flyerTimer);
      flyerTimer = setInterval(flyUnicorn, 8000);
    }

    function disable() {
      enabled = false;
      document.body.classList.remove(MODE_CLASS);

      stopSparkles();
      clearInterval(flyerTimer);
      flyerTimer = null;

      removeMarquee();

      const o = document.getElementById(OVERLAY_ID);
      if (o) o.innerHTML = "";
      window.__CROCO_FUN__.licorne = false;
    }

    function isToggleU(e) {
      return (e.altKey && e.code === "KeyU") || (e.ctrlKey && e.altKey && e.code === "KeyU");
    }
    function isBurstU(e) {
      return e.altKey && e.shiftKey && e.code === "KeyU";
    }

    window.addEventListener("keydown", (e) => {
      if (isToggleU(e)) {
        e.preventDefault();
        enabled ? disable() : enable();
      }
      if (isBurstU(e)) {
        e.preventDefault();
        if (enabled) emojiBurst();
      }
    });

    window.__CROCO_LICORNE_DISABLE__ = disable;
  })();

  // ============================================================
  // 7) MATRIX MODE
  // ============================================================
  (() => {
    "use strict";

    const MODE_CLASS = "matrix-mode";
    const STYLE_ID = "matrix-mode-style";
    const CANVAS_ID = "matrix-rain-canvas";

    let enabled = false;
    let paused = false;

    let styleEl = null;
    let canvas = null;
    let ctx2d = null;
    let animId = null;

    let columns = 0;
    let drops = [];
    let fontSize = 16;

    const css = `
      body.${MODE_CLASS} {
        --m-green: #00ff7f;
        background: #000 !important;
        color: var(--m-green) !important;
      }
      body.${MODE_CLASS}, body.${MODE_CLASS} * {
        color: var(--m-green) !important;
        caret-color: var(--m-green) !important;
        text-shadow: 0 0 6px rgba(0,255,127,.6);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        border-color: rgba(0,255,127,.5) !important;
      }
      body.${MODE_CLASS} a { text-decoration-color: rgba(0,255,127,.6) !important; }
      body.${MODE_CLASS} button,
      body.${MODE_CLASS} .btn,
      body.${MODE_CLASS} [role="button"] {
        background: rgba(0,255,127,.08) !important;
        box-shadow: 0 0 12px rgba(0,255,127,.25) !important;
      }
      body.${MODE_CLASS} input,
      body.${MODE_CLASS} textarea,
      body.${MODE_CLASS} select {
        background: rgba(0,0,0,.6) !important;
      }
      body.${MODE_CLASS} img { filter: grayscale(1) brightness(.8) contrast(1.1) hue-rotate(90deg); }

      body.${MODE_CLASS} ::-webkit-scrollbar { width: 10px; height: 10px; }
      body.${MODE_CLASS} ::-webkit-scrollbar-thumb { background: rgba(0,255,127,.4); border-radius: 8px; }
      body.${MODE_CLASS} ::-webkit-scrollbar-track { background: rgba(255,255,255,.05); }

      #${CANVAS_ID} {
        position: fixed; inset: 0; pointer-events: none; z-index: 999998;
        opacity: .9;
      }

      @media (prefers-reduced-motion: reduce) {
        #${CANVAS_ID} { display: none !important; }
      }
    `;

    function injectCSS() {
      if (styleEl) return;
      styleEl = document.getElementById(STYLE_ID);
      if (styleEl) return;
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }

    function setupCanvas() {
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = CANVAS_ID;
        document.body.appendChild(canvas);
        ctx2d = canvas.getContext("2d");
        window.addEventListener("resize", resizeCanvas, { passive: true });
      }
      resizeCanvas();
    }

    function resizeCanvas() {
      if (!canvas || !ctx2d) return;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);

      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      fontSize = 16;
      columns = Math.ceil(window.innerWidth / fontSize);
      drops = new Array(columns).fill(0).map(() => (Math.random() * -50) | 0);
      ctx2d.font = `${fontSize}px monospace`;
    }

    const chars =
      "ｱｲｳｴｵｶｷｸｹｺﾅﾆﾇﾈﾉﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛ01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+-/<=>?@[]{}";

    function step() {
      if (!enabled) return;
      if (paused) {
        animId = requestAnimationFrame(step);
        return;
      }

      ctx2d.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx2d.fillRect(0, 0, window.innerWidth, window.innerHeight);

      ctx2d.fillStyle = "#00ff7f";
      for (let i = 0; i < columns; i++) {
        const text = chars[(Math.random() * chars.length) | 0];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx2d.fillText(text, x, y);

        if (y > window.innerHeight && Math.random() > 0.975) {
          drops[i] = 0 - ((Math.random() * 30) | 0);
        }
        drops[i]++;
      }

      animId = requestAnimationFrame(step);
    }

    function startRain() {
      setupCanvas();
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(step);
    }

    function stopRain() {
      cancelAnimationFrame(animId);
      animId = null;

      window.removeEventListener("resize", resizeCanvas);

      if (canvas) canvas.remove();
      canvas = null;
      ctx2d = null;
    }

    function enable() {
      // coupe Licorne si actif
      document.body.classList.remove("croco-licorne");
      const unicornOverlay = document.getElementById("croco-licorne-overlay");
      if (unicornOverlay) unicornOverlay.innerHTML = "";

      window.__CROCO_LICORNE_DISABLE__?.();
      window.__CROCO_FUN__.matrix = true;

      injectCSS();
      enabled = true;
      paused = false;
      document.body.classList.add(MODE_CLASS);
      startRain();
    }

    function disable() {
      enabled = false;
      paused = false;
      document.body.classList.remove(MODE_CLASS);
      stopRain();
      window.__CROCO_FUN__.matrix = false;
    }

    function isToggleM(e) {
      return (e.altKey && e.code === "KeyM") || (e.ctrlKey && e.altKey && e.code === "KeyM");
    }
    function isPauseM(e) {
      return e.altKey && e.shiftKey && e.code === "KeyM";
    }

    window.addEventListener("keydown", (e) => {
      if (isToggleM(e)) {
        e.preventDefault();
        enabled ? disable() : enable();
      }
      if (isPauseM(e)) {
        e.preventDefault();
        if (enabled) paused = !paused;
      }
    });

    window.__CROCO_MATRIX_DISABLE__ = disable;
  })();

  // ============================================================
  // 8) CROCO DOM PATCHER (PROD)
  // ============================================================
  (() => {
    "use strict";

    const CFG = {
      divider: {
        selector: 'a[href*="/reporting/reports"]#sb_reporting',
        barAttr: "data-croc-divider",
        barValue: "1",
      },
      supportButton: {
        oldLink: "https://help.gohighlevel.com/support/solutions/articles/155000005110",
        newLink:
          "https://help.crococlick.com/fr/help/articles/7202957-comment-envoyer-automatiquement-un-certificat-apres-la-reussite-dun-quiz",
        selector: (oldLink) => `button[onclick*="${oldLink}"]`,
        patchedAttr: "data-croco-patched",
        patchedValue: "certif-1",
      },
      ghlArticleRedirect: {
        id: "155000001627",
        url:
          "https://help.crococlick.com/fr/help/articles/8716087-comment-integrer-du-contenu-externe-sur-un-dashboard-crococlick",
        patchedAttr: "data-croco-patched",
        patchedValue: "ghl-155000001627",
      },
      helpMap: {
        domains: ["help.leadconnectorhq.com", "help.gohighlevel.com"],
        map: {
          "155000005357":
            "https://help.crococlick.com/fr/help/articles/5480701-comprendre-longlet-domaines-dans-crococlick",
          "155000005273":
            "https://help.crococlick.com/fr/help/articles/10075044-installer-et-connecter-un-domaine-ou-sous-domaine-web-sur",
          "155000006954": "https://help.crococlick.com/fr/help/articles/6259683",
          "155000001627": "https://help.crococlick.com/fr/articles/8716087",
          "155000005651":
            "https://help.crococlick.com/fr/help/articles/7866984-implementer-des-url-imbriquees-pour-vos-pages-de-funnels-et",
          "48001225442":
            "https://help.crococlick.com/fr/articles/10153050-tout-savoir-sur-la-tarification-crococlick-abonnements-credits-et-options",
          "155000007189": "https://help.crococlick.com/fr/help/articles/7881513",
        },
        forceTargetBlank: true,
        patchedAttr: "data-croco-patched",
        patchedValuePrefix: "helpmap-",
      },
      analyticsReplace: {
        routeIncludes: "/analytics",
        selector: ".hl-text-md-normal",
        fromExact: "dans",
        to: "Opt-in",
      },
      youtube: {
        ytId: "Qg1hI_hhWY0",
        redirectUrl:
          "https://help.crococlick.com/fr/articles/10075044-installer-et-connecter-un-domaine-ou-sous-domaine-web-sur",
        patchedAttr: "data-croco-patched",
        patchedValuePrefix: "yt-",
      },
      loader: {
        selector: ".hl-loader-info",
        color: "#065f24",
      },
      clientPortal: {
        routeIncludes: "funnels-websites",
        selector: "#tb_clientportal",
        hideStyle: "display:none !important;",
      },
      perf: {
        useRafThrottle: true,
        dividerRetry: { enabled: true, intervalMs: 250, maxTries: 30 },
      },
    };

    const CROCO = (window.__CROCO_PATCHER__ ||= {
      lastHref: location.href,
      scheduled: false,
      observer: null,
      dividerRetryTimer: null,
      dividerRetryTries: 0,
    });

    function schedule(fn) {
      if (!CFG.perf.useRafThrottle) {
        try {
          fn();
        } catch (_) {}
        return;
      }
      if (CROCO.scheduled) return;
      CROCO.scheduled = true;
      requestAnimationFrame(() => {
        CROCO.scheduled = false;
        try {
          fn();
        } catch (_) {}
      });
    }

    function routeIncludes(part) {
      return String(location.href || "").includes(part);
    }

    function mark(el, attr, value) {
      el.setAttribute(attr, value);
    }
    function isMarked(el, attr, value) {
      return el.getAttribute(attr) === value;
    }

    function patchDivider() {
      const link = document.querySelector(CFG.divider.selector);
      if (!link || !link.parentElement) return false;

      const barSelector = `div[${CFG.divider.barAttr}="${CFG.divider.barValue}"]`;
      let bar = document.querySelector(barSelector);

      if (!bar) {
        bar = document.createElement("div");
        bar.setAttribute(CFG.divider.barAttr, CFG.divider.barValue);
        bar.style.height = "1px";
        bar.style.background = "rgba(0,0,0,.12)";
        bar.style.margin = "16px 0";
        bar.style.marginLeft = "16px";
        bar.style.marginRight = "16px";
      }

      if (bar.parentElement !== link.parentElement || bar.previousElementSibling !== link) {
        link.parentElement.insertBefore(bar, link.nextElementSibling);
      }

      return true;
    }

    function patchSupportButtons(root = document) {
      const s = CFG.supportButton.selector(CFG.supportButton.oldLink);
      const buttons = root.querySelectorAll(s);

      buttons.forEach((btn) => {
        if (isMarked(btn, CFG.supportButton.patchedAttr, CFG.supportButton.patchedValue)) return;

        btn.removeAttribute("onclick");

        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          window.open(CFG.supportButton.newLink, "_blank");
        });

        mark(btn, CFG.supportButton.patchedAttr, CFG.supportButton.patchedValue);
      });

      const links = root.querySelectorAll(`a[href*="${CFG.supportButton.oldLink}"]`);
      links.forEach((a) => {
        if (isMarked(a, CFG.supportButton.patchedAttr, CFG.supportButton.patchedValue)) return;

        a.href = CFG.supportButton.newLink;
        a.target = "_blank";

        mark(a, CFG.supportButton.patchedAttr, CFG.supportButton.patchedValue);
      });
    }

    function patchSpecificGhlArticleAnchors(root = document) {
      const rx = new RegExp("solutions/articles/" + CFG.ghlArticleRedirect.id);
      const anchors = root.querySelectorAll('a[href*="solutions/articles/"]');
      anchors.forEach((a) => {
        if (isMarked(a, CFG.ghlArticleRedirect.patchedAttr, CFG.ghlArticleRedirect.patchedValue)) return;
        const href = a.href || "";
        if (rx.test(href)) {
          a.href = CFG.ghlArticleRedirect.url;
          a.target = "_blank";
          mark(a, CFG.ghlArticleRedirect.patchedAttr, CFG.ghlArticleRedirect.patchedValue);
        }
      });
    }

    function patchHelpMappedLinks(root = document) {
      const anchors = root.querySelectorAll('a[href*="help.leadconnectorhq.com"],a[href*="help.gohighlevel.com"]');
      anchors.forEach((a) => {
        const href = a.href || "";
        if (!href) return;

        const already = a.getAttribute(CFG.helpMap.patchedAttr) || "";
        if (already.startsWith(CFG.helpMap.patchedValuePrefix)) return;

        const m = href.match(/solutions\/articles\/(\d+)/);
        if (!m) return;

        const articleId = m[1];
        const mapped = CFG.helpMap.map[articleId];
        if (!mapped) return;

        a.href = mapped;
        if (CFG.helpMap.forceTargetBlank) a.target = "_blank";
        mark(a, CFG.helpMap.patchedAttr, CFG.helpMap.patchedValuePrefix + articleId);
      });
    }

    function patchYoutubeLinks(root = document) {
      const anchors = root.querySelectorAll('a[href*="youtube.com/watch"], a[href*="youtu.be/"]');
      anchors.forEach((a) => {
        const already = a.getAttribute(CFG.youtube.patchedAttr) || "";
        const markVal = CFG.youtube.patchedValuePrefix + CFG.youtube.ytId;
        if (already === markVal) return;

        const href = a.href || "";
        if (!href.includes(CFG.youtube.ytId)) return;

        a.href = CFG.youtube.redirectUrl;
        a.target = "_blank";
        mark(a, CFG.youtube.patchedAttr, markVal);
      });
    }

    function patchAnalyticsText(root = document) {
      if (!routeIncludes(CFG.analyticsReplace.routeIncludes)) return;
      root.querySelectorAll(CFG.analyticsReplace.selector).forEach((el) => {
        if ((el.textContent || "").trim() === CFG.analyticsReplace.fromExact) {
          el.textContent = CFG.analyticsReplace.to;
        }
      });
    }

    function patchLoaderColor(root = document) {
      root.querySelectorAll(CFG.loader.selector).forEach((el) => {
        el.style.setProperty("color", CFG.loader.color, "important");
      });
    }

    function patchClientPortal() {
      if (!routeIncludes(CFG.clientPortal.routeIncludes)) return;
      const el = document.querySelector(CFG.clientPortal.selector);
      if (el) el.style.cssText += ";" + CFG.clientPortal.hideStyle;
    }

    function installRedirectorsOnce() {
      once("patcher:redirectors", () => {
        const ytId = CFG.youtube.ytId;

        const origOpen = window.open;
        window.open = function (url, target, features) {
          try {
            if (typeof url === "string" && url.includes(ytId)) {
              url = CFG.youtube.redirectUrl;
            }
            if (typeof url === "string" && url.includes("solutions/articles/" + CFG.ghlArticleRedirect.id)) {
              url = CFG.ghlArticleRedirect.url;
            }
          } catch (_) {}
          return origOpen.call(window, url, target, features);
        };
      });
    }

    function applyAll() {
      patchSupportButtons(document);
      patchSpecificGhlArticleAnchors(document);
      patchHelpMappedLinks(document);
      patchYoutubeLinks(document);
      patchAnalyticsText(document);
      patchLoaderColor(document);
      patchClientPortal();

      const ok = patchDivider();
      if (!ok) startDividerRetry();
      else stopDividerRetry();
    }

    function startDividerRetry() {
      if (!CFG.perf.dividerRetry.enabled) return;
      if (CROCO.dividerRetryTimer) return;

      CROCO.dividerRetryTries = 0;
      CROCO.dividerRetryTimer = setInterval(() => {
        CROCO.dividerRetryTries++;
        const ok = patchDivider();
        if (ok || CROCO.dividerRetryTries >= CFG.perf.dividerRetry.maxTries) {
          stopDividerRetry();
        }
      }, CFG.perf.dividerRetry.intervalMs);
    }

    function stopDividerRetry() {
      if (CROCO.dividerRetryTimer) {
        clearInterval(CROCO.dividerRetryTimer);
        CROCO.dividerRetryTimer = null;
      }
    }

    function boot() {
      installRedirectorsOnce();
      schedule(applyAll);

      once("patcher:observer", () => {
        CROCO.observer = new MutationObserver(() => schedule(applyAll));
        CROCO.observer.observe(document.documentElement, { childList: true, subtree: true });
      });

      onRouteChange(() => {
        if (CROCO.lastHref !== location.href) {
          CROCO.lastHref = location.href;
          schedule(applyAll);
        }
      });

      window.addEventListener("load", () => schedule(applyAll));
    }

    boot();
  })();

  // ============================================================
  // 9) FAVICON
  // ============================================================
  (() => {
    "use strict";

    const FAVICON_URL =
      "https://storage.googleapis.com/msgsndr/0XeqHZvwfH59pwE9Y5ZY/media/652299259996f385301e1f33.png";
    const FAV = (window.__CROCO_FAVICON__ ||= { observer: null, scheduled: false });

    function setFavicon() {
      const head = document.head || document.getElementsByTagName("head")[0];
      if (!head) return;

      const links = head.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
      links.forEach((l) => l.remove());

      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.href = FAVICON_URL;
      head.appendChild(link);
    }

    setFavicon();

    const schedule = () => {
      if (FAV.scheduled) return;
      FAV.scheduled = true;
      requestAnimationFrame(() => {
        FAV.scheduled = false;
        setFavicon();
      });
    };

    if (!FAV.observer) {
      FAV.observer = new MutationObserver(schedule);
      FAV.observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }

    onRouteChange(() => schedule());
    window.addEventListener("load", schedule);
  })();

  // ============================================================
// 10) GOCROCO TRACKING (debounced + normalized, SPA-safe)
// ============================================================
(() => {
  "use strict";

  const ENDPOINT = "https://gocroco.vercel.app/api/track";

  const STATE = (window.__CROCO_GOCROCO__ ||= {
    lastSentRoute: "",
    lastSentTs: 0,
    pendingTimer: null,
    pendingRoute: "",
    pendingHref: "",
  });

  const MIN_DWELL_MS = 3000; // doit rester >= 3s sur la route
  const MIN_GAP_MS = 15000;  // max 1 event / 15s (même si URLs différentes)

  function normalizeRoute(href) {
    try {
      const u = new URL(href);
      const parts = u.pathname.split("/").filter(Boolean);
      const i = parts.indexOf("location");
      if (i === -1) return u.pathname;

      const locationId = parts[i + 1] || "";
      const feature = parts[i + 2] || "";
      return `/v2/location/${locationId}/${feature}`;
    } catch {
      return href;
    }
  }

  function sendNow(href, route) {
    if (!ctx?.email) return;

    const now = Date.now();

    // hard cap: pas plus d'1 event / 15s
    if (now - STATE.lastSentTs < MIN_GAP_MS) return;

    // pas de doublon de route logique
    if (route === STATE.lastSentRoute) return;

    STATE.lastSentRoute = route;
    STATE.lastSentTs = now;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        email: ctx.email,
        url: href,
        ts: now,
        // optionnel: utile pour debug (pas stocké si ta table events ne l'a pas)
        // route,
      }),
    }).catch(() => {});
  }

  function schedule(href) {
    const route = normalizeRoute(href);
    if (!route) return;

    // si déjà sur la même route logique, ignore
    if (route === STATE.lastSentRoute) return;

    // debounce: si l'utilisateur reclique, on annule et on replanifie
    if (STATE.pendingTimer) clearTimeout(STATE.pendingTimer);

    STATE.pendingRoute = route;
    STATE.pendingHref = href;

    STATE.pendingTimer = setTimeout(() => {
      sendNow(STATE.pendingHref, STATE.pendingRoute);
      STATE.pendingTimer = null;
    }, MIN_DWELL_MS);
  }

  // 1) premier hit (debounced)
  schedule(location.href);

  // 2) hit à chaque changement d’URL (debounced)
  onRouteChange((href) => schedule(href));
})();

  // ============================================================
  // 11) GOCROCO USAGE TRACKING (time + feature, batched)
  // ============================================================
  (() => {
    "use strict";

    if (!ctx?.email) return;

    const USAGE_ENDPOINT = "https://gocroco.vercel.app/api/usage/batch";
    const buckets = new Map();

    function extractLocationId(url) {
      const m = url.match(/\/location\/([a-zA-Z0-9_-]+)/);
      return m?.[1] ?? null;
    }

    function extractFeatureKey(url) {
      try {
        const u = new URL(url);
        const parts = u.pathname.split("/").filter(Boolean);
        const locIndex = parts.indexOf("location");
        if (locIndex === -1) return null;
        return parts[locIndex + 2] ?? null;
      } catch {
        return null;
      }
    }

    function dayKey() {
      return new Date().toISOString().slice(0, 10);
    }

    function tick() {
      const url = location.href;
      const location_id = extractLocationId(url);
      const feature_key = extractFeatureKey(url);
      if (!location_id || !feature_key) return;

      const key = `${ctx.email}|${location_id}|${feature_key}|${dayKey()}`;
      buckets.set(key, (buckets.get(key) || 0) + 15);
    }

    async function flush() {
      if (buckets.size === 0) return;

      const items = Array.from(buckets.entries()).map(([k, sec]) => {
        const [email, location_id, feature_key, day] = k.split("|");
        return { email, location_id, feature_key, day, sec };
      });

      buckets.clear();

      fetch(USAGE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ items }),
      }).catch(() => {});
    }

    // heartbeat + batching
    setInterval(tick, 15_000);
    setInterval(flush, 60_000);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });

    window.addEventListener("beforeunload", () => flush());

    // premier tick immédiat
    tick();
  })();


  // ============================================================
  // MAIN
  // ============================================================
  async function main() {
    log("bundle loaded", new Date().toISOString(), ctx);

    // 1) Featurebase: SDK + identify puis UI
    const featurebasePromise = initFeaturebaseSDK();

    // 2-4) Lancer en parallèle les SDK annexes
    const others = Promise.allSettled([initLocalize(), initProfitwell(), initAmplitude()]);

    await featurebasePromise;
    initFeaturebaseUI();
    await others;
  }

  main();
})();
