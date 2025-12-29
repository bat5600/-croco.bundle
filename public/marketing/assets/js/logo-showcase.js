/*!
  CrocoClick — logo-showcase.js
  Objectif:
  - Drag horizontal + inertie sur un showcase de logos
  - Robust (idempotent): init 1 seule fois par container
  - Compatible GHL: pas d'events globaux permanents
  - Pointer Events: souris + tactile + stylet
  - Optionnel: injection CSS via window.CC_LOGO_SHOWCASE_CSS (si fourni par loader)
*/

(() => {
  "use strict";

  const DEFAULTS = {
    selector: ".slow",
    contentSelector: ".logo-showcase-content",
    trackSelector: ".logo-showcase-track",

    speed: 1.3,
    friction: 0.92,
    minVelocity: 0.1,
    moveThreshold: 3,
  };

  function ensureCssInjectedOnce() {
    // Le loader peut définir window.CC_LOGO_SHOWCASE_CSS pour injecter le CSS au moment utile
    const css = window.CC_LOGO_SHOWCASE_CSS;
    if (!css) return;

    if (document.getElementById("cc-logo-showcase-css")) return;
    const style = document.createElement("style");
    style.id = "cc-logo-showcase-css";
    style.textContent = String(css);
    document.head.appendChild(style);
  }

  function getTranslateX(el) {
    const t = getComputedStyle(el).transform;
    if (!t || t === "none") return 0;
    const m = new DOMMatrixReadOnly(t);
    return m.m41 || 0;
  }

  // Expose une init globale, appelée par ton loader (ou utilisable ailleurs)
  window.CC_LOGO_SHOWCASE_INIT = function init(containerOrSelector, options = {}) {
    ensureCssInjectedOnce();

    const opts = { ...DEFAULTS, ...options };

    let container =
      typeof containerOrSelector === "string"
        ? document.querySelector(containerOrSelector)
        : containerOrSelector;

    if (!container) return;
    if (container.dataset.ccLogoShowcaseInit === "1") return;
    container.dataset.ccLogoShowcaseInit = "1";

    const content = container.querySelector(opts.contentSelector);
    const track = container.querySelector(opts.trackSelector);
    if (!content || !track) return;

    let dragging = false;
    let moved = false;

    let startX = 0;
    let baseOffset = 0;
    let offsetX = 0;

    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;

    let rafId = 0;
    let pointerId = null;

    function applyOffset(x) {
      content.style.transform = `translateX(${x}px)`;
    }

    function stopMomentum() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function momentum() {
      if (Math.abs(velocity) < opts.minVelocity) {
        rafId = 0;
        return;
      }
      velocity *= opts.friction;
      offsetX += velocity;
      applyOffset(offsetX);
      rafId = requestAnimationFrame(momentum);
    }

    function preventClick(ev) {
      if (!moved) return;
      ev.stopPropagation();
      ev.preventDefault();
    }

    function onPointerDown(e) {
      if (dragging) return;

      // bouton principal souris seulement
      if (e.pointerType === "mouse" && e.button !== 0) return;

      dragging = true;
      moved = false;

      stopMomentum();

      pointerId = e.pointerId;

      try {
        container.setPointerCapture(pointerId);
      } catch (_) {}

      startX = e.pageX;
      baseOffset = getTranslateX(content);
      offsetX = baseOffset;

      lastX = startX;
      lastTime = performance.now();
      velocity = 0;

      container.classList.add("is-dragging");
      container.addEventListener("click", preventClick, true);

      // attach move/up uniquement pendant drag
      container.addEventListener("pointermove", onPointerMove, { passive: true });
      container.addEventListener("pointerup", onPointerUp, { passive: true });
      container.addEventListener("pointercancel", onPointerUp, { passive: true });
    }

    function onPointerMove(e) {
      if (!dragging) return;
      if (pointerId != null && e.pointerId !== pointerId) return;

      const x = e.pageX;
      const dx = x - startX;

      if (Math.abs(dx) > opts.moveThreshold) moved = true;

      offsetX = baseOffset + dx * opts.speed;
      applyOffset(offsetX);

      const now = performance.now();
      const dt = (now - lastTime) || 1;
      const deltaX = x - lastX;

      // normalisation vs 60fps
      velocity = (deltaX / dt) * 16;

      lastX = x;
      lastTime = now;
    }

    function onPointerUp(e) {
      if (!dragging) return;
      if (pointerId != null && e.pointerId !== pointerId) return;

      dragging = false;
      baseOffset = offsetX;

      container.classList.remove("is-dragging");

      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);

      setTimeout(() => container.removeEventListener("click", preventClick, true), 0);

      rafId = requestAnimationFrame(momentum);
      pointerId = null;
    }

    // Public API (au cas où tu veux un destroy plus tard)
    const api = {
      destroy() {
        stopMomentum();
        container.removeEventListener("pointerdown", onPointerDown);
        container.removeEventListener("pointermove", onPointerMove);
        container.removeEventListener("pointerup", onPointerUp);
        container.removeEventListener("pointercancel", onPointerUp);
        container.classList.remove("is-dragging");
        container.dataset.ccLogoShowcaseInit = "";
      }
    };

    // Attache initial
    container.addEventListener("pointerdown", onPointerDown, { passive: true });

    return api;
  };

  // Optionnel: auto-init si quelqu’un charge le fichier sans loader.
  // (Ça ne se lancera qu'une fois grâce au guard dataset)
  try {
    const el = document.querySelector(DEFAULTS.selector);
    if (el) window.CC_LOGO_SHOWCASE_INIT(el);
  } catch (_) {}
})();
