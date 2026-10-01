/* pwn.college profile snapshot — dates = latest activity in that module */
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
  // Ordered by most recent module activity on the public profile (refreshed 2026-10-01)
  recent: [
    {
      title: "Exclusionary globbing",
      dojo: "Computing 101",
      date: "2026-09-30",
      blurb: "Negative globs and path expansions — last clears on Sep 30.",
    },
    {
      title: "level4.1",
      dojo: "Program interaction",
      date: "2026-09-29",
      blurb: "Interaction ladder module — latest submissions Sep 29.",
    },
    {
      title: "Stop, Pop, and ROP II (Hard)",
      dojo: "Memory errors",
      date: "2026-09-28",
      blurb: "Hard ROP set — same day the yellow belt unlocked.",
    },
    {
      title: "Your First Overflow (easy)",
      dojo: "Memory errors",
      date: "2026-09-28",
      blurb: "Overflow module still seeing new clears through belt day.",
    },
    {
      title: "Project 1.0 Intro and Linux",
      dojo: "LecLabs",
      date: "2026-07-24",
      blurb: "Linux fundamentals project track.",
    },
    {
      title: "File Globbing",
      dojo: "Computing 101",
      date: "2026-07-23",
      blurb: "Wildcard mastery that set up the exclusionary set.",
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
    <h3 class="pwn-recent-heading">Recently active modules</h3>
    <p class="pwn-recent-note">Sorted by latest successful submission on the public profile — not first-ever solve.</p>
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
