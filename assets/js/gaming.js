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

  let steam = null, discord = null, sessionStart = null;
  const source = document.getElementById("gaming-source");
  const fallback = document.getElementById("gaming-fallback");
  const session = document.getElementById("gaming-session");
  const sessionRow = session.parentElement;
  const excluded = /^(visual studio(?: code)?|vscode|code|jetbrains.*|intellij idea|pycharm|webstorm|rider|clion|android studio|obs(?: studio)?|spotify|chrome|google chrome|firefox|microsoft edge|opera(?: gx)?|discord|figma|blender|adobe.*|photoshop|premiere pro|notepad\+\+|wallpaper engine|medal|fl studio|ableton live|unity(?: editor)?|unreal engine|roblox studio|browser|terminal|github desktop|cursor|windsurf|microsoft word|microsoft excel)$/i;
  function discordGame(data) {
    if (!data || data.discord_status === "offline" || !Array.isArray(data.activities)) return null;
    return data.activities.find(a => a?.type === 0 && typeof a.name === "string" && a.name.trim() && !excluded.test(a.name.trim())) || null;
  }
  function discordIcon(activity) {
    const app = String(activity.application_id ?? "");
    const asset = activity.assets?.large_image;
    // Only native Discord CDN assets; external proxy artwork is intentionally skipped.
    if (/^\d{15,22}$/.test(app) && typeof asset === "string" && /^\d{15,22}$/.test(asset)) {
      return "https://cdn.discordapp.com/app-assets/" + app + "/" + asset + ".png";
    }
    return null;
  }
  function showIcon(url) {
    icon.hidden = !url;
    fallback.hidden = Boolean(url);
    if (url && icon.getAttribute("src") !== url) icon.src = url;
    if (url && icon.complete && !icon.naturalWidth) { icon.hidden = true; fallback.hidden = false; }
  }
  function tickSession() {
    if (!sessionStart || document.hidden) return;
    const seconds = Math.max(0, Math.floor((Date.now() - sessionStart) / 1000));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = seconds % 60;
    session.textContent = h + "h " + String(m).padStart(2,"0") + "m " + String(s).padStart(2,"0") + "s";
  }
  function renderDiscord(activity) {
    title.textContent = "discord / now playing";
    source.href = "https://discord.com/users/345581101302939648";
    source.textContent = "discord ↗";
    game.textContent = activity.name.toLowerCase();
    status.textContent = "● currently in-game";
    status.classList.add("playing");
    showIcon(discordIcon(activity));
    recentRow.hidden = true;
    totalRow.hidden = true;
    const start = activity.timestamps?.start;
    sessionStart = typeof start === "number" && Number.isFinite(start) && start > 0 && start <= Date.now() ? start : null;
    sessionRow.hidden = !sessionStart;
    stats.hidden = !sessionStart;
    tickSession();
  }
  function choose() {
    if (steam?.status === "playing" && steam.title) return render(steam);
    const activity = discordGame(discord);
    if (activity) return renderDiscord(activity);
    if (steam) render(steam);
  }
  function render(data) {
    source.href = "https://steamcommunity.com/id/indiscover";
    source.textContent = "steam ↗";
    sessionStart = null;
    sessionRow.hidden = true;
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
    showIcon(validIcon ? data.icon : null);
    const presence = ["online","offline","busy","away","snooze","looking to trade","looking to play"].includes(data.presence) ? data.presence : "unknown";
    status.textContent = playing ? "● currently in-game" : !available ? "status unavailable" : presence === "offline" ? "○ offline on steam" : presence === "unknown" ? "status unknown" : "● " + presence + " on steam";
    status.classList.toggle("playing", playing);
    recentRow.hidden = !hasGame || !validMinutes(data.playtime2weeks);
    totalRow.hidden = !hasGame || !validMinutes(data.playtimeTotal);
    if (!recentRow.hidden) recent.textContent = hours(data.playtime2weeks);
    if (!totalRow.hidden) total.textContent = hours(data.playtimeTotal);
    stats.hidden = recentRow.hidden && totalRow.hidden;
  }
  icon.addEventListener("error", () => { icon.hidden = true; fallback.hidden = false; });
  document.addEventListener("discord-activity", event => { discord = event.detail; choose(); });
  setInterval(tickSession, 1000);
  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    try {
      const response = await fetch("https://api.indiscover.workers.dev/steam-status", {signal: AbortSignal.timeout(12000)});
      if (!response.ok) throw new Error("steam unavailable");
      const data = await response.json();
      if (!data || typeof data.status !== "string") throw new Error("invalid response");
      steam = data;
      choose();
    } catch {
      steam = {status:"unavailable"};
      choose();
    } finally { pending = false; }
  }
  refresh();
  setInterval(refresh, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
})();