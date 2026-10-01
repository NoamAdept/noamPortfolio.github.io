/* pwn.college profile snapshot */
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
