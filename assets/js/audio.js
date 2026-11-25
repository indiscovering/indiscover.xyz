(() => {
  const title = document.getElementById("audio-title");
  const track = document.getElementById("audio-track");
  const status = document.getElementById("audio-status");
  const base = "https://api.listenbrainz.org/1/user/indiscover/";
  let pending = false;
  let latest = null;
  let failed = false;

  async function readListen(endpoint) {
    const response = await fetch(base + endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error("Listening activity unavailable");
    const data = await response.json();
    if (!Array.isArray(data.payload?.listens)) throw new Error("Invalid response");
    return data.payload.listens[0] || null;
  }

  function relativeTime(timestamp) {
    const minutes = Math.max(0, Math.floor((Date.now() / 1000 - timestamp) / 60));
    if (minutes < 1) return "just now";
    if (minutes < 60) return minutes + (minutes === 1 ? " min ago" : " mins ago");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + (hours === 1 ? " hour ago" : " hours ago");
    const days = Math.floor(hours / 24);
    return days + (days === 1 ? " day ago" : " days ago");
  }

  function render() {
    const metadata = latest?.listen?.track_metadata;
    const playing = !!latest?.playing && !failed;
    title.textContent = playing ? "audio / now playing" : failed ? "audio / listening activity" : "audio / last played";
    status.classList.toggle("playing", playing);
    if (!metadata) {
      track.textContent = failed ? "listening activity unavailable" : "no listens recorded yet";
      status.textContent = failed ? "will retry automatically" : "";
      return;
    }
    track.textContent = metadata.track_name + " — " + metadata.artist_name;
    if (failed) {
      status.textContent = "last known track / update unavailable";
    } else if (playing) {
      status.textContent = "● currently listening";
    } else {
      const timestamp = latest.listen.listened_at;
      status.textContent = Number.isFinite(timestamp) ? "last listened " + relativeTime(timestamp) : "most recent listen";
    }
  }

  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    try {
      const current = await readListen("playing-now");
      if (current?.track_metadata) {
        latest = {listen: current, playing: true};
      } else {
        const last = await readListen("listens?count=1");
        latest = last ? {listen: last, playing: false} : null;
      }
      failed = false;
    } catch (error) {
      failed = true;
    } finally {
      pending = false;
      render();
    }
  }

  refresh();
  setInterval(refresh, 45000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });
})();
