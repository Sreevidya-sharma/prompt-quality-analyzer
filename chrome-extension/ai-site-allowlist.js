function isAISiteHostname(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (!h) return false;

  // ✅ ChatGPT (IMPORTANT FIX)
  if (h === "chatgpt.com" || h.endsWith(".chatgpt.com")) return true;
  if (h === "chat.openai.com" || h.endsWith(".openai.com")) return true;

  // ✅ Gemini
  if (h === "gemini.google.com") return true;

  // ✅ Claude
  if (h === "claude.ai" || h.endsWith(".claude.ai")) return true;

  // ✅ Poe
  if (h === "poe.com" || h.endsWith(".poe.com")) return true;

  // ✅ Perplexity
  if (h === "perplexity.ai" || h.endsWith(".perplexity.ai")) return true;

  return false;
}