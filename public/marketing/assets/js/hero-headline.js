(function () {
  "use strict";

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  }

  function startWhenIdle(fn) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(fn, { timeout: 1500 });
    } else {
      setTimeout(fn, 150);
    }
  }

  onReady(function () {
    startWhenIdle(function () {
      var root = document.querySelector("[data-rotator]");
      if (!root) return;

      var itemsWrap = root.querySelector(".cc-rotator__items");
      var fallback = root.querySelector(".cc-rotator__fallback");
      if (!itemsWrap || !fallback) return;

      var items = Array.prototype.slice.call(itemsWrap.querySelectorAll("span"))
        .map(function (s) { return (s.textContent || "").trim(); })
        .filter(Boolean);

      if (items.length < 2) return;

      var i = 0;

      // Crée le node affiché (remplace le fallback sans casser le layout)
      var display = document.createElement("span");
      display.className = "cc-highlight";
      display.textContent = items[i];
      fallback.innerHTML = "";
      fallback.appendChild(display);

      // Animations légères (opacity/translate)
      var OUT_MS = 350;
      var IN_MS = 350;
      var PERIOD = 2200; // plus rapide sans “clignoter”

      function next() {
        var nextIndex = (i + 1) % items.length;

        // sortie
        display.style.transition = "transform " + OUT_MS + "ms ease, opacity " + OUT_MS + "ms ease";
        display.style.opacity = "0";
        display.style.transform = "translateY(-30%)";

        setTimeout(function () {
          i = nextIndex;
          display.textContent = items[i];

          // entrée
          display.style.transition = "none";
          display.style.transform = "translateY(30%)";
          display.style.opacity = "0";

          // force reflow
          display.offsetHeight;

          display.style.transition = "transform " + IN_MS + "ms ease, opacity " + IN_MS + "ms ease";
          display.style.transform = "translateY(0)";
          display.style.opacity = "1";
        }, OUT_MS);
      }

      // première mise en forme stable
      display.style.opacity = "1";
      display.style.transform = "translateY(0)";

      setInterval(next, PERIOD);
    });
  });
})();
