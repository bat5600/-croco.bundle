(function () {
  // Prevent double-load
  if (window.__CROCO_TRACK_LOADED__) return;
  window.__CROCO_TRACK_LOADED__ = true;

  // Context
  const ctx = window.__CROCO_CTX__ || {};
  const debug = !!ctx.debug;

  // =========================
  // Config
  // =========================
  // Later you'll set a real endpoint, e.g. https://api.crococlick.com/track
  const TRACK_ENDPOINT = null; // set to string URL when ready

  const HEARTBEAT_SEC = 15;
  const ACTIVE_TIMEOUT_MS = 60 * 1000;
  const FLUSH_EVERY_SEC = 30;

  // Feature mapping (edit over time)
  const FEATURE_RULES = [
    { key: "dashboard",     match: [/\/dashboard/i] },
    { key: "conversations", match: [/\/conversations/i] },
    { key: "calendars",     match: [/\/calendar/i, /\/calendars/i] },
    { key: "contacts",      match: [/\/contacts/i] },
    { key: "pipelines",     match: [/\/opportunit/i, /\/pipelin/i] },
    { key: "workflows",     match: [/\/workflow/i, /\/automation/i] },
    { key: "emails",        match: [/\/emails?/i, /\/marketing/i] },
    { key: "funnels",       match: [/\/funnels?/i, /\/sites?/i, /\/websites?/i] },
    { key: "forms",         match: [/\/forms?/i, /\/form-builder/i] },
    { key: "surveys",       match: [/\/surveys?/i, /\/quizzes?/i] },
    { key: "payments",      match: [/\/payments/i, /\/invoices/i] },
    { key: "integrations",  match: [/\/integrations?/i] },
    { key: "settings",      match: [/\/settings/i] }
  ];

  // =========================
  // Helpers
  // =========================
  const now = () => Date.now();

  function log(...args) {
    if (debug) console.log("[CROCO-TRACK]", ...args);
  }

  function getFeatureKey(url) {
    for (const rule of FEATURE_RULES) {
      if (rule.match.some(rx => rx.test(url))) return rule.key;
    }
    return "other";
  }

  function hash32(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  // =========================
  // Session + State
  // =========================
  const session_id = (() => {
    const k = "__CROCO_SESSION_ID__";
    const existing = sessionStorage.getItem(k);
    if (existing) return existing;
    const sid = "sess_" + now().toString(36) + "_" + Math.random().toString(16).slice(2);
    sessionStorage.setItem(k, sid);
    return sid;
  })();

  let lastInteractionAt = now();
  let currentUrl = location.href;
  let currentFeature = getFeatureKey(currentUrl);

  // =========================
  // Local queue
  // =========================
  const LS_KEY = "__CROCO_TRACK_QUEUE_V1__";
  let queue = [];
  try {
    queue = JSON.parse(localStorage.getItem(LS_KEY) || "[]") || [];
  } catch { queue = []; }

  function persistQueue() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(queue.slice(-500))); } catch {}
  }

  function enqueue(evt) {
    queue.push(evt);
    persistQueue();
    log("enqueue", evt.type, evt.feature_key, evt.duration_sec || 0);
  }

  function buildEvent(type, payload) {
    const ts = now();
    const ts_bucket = Math.floor(ts / 1000);

    const base = {
      v: 1,
      type,
      ts,
      ts_bucket,
      session_id,
      url: location.href,
      feature_key: payload.feature_key || null,
      duration_sec: payload.duration_sec || 0,

      // identity (keep minimal)
      user_id: ctx.userId || null,
      email: ctx.email || null,
      name: ctx.name || null,
      created_at_sec: ctx.createdAtSec || 0,

      // optional meta
      meta: payload.meta || {}
    };

    base.dedupe_key = "d_" + hash32([
      type, base.user_id || "", session_id, base.feature_key || "", ts_bucket, base.duration_sec
    ].join("|"));

    return base;
  }

  // =========================
  // Activity gating
  // =========================
  function markInteraction() { lastInteractionAt = now(); }
  ["click","keydown","mousemove","scroll","touchstart"].forEach(ev =>
    window.addEventListener(ev, markInteraction, { passive: true })
  );

  function isActive() {
    const visible = document.visibilityState === "visible";
    const recent = (now() - lastInteractionAt) <= ACTIVE_TIMEOUT_MS;
    return visible && recent;
  }

  // =========================
  // Route tracking (SPA)
  // =========================
  function onRouteChange() {
    const newUrl = location.href;
    if (newUrl === currentUrl) return;
    currentUrl = newUrl;
    currentFeature = getFeatureKey(newUrl);
    enqueue(buildEvent("feature_view", { feature_key: currentFeature }));
  }

  const _pushState = history.pushState;
  const _replaceState = history.replaceState;
  history.pushState = function () { _pushState.apply(this, arguments); onRouteChange(); };
  history.replaceState = function () { _replaceState.apply(this, arguments); onRouteChange(); };
  window.addEventListener("popstate", onRouteChange);

  // =========================
  // Heartbeat
  // =========================
  setInterval(() => {
    if (!isActive()) return;
    enqueue(buildEvent("heartbeat", { feature_key: currentFeature, duration_sec: HEARTBEAT_SEC }));
  }, HEARTBEAT_SEC * 1000);

  // Initial events
  enqueue(buildEvent("session_start", { feature_key: currentFeature }));
  enqueue(buildEvent("feature_view", { feature_key: currentFeature }));

  // =========================
  // Flush (later: to your endpoint)
  // =========================
  async function flush() {
    if (!TRACK_ENDPOINT) return; // MVP: no network yet
    if (!queue.length) return;

    const batch = queue.slice(0, 100);
    const payload = { sent_at: now(), events: batch };

    try {
      const res = await fetch(TRACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (!res.ok) throw new Error("bad_status_" + res.status);

      queue = queue.slice(batch.length);
      persistQueue();
      log("flush ok", batch.length);
    } catch (e) {
      log("flush fail", String(e && e.message || e));
    }
  }

  setInterval(flush, FLUSH_EVERY_SEC * 1000);

  window.addEventListener("beforeunload", function () {
    enqueue(buildEvent("session_end", { feature_key: currentFeature }));
    persistQueue();
  });

  log("loaded", { userId: ctx.userId, email: ctx.email, session_id });
})();
