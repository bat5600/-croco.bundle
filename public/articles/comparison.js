// public/articles/comparaison.js
(() => {
  // ===== Progress bar =====
  const progressBar = () => {
    const bar = document.getElementById("progressBar");
    if (!bar) return;

    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const scrolled = height > 0 ? (scrollTop / height) * 100 : 0;
    bar.style.width = scrolled + "%";
  };

  // ===== Toggle rows for a given table wrapper =====
  const toggleTable = (tableId) => {
    const table = document.getElementById(tableId);
    if (!table) return;

    const hiddenRows = table.querySelectorAll(".hidden-row");
    const btn = document.getElementById(`${tableId}-btn`);

    const isOpen = table.classList.toggle("is-open");

    hiddenRows.forEach((row) => {
      if (isOpen) {
        row.style.display = "table-row";
        row.classList.add("fade-in");
      } else {
        row.style.display = "none";
        row.classList.remove("fade-in");
      }
    });

    if (btn) {
      btn.setAttribute("aria-expanded", String(isOpen));
      btn.innerHTML = isOpen
        ? 'Voir moins <i class="fa-solid fa-chevron-up ml-2"></i>'
        : 'Voir plus de fonctionnalités <i class="fa-solid fa-chevron-down ml-2"></i>';
    }
  };

  // Expose globally for inline onclick="toggleTable(...)"
  window.toggleTable = toggleTable;

  // ===== Init =====
  document.addEventListener("DOMContentLoaded", () => {
    // Force all hidden rows to be hidden initially (safe)
    document.querySelectorAll(".hidden-row").forEach((row) => {
      row.style.display = "none";
    });

    progressBar();
    window.addEventListener("scroll", progressBar, { passive: true });
    window.addEventListener("resize", progressBar);
  });
})();
