/**
 * Shared user id (chrome.storage.local + sync migration).
 * Used by background, popup, and must match dashboard-bridge / API x-user-id.
 */
function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["userId", "user"], (local) => {
      const fromLogin = local.user && local.user.user_id;
      if (fromLogin) {
        console.log("[Prompt Quality Helper] userId (from login):", fromLogin);
        return resolve(fromLogin);
      }
      if (local.userId) {
        console.log("[Prompt Quality Helper] userId:", local.userId);
        return resolve(local.userId);
      }
      chrome.storage.sync.get(["userId"], (sync) => {
        const migrated = sync.userId && String(sync.userId).trim();
        const newId = migrated || "user_" + crypto.randomUUID();
        chrome.storage.local.set({ userId: newId }, () => {
          console.log("[Prompt Quality Helper] userId:", newId);
          resolve(newId);
        });
      });
    });
  });
}
