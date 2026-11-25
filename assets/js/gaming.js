(() => {
  const title = document.getElementById("gaming-title");
  const game = document.getElementById("gaming-track");
  const status = document.getElementById("gaming-status");
  const icon = document.getElementById("gaming-icon");
  const stats = document.getElementById("gaming-stats");
  const recent = document.getElementById("gaming-recent");
  const total = document.getElementById("gaming-total");
  const recentRow = recent.parentElement;
  const totalRow = total.parentElement;
  let pending = false;
  const validMinutes = n => typeof n === "number" && Number.isFinite(n) && n >= 0;
  const hours = n => (n / 60).toLocaleString("en-GB", {minimumFractionDigits:1, maximumFractionDigits:1}) + " hrs";
  function render(data) {
    const playing = data.status === "playing";
    const available = data.status !== "unavailable";
    const hasGame = available && typeof data.title === "string" && data.title.trim();
    title.textContent = "steam / " + (playing ? "now playing" : hasGame ? "recently played" : "activity");
    game.replaceChildren();
    const appid = String(data.appid ?? "");
    if (hasGame && /^\d+$/.test(appid)) {
      const link = document.createElement("a");
      link.href = "https://store.steampowered.com/app/" + appid + "/";
      link.textContent = data.title.toLowerCase();
      game.append(link);
    } else {
      game.textContent = hasGame ? data.title.toLowerCase() : available ? "no recent games" : "gaming activity unavailable";
    }
    const validIcon = hasGame && /^\d+$/.test(appid) && typeof data.icon === "string" && data.icon.startsWith("https://media.steampowered.com/steamcommunity/public/images/apps/" + appid + "/") && /^[a-f0-9]{40}\.jpg$/i.test(data.icon.split("/").pop());
    icon.hidden = !validIcon;
    if (validIcon && icon.getAttribute("src") !== data.icon) icon.src = data.icon;
    const presence = ["online","offline","busy","away","snooze","looking to trade","looking to play"].includes(data.presence) ? data.presence : "unknown";
    status.textContent = playing ? "● currently in-game" : !available ? "status unavailable" : presence === "offline" ? "○ offline on steam" : presence === "unknown" ? "status unknown" : "● " + presence + " on steam";
    status.classList.toggle("playing", playing);
    recentRow.hidden = !hasGame || !validMinutes(data.playtime2weeks);
    totalRow.hidden = !hasGame || !validMinutes(data.playtimeTotal);
    if (!recentRow.hidden) recent.textContent = hours(data.playtime2weeks);
    if (!totalRow.hidden) total.textContent = hours(data.playtimeTotal);
    stats.hidden = recentRow.hidden && totalRow.hidden;
  }
  icon.addEventListener("error", () => { icon.hidden = true; });
  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    try {
      const response = await fetch("https://api.indiscover.workers.dev/steam-status", {signal: AbortSignal.timeout(12000)});
      if (!response.ok) throw new Error("steam unavailable");
      const data = await response.json();
      if (!data || typeof data.status !== "string") throw new Error("invalid response");
      render(data);
    } catch {
      render({status:"unavailable"});
    } finally { pending = false; }
  }
  refresh();
  setInterval(refresh, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
})();