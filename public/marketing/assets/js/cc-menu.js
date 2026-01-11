/*!
  CrocoClick — cc-menu.js (PROD)
  Objectif:
  - Zéro custom JS inline dans GHL (ou quasi)
  - Robuste aux rerenders GHL (MutationObserver)
  - Performant (un seul handler scroll, délégation click, décorations idempotentes)
  - Accessibilité: role/link + tabindex + Enter/Space + Escape pour le menu

  Dépendances: Aucune
  Requis côté HTML (GHL):
  - Le menu nav GHL existe avec id="nav-menu-v2-AZgY1W6v-f" (si tu veux le CTA auto)
  - Si tu utilises le menu mobile fullscreen:
      -> il faut avoir le markup du menu (header + overlay + sheet + nav + bottom btn)
         OU activer AUTO_INJECT_MOBILE_MENU = true (option) pour l'injecter.
*/

(function () {
  "use strict";

  // =========================================================
  // CONFIG — ajuste ici seulement
  // =========================================================

  // 1) Sticky header section GHL (scrolled-mode)
  const GHL_STICKY_SECTION_ID = "section-ZgRhtAGsiy"; // sans #
  const SCROLL_TRIGGER_PX = 40;

  // 2) Desktop/Mobile GHL nav menu pour appliquer .cc-cta au dernier lien
  const GHL_MENU_ID = "nav-menu-v2-AZgY1W6v-f"; // sans #

  // 3) Click-to-link mapping (rows)
  //    Important: IDs SANS le "#"
  const ROW_LINKS = {
    // --- Mega menu Produit (5 colonnes)
    "row-kkipYf3JXx": "https://crococlick.com/fonctionnalites/formations-en-ligne",
    "row-IDkBmQeMbp": "https://crococlick.com/fonctionnalites/communaute",
    "row-LxNumUZkH5": "https://crococlick.com/fonctionnalites/funnels-sites",
    "row-TTTpqg0nLv": "https://crococlick.com/contenu",

    "row-RPbjYk5uxL": "https://crococlick.com/fonctionnalites/email-sms-marketing",
    "row-i6gxJ0KemK":
      "https://help.crococlick.com/fr/collections/13986402-sms-whatsapp-and-telephonie",
    "row-rhabPkxpJf": "https://crococlick.com/fonctionnalites/planificateur-social",
    "row-RiRt3rTORd": "https://crococlick.com/fonctionnalites/webinar-live",

    "row-hG8mpBF27V":
      "https://help.crococlick.com/fr/articles/11959052-introduction-a-longlet-paiement-dans-crococlick",
    "row-fEWCt-5qzI":
      "https://crococlick.com/fonctionnalites/factures-contrats",
    "row-KLET6Qzvhs": "https://crococlick.com/fonctionnalites/calendriers",
    "row-da4dm5iGuM":
      "https://help.crococlick.com/fr/articles/10331906-vue-densemble-de-laffiliate-managers",

    "row-4shD7gVOF7": "https://crococlick.com/fonctionnalites/crm",
    "row-604uHbj9lX": "https://crococlick.com/fonctionnalites/inbox-unifiee",
    "row-jp6To9GMq2": "https://crococlick.com/fonctionnalites/automatisations",
    "row-eU8SiYiVAe": "https://crococlick.com/ventes",

    "row-hMKjzzgmLX": "https://crococlick.com/fonctionnalites",
    "row-RlLdBhZZwa": "https://crococlick.com/fonctionnalites/crocobot-ai",
    "row-X3cTUrecjc": "https://crococlick.com/operationnel",
    "row-wnguSCmDWt": "https://crococlick.com/demo",

    // --- Ecosystem (3 cartes)
    "row-9kkvdy-EbM": "https://crocassist.com",
    "row-jFWsvViAn-": "https://crococlick.com/academie",
    "row-h_CIUOV8Bk": "https://crocolive.fr",
  };

  // 4) Menu mobile fullscreen (si tu gardes le HTML dans GHL)
  const MOBILE_MENU = {
    enabled: true,

    // Si true: on injecte le markup mobile automatiquement (pratique si tu veux supprimer le HTML custom aussi)
    // Si false: tu dois avoir le HTML déjà présent dans GHL (header + overlay + sheet...)
    autoInjectMarkup: false,

    // IDs attendus si markup présent
    ids: {
      openBtn: "ccOpenMenu",
      closeBtn: "ccCloseMenu",
      overlay: "ccOverlay",
      sheet: "ccMenuSheet",
      content: "ccMenuContent",
      bottomBtn: "ccBottomBtn",
    },

    // URLs
    signupUrl: "https://crococlick.com/etape-1-essential/",
    loginUrl: "https://pro.crococlick.com/",
    pricingUrl: "https://crococlick.com/pricing",
    homeUrl: "https://crococlick.com",

    // Branding
    logoUrl:
      "https://assets.cdn.filesafe.space/0XeqHZvwfH59pwE9Y5ZY/media/65030aca66379924e0aada34.png",

    // Pages data
    pages: {
      root: {
        id: "root",
        type: "root",
        bottom: { label: "Se connecter", href: "https://pro.crococlick.com/" },
        items: [
          { label: "Produit", to: "produit" },
          { label: "Ressources", to: "ressources" },
          { label: "Tarifs", href: "https://crococlick.com/pricing" },
        ],
      },

      produit: {
        id: "produit",
        type: "mega",
        bottom: { label: "Retour", action: "back" },
        columns: [
          {
            title: "CRÉER",
            items: [
              {
                icon: "🎓",
                label: "Formations en ligne",
                href: "https://crococlick.com/fonctionnalites/formations-en-ligne",
              },
              {
                icon: "👥",
                label: "Communauté",
                href: "https://crococlick.com/fonctionnalites/communaute",
              },
              {
                icon: "🧩",
                label: "Funnels & Sites",
                href: "https://crococlick.com/fonctionnalites/funnels-sites",
              },
              { icon: "🛒", label: "E-Shop", href: "https://crococlick.com/contenu" },
            ],
          },
          {
            title: "DIFFUSER",
            items: [
              {
                icon: "✉️",
                label: "Email Marketing",
                href: "https://crococlick.com/fonctionnalites/email-sms-marketing",
              },
              {
                icon: "📞",
                label: "Appels, SMS & WhatsApp",
                href: "https://help.crococlick.com/fr/collections/13986402-sms-whatsapp-and-telephonie",
              },
              {
                icon: "📣",
                label: "Réseaux Sociaux",
                href: "https://crococlick.com/fonctionnalites/planificateur-social",
              },
              {
                icon: "🎥",
                label: "Lives",
                href: "https://crococlick.com/fonctionnalites/webinar-live",
              },
            ],
          },
          {
            title: "CONVERTIR",
            items: [
              {
                icon: "🧺",
                label: "Panier d'achat 2.0",
                href: "https://help.crococlick.com/fr/articles/11959052-introduction-a-longlet-paiement-dans-crococlick",
              },
              {
                icon: "🧾",
                label: "Facture & Devis",
                href: "https://crococlick.com/fonctionnalites/factures-contrats",
              },
              {
                icon: "📅",
                label: "Calendriers",
                href: "https://crococlick.com/fonctionnalites/calendriers",
              },
              {
                icon: "📢",
                label: "Affiliation",
                href: "https://help.crococlick.com/fr/articles/10331906-vue-densemble-de-laffiliate-managers",
              },
            ],
          },
          {
            title: "ORCHESTRER",
            items: [
              {
                icon: "👤",
                label: "CRM Systémique",
                href: "https://crococlick.com/fonctionnalites/crm",
              },
              {
                icon: "📥",
                label: "Inbox Unifié",
                href: "https://crococlick.com/fonctionnalites/inbox-unifiee",
              },
              {
                icon: "⚙️",
                label: "Automatisations",
                href: "https://crococlick.com/fonctionnalites/automatisations",
              },
              { icon: "📊", label: "Dashboard", href: "https://crococlick.com/ventes" },
            ],
          },
          {
            title: "ET BIEN PLUS...",
            items: [
              {
                icon: "🧱",
                label: "100+ Fonctionnalités",
                href: "https://crococlick.com/fonctionnalites",
              },
              {
                icon: "🤖",
                label: "Intégrations",
                href: "https://crococlick.com/fonctionnalites/crocobot-ai",
              },
              { icon: "📱", label: "Nos Applications", href: "https://crococlick.com/operationnel" },
              { icon: "▶️", label: "Regarder la Démo", href: "https://crococlick.com/demo" },
            ],
          },
        ],
      },

      ressources: {
        id: "ressources",
        type: "resources",
        bottom: { label: "Retour", action: "back" },
        blocks: [
          {
            title: "DÉCOUVRIR",
            type: "list",
            items: [
              { label: "Calculateur d'économies", href: "https://crococlick.com/calculateur" },
              { label: "Démo CrocoClick", href: "https://crococlick.com/demo" },
              { label: "Essai gratuit", href: "https://crococlick.com/etape-1-essential" },
            ],
          },
          {
            title: "APPRENDRE",
            type: "list",
            items: [
              { label: "Lives Hebdomadaires", href: "https://crococlick.com/crocolives" },
              { label: "Centre d'aide", href: "https://help.crococlick.com" },
              { label: "Nouveautés", href: "https://ideas.crococlick.com/fr/changelog" },
              { label: "Roadmap", href: "https://ideas.crococlick.com/fr/roadmap" },
            ],
          },
          {
            title: "L'ÉCOSYSTÈME CROCO",
            type: "ecosystem",
            cards: [
              {
                iconEmoji: "🤝",
                title: "CrocAssist",
                desc: "Agence d'assistants experts CrocoClick pour Solopreneurs",
                href: "https://crocassist.com",
              },
              {
                iconEmoji: "🧠",
                title: "CrocoClub",
                desc: "La 1ère communauté d'entrepreneurs systémiques",
                href: "https://crococlick.com/academie",
              },
              {
                iconEmoji: "🔴",
                title: "CrocoLive",
                desc: "Logiciel de Live illimité pour solopreneurs",
                href: "https://crocolive.fr",
              },
            ],
          },
        ],
      },
    },
  };

  // =========================================================
  // HELPERS
  // =========================================================

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function isMobileViewport() {
     return window.matchMedia("(max-width: 767px)").matches;
  }

  function safeQueryById(id) {
    if (!id) return null;
    return document.getElementById(id) || null;
  }

  function isVisible(el) {
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0";
  }

  function closestInteractive(el) {
    if (!el) return null;
    return el.closest(
      "a, button, input, textarea, select, [role='button'], [role='link'], [data-no-rowlink='1']"
    );
  }

  function openUrl(url, target) {
    if (!url) return;
    const t = target || "_self";
    if (t === "_blank") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = url;
  }

  function rafThrottle(fn) {
    let ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        fn();
        ticking = false;
      });
    };
  }

  // =========================================================
  // 1) Sticky header scrolled-mode (GHL section)
  // =========================================================

  function initScrolledMode() {
    const header = safeQueryById(GHL_STICKY_SECTION_ID);
    if (!header) return;

    const update = () => {
      header.classList.toggle("scrolled-mode", window.scrollY > SCROLL_TRIGGER_PX);
    };

    const onScroll = rafThrottle(update);
    document.addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  // =========================================================
  // 2) Add .cc-cta to last link in every <ul> inside GHL nav menu
  // =========================================================

  function markLastLinks(root) {
    if (!root) return;

    root.querySelectorAll("ul").forEach((ul) => {
      const lis = Array.from(ul.children).filter((n) => n.tagName === "LI");

      const visibleLis = lis.filter((li) => {
        // offsetParent null si display:none (souvent)
        if (li.offsetParent !== null) return true;
        const cs = getComputedStyle(li);
        return cs.display !== "none";
      });

      const lastLi = (visibleLis.at(-1) || lis.at(-1)) || null;

      let a = null;
      if (lastLi) {
        a = lastLi.querySelector(":scope > a") || lastLi.querySelector("a");
      }

      if (!a) a = ul.querySelector("li:last-child > a, a:last-child");

      if (a && !a.classList.contains("cc-cta")) a.classList.add("cc-cta");
    });
  }

  function initCtaLastLink() {
    const menu = safeQueryById(GHL_MENU_ID);
    if (!menu) return;

    markLastLinks(menu);

    const mo = new MutationObserver(() => markLastLinks(menu));
    mo.observe(menu, { childList: true, subtree: true });
  }

  // =========================================================
  // 3) Clickable Rows mapping (GHL row -> url)
  //    - Délégation click + keydown
  //    - Décoration tabindex/role idempotente
  // =========================================================

  function findMappedAncestor(startEl) {
    let el = startEl;
    while (el && el !== document.body) {
      if (el.id && ROW_LINKS[el.id]) return el;
      el = el.parentElement;
    }
    return null;
  }

  function decorateRowLinks() {
    Object.keys(ROW_LINKS).forEach((id) => {
      const el = safeQueryById(id);
      if (!el) return;

      // Idempotent decoration
      if (el.getAttribute("data-cc-rowlink") === "1") return;

      el.style.cursor = "pointer";
      el.setAttribute("role", "link");
      el.setAttribute("tabindex", "0");
      el.setAttribute("data-cc-rowlink", "1");
    });
  }

  function initRowLinks() {
    if (!ROW_LINKS || Object.keys(ROW_LINKS).length === 0) return;

    // Click delegation
    document.addEventListener("click", (e) => {
    const row = findMappedAncestor(e.target);
    if (!row) return;

    const interactive = closestInteractive(e.target);

    // Si on clique un vrai lien/bouton À L'INTÉRIEUR de la row, on laisse faire
    // MAIS si l'élément "interactif" détecté est la row elle-même -> on gère le clic
    if (interactive && interactive !== row) return;

    openUrl(ROW_LINKS[row.id], "_self");
    });


    // Keyboard support (Enter/Space when focused on mapped row)
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;

      const active = document.activeElement;
      if (!active) return;

      // Si l'utilisateur est dans un input etc.
      if (closestInteractive(active) && active.tagName !== "DIV") return;

      const row = findMappedAncestor(active);
      if (!row) return;

      e.preventDefault();
      openUrl(ROW_LINKS[row.id], "_self");
    });

    // Initial decorate + watch rerenders
    decorateRowLinks();
    const mo = new MutationObserver(() => decorateRowLinks());
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // =========================================================
  // 4) Mobile fullscreen menu (optional)
  // =========================================================

  function injectMobileMarkupIfNeeded() {
    if (!MOBILE_MENU.enabled) return;
    if (!MOBILE_MENU.autoInjectMarkup) return;

    // Prevent duplicate injection
    if (safeQueryById("cc-mobile-header") || safeQueryById(MOBILE_MENU.ids.sheet)) return;

    const headerHtml = `
      <header class="cc-siteHeader" id="cc-mobile-header">
        <div class="cc-siteHeaderInner">
          <a class="cc-brand" href="${MOBILE_MENU.homeUrl}" aria-label="Accueil CrocoClick">
            <img class="cc-logoImg" src="${MOBILE_MENU.logoUrl}" alt="CrocoClick" />
          </a>
          <div class="cc-headerActions">
            <a class="cc-pill" href="${MOBILE_MENU.signupUrl}">S’inscrire</a>
            <button class="cc-burgerBtn" id="${MOBILE_MENU.ids.openBtn}"
              aria-label="Ouvrir le menu" aria-haspopup="dialog"
              aria-controls="${MOBILE_MENU.ids.sheet}">
              <span class="cc-srOnly">Ouvrir le menu</span>
              <div class="cc-burgerIcon" aria-hidden="true"><span></span></div>
            </button>
          </div>
        </div>
      </header>
      <div class="cc-overlay" id="${MOBILE_MENU.ids.overlay}"></div>
      <div class="cc-sheet" id="${MOBILE_MENU.ids.sheet}" role="dialog" aria-modal="true"
        aria-label="Menu mobile" aria-hidden="true">
        <div class="cc-topbar">
          <a class="cc-brand" href="${MOBILE_MENU.homeUrl}" aria-label="Accueil CrocoClick">
            <img class="cc-logoImg" src="${MOBILE_MENU.logoUrl}" alt="CrocoClick" />
          </a>
          <div class="cc-headerActions">
            <a class="cc-pill" href="${MOBILE_MENU.signupUrl}">S’inscrire</a>
            <button class="cc-iconBtn" id="${MOBILE_MENU.ids.closeBtn}" type="button" aria-label="Fermer le menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        <nav class="cc-content" id="${MOBILE_MENU.ids.content}" aria-label="Navigation mobile"></nav>
        <div class="cc-bottomBar">
          <a class="cc-bottomBtn" id="${MOBILE_MENU.ids.bottomBtn}" href="${MOBILE_MENU.loginUrl}">Se connecter</a>
        </div>
      </div>
    `;

    const wrap = document.createElement("div");
    wrap.innerHTML = headerHtml;
    document.body.prepend(wrap);
  }

  function initMobileMenu() {
    if (!MOBILE_MENU.enabled) return;

    const ids = MOBILE_MENU.ids;

    const openBtn = safeQueryById(ids.openBtn);
    const closeBtn = safeQueryById(ids.closeBtn);
    const overlay = safeQueryById(ids.overlay);
    const sheet = safeQueryById(ids.sheet);
    const content = safeQueryById(ids.content);
    const bottom = safeQueryById(ids.bottomBtn);

    // If markup not present, do nothing (safe)
    if (!openBtn || !closeBtn || !overlay || !sheet || !content || !bottom) return;

    const PAGES = MOBILE_MENU.pages;

    let stack = ["root"];
    let lastActiveEl = null;

    function lockScroll(lock) {
      if (lock) {
        document.body.classList.add("cc-menuOpen");
        document.body.style.overflow = "hidden";
        sheet.setAttribute("aria-hidden", "false");
      } else {
        document.body.classList.remove("cc-menuOpen");
        document.body.style.overflow = "";
        sheet.setAttribute("aria-hidden", "true");
      }
    }

    function openMenu() {
      lastActiveEl = document.activeElement;
      lockScroll(true);
      render();
      closeBtn.focus({ preventScroll: true });
    }

    function closeMenu() {
      lockScroll(false);
      stack = ["root"];
      if (lastActiveEl && typeof lastActiveEl.focus === "function") {
        lastActiveEl.focus({ preventScroll: true });
      }
    }

    function currentPage() {
      return PAGES[stack[stack.length - 1]];
    }

    function push(pageId) {
      if (!PAGES[pageId]) return;
      stack.push(pageId);
      render();
      content.scrollTop = 0;
    }

    function pop() {
      if (stack.length > 1) {
        stack.pop();
        render();
        content.scrollTop = 0;
      }
    }

    function renderRoot(page) {
      return `
        <div class="cc-bigList">
          ${page.items
            .map((it) => {
              const hasTo = !!it.to;
              const chev = hasTo
                ? `
                <svg class="cc-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>`
                : `<span style="width:22px;height:22px;display:block;"></span>`;

              if (hasTo) {
                return `
                  <div class="cc-bigItem" role="button" tabindex="0" data-to="${it.to}">
                    <div class="cc-label">${it.label}</div>
                    ${chev}
                  </div>
                `;
              }

              return `
                <a class="cc-bigItem" href="${it.href || "#"}" data-close-on-click="1">
                  <div class="cc-label">${it.label}</div>
                  ${chev}
                </a>
              `;
            })
            .join("")}
        </div>
      `;
    }

    function renderMega(page) {
      return `
        <div class="cc-megaGrid">
          ${page.columns
            .map(
              (col) => `
            <div>
              <div class="cc-sectionTitle">${col.title}</div>
              <div>
                ${col.items
                  .map(
                    (it) => `
                  <a class="cc-hoverRow cc-bodyText" href="${it.href}" data-close-on-click="1">
                    <div class="cc-ico" aria-hidden="true">${it.icon}</div>
                    <div>${it.label}</div>
                  </a>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    function renderResources(page) {
      return page.blocks
        .map((block) => {
          if (block.type === "list") {
            return `
              <div class="cc-sectionTitle">${block.title}</div>
              <div>
                ${block.items
                  .map(
                    (it) => `
                  <a class="cc-hoverRow cc-bodyText" href="${it.href}" data-close-on-click="1">
                    <div>${it.label}</div>
                  </a>
                `
                  )
                  .join("")}
              </div>
            `;
          }

          // ecosystem cards
          return `
            <div class="cc-sectionTitle">${block.title}</div>
            <div class="cc-ecoList">
              ${block.cards
                .map(
                  (c) => `
                <a class="cc-ecoCard" href="${c.href}" data-close-on-click="1">
                  <div class="cc-ecoIcon" aria-hidden="true">
                    <div class="cc-ecoEmoji">${c.iconEmoji}</div>
                  </div>
                  <div>
                    <div class="cc-ecoTitle">${c.title}</div>
                    <p class="cc-ecoDesc">${c.desc}</p>
                  </div>
                </a>
              `
                )
                .join("")}
            </div>
          `;
        })
        .join("");
    }

    function wireRootInteractions() {
      content.querySelectorAll(".cc-bigItem[data-to]").forEach((el) => {
        const to = el.getAttribute("data-to");
        const go = () => push(to);
        el.addEventListener("click", go);
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            go();
          }
        });
      });
    }

    function wireCloseOnClick() {
      content.querySelectorAll("[data-close-on-click='1']").forEach((a) => {
        a.addEventListener("click", () => closeMenu(), { once: true });
      });
    }

    function render() {
      const page = currentPage();
      if (!page) return;

      if (page.type === "root") content.innerHTML = renderRoot(page);
      if (page.type === "mega") content.innerHTML = renderMega(page);
      if (page.type === "resources") content.innerHTML = renderResources(page);

      // bottom bar behavior
      if (page.bottom && page.bottom.href) {
        bottom.textContent = page.bottom.label || "Se connecter";
        bottom.setAttribute("href", page.bottom.href);
        bottom.onclick = null;
      } else {
        bottom.textContent = (page.bottom && page.bottom.label) || "Retour";
        bottom.setAttribute("href", "#");
        bottom.onclick = (e) => {
          e.preventDefault();
          pop();
        };
      }

      if (page.type === "root") wireRootInteractions();
      wireCloseOnClick();
    }

    openBtn.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("cc-menuOpen")) closeMenu();
    });

    // Initial render (useful if you want pre-built content)
    render();
  }

  // =========================================================
  // BOOT
  // =========================================================

    onReady(function () {
        // Features
        initScrolledMode();
        initCtaLastLink();
        initRowLinks();

        // Mobile menu: seulement sur mobile
        if (isMobileViewport()) {
            injectMobileMarkupIfNeeded();
            initMobileMenu();
        }
    });

})();
