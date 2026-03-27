/**
 * Single source of truth for which hostnames may run extension logic.
 * Used by content scripts (via content-site-guard.js) and the service worker.
 */
function isAISiteHostname(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (!h) return false;
  if (h === "openai.com" || h.endsWith(".openai.com")) return true;
  if (h === "gemini.google.com") return true;
  if (h === "claude.ai" || h.endsWith(".claude.ai")) return true;
  if (h === "poe.com" || h.endsWith(".poe.com")) return true;
  if (h === "perplexity.ai" || h.endsWith(".perplexity.ai")) return true;
  return false;
}
