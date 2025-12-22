(() => {
  if (window.__CROCO_BUNDLE_RUNNING__) return;
  window.__CROCO_BUNDLE_RUNNING__ = true;

  console.log("[CROCO] bundle loaded", new Date().toISOString());

  // ✅ ton code ici
})();
