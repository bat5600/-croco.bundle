/*!
  CrocoClick — transparence.js (PROD)
  Objectif:
  - Zéro data inline (JSON budget + videos)
  - Zéro onclick inline (event delegation)
  - Charts Chart.js + Lucide
  - Playlist + player (mp4 / youtube / loom)
  - Spotlight bento
  - Robuste si certains éléments n’existent pas (HTML variants)

  Attendus côté HTML (ids):
  - budgetChart, devFocusChart
  - videoList, mainVideoThumb, mainVideoTitle, mainVideoDate
  - videoOverlay, videoPlayerWrapper
  Optionnel:
  - navbar (si tu l'as)
*/

(() => {
  "use strict";

  // =========================
  // CONFIG
  // =========================
  const CFG = {
    
    // Si tu host sur croco-bundle.vercel.app directement, remplace par:
    BUDGET_JSON_URL: "https://croco-bundle.vercel.app/marketing/data/budget.json",
    VIDEOS_JSON_URL: "https://croco-bundle.vercel.app/marketing/data/videos.json",

    DEFAULT_YEAR_LABEL: "2025",

    // Fallback durée si non fournie dans videos.json
    FALLBACK_DURATION: "14 min",

    // Chart styles (alignés sur ton design)
    BUDGET_CUTOUT: "82%",
    BUDGET_HOVER_OFFSET: 20,
    BUDGET_BORDER_RADIUS: 8,

    // Dev focus chart
    DEV_GRID_COLOR: "#f1f5f9",
    DEV_BORDER_COLOR: "#ffffff",
  };

  // =========================
  // SAFE DOM HELPERS
  // =========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function exists(el) {
    return !!el;
  }

  // =========================
  // STATE
  // =========================
  const state = {
    budget: null,
    videos: [],
    currentVideoIndex: 0,
    budgetChart: null,
    devChart: null,
  };

  // =========================
  // INIT
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    tryInitLucide();
    setupSpotlightBento();
    setupNavbarScroll();

    // Set Chart defaults once
    if (window.Chart) {
      Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
      Chart.defaults.color = "#64748b";
    }

    boot().catch((err) => {
      console.error("[transparence] boot error:", err);
    });
  });

  async function boot() {
    // Load data
    const [budget, videosPayload] = await Promise.all([
      fetchJSON(CFG.BUDGET_JSON_URL),
      fetchJSON(CFG.VIDEOS_JSON_URL),
    ]);

    state.budget = normalizeBudget(budget);
    state.videos = normalizeVideos(videosPayload);

    // Render charts
    renderBudgetChart(state.budget);
    renderDevFocusChart(); // peut rester "statique" si tu veux. Sinon JSON aussi.

    // Render playlist + bind
    renderVideoList(state.videos);
    bindVideoEvents();

    // Init main video UI
    setCurrentVideo(0, { updateActive: true, resetPlayer: true });
  }

  // =========================
  // FETCH JSON
  // =========================
  async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
    return res.json();
  }

  // =========================
  // NORMALIZERS
  // =========================
  function normalizeVideos(payload) {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    // Tri du plus récent au plus ancien si date ISO
    const sorted = items.slice().sort((a, b) => {
      const da = Date.parse(a?.date || "") || 0;
      const db = Date.parse(b?.date || "") || 0;
      return db - da;
    });

    return sorted.map((v, idx) => ({
      id: v.id ?? idx,
      title: String(v.title || "Untitled"),
      date: String(v.date || ""), // ISO conseillé
      display_date: String(v.display_date || ""),
      duration: String(v.duration || CFG.FALLBACK_DURATION),
      img: String(v.img || ""),
      type: String(v.type || "mp4"),
      url: String(v.url || ""),
      tag: v.tag ? String(v.tag) : "",
    }));
  }

  function normalizeBudget(payload) {
    const cats = Array.isArray(payload?.categories) ? payload.categories : [];
    const total = payload?.meta?.total ?? 100;

    return {
      updated_at: payload?.updated_at || "",
      chart: payload?.chart || {},
      total,
      categories: cats.map((c) => ({
        id: String(c.id || ""),
        label: String(c.label || ""),
        value: Number(c.value || 0),
        color: String(c.color || "#94a3b8"),
        description: String(c.description || ""),
      })),
    };
  }

  // =========================
  // CHARTS
  // =========================
  function renderBudgetChart(budget) {
    const canvas = $("#budgetChart");
    if (!exists(canvas) || !window.Chart) return;

    const labels = budget.categories.map((c) => c.label);
    const values = budget.categories.map((c) => c.value);
    const colors = budget.categories.map((c) => c.color);

    // Destroy old chart if hot-reload / re-init
    if (state.budgetChart) {
      try { state.budgetChart.destroy(); } catch (_) {}
      state.budgetChart = null;
    }

    const ctx = canvas.getContext("2d");

    state.budgetChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: CFG.BUDGET_HOVER_OFFSET,
            borderRadius: CFG.BUDGET_BORDER_RADIUS,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: CFG.BUDGET_CUTOUT,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#ffffff",
            titleColor: "#0f172a",
            bodyColor: "#475569",
            padding: 16,
            borderColor: "#e2e8f0",
            borderWidth: 1,
            displayColors: true,
            boxPadding: 4,
            cornerRadius: 8,
            callbacks: {
              // Ajoute la description si présente (propre, utile)
              afterBody: (items) => {
                const idx = items?.[0]?.dataIndex ?? -1;
                const desc = budget.categories[idx]?.description;
                return desc ? ["", desc] : [];
              },
              label: (ctx) => {
                const label = ctx.label || "";
                const value = ctx.raw ?? 0;
                return `${label} — ${value}%`;
              },
            },
          },
        },
      },
    });
  }

  function renderDevFocusChart() {
    const canvas = $("#devFocusChart");
    if (!exists(canvas) || !window.Chart) return;

    // Destroy old
    if (state.devChart) {
      try { state.devChart.destroy(); } catch (_) {}
      state.devChart = null;
    }

    const ctx = canvas.getContext("2d");

    // Ici, on reprend ta logique "Client Success / Produit / Ventes"
    // Si tu veux le passer en JSON plus tard, easy: même pattern que budget.
    state.devChart = new Chart(ctx, {
      type: "polarArea",
      data: {
        labels: ["Succes Client", "Produit", "Growth"],
        datasets: [
          {
            data: [60, 30, 10],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(148, 163, 184, 0.7)",
              "rgba(239, 68, 68, 0.7)",
            ],
            borderWidth: 2,
            borderColor: CFG.DEV_BORDER_COLOR,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            ticks: { display: false, backdropColor: "transparent" },
            grid: { color: CFG.DEV_GRID_COLOR },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  // =========================
  // VIDEOS UI
  // =========================
  function renderVideoList(videos) {
    const list = $("#videoList");
    if (!exists(list)) return;

    list.innerHTML = "";

    videos.forEach((vid, index) => {
      const isActive = index === 0;
      const item = document.createElement("div");
      item.className = [
        "video-item p-3 m-2 rounded-xl cursor-pointer flex gap-4",
        isActive ? "active" : "",
      ].join(" ");

      item.dataset.index = String(index);
      item.id = `vid-item-${index}`;

      item.innerHTML = `
        <div class="relative w-24 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm border border-slate-100">
          <img src="${escapeAttr(vid.img)}" class="w-full h-full object-cover opacity-100" alt="">
        </div>
        <div class="flex flex-col justify-center">
          <span class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">
            ${escapeHTML(vid.display_date || formatFRDate(vid.date))}
          </span>
          <h5 class="text-sm font-bold text-slate-800 leading-tight">${escapeHTML(vid.title)}</h5>
        </div>
      `;

      list.appendChild(item);
    });
  }

  function bindVideoEvents() {
    const list = $("#videoList");
    const overlay = $("#videoOverlay");
    if (!exists(list)) return;

    // 1) Clic sur un item playlist (delegation)
    list.addEventListener("click", (e) => {
      const item = e.target.closest(".video-item");
      if (!item) return;

      const idx = Number(item.dataset.index);
      if (Number.isNaN(idx)) return;

      setCurrentVideo(idx, { updateActive: true, resetPlayer: true });
    });

    // 2) Clic sur le bouton play (dans overlay) — plus de onclick inline
    if (exists(overlay)) {
      overlay.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action='play-video'], button");
        // Ton HTML n’a pas data-action, donc on accepte button dans l’overlay
        if (!btn) return;
        playCurrentVideo();
      });
    }

    // 3) Support clavier (Enter/Espace) sur items (access)
    list.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const item = e.target.closest(".video-item");
      if (!item) return;
      e.preventDefault();
      const idx = Number(item.dataset.index);
      if (!Number.isNaN(idx)) setCurrentVideo(idx, { updateActive: true, resetPlayer: true });
    });

    // Rendre les items focusables (après render)
    $$(".video-item", list).forEach((el) => el.setAttribute("tabindex", "0"));
  }

  function setCurrentVideo(index, opts = {}) {
    const { updateActive = true, resetPlayer = true } = opts;

    const videos = state.videos || [];
    if (!videos.length) return;

    const safeIndex = clamp(index, 0, videos.length - 1);
    state.currentVideoIndex = safeIndex;

    const data = videos[safeIndex];

    const thumb = $("#mainVideoThumb");
    const title = $("#mainVideoTitle");
    const dateEl = $("#mainVideoDate");

    const wrapper = $("#videoPlayerWrapper");
    const overlay = $("#videoOverlay");

    // Reset player state
    if (resetPlayer) {
      if (exists(wrapper)) {
        wrapper.innerHTML = "";
        wrapper.classList.add("hidden");
      }
      if (exists(overlay)) {
        overlay.classList.remove("opacity-0", "pointer-events-none");
      }
    }

    // Update hero overlay content
    if (exists(thumb)) {
      thumb.style.opacity = "0.5";
      setTimeout(() => {
        if (data.img) thumb.src = data.img;
        thumb.style.opacity = "0.9";
      }, 200);
    }
    if (exists(title)) title.textContent = data.title;

    if (exists(dateEl)) {
      const year = extractYear(data.date) || CFG.DEFAULT_YEAR_LABEL;
      const frDate = data.display_date || formatFRDate(data.date);
      dateEl.textContent = `${frDate} ${year} • ${data.duration || CFG.FALLBACK_DURATION}`;
    }

    // Active state
    if (updateActive) {
      $$(".video-item").forEach((el) => el.classList.remove("active"));
      const active = $(`#vid-item-${safeIndex}`);
      if (exists(active)) active.classList.add("active");
    }
  }

  function playCurrentVideo() {
    const videos = state.videos || [];
    if (!videos.length) return;

    const data = videos[state.currentVideoIndex];

    const wrapper = $("#videoPlayerWrapper");
    const overlay = $("#videoOverlay");

    if (!exists(wrapper) || !exists(overlay)) return;

    let playerHTML = "";

    if (data.type === "youtube") {
      playerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${escapeAttr(
        data.url
      )}?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (data.type === "loom") {
      playerHTML = `<iframe src="https://www.loom.com/embed/${escapeAttr(
        data.url
      )}?autoplay=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="width: 100%; height: 100%;"></iframe>`;
    } else {
      playerHTML = `
        <video width="100%" height="100%" controls autoplay class="w-full h-full object-cover">
          <source src="${escapeAttr(data.url)}" type="video/mp4">
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      `;
    }

    wrapper.innerHTML = playerHTML;
    wrapper.classList.remove("hidden");
    overlay.classList.add("opacity-0", "pointer-events-none");
  }

  // =========================
  // UI HELPERS
  // =========================
  function setupSpotlightBento() {
    $$(".bento-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    });
  }

  function setupNavbarScroll() {
    const nav = $("#navbar");
    if (!exists(nav)) return;

    const onScroll = () => {
      if (window.scrollY > 50) {
        nav.classList.add("py-0");
        nav.classList.remove("py-2");
      } else {
        nav.classList.add("py-2");
        nav.classList.remove("py-0");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function tryInitLucide() {
    try {
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    } catch (_) {}
  }

  // =========================
  // SMALL UTILS
  // =========================
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function extractYear(iso) {
    // iso: YYYY-MM-DD
    if (typeof iso !== "string") return "";
    const m = iso.match(/^(\d{4})-/);
    return m ? m[1] : "";
  }

  function formatFRDate(iso) {
    // Retourne "31 Décembre" en FR, à partir d’une date ISO.
    // Fallback si invalid.
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      // jour + mois (long)
      return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" }).replace(/^\d{2}/, (x) => String(Number(x)));
    } catch (_) {
      return "";
    }
  }

  function escapeHTML(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(str) {
    // escape minimal pour attributes
    return escapeHTML(str).replaceAll("`", "&#096;");
  }
})();
