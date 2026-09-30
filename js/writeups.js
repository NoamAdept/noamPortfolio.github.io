/* Writeups list + markdown post rendering */
(function () {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function parseFrontmatter(raw) {
    if (!raw.startsWith("---")) {
      return { meta: {}, body: raw };
    }
    const end = raw.indexOf("\n---", 3);
    if (end === -1) return { meta: {}, body: raw };
    const block = raw.slice(3, end).trim();
    const body = raw.slice(end + 4).replace(/^\s*\n/, "");
    const meta = {};
    block.split("\n").forEach((line) => {
      const i = line.indexOf(":");
      if (i === -1) return;
      const key = line.slice(0, i).trim();
      let val = line.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    });
    return { meta, body };
  }

  async function loadManifest() {
    const res = await fetch("manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load writeups/manifest.json");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function renderList() {
    const el = document.getElementById("writeups-list");
    if (!el) return;
    try {
      const items = await loadManifest();
      items.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      if (!items.length) {
        el.innerHTML =
          '<p class="lead">No writeups yet. Add a markdown file and list it in <code>manifest.json</code>.</p>';
        return;
      }
      el.innerHTML = items
        .map(
          (w) => `
        <a class="post-card" href="post.html?slug=${encodeURIComponent(w.slug)}">
          <span class="post-meta">${escapeHtml(formatDate(w.date))}</span>
          <h2 class="post-title">${escapeHtml(w.title || w.slug)}</h2>
          <p class="post-desc">${escapeHtml(w.description || "")}</p>
        </a>`
        )
        .join("");
    } catch (err) {
      el.innerHTML = `<p class="lead err-msg">${escapeHtml(err.message)}</p>`;
    }
  }

  async function renderPost() {
    const article = document.getElementById("writeup-body");
    if (!article) return;

    const params = new URLSearchParams(location.search);
    const slug = params.get("slug");
    if (!slug || !/^[a-zA-Z0-9._-]+$/.test(slug)) {
      article.innerHTML = '<p>Missing or invalid <code>slug</code>.</p>';
      return;
    }

    try {
      const [manifest, mdRes] = await Promise.all([
        loadManifest().catch(() => []),
        fetch(`${slug}.md`, { cache: "no-store" }),
      ]);
      if (!mdRes.ok) throw new Error(`Writeup not found: ${slug}.md`);
      const raw = await mdRes.text();
      const { meta, body } = parseFrontmatter(raw);
      const listed = manifest.find((w) => w.slug === slug) || {};
      const title = meta.title || listed.title || slug;
      const date = meta.date || listed.date || "";
      const description = meta.description || listed.description || "";

      document.title = `${title} — Writeups`;
      const titleEl = document.getElementById("writeup-title");
      const dateEl = document.getElementById("writeup-date");
      const descEl = document.getElementById("writeup-desc");
      if (titleEl) titleEl.textContent = title;
      if (dateEl) dateEl.textContent = formatDate(date);
      if (descEl) {
        descEl.textContent = description;
        descEl.hidden = !description;
      }

      if (typeof marked === "undefined") {
        article.textContent = body;
        return;
      }
      marked.setOptions({
        gfm: true,
        breaks: false,
      });
      article.innerHTML = marked.parse(body);
    } catch (err) {
      article.innerHTML = `<p class="err-msg">${escapeHtml(err.message)}</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderList();
    renderPost();
  });
})();
