/* Quiet Easter egg — Konami only. Not part of the opening UX. */
(function () {
  const flagHash =
    "ea3396d401dba439de8968fdef106c655f58a7031bb2a86e509819db872d815d";

  const PIECES = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  };
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

  const konami = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
  ];
  let idx = 0;
  let opened = false;
  let mode = "idle";

  const panel = () => document.getElementById("egg-terminal");
  const body = () => document.getElementById("terminal-body");

  function append(html) {
    const el = body();
    if (!el) return;
    const line = document.createElement("div");
    line.innerHTML = html;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }

  function ask(label, onSubmit) {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      (label ? `<span class="dim">${label}</span> ` : "") +
      '<input class="terminal-input" type="text" autocomplete="off" spellcheck="false" />';
    body().appendChild(wrap);
    const input = wrap.querySelector("input");
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.disabled = true;
        onSubmit(input.value);
      }
    });
  }

  function openEgg() {
    const p = panel();
    if (!p) return;
    p.classList.add("open");
    p.scrollIntoView({ behavior: "smooth", block: "start" });
    if (opened) return;
    opened = true;
    body().innerHTML = "";
    append('<span class="ok">you found it.</span>');
    append("Shall we play a game?");
    menu();
  }

  function menu() {
    mode = "menu";
    append("1 — crypto · 2 — chess · 0 — quit");
    ask(">", (choice) => {
      const c = choice.trim();
      if (c === "1") cryptoPuzzle();
      else if (c === "2") chessPuzzle();
      else if (c === "0") append('<span class="dim">later.</span>');
      else {
        append('<span class="err">?</span>');
        menu();
      }
    });
  }

  function cryptoPuzzle() {
    mode = "crypto";
    append('<span class="warn">crypto</span> — keys in #hiddenData. enter flag:');
    ask("flag>", (answer) => {
      const hash = CryptoJS.SHA256(answer.trim()).toString();
      if (hash === flagHash) {
        append('<span class="ok">correct. still just an egg.</span>');
      } else {
        append('<span class="err">nope.</span> r = retry · m = menu');
        ask(">", (x) => {
          if (x.trim().toLowerCase() === "r") cryptoPuzzle();
          else menu();
        });
      }
    });
  }

  function buildBoard() {
    const wrap = document.createElement("div");
    wrap.className = "chess-wrap";
    const board = document.createElement("div");
    board.className = "chess-board";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement("div");
        sq.className = "sq " + ((r + c) % 2 === 0 ? "light" : "dark");
        const piece = CHESS_ROWS[r][c];
        if (piece !== ".") {
          sq.textContent = PIECES[piece] || piece;
          sq.classList.add(piece === piece.toUpperCase() ? "white-piece" : "black-piece");
        }
        board.appendChild(sq);
      }
    }
    const img = document.createElement("img");
    img.src = "chess.png";
    img.alt = "Chess reference";
    img.className = "chess-ref";
    wrap.appendChild(board);
    wrap.appendChild(img);
    return wrap;
  }

  function chessPuzzle() {
    mode = "chess";
    append('<span class="warn">chess</span> — mate in 2, white to move.');
    body().appendChild(buildBoard());
    ask("moves>", (moves) => {
      const m = moves.trim().toLowerCase().replace(/\s+/g, " ");
      if (m === "qh6 qg7" || m === "qg6 qh7") {
        append('<span class="ok">mate. egg cleared.</span>');
      } else {
        append('<span class="err">miss.</span> r = retry · m = menu');
        ask(">", (x) => {
          if (x.trim().toLowerCase() === "r") {
            body().innerHTML = "";
            chessPuzzle();
          } else menu();
        });
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const want = konami[idx];
    if (key === want || key === (want && want.toLowerCase())) {
      idx += 1;
      if (idx === konami.length) {
        idx = 0;
        openEgg();
      }
    } else if (e.key !== "Shift") {
      idx = 0;
    }
  });

  window.noamOpenEgg = openEgg;
  if (location.hash === "#egg") {
    document.addEventListener("DOMContentLoaded", openEgg);
  }
})();
