/* =========================
   CrocoClick Comparison – JS
========================= */

(function () {
  // Progress bar (scroll)
  const progressBar = document.getElementById("progressBar");

  function updateProgress() {
    if (!progressBar) return;
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop || 0;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = scrolled + "%";
  }

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("load", updateProgress);

  // Accordion tables
  window.toggleTable = function (tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const hiddenRows = table.querySelectorAll(".hidden-row");
    const btn = document.getElementById(tableId + "-btn");

    // On détecte si on est actuellement "fermé"
    const isCollapsed = hiddenRows.length > 0 && (hiddenRows[0].style.display !== "table-row");

    hiddenRows.forEach((row) => {
      if (isCollapsed) {
        row.style.display = "table-row";
        row.classList.add("fade-in");
      } else {
        row.style.display = "none";
        row.classList.remove("fade-in");
      }
    });

    if (btn) {
      if (isCollapsed) {
        btn.innerHTML = 'Voir moins <i class="fa-solid fa-chevron-up ml-2"></i>';
        btn.setAttribute("aria-expanded", "true");
      } else {
        btn.innerHTML = 'Voir plus de fonctionnalités <i class="fa-solid fa-chevron-down ml-2"></i>';
        btn.setAttribute("aria-expanded", "false");
      }
    }
  };
})();

/* ===== Sticky Sidebar (GHL safe) ===== */
(function () {
  const TOP = 128;
  let raf = null;

  function run() {
    const aside = document.getElementById("cc-aside");
    const inner = document.getElementById("cc-aside-inner");
    const article = document.getElementById("cc-article");
    if (!aside || !inner || !article) return;

    if (window.innerWidth < 1024) {
      inner.style.position = "";
      inner.style.top = "";
      inner.style.left = "";
      inner.style.width = "";
      inner.style.transform = "";
      return;
    }

    const articleRect = article.getBoundingClientRect();
    const asideRect = aside.getBoundingClientRect();

    const left = asideRect.left;
    const width = asideRect.width;

    const articleBottomY = articleRect.bottom + window.scrollY;
    const scrollY = window.scrollY;
    const fixedTopY = scrollY + TOP;
    const innerHeight = inner.offsetHeight;

    const stopY = articleBottomY - innerHeight;

    if (fixedTopY >= stopY) {
      inner.style.position = "absolute";
      inner.style.left = "";
      inner.style.width = width + "px";
      inner.style.top = (stopY - (asideRect.top + scrollY)) + "px";
      inner.style.transform = "";
    } else if (articleRect.top <= TOP) {
      inner.style.position = "fixed";
      inner.style.top = TOP + "px";
      inner.style.left = left + "px";
      inner.style.width = width + "px";
      inner.style.transform = "translateZ(0)";
    } else {
      inner.style.position = "";
      inner.style.top = "";
      inner.style.left = "";
      inner.style.width = "";
      inner.style.transform = "";
    }
  }

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      run();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", run);
  setTimeout(run, 250);
})();
