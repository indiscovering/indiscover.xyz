(() => {
  const dialog = document.getElementById("terminal-modal");
  const output = document.getElementById("terminal-output");
  const input = document.getElementById("terminal-input");
  const form = document.getElementById("terminal-form");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const history = [];
  let cursor = 0, draft = "", timer = 0, screen = null, pendingOpen = false;
  const commands = ["help","ls","cat","pwd","whoami","neofetch","nowplaying","date","fortune","echo","effect","screensaver","guestbook","specs","changelog","clear","exit"];
  const files = Object.freeze({
    "readme.txt": "welcome to indiscover.xyz. a little corner of the internet.\nthere is more here than meets the eye.",
    "music.txt": "music is a pretty big deal around here.\ntry nowplaying.",
    "specs.txt": "try specs to view the hardware.",
    "guestbook.txt": "try guestbook to leave a message."
  });
  const fortunes = ["go listen to an album all the way through.","the internet is what you make of it.","there is always time for one more song.","your computer is a very expensive fish tank.","be curious. make things."];
  function print(value, kind = "") {
    const line = document.createElement("div");
    line.className = kind;
    line.textContent = value;
    output.append(line);
    while (output.childElementCount > 150) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  }
  function stopScreen() {
    clearInterval(timer);
    timer = 0;
    if (screen) screen.remove();
    screen = null;
  }
  function open() {
    if (dialog.open || document.querySelector("dialog[open]")) return;
    dialog.showModal();
    input.focus();
    output.scrollTop = output.scrollHeight;
  }
  function openOther(name) {
    const button = document.querySelector('[data-modal="' + name + '"]');
    if (!button) return print("not available.");
    dialog.close();
    button.click();
  }
  function screensaver(kind) {
    stopScreen();
    screen = document.createElement("pre");
    screen.className = "terminal-screen";
    output.append(screen);
    let frame = 0;
    function draw() {
      if (!screen) return;
      if (kind === "fish") {
        const lines = Array.from({length: 5}, (_, i) => {
          const x = (frame + i * 11) % 42;
          return " ".repeat(x) + (i % 2 ? "<o))><" : "><((o>");
        });
        screen.textContent = lines.join("\n");
      } else {
        const grid = Array.from({length: 12}, () => Array(44).fill(" "));
        for (let a = 0; a < Math.PI * 2; a += .12) {
          for (let b = 0; b < Math.PI * 2; b += .19) {
            const x = 2 + Math.cos(a), y = Math.sin(a);
            const u = x * Math.cos(b), v = x * Math.sin(b);
            const q = v * Math.cos(frame * .07) - y * Math.sin(frame * .07);
            const z = v * Math.sin(frame * .07) + y * Math.cos(frame * .07) + 7;
            const xx = Math.round(22 + 42 * u / z), yy = Math.round(6 + 17 * q / z);
            if (grid[yy] && xx >= 0 && xx < 44) grid[yy][xx] = ".,:;=!*#@"[Math.max(0, Math.min(8, Math.floor((Math.sin(a + b + frame * .07) + 1) * 4)))];
          }
        }
        screen.textContent = grid.map(row => row.join("")).join("\n");
      }
      frame++;
    }
    draw();
    if (!motion.matches && !document.hidden) timer = setInterval(draw, 100);
    output.scrollTop = output.scrollHeight;
  }
  function run(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    stopScreen();
    print("guest@indiscover:~$ " + trimmed, "terminal-command");
    const [name, ...args] = trimmed.split(/\s+/);
    const arg = args.join(" ");
    switch (name.toLowerCase()) {
      case "help": print("commands:\n" + commands.join("  ") + "\n\nup/down: history | tab: autocomplete\ntry ls, then cat readme.txt"); break;
      case "ls": print(Object.keys(files).join("  ")); break;
      case "cat": print(Object.hasOwn(files, arg) ? files[arg] : "cat: file not found"); break;
      case "pwd": print("/home/guest"); break;
      case "whoami": print("guest / internet wanderer"); break;
      case "neofetch": print("  /\\     guest@indiscover\n /  \\    ----------------\n/____\\   os: internet\n| [] |   shell: browser\n|____|   theme: terminal\n         version: 2.3"); break;
      case "nowplaying": print(document.getElementById("audio-title").textContent + "\n" + document.getElementById("audio-track").textContent.trim() + "\n" + document.getElementById("audio-status").textContent); break;
      case "date": print(new Date().toLocaleString("en-GB", {timeZone:"Europe/London"})); break;
      case "fortune": print(fortunes[Math.floor(Math.random()*fortunes.length)]); break;
      case "echo": print(arg); break;
      case "effect": {
        const select = document.getElementById("effect-select");
        if (!["snow","rain","stars","fish","off"].includes(arg)) { print("effect: snow | rain | stars | fish | off"); break; }
        if (select.disabled) { print("effects disabled by reduced-motion preference."); break; }
        select.value = arg;
        select.dispatchEvent(new Event("change"));
        print("effect: " + arg);
        break;
      }
      case "screensaver": print("type any command to stop."); screensaver("donut"); break;
      case "guestbook": openOther("guestbook"); break;
      case "specs": openOther("pc-specs"); break;
      case "changelog": openOther("changelog"); break;
      case "clear": output.replaceChildren(); break;
      case "exit": dialog.close(); break;
      case "fish": print("you have discovered the fish."); screensaver("fish"); break;
      case "909": print("daft punk day.\n       /\\___/\\\n      ( o   o )\n       (  ^  )\n       /     \\\n      | robot |"); break;
      case "club": print("membership granted.\n[ certified internet creature ]\nyou know something they don't."); break;
      case "sudo": print("nice try. this is a website, not a linux box."); break;
      default: print(name + ": command not found");
    }
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const raw = input.value;
    input.value = "";
    if (!raw.trim()) return;
    if (history[history.length - 1] !== raw) history.push(raw);
    if (history.length > 50) history.shift();
    cursor = history.length;
    draft = "";
    run(raw);
  });
  input.addEventListener("keydown", event => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (cursor === history.length) draft = input.value;
      if (cursor > 0) input.value = history[--cursor];
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (cursor < history.length) cursor++;
      input.value = cursor === history.length ? draft : history[cursor];
    } else if (event.key === "Tab" && input.value.trim() && !/\s/.test(input.value)) {
      const matches = commands.filter(command => command.startsWith(input.value.toLowerCase()));
      if (!matches.length) return;
      event.preventDefault();
      if (matches.length === 1) input.value = matches[0];
      else print(matches.join("  "));
    }
  });
  dialog.addEventListener("close", stopScreen);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopScreen(); });
  motion.addEventListener("change", () => { if (motion.matches) stopScreen(); });
  document.getElementById("terminal-trigger").addEventListener("click", open);
  document.addEventListener("keydown", event => {
    if (event.ctrlKey && event.shiftKey && event.code === "Backquote") {
      event.preventDefault();
      if (dialog.open) dialog.close(); else open();
    }
  });
  print("indiscover shell / v2.3\nwelcome, guest.\ntype help to get started.");
})();
