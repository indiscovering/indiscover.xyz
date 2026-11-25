// UK clock, including daylight saving time.
const clock = document.getElementById("gmt-time");
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London", weekday: "short", day: "numeric",
  month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false
});
function updateClock() {
  const now = new Date();
  clock.textContent = formatter.format(now).toLowerCase();
  clock.dateTime = now.toISOString();
}
updateClock();
setInterval(updateClock, 1000);

document.querySelectorAll("[data-modal]").forEach(button => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.modal + "-modal");
    dialog.showModal();
  });
});
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

// ASCII background effects.
(() => {
  const canvas = document.getElementById("snow");
  const ctx = canvas.getContext("2d");
  const select = document.getElementById("effect-select");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const modes = ["snow", "rain", "stars", "fish", "off"];
  let preference = "snow";
  try {
    const saved = localStorage.getItem("indiscover-effect");
    if (modes.includes(saved)) preference = saved;
  } catch {}
  let mode = "off", particles = [], frame = 0, previous = 0;
  let width = 0, height = 0, elapsed = 0;
  const random = (min, max) => min + Math.random() * (max - min);
  const pick = items => items[Math.floor(Math.random() * items.length)];

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const area = width * height;
    const count = mode === "off" ? 0 :
      mode === "fish" ? Math.min(24, Math.max(5, Math.ceil(area / 75000))) :
      Math.min(240, Math.ceil(area / (mode === "rain" ? 7500 : 10500)));
    particles = Array.from({length: count}, () => ({
      x: random(0, width), y: random(0, height),
      depth: random(.35, 1), phase: random(0, Math.PI * 2),
      direction: Math.random() < .5 ? -1 : 1,
      speed: random(12, 34), kind: Math.floor(random(0, 3)),
      char: pick([".", "*", "+", ":"])
    }));
  }

  function draw(now) {
    const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
    previous = now;
    elapsed += dt;
    ctx.clearRect(0, 0, width, height);
    ctx.textBaseline = "middle";
    for (const p of particles) {
      ctx.globalAlpha = p.depth;
      ctx.fillStyle = "#a9c2ae";
      ctx.font = Math.round(9 + p.depth * 6) + "px monospace";
      if (mode === "snow") {
        p.y += p.speed * p.depth * dt;
        p.x += Math.sin(elapsed * .8 + p.phase) * 9 * dt;
        ctx.fillText(p.char, p.x, p.y);
      } else if (mode === "rain") {
        p.y += (65 + p.speed * 3) * dt;
        p.x -= 12 * dt;
        ctx.fillStyle = "#8ba5b3";
        ctx.fillText(p.depth > .65 ? "|" : ":", p.x, p.y);
      } else if (mode === "stars") {
        ctx.globalAlpha = p.depth * (.4 + .6 * (.5 + .5 * Math.sin(elapsed * .9 + p.phase)));
        ctx.fillStyle = "#c5d2d9";
        ctx.fillText(p.char, p.x, p.y);
      } else if (mode === "fish") {
        const right = ["><>", "><((o>", ">-<>"];
        const left = ["<><", "<o))><", "<>-<"];
        p.x += p.direction * p.speed * dt;
        const tail = Math.sin(elapsed * 4 + p.phase) > 0;
        const fish = p.direction > 0 ? right[p.kind] : left[p.kind];
        ctx.fillText(fish, p.x, p.y + Math.sin(elapsed * .7 + p.phase) * 7);
        if (tail && p.kind === 1) {
          ctx.globalAlpha *= .35;
          ctx.fillText("o", p.x + (p.direction > 0 ? 58 : -12), p.y - 12);
        }
        if (p.x > width + 80) p.x = -80;
        if (p.x < -80) p.x = width + 80;
        continue;
      }
      if (p.y > height + 16) { p.y = -16; p.x = random(0, width); }
      if (p.x < -16) p.x = width + 16;
      if (p.x > width + 16) p.x = -16;
    }
    ctx.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  }

  function sync() {
    cancelAnimationFrame(frame);
    previous = 0;
    ctx.clearRect(0, 0, width, height);
    if (mode !== "off" && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function apply() {
    mode = motion.matches ? "off" : preference;
    select.value = mode;
    select.disabled = motion.matches;
    select.title = motion.matches ? "Disabled by reduced-motion preference" : "Background effect";
    resize();
    sync();
  }

  select.addEventListener("change", () => {
    preference = select.value;
    try { localStorage.setItem("indiscover-effect", preference); } catch {}
    apply();
  });
  motion.addEventListener("change", apply);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("resize", () => { resize(); sync(); });
  apply();
})();
