/* pwn.college profile snapshot — update when you earn a new belt / binge solves */
window.PWN_COLLEGE = {
  handle: "noamyakar23",
  profileUrl: "https://pwn.college/hacker/noamyakar23",
  belt: {
    color: "yellow",
    label: "Yellow Belt",
    earned: "2026-09-28",
    image: "img/pwncollege-yellow-belt.svg",
  },
  stats: {
    modules: "58 / 232",
    challenges: "≈2.9k solves",
    note: "Progress across dojos · public profile",
  },
  recent: [
    {
      title: "Exclusionary globbing",
      dojo: "Linux / shell",
      date: "2026-09-30",
      blurb: "Path expansions and negative globs under pressure.",
    },
    {
      title: "level4.1",
      dojo: "Program interaction",
      date: "2026-09-29",
      blurb: "Next rung on the interaction ladder.",
    },
    {
      title: "Stop, Pop, and ROP II (Hard)",
      dojo: "Binary exploitation",
      date: "2026-09-28",
      blurb: "ROP chain work the same day the yellow belt dropped.",
    },
    {
      title: "File Globbing",
      dojo: "Linux / shell",
      date: "2026-07-23",
      blurb: "Shell wildcard mastery before the exclusionary set.",
    },
    {
      title: "Your First Overflow (easy)",
      dojo: "Binary exploitation",
      date: "2025-01-21",
      blurb: "Classic stack smash warmup.",
    },
    {
      title: "Assembly Crash Course",
      dojo: "Fundamentals",
      date: "2025-03-20",
      blurb: "Registers, calling conventions, and reading disasm.",
    },
  ],
};

window.renderPwnCollege = function (root) {
  if (!root || !window.PWN_COLLEGE) return;
  const d = window.PWN_COLLEGE;
  const belt = d.belt;

  root.innerHTML = `
    <div class="pwn-hero">
      <div class="pwn-belt-wrap">
        <img class="pwn-belt" src="${escapePc(belt.image)}" alt="${escapePc(belt.label)}" width="320" height="106" />
        <span class="pwn-belt-badge">${escapePc(belt.label)}</span>
      </div>
      <div class="pwn-hero-copy">
        <p class="pwn-eyebrow">pwn.college</p>
        <h2 class="pwn-title">@${escapePc(d.handle)}</h2>
        <p class="pwn-lead">
          Dojo progression with a freshly earned
          <strong>${escapePc(belt.label)}</strong>
          <span class="pwn-muted">· earned ${escapePc(formatPcDate(belt.earned))}</span>
        </p>
        <div class="pwn-stats">
          <div class="pwn-stat">
            <span class="pwn-stat-value">${escapePc(d.stats.modules)}</span>
            <span class="pwn-stat-label">Modules touched</span>
          </div>
          <div class="pwn-stat">
            <span class="pwn-stat-value">${escapePc(d.stats.challenges)}</span>
            <span class="pwn-stat-label">Challenge solves</span>
          </div>
          <div class="pwn-stat">
            <span class="pwn-stat-value">${escapePc(belt.color)}</span>
            <span class="pwn-stat-label">Current belt</span>
          </div>
        </div>
        <a class="btn btn-accent" href="${escapePc(d.profileUrl)}" target="_blank" rel="noopener noreferrer">Open public profile</a>
      </div>
    </div>
    <h3 class="pwn-recent-heading">Recently solved</h3>
    <div class="pwn-recent-grid">
      ${d.recent
        .map(
          (c, i) => `
        <article class="pwn-solve${i === 0 ? " pwn-solve-latest" : ""}">
          <div class="pwn-solve-top">
            <span class="pwn-solve-dojo">${escapePc(c.dojo)}</span>
            <time class="pwn-solve-date" datetime="${escapePc(c.date)}">${escapePc(formatPcDate(c.date))}</time>
          </div>
          <h4 class="pwn-solve-title">${escapePc(c.title)}</h4>
          <p class="pwn-solve-blurb">${escapePc(c.blurb)}</p>
        </article>`
        )
        .join("")}
    </div>
  `;
};

function formatPcDate(iso) {
  const d = new Date(iso + (iso.length <= 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function escapePc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
  window.renderPwnCollege(document.getElementById("pwncollege-root"));
});
