(() => {
  const base = "https://guestbook.indiscover.workers.dev";
  const latest = document.getElementById("transmission-latest");
  const date = document.getElementById("transmission-date");
  const archive = document.getElementById("transmission-entries");
  const stamp = n => new Date(n * 1000).toLocaleString("en-GB", {timeZone:"Europe/London", dateStyle:"medium", timeStyle:"short"}).toLowerCase();
  let loading = false;
  async function transmissions() {
    if (loading) return;
    loading = true;
    try {
      const r = await fetch(base + "/transmissions", {cache:"no-store", signal:AbortSignal.timeout(12000)});
      if (!r.ok) throw Error();
      const d = await r.json();
      if (!Array.isArray(d.transmissions)) throw Error();
      latest.textContent = d.transmissions[0]?.message || "no transmissions yet.";
      date.textContent = d.transmissions.length ? stamp(d.transmissions[0].created_at) : "";
      archive.replaceChildren();
      if (!d.transmissions.length) archive.textContent = "no transmissions yet.";
      for (const item of d.transmissions) {
        const article = document.createElement("article");
        article.className = "guestbook-entry";
        const time = document.createElement("div");
        time.className = "guestbook-small";
        time.textContent = stamp(item.created_at) + (item.updated_at ? " / edited" : "");
        const p = document.createElement("p");
        p.textContent = item.message;
        article.append(time,p);
        archive.append(article);
      }
    } catch { latest.textContent = "transmissions unavailable."; date.textContent = ""; archive.textContent = "could not load transmissions."; }
    finally { loading = false; }
  }
  transmissions();
  document.querySelector('[data-modal="transmissions"]').addEventListener("click", transmissions);
  const dialog = document.getElementById("anonymous-inbox-modal");
  const form = document.getElementById("inbox-form");
  const message = document.getElementById("inbox-message");
  const count = document.getElementById("inbox-count");
  const submit = document.getElementById("inbox-submit");
  const feedback = document.getElementById("inbox-feedback");
  const verification = document.getElementById("inbox-verification");
  const retry = document.getElementById("inbox-retry");
  let widget = null, token = "", sending = false, loadingWidget = false;
  function update() { submit.disabled = sending || !token || !message.value.trim(); count.textContent = message.value.length + " / 1000"; }
  function fail(text) { token = ""; verification.textContent = text; retry.hidden = false; update(); }
  function render() {
    if (!dialog.open) return;
    try {
      if (widget !== null) window.turnstile.remove(widget);
      widget = null; token = ""; retry.hidden = true; verification.textContent = "verifying..."; update();
      widget = window.turnstile.render("#inbox-turnstile", {
        sitekey:"0x4AAAAAAGS-BURutXKMO5on", theme:"dark", size:"flexible", appearance:"interaction-only", action:"inbox",
        callback: value => { token = value; verification.textContent = "verification complete."; retry.hidden = true; update(); },
        "expired-callback": () => fail("verification expired. retry below."),
        "timeout-callback": () => fail("verification timed out. retry below."),
        "error-callback": () => fail("verification failed. retry below.")
      });
    } catch { fail("could not initialise verification."); }
  }
  function initialise() {
    if (window.turnstile?.render) return render();
    if (loadingWidget) return;
    loadingWidget = true;
    verification.textContent = "loading verification...";
    retry.hidden = true;
    const existing = document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
    const script = existing || document.createElement("script");
    const finish = () => { loadingWidget = false; if (window.turnstile?.render) render(); else fail("verification unavailable. retry below."); };
    script.addEventListener("load", finish, {once:true});
    script.addEventListener("error", () => { loadingWidget = false; script.remove(); fail("verification unavailable. retry below."); }, {once:true});
    if (!existing) { script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; script.async = true; document.head.append(script); }
    setTimeout(() => { if (loadingWidget) { loadingWidget = false; if (window.turnstile?.render) render(); else { script.remove(); fail("verification timed out. retry below."); } } }, 15000);
  }
  document.querySelector('[data-modal="anonymous-inbox"]').addEventListener("click", () => { if (!sending) requestAnimationFrame(initialise); });
  dialog.addEventListener("close", () => { token = ""; if (widget !== null && window.turnstile) window.turnstile.remove(widget); widget = null; update(); });
  message.addEventListener("input", update);
  retry.addEventListener("click", initialise);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (sending || !token || !message.value.trim()) return;
    sending = true; update(); feedback.textContent = "transmitting...";
    try {
      const response = await fetch(base + "/inbox", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({message:message.value,token}), signal:AbortSignal.timeout(15000)});
      const data = await response.json();
      if (!response.ok || !data.success) { feedback.textContent = data.error || "submission failed."; return; }
      feedback.textContent = "message received. thank you!";
      form.reset();
    } catch { feedback.textContent = "could not confirm delivery. please don't immediately resend."; }
    finally { sending = false; token = ""; update(); if (dialog.open) render(); }
  });
})();