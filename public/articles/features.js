/*
  CrocoClick — Features Catalogue (Premium)
  Compatible avec le features.json “premium” (tabs -> groups -> items)

  ✅ Charge JSON distant
  ✅ Construit un index (tab/category/items)
  ✅ Recherche full-text + aliases (FR/EN + abréviations)
  ✅ Filtres par onglet (activeTab) depuis ton HTML
  ✅ Groupes accordéon + "voir plus/moins"
  ✅ Compteurs (visibleCount / totalInTab)

  IMPORTANT
  - Ton HTML doit inclure ce script APRÈS Alpine.
  - Ton <body> doit contenir: x-data="{ ...CROCO_FEATURES() }" et x-init="init()"
  - Ton UI (template) utilise: loading, error, search, filteredGroups(), toggle(group), etc.

  Optionnel (recommandé)
  - Ajouter dans le <head>:
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
*/

(function () {
  // === Config ===
  const DEFAULT_JSON_URL = "https://croco-bundle.vercel.app/articles/features.json";

  // Normalise une chaîne pour la recherche
  function norm(str) {
    return (str || "")
      .toString()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  }

  function uniq(arr) {
    return Array.from(new Set((arr || []).filter(Boolean)));
  }

  function safeArray(x) {
    return Array.isArray(x) ? x : [];
  }

  function pickHighlights(entity) {
    const h = safeArray(entity && entity.highlights);
    return h.slice(0, 4);
  }

  // Merge aliases tab + group + global + per-item heuristiques
  function buildAliases({ tab, group, item }) {
    const base = [];
    base.push(...safeArray(tab && tab.aliases));
    base.push(...safeArray(group && group.aliases));

    // Aliases "intelligents" pour l’item: split mots + variantes
    const t = (item || "").toString();
    const words = t
      .replace(/[’'"()\[\]{}:;,.!?/\\|+*=<>`~^$#@]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 3);

    base.push(...words);

    // Alias supplémentaires basiques (FR abréviations)
    const n = norm(t);
    if (n.includes("rendez")) base.push("rdv", "booking", "calendar");
    if (n.includes("facture") || n.includes("devis")) base.push("invoice", "billing", "quote");
    if (n.includes("paiement")) base.push("payment", "checkout", "stripe", "paypal");
    if (n.includes("workflow") || n.includes("automatisation")) base.push("automation", "zap", "zapier", "make", "scenario");

    return uniq(base);
  }

  // Fabrique une entrée indexée
  function makeRow({ tab, group, item }) {
    const itemText = (item || "").toString();
    const tabLabel = tab.label || tab.id;
    const category = group.category || group.id;

    const aliases = buildAliases({ tab, group, item: itemText });

    const searchBlob = uniq([
      tab.id,
      tabLabel,
      group.id,
      category,
      itemText,
      ...aliases,
    ])
      .map(norm)
      .join(" | ");

    return {
      tabId: tab.id,
      tabLabel,
      tabRank: Number.isFinite(tab.rank) ? tab.rank : 999,

      groupId: group.id,
      category,
      groupRank: Number.isFinite(group.rank) ? group.rank : 999,

      groupIcon: group.icon || tab.icon || "fa-solid fa-list-check",
      tabIcon: tab.icon || "fa-solid fa-list-check",

      highlights: pickHighlights(group).length ? pickHighlights(group) : pickHighlights(tab),

      item: itemText,
      aliases,
      _search: searchBlob,
    };
  }

  // Regroupe les rows par (tabId + category)
  function groupRows(rows) {
    const map = new Map();
    for (const r of rows) {
      const key = `${r.tabId}||${r.category}`;
      if (!map.has(key)) {
        map.set(key, {
          tab: r.tabId,
          tabLabel: r.tabLabel,
          tabRank: r.tabRank,
          category: r.category,
          groupRank: r.groupRank,
          icon: r.groupIcon,
          highlights: r.highlights,
          items: [],
          _items: [], // items filtrés par recherche
        });
      }
      const g = map.get(key);
      g.items.push(r.item);
    }

    // dédup items, sort
    const out = Array.from(map.values()).map((g) => {
      g.items = uniq(g.items);
      g._items = g.items.slice();
      return g;
    });

    out.sort((a, b) => {
      if (a.tabRank !== b.tabRank) return a.tabRank - b.tabRank;
      if (a.groupRank !== b.groupRank) return a.groupRank - b.groupRank;
      return a.category.localeCompare(b.category, "fr");
    });

    return out;
  }

  // === Expose à window pour Alpine ===
  window.CROCO_FEATURES = function CROCO_FEATURES(opts) {
    const cfg = opts || {};

    return {
      // State
      jsonUrl: cfg.jsonUrl || DEFAULT_JSON_URL,
      loading: true,
      error: "",
      search: "",

      // Alpine/HTML utilise déjà activeTab. On la définit si absente.
      activeTab: "creer",
      previewlimit:3,

      // Data
      raw: null,
      rows: [],
      groups: [],

      // UI state accordéon
      expanded: {},

      async init() {
        // Si la page définit déjà activeTab, on ne touche pas.
        if (!this.activeTab) this.activeTab = "creer";

        // Diagnostic rapide
        try {
          console.log("[CrocoFeatures] init — jsonUrl:", this.jsonUrl);

          const res = await fetch(this.jsonUrl, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

          const data = await res.json();
          this.raw = data;

          const tabs = safeArray(data && data.tabs);
          if (!tabs.length) throw new Error("JSON invalide : tabs[] est vide ou manquant");

          const rows = [];
          for (const tab of tabs) {
            const groups = safeArray(tab && tab.groups);
            for (const group of groups) {
              const items = safeArray(group && group.items);
              for (const item of items) {
                rows.push(makeRow({ tab, group, item }));
              }
            }
          }

          this.rows = rows;
          this.groups = groupRows(rows);

          // Déplier par défaut le 1er groupe de l’onglet actif
          const first = this.groups.find((g) => g.tab === this.activeTab);
          if (first) this.expanded[this._key(first)] = true;

          console.log("[CrocoFeatures] loaded rows:", this.rows.length);
          console.log("[CrocoFeatures] grouped:", this.groups.length);

          this.loading = false;
          this.error = "";
        } catch (e) {
          this.loading = false;
          this.error = "Impossible de charger le catalogue. " + (e && e.message ? e.message : String(e));
          console.error("[CrocoFeatures] ERROR:", e);
        }
      },

      // === Helpers UI / computed ===
      _key(group) {
        return `${group.tab}||${group.category}`;
      },

      isExpanded(group) {
        return !!this.expanded[this._key(group)];
      },

      toggle(group) {
        const k = this._key(group);
        this.expanded[k] = !this.expanded[k];
      },

      visibleItems(group) {
        const items = group._items || group.items || [];
        if (this.isExpanded(group)) return items;
        return items.slice(0, this.previewLimit);
      },

      // Compteurs
      totalInTab() {
        const tab = this.activeTab;
        return this.groups
          .filter((g) => g.tab === tab)
          .reduce((sum, g) => sum + (g.items ? g.items.length : 0), 0);
      },

      visibleCount() {
        const tab = this.activeTab;
        const q = norm(this.search);
        if (!q) {
          return this.totalInTab();
        }

        // total filtré
        return this.filteredGroups()
          .filter((g) => g.tab === tab)
          .reduce((sum, g) => sum + ((g._items || []).length || 0), 0);
      },

      // Filtrage principal : groupe par groupe + recherche
      filteredGroups() {
        const tab = this.activeTab;
        const q = norm(this.search);

        // on clone les groupes (pour ne pas muter l'original)
        const base = this.groups.filter((g) => g.tab === tab);

        if (!q) {
          return base.map((g) => ({ ...g, _items: g.items.slice() }));
        }

        // Recherche : on matche dans rows (_search)
        const matched = this.rows.filter((r) => r.tabId === tab && r._search.includes(q));

        // Build map category -> items
        const m = new Map();
        for (const r of matched) {
          const key = r.category;
          if (!m.has(key)) m.set(key, new Set());
          m.get(key).add(r.item);
        }

        const out = [];
        for (const g of base) {
          const set = m.get(g.category);
          if (!set) continue;
          const items = Array.from(set);
          out.push({ ...g, _items: items });
        }

        // tri stable
        out.sort((a, b) => {
          if (a.groupRank !== b.groupRank) return a.groupRank - b.groupRank;
          return a.category.localeCompare(b.category, "fr");
        });

        return out;
      },

      // Expose: badge/hightlights & icon (si tu veux les afficher dans le template)
      groupIcon(group) {
        return group.icon || "fa-solid fa-list-check";
      },

      groupHighlights(group) {
        return safeArray(group.highlights).slice(0, 4);
      }
    };
  };
})();
