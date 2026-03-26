/**
 * Injects the same userId the extension uses for /analyze into the hosted dashboard page
 * via postMessage (page scripts cannot access chrome.storage).
 */
(function () {
  chrome.storage.local.get(["user", "userId"], (r) => {
    const fromLogin = r.user && r.user.user_id;
    const id = (fromLogin && String(fromLogin).trim()) || (r.userId && String(r.userId).trim()) || "";
    try {
      window.postMessage(
        { source: "pqa-extension", type: "PQA_USER_ID", userId: id },
        "*",
      );
    } catch (_) {
      /* ignore */
    }
  });
})();
