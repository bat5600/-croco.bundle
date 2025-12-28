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
  const DEFAULT_JSON_URL = "https://croco-bundle.vercel.app/marketing/data/features.json";


  // === Link Router (feature pages + help center) ===
  const BASE = {
    feature: "https://crococlick.com/fonctionnalites/",
    help: "https://help.crococlick.com/fr/articles/",
  };

  // clé -> destination
  // - type: "feature" | "help"
  // - slug: le chemin après le domaine
  // - ou url: url complète (override)
  const CROCO_LINKS = {
    
    // LISTE (à compléter)
    // ==================== TAB: CRÉER ====================

  // HERO CARDS
  sitesFunnels: { type: "feature", slug: "funnels-sites" },
  eShop: { type: "help", slug: "11142730" },
  formations: { type: "feature", slug: "formations-en-ligne" },

  // BENTO CARDS
  blogSEO: { type: "help", slug: "12040421" },
  domainesDNS: { type: "help", slug: "10075044" },
  formulaires: { type: "help", slug: "10083202" },
  mediaLibrary: { type: "help", slug: "10511791" },
  qrCodeDynamique: { type: "help", slug: "11798509" },
  communautes: { type: "feature", slug: "communaute" },
  testsAB: { type: "help", slug: "11959197" },
  appMobile: { type: "help", slug: "10199388" },

  // ==================== TAB: DIFFUSER ====================

  // HERO CARDS
  emailMarketing: { type: "feature", slug: "email-sms-marketing" },
  socialPlanner: { type: "feature", slug: "planificateur-social" },
  crocoLive: { type: "feature", slug: "webinar-live" },

  // BENTO CARDS
  smsWhatsapp: { type: "help", slug: "11112384" },
  eReputation: { type: "help", slug: "11798509" },
  chatWidget: { type: "help", slug: "12310579" },
  autoDM: { type: "help", slug: "10498095" },
  webinarAuto: { type: "help", slug: "12339445" },
  ipDediee: { type: "help", slug: "10075285" },

  // ==================== TAB: CONVERTIR ====================

  // HERO CARDS
  panierIntelligent: { type: "help", slug: "10034926" },
  calendrier: { type: "feature", slug: "calendriers" },
  calendrierService: { type: "help", slug: "9979267" },
  gestionAffiliation: { type: "help", slug: "10331906" },

  // BENTO CARDS
  facturesDevis: { type: "help", slug: "10483189" },
  gestionPublicites: { type: "help", slug: "10903301" },
  codespromo: { type: "help", slug: "10283758" },
  signatures: { type: "help", slug: "10174157" },
  taxesAuto: { type: "help", slug: "11960095" },
  liensPaiement: { type: "help", slug: "10034753" },

  // ==================== TAB: ORCHESTRER ====================

  // HERO CARDS
  inboxUnifie: { type: "feature", slug: "inbox-unifiee" },
  crmSystemique: { type: "feature", slug: "crm" },
  automatisationsWorkflows: { type: "feature", slug: "automatisations" },

  // BENTO CARDS
  dashboards: { type: "help", slug: "11958660" },
  appAdmin: { type: "help", slug: "10199388" },
  apiWebhooks: { type: "help", slug: "10881987" },
  leadScoring: { type: "help", slug: "10083155" },
  callRecord: { type: "help", slug: "12644794" },
  tracking: { type: "help", slug: "11397009" },
  triggerLinks: { type: "help", slug: "10189148" },
  equipes: { type: "help", slug: "10825268" },

  // ==================== TAB: CROCO AI ====================

  // HERO CARD + FEATURES
  crocobotAI: { type: "feature", slug: "crocobot-ai" },
  contentAI: { type: "help", slug: "10988781" },
  imagesAI: { type: "help", slug: "10988781" },
  workflowAI: { type: "help", slug: "10993609" },
  reviewAI: { type: "help", slug: "11798386" },
  voiceAI: { type: "help", slug: "10987862" },
  agentStudio: { type: "help", slug: "11978723" },

  // ==================== CATALOGUE COMPLET - CRÉER ====================

  // Sites & Pages
  sitesIllimites: { type: "help", slug: "11959197" },
  builderDragDrop: { type: "help", slug: "10096735" },
  templatesNiches: { type: "help", slug: "10602938" },
  hebergementDomaine: { type: "help", slug: "10075044" },
  wordpressNatif: { type: "help", slug: "11959197" },

  // Blog & SEO
  blogBuilder: { type: "help", slug: "12040421" },
  seoAvance: { type: "help", slug: "11524968" },

  // Funnels
  funnelsIllimites: { type: "help", slug: "11458857" },
  templatesPreConstructs: { type: "help", slug: "10602938" },
  funnelsIA: { type: "help", slug: "12613457" },
  funnelsWebinaires: { type: "help", slug: "11856603" },
  importURL: { type: "help", slug: "7866984" },

  // Formulaires, Quiz & Logique
  formBuilder: { type: "help", slug: "10083202" },
  surveyBuilder: { type: "help", slug: "10083287" },
  champsIllimites: { type: "help", slug: "10083357" },
  conditionalLogic: { type: "help", slug: "2648477" },
  leadForms: { type: "help", slug: "10083202" },
  inlineEmbed: { type: "help", slug: "11363316" },
  quizBuilder: { type: "help", slug: "10806302" },
  branchingLogic: { type: "help", slug: "2648477" },
  scoringTiers: { type: "help", slug: "10807091" },
  resultsPages: { type: "help", slug: "10807091" },
  analyticsQuiz: { type: "help", slug: "11925514" },
  venteScore: { type: "help", slug: "10806908" },

  // QR Codes
  generatricNative: { type: "help", slug: "11798509" },
  qrTypes: { type: "help", slug: "11798509" },
  personnalisationQR: { type: "help", slug: "11798509" },
  exportQR: { type: "help", slug: "11798509" },
  analyticsQR: { type: "help", slug: "11798509" },

  // ==================== CATALOGUE COMPLET - DIFFUSER ====================

  // Inbox Omnichannel
  inboxUnifiee: { type: "help", slug: "10526137" },
  conversationsExperience: { type: "help", slug: "10526137" },
  smsBidirectionnel: { type: "help", slug: "11959134" },
  emailBidirectionnel: { type: "help", slug: "10575248" },
  whatsappBusiness: { type: "help", slug: "11109324" },
  facebookMessenger: { type: "help", slug: "10525960" },
  instagramDM: { type: "help", slug: "10498095" },
  googleBusinessMessages: { type: "help", slug: "10526137" },
  liveChat: { type: "help", slug: "12310579" },
  webchatIntelligent: { type: "help", slug: "12310579" },
  groupChat: { type: "help", slug: "10526137" },
  reponsesRapides: { type: "help", slug: "10526137" },
  multiNumerosSMS: { type: "help", slug: "11782205" },
  composerFullscreen: { type: "help", slug: "10526137" },
  raccourcisClavier: { type: "help", slug: "12613622" },

  // Email Marketing
  envoiMasse: { type: "help", slug: "11459185" },
  campagnesSequencees: { type: "help", slug: "11458277" },
  dripScheduling: { type: "help", slug: "11959134" },
  smartSend: { type: "help", slug: "11959134" },
  optimisationHoraire: { type: "help", slug: "11959134" },
  editeurDragDrop: { type: "help", slug: "11959134" },
  htmlBuilder: { type: "help", slug: "11959134" },
  snippetsReutilisables: { type: "help", slug: "11959134" },
  templates350: { type: "help", slug: "11959134" },
  gestionAbonnements: { type: "help", slug: "10207520" },
  conditionalContentEmail: { type: "help", slug: "12309320" },
  statsIntegrees: { type: "help", slug: "11959134" },
  syncGmailOutlook: { type: "help", slug: "10575248" },

  // SMS Marketing
  smsBidirectionnels: { type: "help", slug: "11959134" },
  campaignesAutomatisees: { type: "help", slug: "11959134" },
  text2Pay: { type: "help", slug: "11959134" },
  rappelsAutomatiques: { type: "help", slug: "11452555" },
  snippetsSMS: { type: "help", slug: "11959134" },
  a2p10dlc: { type: "help", slug: "11782205" },
  conformiteTCPA: { type: "help", slug: "10083104" },
  businessProfileSMS: { type: "help", slug: "11782205" },

  // Social & Diffusion
  publicationsIllimitees: { type: "help", slug: "11452168" },
  multiPlateformes: { type: "help", slug: "10083634" },
  templatesContenu: { type: "help", slug: "11452168" },
  utmTracking: { type: "help", slug: "11397009" },
  linkShortener: { type: "help", slug: "10217584" },

  // Live & Webinar
  webinairesLive: { type: "help", slug: "12339445" },
  salleChat: { type: "help", slug: "12339574" },
  offresPopup: { type: "help", slug: "12339574" },
  replayAutomatique: { type: "help", slug: "12750349" },
  modeEvergreen: { type: "help", slug: "12339737" },

  // ==================== CATALOGUE COMPLET - CONVERTIR ====================

  // Paiements
  stripePaiements: { type: "help", slug: "11959052" },
  paypalIntegration: { type: "help", slug: "10506793" },
  nmiIntegration: { type: "help", slug: "11959052" },
  authorizeIntegration: { type: "help", slug: "11959052" },
  paiementsSecurises: { type: "help", slug: "11959052" },
  paiementsPartiels: { type: "help", slug: "10525985" },
  paiementsAntcipes: { type: "help", slug: "10525985" },
  paiementsRecurrents: { type: "help", slug: "12072281" },

  // Facturation
  invoices: { type: "help", slug: "10483189" },
  estimates: { type: "help", slug: "10483189" },
  conversionEstimate: { type: "help", slug: "10483189" },
  lateFees: { type: "help", slug: "10483189" },
  gracePeriod: { type: "help", slug: "10483189" },
  scheduledInvoices: { type: "help", slug: "10483189" },

  // Produits & Catalogue
  produitsPhysiques: { type: "help", slug: "10111265" },
  produitsDigitaux: { type: "help", slug: "11396871" },
  produitsAbonnements: { type: "help", slug: "12072281" },
  variantes: { type: "help", slug: "10111265" },
  inventoryTracking: { type: "help", slug: "11142730" },
  collectionsManuel: { type: "help", slug: "11142730" },
  smartCollections: { type: "help", slug: "11142730" },
  importStripe: { type: "help", slug: "11959052" },
  pricingSaaS: { type: "help", slug: "10111265" },

  // Checkout & Optimisation
  upsell1click: { type: "help", slug: "10141193" },
  downsell: { type: "help", slug: "10141193" },
  crosssell: { type: "help", slug: "10283788" },
  oto: { type: "help", slug: "10141193" },
  orderBumps: { type: "help", slug: "10283788" },
  checkoutOneStep: { type: "help", slug: "10034926" },
  checkoutTwoSteps: { type: "help", slug: "10034926" },
  orderForm: { type: "help", slug: "10141193" },

  // Ads & Reporting
  adsManager: { type: "help", slug: "10903301" },
  googleAdsCampaigns: { type: "help", slug: "10903301" },
  facebookAdsCampaigns: { type: "help", slug: "10903301" },
  audiences: { type: "help", slug: "10903301" },
  lookalike: { type: "help", slug: "10903301" },
  reportingAds: { type: "help", slug: "11171672" },

  // ==================== CATALOGUE COMPLET - ORCHESTRER ====================

  // CRM & Données
  contactsIllimites: { type: "help", slug: "11958934" },
  champsRichText: { type: "help", slug: "10083357" },
  valeursGlobales: { type: "help", slug: "10460903" },
  objetsPersonnalises: { type: "help", slug: "10083357" },
  fichesCompany: { type: "help", slug: "11958934" },
  relationsContacts: { type: "help", slug: "11525380" },
  rechercheAvancee: { type: "help", slug: "10083179" },
  rechercheRegex: { type: "help", slug: "10083179" },
  smartLists: { type: "help", slug: "10083179" },
  tagsPersonnalisables: { type: "help", slug: "10083155" },
  leadScoringAuto: { type: "help", slug: "10083155" },
  personnalisationDynamique: { type: "help", slug: "10460903" },

  // Pipelines & Opportunités
  pipelinesIllimites: { type: "help", slug: "12017898" },
  pipelinesCampagne: { type: "help", slug: "12017898" },
  opportunitesIllimitees: { type: "help", slug: "11958951" },
  progressionAuto: { type: "help", slug: "12017923" },
  automatisationParcours: { type: "help", slug: "12019430" },
  visualisationTempsReel: { type: "help", slug: "11958951" },
  vueListeOpportunites: { type: "help", slug: "11958951" },
  liaisonDevisFactures: { type: "help", slug: "10483189" },

  // Workflows & Automatisation
  builderVisuel: { type: "help", slug: "12613560" },
  automatisationMultiCanal: { type: "help", slug: "11959156" },
  declencheurConditions: { type: "help", slug: "11363511" },
  actionsConditionnelles: { type: "help", slug: "11363445" },
  webhooks: { type: "help", slug: "10881987" },
  triggerLinksWorkflow: { type: "help", slug: "10207451" },
  notificationsSlack: { type: "help", slug: "11189644" },
  connexionGoogleSheets: { type: "help", slug: "10881987" },
  onboardingClient: { type: "help", slug: "11959156" },
  creationTaches: { type: "help", slug: "12410319" },
  rebillingMarkup: { type: "help", slug: "11959156" },

  // Sécurité, Équipe & Notifications
  permissionsRole: { type: "help", slug: "10825268" },
  auditLogs: { type: "help", slug: "10825268" },
  encryption: { type: "help", slug: "11959052" },
  multiLocalisation: { type: "help", slug: "10825268" },
  taskManagement: { type: "help", slug: "12410319" },
  assignations: { type: "help", slug: "12410319" },
  notificationsComplet: { type: "help", slug: "11189644" },
  tempsReel: { type: "help", slug: "11958660" },

  // ==================== CATALOGUE COMPLET - CROCO AI ====================

  // Conversation AI
  chatSmsIA: { type: "help", slug: "10987958" },
  multiBotsIA: { type: "help", slug: "11978723" },
  intentionRouting: { type: "help", slug: "11978791" },
  reconnaissanceImage: { type: "help", slug: "10988781" },
  reconnaissanceAudio: { type: "help", slug: "10987862" },

  // Voice AI
  appelsEntrants: { type: "help", slug: "10987862" },
  appelsSortants: { type: "help", slug: "10987862" },
  reservationsAuto: { type: "help", slug: "10987862" },
  voixMultilingues: { type: "help", slug: "10987862" },
  sentimentDetection: { type: "help", slug: "10987862" },

  // Workflow AI
  actionsIA: { type: "help", slug: "11978581" },
  analyseSentiment: { type: "help", slug: "11978581" },
  webhooksIA: { type: "help", slug: "10993609" },
  chatgptActions: { type: "help", slug: "11978646" },

  // Review AI
  reponseAutomatique: { type: "help", slug: "11791115" },
  detectionSpam: { type: "help", slug: "11798386" },

  // Agent Studio
  deploiementAgents: { type: "help", slug: "11978723" },
  marketplaceAgents: { type: "help", slug: "11978723" },

  // ==================== ENTÊTE HÉRO (Checklist) ====================

  funnelsIllimitesChecklist: { type: "help", slug: "11458857" },
  formationsOnlineChecklist: { type: "help", slug: "10048760" },
  appMobileChecklistFull: { type: "help", slug: "10199388" },
  crmMainChecklist: { type: "help", slug: "11958934" },
  emailingMainChecklist: { type: "help", slug: "11959134" },
  smsMainChecklist: { type: "help", slug: "11959134" },
  automatisationsChecklist: { type: "help", slug: "11959156" },
  eShopMainChecklist: { type: "help", slug: "11142730" },
  calendrierChecklist: { type: "help", slug: "11958984" },
  avisIAChecklist: { type: "help", slug: "11798386" },

  // ==================== HELP CENTER / SUPPORT ====================

  whatsapp: { type: "help", slug: "11112384" },
  };

  function linkTo(key) {
    const entry = CROCO_LINKS[key];
    if (!entry) return "#";
    if (entry.url) return entry.url;

    const base = BASE[entry.type];
    if (!base) return "#";

    return base + entry.slug;
  }
  
  function linkTarget(key) {
    const entry = CROCO_LINKS[key];
    if (!entry) return "_self";
    return entry.type === "help" ? "_blank" : "_self";
  }

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
      
      // Links
      linkTo,
      linkTarget,
      links: CROCO_LINKS,

      // State
      jsonUrl: cfg.jsonUrl || DEFAULT_JSON_URL,
      loading: true,
      error: "",
      search: "",
      globalSearch: false, // ✅ recherche sur tout le catalogue

      // Phrase post-recherche infructueuse (à afficher conditionnellement)
            matchingTabs() {
        const q = (this.search || "").toLowerCase().trim();
        if (!q) return [];

        const matches = {};

        for (const g of this.groups) {
          const count = (g.items || []).filter(it =>
            (it || "").toLowerCase().includes(q)
          ).length;

          if (count > 0) {
            matches[g.tab] = (matches[g.tab] || 0) + count;
          }
        }

        return Object.entries(matches)
          .map(([tab, count]) => ({ tab, count }))
          .filter(m => m.tab !== this.activeTab) // ⬅️ seulement les autres onglets
          .sort((a, b) => b.count - a.count);
      },


      // Alpine/HTML utilise déjà activeTab. On la définit si absente.
      activeTab: "creer",
      previewLimit:3,

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
          const base = this.globalSearch
            ? this.groups
            : this.groups.filter(g => g.tab === this.activeTab);

          return base.reduce((acc, g) => acc + ((g.items || []).length), 0);
        },


      visibleCount() {
          // nombre total de fonctionnalités visibles après filtre (search)
          const groups = this.filteredGroups();
          return groups.reduce((acc, g) => acc + ((g._items || g.items || []).length), 0);
        },


      // Filtrage principal : groupe par groupe + recherche
      filteredGroups() {
        const q = (this.search || "").toLowerCase().trim();

        // Base : soit tout le catalogue, soit onglet actif seulement
        const base = this.globalSearch
          ? this.groups
          : this.groups.filter(g => g.tab === this.activeTab);

        // Pas de recherche -> pas de _items, on renvoie brut
        if (!q) {
          return base.map(g => {
            const copy = { ...g };
            delete copy._items;
            return copy;
          });
        }

        // Recherche -> filtre items, stocke en _items (pour "voir plus/moins" sur le subset)
        return base
          .map(g => {
            const items = (g.items || []).filter(it => (it || "").toLowerCase().includes(q));
            return { ...g, _items: items };
          })
          .filter(g => (g._items || []).length > 0);
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
