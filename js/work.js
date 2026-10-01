/* Shared project catalog + Faav-style list rendering */
window.NOAM_PROJECTS = [
  {
    id: "piSdrAcademy",
    featured: true,
    highlight: true,
    passion: true,
    title: "pi-sdr-academy — offline Pi SDR lab",
    meta: "Python · Raspberry Pi · DSP / SDR",
    desc: "The project I am building hardest right now: a self-contained Raspberry Pi laboratory for systems, DSP, and software-defined radio with dojo-style progression.",
    tags: ["SDR", "DSP", "hardware", "passion"],
    url: "https://github.com/NoamAdept/pi-sdr-academy",
    highlights: [
      "Offline lab modules on real hardware",
      "Bridges RF, signals, and software",
      "Belt / academy structure for deliberate practice",
    ],
  },
  {
    id: "gradebook",
    featured: true,
    highlight: true,
    title: "aTotallyNormalGradebook — WarGames CTF",
    meta: "Python · teaching CTF",
    desc: "Terminal hacking simulation: infiltrate a “secure” gradebook and study auth / design flaws.",
    tags: ["CTF", "Python", "AppSec"],
    url: "https://github.com/NoamAdept/aTotallyNormalGradebook-",
    highlights: [
      "Interactive teaching narrative",
      "Most-starred NoamAdept project",
      "Auth and design-flaw focus",
    ],
  },
  {
    id: "libCanary",
    featured: true,
    highlight: true,
    title: "libCanary — custom stack canaries",
    meta: "C · systems security",
    desc: "Native stack-canary implementation exploring how runtime guards detect stack-smashing and harden binaries.",
    tags: ["C", "memory safety", "mitigations"],
    url: "https://github.com/NoamAdept/libCanary",
    highlights: [
      "Custom canary init / check path",
      "Teaching artifact for exploit mitigation",
      "Focus on overflow detection mechanics",
    ],
  },
  {
    id: "leakyFeistel",
    featured: true,
    highlight: true,
    title: "leakyFeistel — fixed-key Feistel recovery",
    meta: "C++ · crypto research",
    desc: "Demonstrates how a Feistel cipher with no key schedule leaks enough intermediate state to recover the key.",
    tags: ["C++", "Feistel", "research"],
    url: "https://github.com/NoamAdept/leakyFeistel",
    highlights: [
      "Chosen-plaintext key recovery",
      "Weak key-schedule lesson",
      "Clear C++ write-up",
    ],
  },
  {
    id: "provenance",
    featured: true,
    highlight: false,
    title: "provenance — encrypt, verify, sign",
    meta: "CLI · crypto tooling",
    desc: "Command-line tool to encrypt files, verify integrity, track versions, and optionally sign artifacts.",
    tags: ["crypto", "integrity", "CLI"],
    url: "https://github.com/NoamAdept/provenance",
    highlights: [
      "Encryption + hash verification",
      "Artifact version tracking",
      "Optional signing",
    ],
  },
  {
    id: "perturbedNN",
    featured: false,
    highlight: false,
    title: "perturbedNN — adversarial examples",
    meta: "Python · adversarial ML",
    desc: "Survey of perturbation methods that push a neural net into misclassifying images.",
    tags: ["ML", "security"],
    url: "https://github.com/NoamAdept/perturbedNN",
    highlights: ["Perturbation survey", "Robustness lens on ML"],
  },
  {
    id: "chunkyMonkey",
    featured: false,
    title: "chunkyMonkey — packet chunker / reassembler",
    meta: "Python · networking",
    desc: "Real-time packet chunking and reassembly tooling for network forensics intuition.",
    tags: ["packets", "forensics"],
    url: "https://github.com/NoamAdept/chunkyMonkey",
    highlights: ["Chunk / reassemble pipeline"],
  },
  {
    id: "redAlertRPI",
    featured: false,
    title: "redAlertRPI — Pi alert receiver",
    meta: "C · embedded",
    desc: "Raspberry Pi application that receives and surfaces emergency red alerts.",
    tags: ["embedded", "C"],
    url: "https://github.com/NoamAdept/redAlertRPI",
    highlights: ["Real-time alert path on RPi"],
  },
  {
    id: "honeyTheBackdoor",
    featured: false,
    title: "honeyTheBackdoor — Flask injection demo",
    meta: "Python · AppSec",
    desc: "Concise demonstration of injecting code into a Flask app and why trust boundaries matter.",
    tags: ["Flask", "AppSec"],
    url: "https://github.com/NoamAdept/honeyTheBackdoor-",
    highlights: ["Unsafe sink → RCE narrative"],
  },
  {
    id: "sneakyPixels",
    featured: false,
    title: "sneakyPixels — image steganography",
    meta: "HTML · steganography",
    desc: "Encode and decode secret messages in images (LSB-style covert channels).",
    tags: ["stego", "web"],
    url: "https://github.com/NoamAdept/sneakyPixels",
    highlights: ["Browser encode / decode demo"],
  },
  {
    id: "zipCracker",
    featured: false,
    title: "ZIP Blaster — crack + scan archives",
    meta: "Python · Flask · ClamAV",
    desc: "Dictionary attacks on password ZIPs with malware scanning and job history.",
    tags: ["forensics", "Flask"],
    url: "https://github.com/NoamAdept/zipCracker.github.io",
    highlights: ["fcrackzip + ClamAV integration"],
  },
  {
    id: "diffieCulty",
    featured: false,
    title: "diffie-culty — DHKE CTF modules",
    meta: "Python · crypto CTF",
    desc: "Challenges examining weaknesses in Diffie–Hellman key exchange.",
    tags: ["DHKE", "CTF"],
    url: "https://github.com/NoamAdept/diffie-culty.github.io",
    highlights: ["Hands-on weak-parameter labs"],
  },
];

window.renderProjectCards = function (el, { featuredOnly = false, highlightOnly = false, excludeHighlight = false } = {}) {
  if (!el) return;
  let items = window.NOAM_PROJECTS.slice();
  if (highlightOnly) items = items.filter((p) => p.highlight);
  else if (featuredOnly) items = items.filter((p) => p.featured);
  if (excludeHighlight) items = items.filter((p) => !p.highlight);

  if (highlightOnly) {
    // Passion project first, then the rest
    items = [
      ...items.filter((p) => p.passion),
      ...items.filter((p) => !p.passion),
    ];
    el.innerHTML = items
      .map(
        (p, i) => `
      <a class="highlight-card accent-${i % 4}${p.passion ? " highlight-passion" : ""}" href="${p.url}" target="_blank" rel="noopener noreferrer">
        <span class="highlight-kicker">${p.passion ? "Currently building" : "Highlighted"}</span>
        <h3 class="highlight-title">${escapeHtml(p.title)}</h3>
        <p class="highlight-meta">${escapeHtml(p.meta)}</p>
        <p class="highlight-desc">${escapeHtml(p.desc)}</p>
        <ul class="highlight-list">
          ${(p.highlights || [])
            .slice(0, 2)
            .map((h) => `<li>${escapeHtml(h)}</li>`)
            .join("")}
        </ul>
        <span class="highlight-cta">View on GitHub →</span>
      </a>`
      )
      .join("");
    return;
  }

  el.innerHTML = items
    .map(
      (p) => `
    <a class="post-card" href="${p.url}" target="_blank" rel="noopener noreferrer">
      <span class="post-meta">${escapeHtml(p.meta)}</span>
      <h2 class="post-title">${escapeHtml(p.title)}</h2>
      <p class="post-desc">${escapeHtml(p.desc)}</p>
      <div class="post-tags">${p.tags
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join("")}</div>
    </a>`
    )
    .join("");
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
  const work = document.getElementById("work-list");
  if (work) window.renderProjectCards(work, { featuredOnly: true });

  const featured = document.getElementById("featured-projects");
  if (featured) window.renderProjectCards(featured, { highlightOnly: true });

  const all = document.getElementById("all-projects");
  if (all) window.renderProjectCards(all, { excludeHighlight: true });

  const detail = document.getElementById("project-detail");
  const pick =
    window.NOAM_PROJECTS.find((p) => p.passion) ||
    window.NOAM_PROJECTS.find((p) => p.highlight) ||
    window.NOAM_PROJECTS.find((p) => p.featured) ||
    window.NOAM_PROJECTS[0];
  if (detail && pick) {
    detail.innerHTML = `
      <h3>${escapeHtml(pick.title)}</h3>
      <div class="meta">${escapeHtml(pick.meta)}</div>
      <p>${escapeHtml(pick.desc)}</p>
      <h4>Highlights</h4>
      <ul>${pick.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join("")}</ul>
      <div class="btn-row" style="margin-top:1rem">
        <a class="btn btn-accent" href="${pick.url}" target="_blank" rel="noopener noreferrer">View on GitHub</a>
      </div>`;
  }
});
