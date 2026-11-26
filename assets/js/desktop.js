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
  const on = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%223%22%20fill%3D%22%230c0d0e%22%2F%3E%3Cpath%20d%3D%22m6%208%209%208-9%208%22%20fill%3D%22none%22%20stroke%3D%22%23a9c2ae%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22square%22%2F%3E%3Cpath%20d%3D%22M18%2024h9%22%20stroke%3D%22%23a9c2ae%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E";
  const off = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%223%22%20fill%3D%22%230c0d0e%22%2F%3E%3Cpath%20d%3D%22m6%208%209%208-9%208%22%20fill%3D%22none%22%20stroke%3D%22%23a9c2ae%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22square%22%2F%3E%3C%2Fsvg%3E";
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