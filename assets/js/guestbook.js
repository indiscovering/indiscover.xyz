(() => {
  const endpoint = "https://guestbook.indiscover.workers.dev/guestbook";
  const dialog = document.getElementById("guestbook-modal");
  const form = document.getElementById("guestbook-form");
  const name = document.getElementById("guestbook-name");
  const message = document.getElementById("guestbook-message");
  const count = document.getElementById("guestbook-count");
  const submit = document.getElementById("guestbook-submit");
  const feedback = document.getElementById("guestbook-feedback");
  const entries = document.getElementById("guestbook-entries");
  const heading = document.getElementById("guestbook-entries-title");
  let widget = null;
  let loadingWidget = false;
  let token = "";
  let sending = false;
  let loadingEntries = false;

  function updateButton() {
    submit.disabled = sending || !token || !message.value.trim();
  }

  message.addEventListener("input", () => {
    count.textContent = message.value.length + " / 500";
    updateButton();
  });

  function initialiseWidget() {
    if (widget !== null) {
      window.turnstile.reset(widget);
      return;
    }
    if (loadingWidget) return;
    loadingWidget = true;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      window.turnstile.ready(() => {
        loadingWidget = false;
        widget = window.turnstile.render("#guestbook-turnstile", {
          sitekey: "0x4AAAAAAGS-BURutXKMO5on",
          theme: "dark",
          size: "flexible",
          action: "guestbook",
          callback: value => { token = value; updateButton(); },
          "expired-callback": () => { token = ""; updateButton(); },
          "error-callback": () => {
            token = "";
            updateButton();
            feedback.textContent = "verification unavailable. try reopening the guestbook.";
          }
        });
      });
    };
    script.onerror = () => {
      loadingWidget = false;
      script.remove();
      feedback.textContent = "could not load verification. try reopening the guestbook.";
    };
    document.head.append(script);
  }

  async function loadEntries() {
    if (loadingEntries) return;
    loadingEntries = true;
    try {
      const response = await fetch(endpoint, {cache: "no-store", signal: AbortSignal.timeout(12000)});
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data.messages)) throw new Error();
      heading.textContent = "entries / " + String(data.messages.length).padStart(3, "0");
      entries.replaceChildren();
      if (!data.messages.length) entries.textContent = "no messages yet. be the first.";
      for (const item of data.messages) {
        const article = document.createElement("article");
        article.className = "guestbook-entry";
        const header = document.createElement("div");
        header.className = "guestbook-entry-header";
        const alias = document.createElement("strong");
        alias.textContent = item.name;
        const date = document.createElement("time");
        const stamp = new Date(item.created_at * 1000);
        if (Number.isFinite(stamp.getTime())) {
          date.dateTime = stamp.toISOString();
          date.textContent = stamp.toLocaleDateString("en-GB", {day:"2-digit", month:"2-digit", year:"numeric", timeZone:"UTC"}).replaceAll("/", ".");
        }
        const body = document.createElement("p");
        body.textContent = item.message;
        header.append(alias, date);
        article.append(header, body);
        entries.append(article);
      }
    } catch {
      entries.textContent = "could not load entries. try refreshing.";
    } finally {
      loadingEntries = false;
    }
  }

  document.querySelector('[data-modal="guestbook"]').addEventListener("click", () => {
    if (sending) return;
    token = "";
    updateButton();
    initialiseWidget();
    loadEntries();
  });

  document.getElementById("guestbook-refresh").addEventListener("click", loadEntries);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (sending || !token || !message.value.trim()) return;
    sending = true;
    updateButton();
    feedback.textContent = "sending...";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name: name.value, message: message.value, token}),
        signal: AbortSignal.timeout(15000)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        feedback.textContent = data.error || "submission failed. try again.";
        return;
      }
      feedback.textContent = data.status === "pending" ? "message submitted / awaiting moderation." : "message signed. thank you!";
      form.reset();
      count.textContent = "0 / 500";
      await loadEntries();
    } catch {
      feedback.textContent = "could not confirm submission. refresh entries before retrying.";
    } finally {
      token = "";
      sending = false;
      updateButton();
      if (widget !== null) window.turnstile.reset(widget);
    }
  });
})();
