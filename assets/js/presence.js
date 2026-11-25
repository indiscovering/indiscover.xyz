(() => {
  const dot = document.getElementById("discord-presence");
  const states = ["online", "idle", "dnd", "offline"];
  let pending = false;
  function render(state) {
    const label = "discord: " + (state === "dnd" ? "do not disturb" : state);
    dot.dataset.status = state;
    dot.title = label;
    dot.setAttribute("aria-label", label);
  }
  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    try {
      const response = await fetch("https://api.lanyard.rest/v1/users/345581101302939648", {signal: AbortSignal.timeout(10000), cache: "no-store"});
      if (!response.ok) throw new Error("presence unavailable");
      const result = await response.json();
      const state = result.data?.discord_status;
      render(result.success && states.includes(state) ? state : "unavailable");
      document.dispatchEvent(new CustomEvent("discord-activity", {detail: result.success ? result.data : null}));
    } catch {
      render("unavailable");
      document.dispatchEvent(new CustomEvent("discord-activity", {detail: null}));
    } finally {
      pending = false;
    }
  }
  refresh();
  setInterval(refresh, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
})();