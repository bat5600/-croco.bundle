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
