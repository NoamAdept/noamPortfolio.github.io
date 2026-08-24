/* Gibson jack-in: planet nodes, dumpster dive, payphone */
(function () {
  const dumpsterLoot = [
    { id: "pizza", label: "greasy pizza box — 'HACKERS extra large'", payload: "Nothing but oregano. Keep digging." },
    { id: "floppy", label: "3.5\" floppy: WAR_GAMES.BAS", payload: "egg", egg: true },
    { id: "printout", label: "dot-matrix printout (smeared)", payload: "Nike · Radware · ASU. Dual-degree CS + Math. That's the real loot." },
    { id: "resume", label: "★ coffee-stained RESUME.PDF", payload: "resume", special: true },
    { id: "sticker", label: "peeled 'HACK THE PLANET' sticker", payload: "This is our world now. Click FILEZ for the warez board." },
  ];

  const phoneSecret = "311"; // NYC payphone energy
  let dialed = "";

  function $(id) {
    return document.getElementById(id);
  }

  function openModal(id) {
    const el = $(id);
    if (!el) return;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    const focusable = el.querySelector("button, a, input");
    focusable?.focus();
  }

  function closeModal(id) {
    const el = $(id);
    if (!el) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
  }

  function beep(freq, ms) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, ms || 120);
    } catch (_) {
      /* audio optional */
    }
  }

  document.querySelectorAll("[data-node]").forEach((node) => {
    node.addEventListener("click", () => {
      const kind = node.getAttribute("data-node");
      beep(kind === "games" ? 220 : 440, 80);
      if (kind === "mail") {
        $("dossier")?.scrollIntoView({ behavior: "smooth" });
      } else if (kind === "filez") {
        window.location.href = "projects.html";
      } else if (kind === "dumpster") {
        window.dispatchEvent(new CustomEvent("cyberops:dumpster"));
      } else if (kind === "phone") {
        window.dispatchEvent(new CustomEvent("cyberops:phone"));
      } else if (kind === "games") {
        document.getElementById("terminal")?.scrollIntoView({ behavior: "smooth" });
        window.dispatchEvent(new CustomEvent("cyberops:games"));
      }
    });
  });

  window.addEventListener("cyberops:dumpster", () => {
    renderDumpster();
    openModal("dumpster-modal");
  });

  window.addEventListener("cyberops:phone", () => {
    dialed = "";
    if ($("phone-screen")) $("phone-screen").textContent = "_";
    if ($("phone-msg")) $("phone-msg").textContent = "…";
    openModal("phone-modal");
  });

  function renderDumpster() {
    const pile = $("dump-pile");
    if (!pile) return;
    pile.innerHTML = "";
    dumpsterLoot.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dump-item" + (item.special ? " found" : "");
      btn.textContent = item.label;
      btn.addEventListener("click", () => {
        const msg = $("dump-msg");
        if (item.egg) {
          if (msg) msg.textContent = "The disk spins up…";
          setTimeout(() => window.dispatchEvent(new CustomEvent("cyberops:games")), 350);
        } else if (item.special) {
          if (msg) msg.textContent = "Jackpot. Opening the coffee-stained resume…";
          setTimeout(() => window.open("resume1.pdf", "_blank", "noopener"), 400);
        } else if (msg) {
          msg.textContent = item.payload;
        }
      });
      pile.appendChild(btn);
    });
  }

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close-modal")));
  });

  document.querySelectorAll(".hack-modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal("dumpster-modal");
      closeModal("phone-modal");
    }
  });

  document.querySelectorAll("[data-digit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = btn.getAttribute("data-digit");
      if (d === "clr") {
        dialed = "";
      } else if (d === "snd") {
        if (dialed === "1995") {
          $("phone-msg").textContent = "1995. The line opens a back channel…";
          beep(880, 200);
          setTimeout(() => window.dispatchEvent(new CustomEvent("cyberops:games")), 400);
        } else if (dialed === phoneSecret || dialed === "7734") {
          $("phone-msg").textContent =
            "Line's hot. Operator's not listening. MAIL and FILEZ are already yours.";
          beep(880, 200);
        } else {
          $("phone-msg").textContent = "BUSY SIGNAL.";
          beep(140, 300);
        }
      } else {
        if (dialed.length < 6) dialed += d;
        const f = [0, 697, 770, 852, 941];
        beep(f[Number(d) % 4 + 1] || 440, 90);
      }
      if ($("phone-screen")) $("phone-screen").textContent = dialed || "_";
    });
  });
  const konami = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  let konamiIdx = 0;
  document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const want = konami[konamiIdx];
    const match = key === want || key === want.toLowerCase();
    if (match) {
      konamiIdx += 1;
      if (konamiIdx === konami.length) {
        konamiIdx = 0;
        window.dispatchEvent(new CustomEvent("cyberops:games"));
      }
    } else if (e.key !== "Shift") {
      konamiIdx = 0;
    }
  });
})();
