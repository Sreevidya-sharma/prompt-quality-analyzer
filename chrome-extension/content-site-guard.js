globalThis.__PQA_isAISite = function isAISite() {
  return isAISiteHostname(window.location.hostname);
};
globalThis.__PQA_contentScriptBlocked = !globalThis.__PQA_isAISite();
if (globalThis.__PQA_contentScriptBlocked) {
  console.warn("Extension blocked on non-AI site:", window.location.hostname);
}
