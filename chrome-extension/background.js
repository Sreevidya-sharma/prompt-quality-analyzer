importScripts("user-id.js");

const BASE_URL = "https://prompt-quality-analyzer.onrender.com";
const API_URL = `${BASE_URL}/analyze`;
const API_TIMEOUT_MS = 30000;

console.log("🔥 Background script loaded");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📩 [BG] Message received:", msg);

  if (msg.type === "PING") {
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === "ANALYZE") {
    const prompt = typeof msg.prompt === "string" ? msg.prompt.trim() : "";

    if (!prompt) {
      sendResponse(fallback("Empty prompt"));
      return;
    }

    console.log("🚀 CALLING API:", API_URL);
    console.log("🧠 PROMPT:", prompt);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    (async () => {
      try {
        const userId = await getUserId();

        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({ text: prompt }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("📡 STATUS:", res.status);

        const raw = await res.text();
        console.log("📦 RAW RESPONSE:", raw);

        let data = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch (e) {
          console.error("❌ JSON PARSE ERROR:", e);
          sendResponse(fallback("Invalid JSON from API"));
          return;
        }

        if (!res.ok || !data) {
          console.error("❌ API ERROR:", data || raw);
          sendResponse(fallback("API error"));
          return;
        }

        // ✅ CRITICAL FIX: ensure decision always exists
        if (!data.decision) {
          console.warn("⚠️ Missing decision → fixing");

          data = {
            decision: "review",
            score: data.score || 0,
            reason: data.error || "Invalid response from API",
            suggestion: data.suggestion || "Try rewriting your prompt",
            breakdown: data.breakdown || {
              clarity: 0,
              structure: 0,
              actionability: 0
            }
          };
        }

        console.log("✅ FINAL DATA:", data);
        sendResponse(data);

      } catch (err) {
        clearTimeout(timeoutId);
        console.error("❌ FETCH FAILED:", err);
        sendResponse(fallback("Network error"));
      }
    })();

    return true;
  }
});

function fallback(reason) {
  return {
    decision: "review",
    score: 0,
    reason: reason,
    suggestion: "Check your input or try again",
    breakdown: {
      clarity: 0,
      structure: 0,
      actionability: 0
    }
  };
}