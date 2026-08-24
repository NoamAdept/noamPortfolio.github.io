/* CyberOps projects — featured highlights + decompiler workspace */
(function () {
  const STORAGE_KEY = "cyberops_unlocked";

  const projects = [
    {
      id: "libCanary",
      file: "libCanary.so",
      title: "libCanary",
      featured: true,
      badge: "Systems security",
      stack: "C · memory safety · stack protection",
      blurb:
        "Custom stack canary implementation exploring how runtime guards detect stack-smashing attempts and harden native binaries.",
      threat:
        "Demonstrates defense-in-depth against buffer overflows — the class of bugs behind decades of remote code execution.",
      highlights: [
        "Native C implementation of stack canaries",
        "Focus on exploit mitigation mechanics",
        "Useful teaching / research artifact for systems security",
      ],
      functions: ["canary_init()", "canary_check()", "report_corruption()"],
      strings: ["__stack_chk", "canary", "SIGABRT", "corrupt"],
      url: "https://github.com/NoamAdept/libCanary",
    },
    {
      id: "piSdrAcademy",
      file: "pi-sdr-academy.bin",
      title: "pi-sdr-academy",
      featured: true,
      badge: "SDR / systems lab",
      stack: "Python · Raspberry Pi · DSP · SDR",
      blurb:
        "Offline Raspberry Pi laboratory for systems, digital signal processing, and software-defined radio — structured like a dojo / belt academy.",
      threat:
        "Builds hands-on RF and systems intuition without depending on cloud labs — portable, reproducible training environment.",
      highlights: [
        "Self-contained Pi lab for DSP & SDR",
        "Dojo-style progression for systems skills",
        "Bridges hardware, signals, and software",
      ],
      functions: ["init_lab()", "run_module(belt)", "capture_iq()"],
      strings: ["RTL-SDR", "DSP", "belt", "offline"],
      url: "https://github.com/NoamAdept/pi-sdr-academy",
    },
    {
      id: "provenance",
      file: "provenance.cli",
      title: "provenance",
      featured: true,
      badge: "Crypto tooling",
      stack: "CLI · encryption · integrity · signing",
      blurb:
        "Command-line tool to encrypt files, verify integrity, track versions, and optionally sign artifacts — practical cryptography for real workflows.",
      threat:
        "Addresses supply-chain and tampering risk: prove what changed, who signed it, and that contents were not altered.",
      highlights: [
        "Encrypt + integrity verification",
        "Version tracking for artifacts",
        "Optional cryptographic signing",
      ],
      functions: ["encrypt(path)", "verify(hash)", "sign(artifact)"],
      strings: ["AES", "SHA-256", "signature", "manifest"],
      url: "https://github.com/NoamAdept/provenance",
    },
    {
      id: "leakyFeistel",
      file: "leakyFeistel.exe",
      title: "leakyFeistel",
      featured: true,
      badge: "Crypto research",
      stack: "C++ · Feistel ciphers · key recovery",
      blurb:
        "Shows how a Feistel cipher with a fixed round key (no key schedule) leaks enough intermediate state for an attacker to recover the key.",
      threat:
        "Classic lesson in cryptographic engineering: weak key schedules turn “encryption” into a recoverable puzzle.",
      highlights: [
        "Chosen-plaintext key recovery demo",
        "Fixed-key Feistel vulnerability",
        "Clear research write-up in C++",
      ],
      functions: ["feistel_encrypt()", "leak_round()", "recover_key()"],
      strings: ["Feistel", "round_key", "intermediate", "plaintext"],
      url: "https://github.com/NoamAdept/leakyFeistel",
    },
    {
      id: "gradebook",
      file: "aTotallyNormalGradebook-.exe",
      title: "aTotallyNormalGradebook",
      featured: true,
      badge: "Most starred · teaching CTF",
      stack: "Python · WarGames-inspired · terminal CTF",
      blurb:
        "Terminal hacking simulation inspired by WarGames: infiltrate a “secure” gradebook, bypass controls, and access classified records.",
      threat:
        "Models how playful internal tools become attack surfaces when auth and design are treated as afterthoughts.",
      highlights: [
        "Interactive teaching CTF",
        "Auth / design-flaw narrative",
        "Highest-starred NoamAdept project",
      ],
      functions: ["login(user, pass)", "get_grades(id)", "admin_export()"],
      strings: ["Shall we play a game?", "session_token", "role=student"],
      url: "https://github.com/NoamAdept/aTotallyNormalGradebook-",
    },
    {
      id: "perturbedNN",
      file: "perturbedNN.py",
      title: "perturbedNN",
      featured: false,
      badge: "Adversarial ML",
      stack: "Python · neural nets · adversarial examples",
      blurb:
        "Survey of perturbation methods that push a neural network into misclassifying images — practical adversarial ML exploration.",
      threat:
        "Shows why ML systems in security-sensitive pipelines need robustness testing, not just accuracy metrics.",
      highlights: [
        "Image misclassification attacks",
        "Perturbation method survey",
        "Security lens on ML reliability",
      ],
      functions: ["perturb(img)", "evaluate(model)", "compare_methods()"],
      strings: ["FGSM", "perturbation", "misclassify", "epsilon"],
      url: "https://github.com/NoamAdept/perturbedNN",
    },
    {
      id: "chunkyMonkey",
      file: "chunkyMonkey.exe",
      title: "chunkyMonkey",
      featured: false,
      badge: "Networking",
      stack: "Python · packets · reassembly",
      blurb:
        "Real-time packet chunker and reassembler — tooling for understanding how fragmented network payloads are rebuilt.",
      threat:
        "Packet fragmentation and reassembly are classic evasion and analysis surfaces in network defense.",
      highlights: [
        "Real-time chunking / reassembly",
        "Network forensics friendly",
        "Practical protocol intuition",
      ],
      functions: ["chunk(packet)", "reassemble(stream)", "flush_buffer()"],
      strings: ["chunk", "seq", "reassemble", "MTU"],
      url: "https://github.com/NoamAdept/chunkyMonkey",
    },
    {
      id: "redAlertRPI",
      file: "redAlertRPI.bin",
      title: "redAlertRPI",
      featured: false,
      badge: "Embedded",
      stack: "C · Raspberry Pi · alerting",
      blurb:
        "Raspberry Pi application that receives and surfaces emergency red alerts — embedded systems with a real-world operational purpose.",
      threat:
        "Reliability and timely delivery matter: alert pipelines are safety-adjacent systems.",
      highlights: [
        "Embedded C on Raspberry Pi",
        "Real-time alert reception",
        "Hardware-adjacent software",
      ],
      functions: ["poll_alerts()", "notify()", "persist_event()"],
      strings: ["alert", "GPIO", "poll", "RPi"],
      url: "https://github.com/NoamAdept/redAlertRPI",
    },
    {
      id: "honeyTheBackdoor",
      file: "honeyTheBackdoor-.exe",
      title: "honeyTheBackdoor",
      featured: false,
      badge: "AppSec demo",
      stack: "Python · Flask · code injection",
      blurb:
        "Demonstration of injecting code into a Flask app — a concise lesson in insecure patterns and why input trust boundaries matter.",
      threat:
        "Shows how a single unsafe sink in a web app becomes remote code execution.",
      highlights: [
        "Flask injection demo",
        "Teaching-focused AppSec",
        "Clear exploit narrative",
      ],
      functions: ["start_listener()", "inject(payload)", "log_session(ip)"],
      strings: ["Flask", "eval", "callback", "AUTH_FAIL"],
      url: "https://github.com/NoamAdept/honeyTheBackdoor-",
    },
    {
      id: "sneakyPixels",
      file: "sneakyPixels.exe",
      title: "sneakyPixels",
      featured: false,
      badge: "Steganography",
      stack: "HTML · steganography · image forensics",
      blurb:
        "Web app to encode and decode secret messages in images (LSB-style steganography), inspired by Hackers (1995).",
      threat:
        "Benign-looking media can carry covert channels past casual inspection.",
      highlights: [
        "Encode / decode in images",
        "Covert-channel teaching tool",
        "Browser-friendly demo",
      ],
      functions: ["embed_payload(img, data)", "extract_lsb(img)", "verify_integrity(hash)"],
      strings: ["PNG", "LSB", "payload", "magic_header"],
      url: "https://github.com/NoamAdept/sneakyPixels",
    },
    {
      id: "zipCracker",
      file: "zipCracker.web",
      title: "ZIP Blaster",
      featured: false,
      badge: "Forensics tooling",
      stack: "Python · Flask · fcrackzip · ClamAV",
      blurb:
        "Web app for dictionary attacks on password-protected ZIPs, malware scanning with ClamAV, and tracking previously processed archives.",
      threat:
        "Password-protected archives are a common phishing / malware delivery wrapper — tooling helps defenders inspect them safely.",
      highlights: [
        "Dictionary ZIP recovery",
        "ClamAV malware scan integration",
        "Processing history",
      ],
      functions: ["crack_zip(path)", "scan_malware()", "log_job()"],
      strings: ["fcrackzip", "ClamAV", "dictionary", "ZIP"],
      url: "https://github.com/NoamAdept/zipCracker.github.io",
    },
    {
      id: "diffieCulty",
      file: "diffie-culty.ctf",
      title: "diffie-culty",
      featured: false,
      badge: "Crypto CTF",
      stack: "Python · Diffie–Hellman · CTF modules",
      blurb:
        "Set of CTF challenges examining weaknesses in Diffie–Hellman key exchange — learn crypto by breaking it.",
      threat:
        "DH misconfiguration and parameter weakness remain practical attack surfaces.",
      highlights: [
        "Hands-on DHKE challenges",
        "Weakness-focused curriculum",
        "Interactive crypto learning",
      ],
      functions: ["gen_params()", "derive_shared()", "exploit_weak_p()"],
      strings: ["DHKE", "modulus", "shared_secret", "CTF"],
      url: "https://github.com/NoamAdept/diffie-culty.github.io",
    },
  ];

  const unlocked = localStorage.getItem(STORAGE_KEY) === "1";
  const gate = document.getElementById("gate");
  const app = document.getElementById("decompiler-app");
  const featuredGrid = document.getElementById("featured-grid");
  const fileList = document.getElementById("file-list");
  const workspaceBody = document.getElementById("workspace-body");
  const tabLabel = document.getElementById("tab-label");
  const openBtn = document.getElementById("open-repo");
  const decompileBtn = document.getElementById("decompile-btn");
  const bar = document.getElementById("decompile-bar");
  const statusPill = document.getElementById("status-pill");

  let active = projects[0];
  let view = "summary";

  function syncChrome() {
    if (statusPill) {
      statusPill.textContent = unlocked ? "ACCESS GRANTED" : "LOCKED";
      statusPill.classList.toggle("unlocked", unlocked);
    }
  }

  function showGate() {
    if (gate) gate.hidden = false;
    if (app) app.hidden = true;
  }

  function showApp() {
    if (gate) gate.hidden = true;
    if (app) app.hidden = false;
    renderFeatured();
    renderFileList();
    selectProject(projects[0].id);
  }

  function renderFeatured() {
    if (!featuredGrid) return;
    const featured = projects.filter((p) => p.featured);
    featuredGrid.innerHTML = featured
      .map(
        (p) => `
      <article class="project-card${p.id === active.id ? " is-active" : ""}" data-id="${p.id}">
        <div class="project-card-top">
          <span class="project-badge">${escapeHtml(p.badge)}</span>
        </div>
        <h3 class="project-card-title">${escapeHtml(p.title)}</h3>
        <p class="project-card-stack">${escapeHtml(p.stack)}</p>
        <p class="project-card-blurb">${escapeHtml(p.blurb)}</p>
        <ul class="project-card-points">
          ${p.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join("")}
        </ul>
        <div class="project-card-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-inspect="${p.id}">Inspect</button>
          <a class="btn btn-primary btn-sm" href="${p.url}" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </article>`
      )
      .join("");

    featuredGrid.querySelectorAll("[data-inspect]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectProject(btn.getAttribute("data-inspect"));
        document.getElementById("decompiler-panel")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });

    featuredGrid.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("a, button")) return;
        selectProject(card.dataset.id);
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderFileList() {
    if (!fileList) return;
    fileList.innerHTML = "";
    projects.forEach((p) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "file-item" + (p.id === active.id ? " active" : "");
      btn.dataset.id = p.id;
      btn.innerHTML = `<span class="ext">${p.featured ? "★" : "▸"}</span><span>${p.file}</span>`;
      btn.addEventListener("click", () => selectProject(p.id));
      li.appendChild(btn);
      fileList.appendChild(li);
    });
  }

  function selectProject(id) {
    active = projects.find((p) => p.id === id) || projects[0];
    view = "summary";
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.view === view);
    });
    renderFileList();
    renderWorkspace();
    renderFeatured();
    if (tabLabel) tabLabel.textContent = active.file;
  }

  function renderWorkspace() {
    if (!workspaceBody) return;
    if (view === "summary") {
      workspaceBody.innerHTML = `
        <div class="ws-title">${escapeHtml(active.title)}</div>
        <div class="ws-meta">${escapeHtml(active.file)} · ${escapeHtml(active.stack)}</div>
        <div class="ws-block">
          <h4>Summary</h4>
          <p>${escapeHtml(active.blurb)}</p>
        </div>
        <div class="ws-block">
          <h4>Why it matters</h4>
          <p>${escapeHtml(active.threat)}</p>
        </div>
        <div class="ws-block">
          <h4>Highlights</h4>
          <ul>${active.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join("")}</ul>
        </div>
        <div class="ws-block">
          <h4>Exports</h4>
          <ul>${active.functions.map((f) => `<li><code>${escapeHtml(f)}</code></li>`).join("")}</ul>
        </div>
      `;
    } else if (view === "pseudocode") {
      const lines = active.functions
        .map(
          (f, i) =>
            `${String(i + 10).padStart(2, "0")}  def ${f.replace("()", "(…)")}:\n${String(i + 11).padStart(2, "0")}      # recovered from ${active.file}\n${String(i + 12).padStart(2, "0")}      …`
        )
        .join("\n\n");
      workspaceBody.innerHTML = `
        <div class="ws-title">Pseudocode — ${escapeHtml(active.title)}</div>
        <div class="ws-meta">Illustrative recovery view</div>
        <pre class="code-block">${escapeHtml(lines)}</pre>
      `;
    } else {
      workspaceBody.innerHTML = `
        <div class="ws-title">Strings — ${escapeHtml(active.title)}</div>
        <div class="ws-meta">xref candidates</div>
        <pre class="code-block">${active.strings.map((s) => `"${escapeHtml(s)}"`).join("\n")}</pre>
      `;
    }
  }

  function decompileAndOpen() {
    if (!active) return;
    bar?.classList.remove("running");
    void bar?.offsetWidth;
    bar?.classList.add("running");
    if (decompileBtn) {
      decompileBtn.disabled = true;
      decompileBtn.textContent = "Opening…";
    }
    setTimeout(() => {
      window.open(active.url, "_blank", "noopener,noreferrer");
      if (decompileBtn) {
        decompileBtn.disabled = false;
        decompileBtn.textContent = "Open on GitHub";
      }
      bar?.classList.remove("running");
    }, 900);
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      view = tab.dataset.view;
      document.querySelectorAll(".tab").forEach((t) =>
        t.classList.toggle("active", t === tab)
      );
      renderWorkspace();
    });
  });

  openBtn?.addEventListener("click", () => {
    if (active) window.open(active.url, "_blank", "noopener,noreferrer");
  });

  decompileBtn?.addEventListener("click", decompileAndOpen);

  document.addEventListener("keydown", (e) => {
    if ((e.key === "Tab" || e.keyCode === 9) && unlocked && active) {
      if (!app || app.hidden) return;
      if (!app.contains(document.activeElement) && document.activeElement !== document.body)
        return;
      e.preventDefault();
      decompileAndOpen();
    }
  });

  const bootFlash = document.getElementById("bootFlash");
  setTimeout(() => bootFlash?.classList.add("hide"), 500);

  syncChrome();
  if (!unlocked) showGate();
  else showApp();
})();
