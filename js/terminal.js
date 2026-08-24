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
    unlocked: localStorage.getItem(STORAGE_KEY) === "1",
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
      statusPill.textContent = isUnlocked() ? "ACCESS GRANTED" : "LOCKED";
      statusPill.classList.toggle("unlocked", isUnlocked());
    }
    if (projectsLink) {
      projectsLink.classList.toggle("locked", !isUnlocked());
      projectsLink.setAttribute(
        "title",
        isUnlocked()
          ? "Open projects decompiler"
          : "Solve the CTF or run unlock (if cleared) to access"
      );
    }
    if (dossier) {
      dossier.classList.toggle("open", isUnlocked());
    }
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
    return '<span class="prompt"><span class="host">noam</span>@cyberops:<span class="dim">~</span>$</span>';
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
      '<span class="hint">Type <span class="ok">help</span> for commands. Try <span class="ok">ctf</span> to begin.</span>'
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
        appendLine(
          [
            "Available commands:",
            "  <span class='ok'>whoami</span>          — identity",
            "  <span class='ok'>ls</span>              — list filesystem",
            "  <span class='ok'>cat &lt;file&gt;</span>      — read a file",
            "  <span class='ok'>ctf</span>             — launch challenge menu",
            "  <span class='ok'>hint</span>            — soft nudge",
            "  <span class='ok'>projects</span>        — open decompiler (if unlocked)",
            "  <span class='ok'>resume</span>          — jump to dossier",
            "  <span class='ok'>clear</span>           — clear screen",
            "  <span class='ok'>status</span>          — access state",
            "  <span class='ok'>reset</span>           — clear unlock + re-lock",
            "  <span class='ok'>ascii-chess</span>     — text board for chess CTF",
          ].join("\n")
        );
        shellPrompt();
        break;
      case "whoami":
        appendLine("Noam Yakar — CyberOps / CS + Math @ ASU");
        shellPrompt();
        break;
      case "ls":
        appendLine(
          [
            "drwxr-xr-x  ctf/",
            "-rw-r--r--  about.txt",
            "-rw-r--r--  resume.pdf",
            isUnlocked()
              ? "drwxr-xr-x  projects/"
              : "d---------  projects/  <span class='warn'>[LOCKED]</span>",
            "-rw-r--r--  socials.txt",
          ].join("\n")
        );
        shellPrompt();
        break;
      case "cat":
        catFile(args[0]);
        break;
      case "ctf":
      case "./ctf":
        beginCtf();
        break;
      case "hint":
        appendLine(
          "Crypto: keys live in page source under <span class='warn'>#hiddenData</span>. Chess: mate in 2, queen sacrifices look tasty."
        );
        shellPrompt();
        break;
      case "projects":
        if (!isUnlocked()) {
          appendLine(
            '<span class="err">Permission denied.</span> Solve <span class="ok">ctf</span> first.'
          );
          shellPrompt();
        } else {
          appendLine("Opening /projects …");
          setTimeout(() => {
            window.location.href = "projects.html";
          }, 400);
        }
        break;
      case "resume":
      case "dossier":
        if (!isUnlocked()) {
          appendLine('<span class="err">Dossier encrypted.</span> Clear CTF to decrypt.');
        } else {
          dossier.scrollIntoView({ behavior: "smooth" });
          appendLine("Dossier mounted at #dossier");
        }
        shellPrompt();
        break;
      case "status":
        appendLine(
          isUnlocked()
            ? '<span class="ok">ACCESS GRANTED</span> — projects & dossier available'
            : '<span class="warn">LOCKED</span> — run ctf'
        );
        shellPrompt();
        break;
      case "clear":
        terminalBody.innerHTML = "";
        shellPrompt();
        break;
      case "reset":
        setUnlocked(false);
        appendLine('<span class="warn">Session cleared. Access revoked.</span>');
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
        isUnlocked()
          ? "Cybersecurity enthusiast. Dual-degree CS + Math @ ASU. Internships: Nike, ASU, Radware. CTF competitor."
          : "████████ ████ encrypted — solve ctf ████████"
      );
    } else if (key === "resume.pdf" || key === "resume1.pdf") {
      if (isUnlocked()) {
        appendLine("Opening resume1.pdf …");
        window.open("resume1.pdf", "_blank");
      } else {
        appendLine('<span class="err">Permission denied.</span>');
      }
    } else if (key === "socials.txt") {
      if (isUnlocked()) {
        appendLine(
          "github: https://github.com/NoamAdept\nlinkedin: https://www.linkedin.com/in/noam-yakar/"
        );
      } else {
        appendLine('<span class="err">Permission denied.</span>');
      }
    } else if (key === "projects" || key === "projects/") {
      appendLine("projects is a directory — use <span class='ok'>projects</span>");
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

  function beginCtf() {
    state.mode = "challenge-menu";
    appendLine("Shall we play a game?");
    askInput("[Y / N]", (ans) => {
      if (ans.trim().toUpperCase() === "Y") {
        showChallengeMenu();
      } else {
        appendLine("Maybe next time.");
        startShell();
      }
    });
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
        appendLine('<span class="ok">Correct flag!</span>');
        unlockPortfolio();
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
        appendLine('<span class="ok">Correct moves!</span>');
        unlockPortfolio();
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
    setUnlocked(true);
    lockOverlay.classList.add("active");
    const ring = document.getElementById("lockRing");
    const glyph = document.getElementById("lockGlyph");
    const copy = document.getElementById("lockCopy");
    const sub = document.getElementById("lockSub");

    glyph.textContent = "🔒";
    copy.textContent = "Decrypting dossier…";
    sub.textContent = "scanning /home/noam/*";
    ring.classList.remove("done");

    setTimeout(() => {
      glyph.textContent = "🔓";
      ring.classList.add("done");
      copy.textContent = "Access granted";
      sub.textContent = "projects/ mounted · about decrypted";
      celebrateScan();
    }, 1400);

    setTimeout(() => {
      lockOverlay.classList.remove("active");
      dossier.classList.add("open");
      dossier.scrollIntoView({ behavior: "smooth", block: "start" });
      appendLine(
        '<span class="ok">Unlocked.</span> Dossier online. Run <span class="ok">projects</span> or click Projects.'
      );
      startShell();
    }, 2600);
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

  // Projects nav gate
  if (projectsLink) {
    projectsLink.addEventListener("click", (e) => {
      if (!isUnlocked()) {
        e.preventDefault();
        appendLine(
          '<span class="warn">Projects locked.</span> Run <span class="ok">ctf</span> and clear a challenge.'
        );
        scrollTerminal();
        document.getElementById("terminal")?.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Boot sequence
  function boot() {
    syncChrome();
    const bootFlash = document.getElementById("bootFlash");
    setTimeout(() => bootFlash?.classList.add("hide"), 700);

    const sequence = [
      { cmd: "whoami", out: "Noam Yakar" },
      {
        cmd: "ls -la",
        out: isUnlocked()
          ? "drwxr-xr-x  ctf/\ndrwxr-xr-x  projects/\n-rw-r--r--  about.txt\n-rw-r--r--  resume.pdf"
          : "drwxr-xr-x  ctf/\nd---------  projects/  [LOCKED]\n-rw-------  about.txt  [ENCRYPTED]\n-rw-------  resume.pdf [ENCRYPTED]",
      },
    ];

    let idx = 0;
    function next() {
      if (idx >= sequence.length) {
        if (isUnlocked()) {
          appendLine(
            '<span class="ok">Session restored — ACCESS GRANTED.</span> Type <span class="ok">help</span> or <span class="ok">ctf</span> to replay.'
          );
          dossier.classList.add("open");
        } else {
          appendLine(
            'Challenge ready. Type <span class="ok">ctf</span> to begin — or <span class="ok">help</span>.'
          );
        }
        startShell();
        return;
      }
      const step = sequence[idx++];
      typeCommand(step.cmd, () => {
        appendLine(step.out);
        setTimeout(next, 350);
      });
    }
    setTimeout(next, 850);
  }

  document.getElementById("cta-ctf")?.addEventListener("click", () => {
    document.getElementById("terminal")?.scrollIntoView({ behavior: "smooth" });
    const launch = () => {
      if (state.mode === "shell") {
        appendLine("Launching CTF…");
        beginCtf();
      } else if (state.mode === "boot") {
        setTimeout(launch, 200);
      }
    };
    launch();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
