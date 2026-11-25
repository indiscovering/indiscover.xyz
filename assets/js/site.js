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

// Sparse ASCII snowfall.
const canvas = document.getElementById("snow");
const ctx = canvas.getContext("2d");
const toggle = document.getElementById("snow-toggle");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
let enabled = !motion.matches;
let flakes = [];
let frame = 0;
let previous = 0;

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  flakes = Array.from({length: Math.min(160, Math.ceil(innerWidth * innerHeight / 10000))}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 9 + Math.random() * 18,
    drift: Math.random() * 8 - 4,
    char: [".", "*", "+", ":"][Math.floor(Math.random() * 4)]
  }));
}
function draw(now) {
  const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
  previous = now;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "13px monospace";
  ctx.fillStyle = "#a9c2ae";
  for (const flake of flakes) {
    flake.y += flake.speed * dt;
    flake.x += flake.drift * dt;
    if (flake.y > canvas.height + 12) {
      flake.y = -12;
      flake.x = Math.random() * canvas.width;
    }
    if (flake.x < -12) flake.x = canvas.width;
    if (flake.x > canvas.width + 12) flake.x = 0;
    ctx.fillText(flake.char, flake.x, flake.y);
  }
  frame = requestAnimationFrame(draw);
}
function syncSnow() {
  cancelAnimationFrame(frame);
  previous = 0;
  toggle.textContent = enabled ? "snow: on" : "snow: off";
  toggle.setAttribute("aria-pressed", String(enabled));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (enabled && !document.hidden) frame = requestAnimationFrame(draw);
}
toggle.addEventListener("click", () => { enabled = !enabled; syncSnow(); });
motion.addEventListener("change", () => { enabled = !motion.matches; syncSnow(); });
document.addEventListener("visibilitychange", syncSnow);
window.addEventListener("resize", resize);
resize();
syncSnow();
