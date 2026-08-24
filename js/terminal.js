/* CyberOps terminal — interactive shell + CTF */
(function () {
  const STORAGE_KEY = "cyberops_unlocked";
  const flagHash =
    "ea3396d401dba439de8968fdef106c655f58a7031bb2a86e509819db872d815d";

  const PIECES = {
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙",
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  };

  // Mate in 2 — White to move
  const CHESS_ROWS = [
    [".", ".", ".", ".", ".", "r", "k", "."],
    ["p", "p", ".", ".", ".", "p", ".", "p"],
    [".", ".", ".", ".", ".", "P", "p", "."],
    [".", ".", ".", ".", ".", ".", "Q", "."],
    ["q", ".", ".", ".", ".", ".", ".", "."],
    [".", ".", ".", ".", ".", ".", ".", "."],
    ["P", ".", ".", ".", ".", "P", "P", "P"],
    [".", ".", ".", ".", ".", "R", "K", "."],
  ];

  const state = {
    unlocked: true,
    mode: "boot", // boot | shell | challenge-menu | crypto | chess
    history: [],
  };

  const terminalBody = document.getElementById("terminal-body");
  const statusPill = document.getElementById("status-pill");
  const projectsLink = document.getElementById("projects-link");
  const dossier = document.getElementById("dossier");
  const lockOverlay = document.getElementById("lockOverlay");

  function isUnlocked() {
    return state.unlocked;
  }

  function setUnlocked(value) {
    state.unlocked = value;
    if (value) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
    syncChrome();
  }

  function syncChrome() {
    if (statusPill) {
      statusPill.textContent = "ONLINE";
      statusPill.classList.add("unlocked");
    }
    if (projectsLink) {
      projectsLink.classList.remove("locked");
      projectsLink.setAttribute("title", "FILEZ — warez board");
    }
    dossier?.classList.add("open");
  }

  function scrollTerminal() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function appendLine(html, className) {
    const line = document.createElement("div");
    line.className = "output-line" + (className ? " " + className : "");
    line.innerHTML = html;
    terminalBody.appendChild(line);
    scrollTerminal();
    return line;
  }

  function promptHtml() {
    return '<span class="prompt"><span class="host">guest</span>@bbs:<span class="dim">/node23</span>&gt;</span>';
  }

  function typeCommand(cmd, then) {
    const line = document.createElement("div");
    line.className = "command-line";
    line.innerHTML = promptHtml() + ' <span class="command"></span>';
    terminalBody.appendChild(line);
    const el = line.querySelector(".command");
    let i = 0;
    function tick() {
      if (i < cmd.length) {
        el.textContent += cmd.charAt(i++);
        scrollTerminal();
        setTimeout(tick, 28);
      } else if (then) {
        setTimeout(then, 220);
      }
    }
    tick();
  }

  function askInput(label, onSubmit) {
    const wrap = document.createElement("div");
    wrap.className = "output-line";
    wrap.innerHTML =
      (label ? `<span class="dim">${label}</span> ` : "") +
      '<input class="terminal-input" type="text" autocomplete="off" spellcheck="false" />';
    terminalBody.appendChild(wrap);
    const input = wrap.querySelector("input");
    input.focus();
    scrollTerminal();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const val = input.value;
        input.disabled = true;
        onSubmit(val);
      } else if (e.key === "ArrowUp" && state.history.length) {
        e.preventDefault();
        input.value = state.history[state.history.length - 1];
      }
    });
    return input;
  }

  function startShell() {
    state.mode = "shell";
    appendLine(
      '<span class="hint">Type <span class="ok">help</span> · <span class="ok">filez</span> · <span class="ok">mail</span></span>'
    );
    shellPrompt();
  }

  function shellPrompt() {
    askInput("", (raw) => {
      const line = raw.trim();
      if (line) state.history.push(line);
      handleCommand(line);
    });
  }

  function handleCommand(raw) {
    const parts = raw.split(/\s+/).filter(Boolean);
    const cmd = (parts[0] || "").toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case "":
        shellPrompt();
        break;
      case "help":
      case "?":
      case "menu":
        appendLine(
          [
            "CYBEROPS BBS — commands",
            "  <span class='ok'>whoami</span>       — handle",
            "  <span class='ok'>ls</span> / <span class='ok'>dir</span>     — filez on this node",
            "  <span class='ok'>cat &lt;file&gt;</span>   — read",
            "  <span class='ok'>filez</span>        — warez board (projects)",
            "  <span class='ok'>mail</span>         — about / resume",
            "  <span class='ok'>dumpster</span>    — rummage",
            "  <span class='ok'>phone</span>        — payphone",
            "  <span class='ok'>planet</span>       — HACK THE PLANET",
            "  <span class='ok'>clear</span>        — wipe screen",
            "  <span class='dim'>undocumented commands exist.</span>",
          ].join("\n")
        );
        shellPrompt();
        break;
      case "whoami":
        appendLine("noam // dual CS+Math @ ASU // nike · radware · junkyard cryptographer");
        shellPrompt();
        break;
      case "ls":
      case "dir":
        appendLine(
          [
            "MAIL     about.txt",
            "MAIL     resume.pdf",
            "FILEZ    projects/",
            "JUNK     dumpster/",
            "PHREAK   payphone.nfo",
          ].join("\n")
        );
        shellPrompt();
        break;
      case "cat":
        catFile(args[0]);
        break;
      case "ctf":
      case "./ctf":
      case "games":
        beginCtf();
        break;
      case "hint":
        appendLine("Globe, dumpster, payphone. Some disks still boot.");
        shellPrompt();
        break;
      case "projects":
      case "filez":
      case "warez":
        appendLine("Connecting to FILEZ…");
        setTimeout(() => {
          window.location.href = "projects.html";
        }, 280);
        break;
      case "resume":
      case "dossier":
      case "about":
      case "mail":
        dossier?.scrollIntoView({ behavior: "smooth" });
        appendLine("Opening MAIL…");
        shellPrompt();
        break;
      case "dumpster":
        window.dispatchEvent(new CustomEvent("cyberops:dumpster"));
        appendLine("You climb into the dumpster.");
        shellPrompt();
        break;
      case "phone":
      case "payphone":
        window.dispatchEvent(new CustomEvent("cyberops:phone"));
        appendLine("Payphone off the hook.");
        shellPrompt();
        break;
      case "planet":
        appendLine('<span class="ok">HACK THE PLANET</span>\nthis is our world now… the world is wired.');
        document.getElementById("gibson")?.scrollIntoView({ behavior: "smooth" });
        shellPrompt();
        break;
      case "status":
        appendLine('<span class="ok">CARRIER DETECTED</span> — node 23 online. nothing locked.');
        shellPrompt();
        break;
      case "clear":
        terminalBody.innerHTML = "";
        shellPrompt();
        break;
      case "reset":
        appendLine('<span class="warn">Nothing to lock. This BBS stays open.</span>');
        shellPrompt();
        break;
      case "ascii-chess":
        appendLine(asciiBoard());
        shellPrompt();
        break;
      default:
        appendLine(
          `<span class="err">command not found:</span> ${escapeHtml(cmd)} — try <span class="ok">help</span>`
        );
        shellPrompt();
    }
  }

  function catFile(name) {
    if (!name) {
      appendLine("usage: cat &lt;file&gt;");
      shellPrompt();
      return;
    }
    const key = name.replace(/^\.\//, "").toLowerCase();
    if (key === "about.txt") {
      appendLine(
        "Cybersecurity junkyard poet. Dual-degree CS + Math @ ASU. Internships: Nike, ASU, Radware. pwn.college regular."
      );
    } else if (key === "resume.pdf" || key === "resume1.pdf") {
      appendLine("Opening coffee-stained resume1.pdf …");
      window.open("resume1.pdf", "_blank");
    } else if (key === "socials.txt") {
      appendLine(
        "github: https://github.com/NoamAdept\nlinkedin: https://www.linkedin.com/in/noam-yakar/"
      );
    } else if (key === "projects" || key === "projects/") {
      appendLine("projects is a directory — use <span class='ok'>filez</span>");
    } else if (key === "payphone.nfo") {
      appendLine("DTMF secrets: 311 · 1995 · 7734 (hELLO). Use the PAYPHONE node.");
    } else {
      appendLine(`cat: ${escapeHtml(name)}: No such file`);
    }
    shellPrompt();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  let eggOpened = false;

  function revealEgg() {
    const term = document.getElementById("terminal");
    if (!term || !terminalBody) return;
    term.hidden = false;
    term.classList.remove("egg-hidden");
    term.classList.add("egg-found");
    closeNearbyModals();
    term.scrollIntoView({ behavior: "smooth", block: "start" });
    if (eggOpened) return;
    eggOpened = true;
    if (state.mode === "boot") {
      terminalBody.innerHTML = "";
      appendLine('<span class="ok">you found it.</span>');
      appendLine("Shall we play a game?");
      startShellSoonThenGames();
    } else if (state.mode === "shell") {
      appendLine('<span class="ok">you found it.</span>');
      beginCtf();
    }
  }

  function startShellSoonThenGames() {
    state.mode = "shell";
    beginCtf();
  }

  function closeNearbyModals() {
    document.getElementById("dumpster-modal")?.classList.remove("open");
    document.getElementById("phone-modal")?.classList.remove("open");
  }

  function beginCtf() {
    state.mode = "challenge-menu";
    appendLine("Hidden board. Crypto or chess — your call.");
    showChallengeMenu();
  }

  function showChallengeMenu() {
    appendLine(
      "Select challenge:\n  <span class='ok'>1</span> — Crypto Challenge\n  <span class='ok'>2</span> — Chess Puzzle\n  <span class='ok'>0</span> — back to shell"
    );
    askInput("Choice:", (choice) => {
      const c = choice.trim();
      if (c === "1") {
        terminalBody.innerHTML = "";
        displayCryptoPuzzle();
      } else if (c === "2") {
        terminalBody.innerHTML = "";
        displayChessPuzzle();
      } else if (c === "0") {
        startShell();
      } else {
        appendLine('<span class="err">Invalid.</span>');
        showChallengeMenu();
      }
    });
  }

  function displayCryptoPuzzle() {
    state.mode = "crypto";
    appendLine("<span class='warn'>Crypto Challenge</span>");
    appendLine(
      "Public & private keys are hidden in the source (<span class='ok'>#hiddenData</span>).\nDecrypt the flag and enter it below."
    );
    askInput("Enter decrypted flag:", (answer) => {
      const inputHash = CryptoJS.SHA256(answer.trim()).toString();
      if (inputHash === flagHash) {
        appendLine('<span class="ok">Nice. You still didn\'t need that to get in.</span>');
        celebrateScan();
        startShell();
      } else {
        appendLine('<span class="err">Incorrect flag.</span> [R]etry / [S]witch to Chess / [Q]uit');
        askInput("R / S / Q:", (choice) => {
          const c = choice.trim().toUpperCase();
          if (c === "R") {
            terminalBody.innerHTML = "";
            displayCryptoPuzzle();
          } else if (c === "S") {
            terminalBody.innerHTML = "";
            displayChessPuzzle();
          } else {
            startShell();
          }
        });
      }
    });
  }

  function asciiBoard() {
    return [
      "Mate in 2. White to move.",
      "   -------------------------",
      "8 | .  .  .  .  .  r  k  . |",
      "7 | p  p  .  .  .  p  .  p |",
      "6 | .  .  .  .  .  P  p  . |",
      "5 | .  .  .  .  .  .  Q  . |",
      "4 | q  .  .  .  .  .  .  . |",
      "3 | .  .  .  .  .  .  .  . |",
      "2 | P  .  .  .  .  P  P  P |",
      "1 | .  .  .  .  .  R  K  . |",
      "   -------------------------",
      "     a  b  c  d  e  f  g  h",
    ].join("\n");
  }

  function buildChessBoardEl() {
    const wrap = document.createElement("div");
    wrap.className = "chess-wrap";

    const board = document.createElement("div");
    board.className = "chess-board";
    board.setAttribute("role", "img");
    board.setAttribute("aria-label", "Chess puzzle: mate in two, white to move");

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement("div");
        const light = (r + c) % 2 === 0;
        sq.className = "sq " + (light ? "light" : "dark");
        const piece = CHESS_ROWS[r][c];
        if (piece !== ".") {
          sq.textContent = PIECES[piece] || piece;
          sq.classList.add(piece === piece.toUpperCase() ? "white-piece" : "black-piece");
        }
        board.appendChild(sq);
      }
    }

    const ref = document.createElement("img");
    ref.src = "chess.png";
    ref.alt = "Chess puzzle reference diagram";
    ref.className = "chess-ref";

    const cap = document.createElement("div");
    cap.className = "chess-caption";
    cap.textContent = "Interactive board + reference diagram. Enter White moves only.";

    wrap.appendChild(board);
    wrap.appendChild(ref);
    wrap.appendChild(cap);
    return wrap;
  }

  function displayChessPuzzle() {
    state.mode = "chess";
    appendLine("<span class='warn'>Chess Challenge</span> — Mate in 2. White to move.");
    terminalBody.appendChild(buildChessBoardEl());
    appendLine(
      '<span class="hint">Example format: <span class="ok">Ka2 Ka3</span> · or type <span class="ok">ascii-chess</span> in shell later</span>'
    );
    askInput("Your moves:", (moves) => {
      const movesNormalized = moves.trim().toLowerCase().replace(/\s+/g, " ");
      if (movesNormalized === "qh6 qg7" || movesNormalized === "qg6 qh7") {
        appendLine('<span class="ok">Mate. Optional high-score logged. Nothing was locked.</span>');
        celebrateScan();
        startShell();
      } else {
        appendLine('<span class="err">Wrong solution.</span> [R]etry / [S]witch to Crypto / [Q]uit');
        askInput("R / S / Q:", (choice) => {
          const c = choice.trim().toUpperCase();
          if (c === "R") {
            terminalBody.innerHTML = "";
            displayChessPuzzle();
          } else if (c === "S") {
            terminalBody.innerHTML = "";
            displayCryptoPuzzle();
          } else {
            startShell();
          }
        });
      }
    });
  }

  function unlockPortfolio() {
    celebrateScan();
    startShell();
  }

  function celebrateScan() {
    // On-brand flash: brief hex rain instead of party confetti
    const rain = document.getElementById("hexRain");
    if (!rain) return;
    rain.innerHTML = "";
    for (let i = 0; i < 28; i++) {
      const span = document.createElement("span");
      span.style.position = "absolute";
      span.style.left = Math.random() * 100 + "%";
      span.style.top = Math.random() * 100 + "%";
      span.style.opacity = String(0.3 + Math.random() * 0.7);
      span.textContent = Math.random().toString(16).slice(2, 6).toUpperCase();
      rain.appendChild(span);
    }
  }

  // Page load: splash only. Terminal stays hidden until the egg is found.
  function boot() {
    syncChrome();
    if (statusPill) {
      statusPill.textContent = "ONLINE";
      statusPill.classList.add("unlocked");
    }
    dossier?.classList.add("open");
    const bootFlash = document.getElementById("bootFlash");
    setTimeout(() => bootFlash?.classList.add("hide"), 900);
  }

  window.addEventListener("cyberops:games", revealEgg);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
