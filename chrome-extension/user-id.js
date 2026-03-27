function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["email", "userId"], (res) => {

      if (res.email && typeof res.email === "string" && res.email.trim()) {
        resolve(res.email.trim());
        return;
      }

      if (res.userId && typeof res.userId === "string") {
        resolve(res.userId);
        return;
      }

      const newId = crypto.randomUUID();

      chrome.storage.local.set({ userId: newId }, () => {
        resolve(newId);
      });

    });
  });
}
