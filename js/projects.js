/* CyberOps projects — decompiler workspace */
(function () {
  const STORAGE_KEY = "cyberops_unlocked";

  const projects = [
    {
      id: "sneakyPixels",
      file: "sneakyPixels.exe",
      title: "sneakyPixels",
      stack: "Python · steganography · image forensics",
      blurb:
        "Hide and recover payloads inside images. Built for CTF-style exfil and classroom demos of covert channels.",
      threat:
        "Demonstrates how benign-looking media can carry executable or credential data past casual inspection.",
      functions: [
        "embed_payload(img, data)",
        "extract_lsb(img)",
        "verify_integrity(hash)",
      ],
      strings: ["PNG", "LSB", "payload", "magic_header"],
      url: "https://github.com/NoamAdept/sneakyPixels",
    },
    {
      id: "honeyTheBackdoor",
      file: "honeyTheBackdoor-.exe",
      title: "honeyTheBackdoor",
      stack: "Python · deception · network monitoring",
      blurb:
        "A honeypot-flavored backdoor lab: lure, observe, and study attacker behavior in a controlled environment.",
      threat:
        "Shows why exposed services need telemetry — and how decoys can burn attacker tooling early.",
      functions: ["start_listener()", "log_session(ip)", "alert_on_pattern()"],
      strings: ["bind", "honeytoken", "callback", "AUTH_FAIL"],
      url: "https://github.com/NoamAdept/honeyTheBackdoor-",
    },
    {
      id: "gradebook",
      file: "aTotallyNormalGradebook-.exe",
      title: "aTotallyNormalGradebook",
      stack: "Web · auth · intentional vulns",
      blurb:
        "Looks like a boring gradebook. Under the hood: teaching surface for auth flaws, injection, and insecure design.",
      threat:
        "Models how 'internal tools' become attack paths when security is an afterthought.",
      functions: ["login(user, pass)", "get_grades(id)", "admin_export()"],
      strings: ["SELECT *", "session_token", "role=student"],
      url: "https://github.com/NoamAdept/aTotallyNormalGradebook-",
    },
    {
      id: "mvpPlot",
      file: "mvpPlot.exe",
      title: "mvpPlot",
      stack: "Data · visualization · Python",
      blurb:
        "Fast plotting / MVP analytics experiments — turning messy datasets into readable signal.",
      threat: "N/A (analytics). Focus: clarity under time pressure.",
      functions: ["load_csv(path)", "plot_series(df)", "export_fig()"],
      strings: ["matplotlib", "pandas", "figsize"],
      url: "https://github.com/NoamYakar23/mvpPlot",
    },
  ];

  const unlocked = localStorage.getItem(STORAGE_KEY) === "1";
  const gate = document.getElementById("gate");
  const app = document.getElementById("decompiler-app");
  const fileList = document.getElementById("file-list");
  const workspaceBody = document.getElementById("workspace-body");
  const tabLabel = document.getElementById("tab-label");
  const openBtn = document.getElementById("open-repo");
  const decompileBtn = document.getElementById("decompile-btn");
  const bar = document.getElementById("decompile-bar");
  const statusPill = document.getElementById("status-pill");

  let active = projects[0];
  let view = "summary"; // summary | pseudocode | strings

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
    renderFileList();
    selectProject(projects[0].id);
  }

  function renderFileList() {
    fileList.innerHTML = "";
    projects.forEach((p) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "file-item" + (p.id === active.id ? " active" : "");
      btn.dataset.id = p.id;
      btn.innerHTML = `<span class="ext">▸</span><span>${p.file}</span>`;
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
    if (tabLabel) tabLabel.textContent = active.file;
  }

  function renderWorkspace() {
    if (!workspaceBody) return;
    if (view === "summary") {
      workspaceBody.innerHTML = `
        <div class="ws-title">${active.title}</div>
        <div class="ws-meta">${active.file} · ${active.stack}</div>
        <div class="ws-block">
          <h4>Summary</h4>
          <p>${active.blurb}</p>
        </div>
        <div class="ws-block">
          <h4>Threat / context</h4>
          <p>${active.threat}</p>
        </div>
        <div class="ws-block">
          <h4>Exports</h4>
          <ul>${active.functions.map((f) => `<li><code>${f}</code></li>`).join("")}</ul>
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
        <div class="ws-title">Pseudocode — ${active.title}</div>
        <div class="ws-meta">Ghidra-style recovery (illustrative)</div>
        <pre class="code-block">${lines}</pre>
      `;
    } else {
      workspaceBody.innerHTML = `
        <div class="ws-title">Strings — ${active.title}</div>
        <div class="ws-meta">xref candidates</div>
        <pre class="code-block">${active.strings.map((s) => `"${s}"`).join("\n")}</pre>
      `;
    }
  }

  function decompileAndOpen() {
    if (!active) return;
    bar?.classList.remove("running");
    void bar?.offsetWidth;
    bar?.classList.add("running");
    decompileBtn.disabled = true;
    decompileBtn.textContent = "Decompiling…";
    setTimeout(() => {
      window.open(active.url, "_blank", "noopener,noreferrer");
      decompileBtn.disabled = false;
      decompileBtn.textContent = "Decompile → GitHub";
      bar?.classList.remove("running");
    }, 1200);
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

  // TAB easter egg still works when a file is selected
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Tab" || e.keyCode === 9) && unlocked && active) {
      // only when focus is inside decompiler, avoid trapping all tabs
      if (!app || app.hidden) return;
      if (!app.contains(document.activeElement) && document.activeElement !== document.body)
        return;
      e.preventDefault();
      decompileAndOpen();
    }
  });

  // Boot flash
  const bootFlash = document.getElementById("bootFlash");
  setTimeout(() => bootFlash?.classList.add("hide"), 600);

  syncChrome();
  if (!unlocked) showGate();
  else showApp();
})();
