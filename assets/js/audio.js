(() => {
  const title = document.getElementById("audio-title");
  const track = document.getElementById("audio-track");
  const status = document.getElementById("audio-status");
  const progressBox = document.getElementById("audio-progress");
  const progress = document.getElementById("track-progress");
  const elapsed = document.getElementById("elapsed");
  const duration = document.getElementById("duration");
  const cover = document.getElementById("audio-cover");
  const coverFallback = document.getElementById("audio-cover-fallback");
  let coverUrl = null;
  cover.addEventListener("load", () => { cover.hidden = false; coverFallback.hidden = true; });
  cover.addEventListener("error", () => { cover.hidden = true; coverFallback.hidden = false; });
  function showCover(value) {
    let url = null;
    try { const parsed = new URL(value); if (parsed.origin === "https://i.scdn.co" && /^\/image\/[a-zA-Z0-9]+$/.test(parsed.pathname)) url = parsed.href; } catch {}
    if (url === coverUrl) return;
    coverUrl = url;
    cover.hidden = true;
    coverFallback.hidden = false;
    if (url) cover.src = url; else cover.removeAttribute("src");
  }
  const endpoint = "https://api.indiscover.workers.dev/now-playing";
  let latest = null;
  let pending = false;
  let failed = false;
  let retryAt = 0;

  function time(ms) {
    const seconds = Math.floor(Math.max(0, ms) / 1000);
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  }

  function relativeTime(value) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return "most recent listen";
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes === 0) return "last played just now";
    if (minutes < 60) return "last played " + minutes + (minutes === 1 ? " min ago" : " mins ago");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return "last played " + hours + (hours === 1 ? " hour ago" : " hours ago");
    const days = Math.floor(hours / 24);
    return "last played " + days + (days === 1 ? " day ago" : " days ago");
  }

  function trackUrl(value) {
    try {
      const url = new URL(value);
      if (url.origin === "https://open.spotify.com" && /^\/track\/[a-zA-Z0-9]+$/.test(url.pathname)) return url.href;
    } catch {}
    return null;
  }

  function tick() {
    if (!latest || failed) return;
    if (latest.status === "last-played") {
      status.textContent = relativeTime(latest.playedAt);
    }
    if (progressBox.hidden) return;
    const delta = latest.status === "playing" ? Math.max(0, Date.now() - latest.fetchedAt) : 0;
    const position = Math.max(0, Math.min(latest.duration, latest.progress + delta));
    progress.max = latest.duration;
    progress.value = position;
    elapsed.textContent = time(position);
    duration.textContent = time(latest.duration);
  }

  function render() {
    const playing = !failed && latest?.status === "playing";
    const paused = !failed && latest?.status === "paused";
    title.textContent = "audio / " + (playing ? "now playing" : paused ? "paused" : failed || latest?.status === "unavailable" ? "listening activity" : "last played");
    status.classList.toggle("playing", playing);
    progressBox.hidden = !(playing || paused) || !Number.isFinite(latest?.duration) || latest.duration <= 0 || !Number.isFinite(latest.progress) || !Number.isFinite(latest.fetchedAt);
    showCover(latest?.artwork);
    const url = trackUrl(latest?.url);
    track.replaceChildren();
    if (latest?.title && latest?.artist) {
      const text = (latest.title + " — " + latest.artist).toLowerCase();
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.textContent = text;
        track.append(link);
      } else {
        track.textContent = text;
      }
    } else {
      track.textContent = failed || latest?.status === "unavailable" ? "listening activity unavailable" : "no recent tracks";
    }
    status.textContent = failed ? (latest?.title ? "last known track / update unavailable" : "will retry automatically") :
      playing ? "● currently listening" : paused ? "Ⅱ paused" :
      latest?.status === "last-played" ? relativeTime(latest.playedAt) :
      latest?.status === "unavailable" ? "not available right now" : "not listening";
    tick();
  }

  async function refresh() {
    if (pending || document.hidden || Date.now() < retryAt) return;
    pending = true;
    try {
      const response = await fetch(endpoint, {signal: AbortSignal.timeout(10000)});
      if (!response.ok) {
        retryAt = Date.now() + 60000;
        throw new Error("Playback unavailable");
      }
      const data = await response.json();
      if (!["playing", "paused", "last-played", "offline", "unavailable"].includes(data.status)) throw new Error("Invalid playback response");
      latest = data;
      failed = false;
    } catch {
      failed = true;
      retryAt = Date.now() + 60000;
    } finally {
      pending = false;
      render();
    }
  }

  refresh();
  setInterval(refresh, 15000);
  setInterval(() => { if (!document.hidden) tick(); }, 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { tick(); refresh(); }
  });
})();
