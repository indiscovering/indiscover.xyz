(() => {
  const windows = [...document.querySelectorAll(".desktop-window")];
  function focusWindow(target) {
    windows.forEach(w => w.classList.toggle("window-focused", w === target));
  }
  document.addEventListener("pointerdown", event => {
    if (event.target.closest("dialog")) return;
    focusWindow(event.target.closest(".desktop-window"));
  });
  document.addEventListener("focusin", event => {
    const win = event.target.closest(".desktop-window");
    if (win) focusWindow(win);
  });
  const favicon = document.querySelector('link[rel="icon"]');
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const on = favicon.href;
  const off = new URL("prompt-off.svg", on).href;
  let timer = null, visible = true;
  function sync() {
    clearInterval(timer);
    favicon.href = on;
    visible = true;
    if (!document.hidden && !motion.matches) {
      timer = setInterval(() => {
        visible = !visible;
        favicon.href = visible ? on : off;
      }, 800);
    }
  }
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  sync();
})();