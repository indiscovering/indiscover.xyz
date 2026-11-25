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

  const verification = document.getElementById("guestbook-verification");
  const retry = document.getElementById("guestbook-retry");

  function verificationError(text) {
    token = "";
    updateButton();
    verification.textContent = text;
    retry.hidden = false;
  }

  function renderWidget() {
    if (!dialog.open) return;
    try {
      if (widget !== null) window.turnstile.remove(widget);
      widget = null;
      token = "";
      updateButton();
      verification.textContent = "verifying...";
      retry.hidden = true;
      widget = window.turnstile.render("#guestbook-turnstile", {
        sitekey: "0x4AAAAAAGS-BURutXKMO5on",
        theme: "dark",
        size: "normal",
        appearance: "interaction-only",
        execution: "render",
        action: "guestbook",
        callback: value => {
          token = value;
          verification.textContent = "verification complete.";
          retry.hidden = true;
          updateButton();
        },
        "expired-callback": () => verificationError("verification expired. retry below."),
        "timeout-callback": () => verificationError("verification timed out. retry below."),
        "error-callback": code => {
          verificationError("verification failed (" + code + "). retry below.");
        }
      });
      if (widget == null) verificationError("could not create verification widget.");
    } catch (error) {
      console.error("Guestbook Turnstile:", error);
      verificationError("could not initialise verification. check browser console.");
    }
  }

  function initialiseWidget() {
    if (window.turnstile && typeof window.turnstile.render === "function") {
      renderWidget();
      return;
    }
    if (loadingWidget) return;
    loadingWidget = true;
    verification.textContent = "loading verification...";
    retry.hidden = true;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      loadingWidget = false;
      if (!window.turnstile) {
        script.remove();
        verificationError("verification script did not initialise.");
        return;
      }
      renderWidget();
    };
    script.onerror = () => {
      loadingWidget = false;
      script.remove();
      verificationError("verification script blocked or unavailable.");
    };
    document.head.append(script);
  }

  retry.addEventListener("click", initialiseWidget);

  async function loadEntries() {
    if (loadingEntries) return;
    loadingEntries = true;
    if (!entries.querySelector(".guestbook-entry")) {
      const spinner = document.createElement("span");
      spinner.className = "ascii-loader";
      spinner.setAttribute("aria-hidden", "true");
      entries.replaceChildren(spinner, document.createTextNode(" loading..."));
    }
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
    requestAnimationFrame(initialiseWidget);
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
      if (widget !== null && dialog.open) renderWidget();
    }
  });
})();
