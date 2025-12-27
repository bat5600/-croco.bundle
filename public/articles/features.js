// articles/features.js
// Moteur "Catalogue exhaustif" pour CrocoClick (AlpineJS)
// - Charge features.json
// - Filtre par onglet (tab)
// - Recherche instantanée
// - "Voir plus" par catégorie

window.CROCO_FEATURES = function CROCO_FEATURES() {
  return {
    // ✅ URL de ton JSON (tu l'as donnée)
    featuresUrl: "https://croco-bundle.vercel.app/articles/features.json",

    // état
    activeTab: "creer",
    search: "",
    loading: true,
    error: null,

    // données
    groups: [],

    // UI "voir plus"
    expanded: {}, // { "tab|category": true }

    // ✅ init auto
    async init() {
      try {
        const res = await fetch(this.featuresUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`features.json introuvable (${res.status})`);

        const data = await res.json();

        // On accepte 2 formats :
        // A) [{ tab, category, items: [...] }, ...]
        // B) { groups: [...] }
        this.groups = Array.isArray(data) ? data : (data.groups || []);

        if (!Array.isArray(this.groups)) {
          throw new Error("Format JSON invalide : attendu un tableau de groupes.");
        }
      } catch (e) {
        this.error = e?.message || "Erreur inconnue";
      } finally {
        this.loading = false;
      }
    },

    // helpers
    keyOf(group) {
      const tab = group.tab || "unknown";
      const cat = group.category || "Sans catégorie";
      return `${tab}|${cat}`;
    },

    toggle(group) {
      const k = this.keyOf(group);
      this.expanded[k] = !this.expanded[k];
    },

    isExpanded(group) {
      return !!this.expanded[this.keyOf(group)];
    },

    // ⚙️ filtre principal : tab + recherche
    filteredGroups() {
      const q = (this.search || "").trim().toLowerCase();

      return this.groups
        .filter(g => (g.tab || "") === this.activeTab)
        .map(g => {
          const items = Array.isArray(g.items) ? g.items : [];
          const filtered = q
            ? items.filter(it => String(it).toLowerCase().includes(q))
            : items;

          return { ...g, _items: filtered };
        })
        .filter(g => (g._items || []).length > 0);
    },

    // "Voir plus" : 10 items visibles par défaut
    visibleItems(group) {
      const items = group._items || group.items || [];
      return this.isExpanded(group) ? items : items.slice(0, 10);
    },

    // compteur global (par tab)
    totalInTab() {
      return this.groups
        .filter(g => (g.tab || "") === this.activeTab)
        .reduce((acc, g) => acc + ((g.items || []).length), 0);
    },

    // compteur visible (après recherche)
    visibleCount() {
      return this.filteredGroups()
        .reduce((acc, g) => acc + ((g._items || []).length), 0);
    }
  };
};
