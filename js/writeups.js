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

  function protectMath(src) {
    const store = [];
    const out = src.replace(/\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/g, (m) => {
      const i = store.length;
      store.push(m);
      return `@@MATH${i}@@`;
    });
    return { src: out, store };
  }

  function restoreMath(html, store) {
    return html.replace(/@@MATH(\d+)@@/g, (_, i) => store[Number(i)] || "");
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

  /** Directory of the current writeups page (handles /writeups and /writeups/). */
  function writeupsDir() {
    const path = window.location.pathname || "/";
    if (path.endsWith("/")) return path;
    const slash = path.lastIndexOf("/");
    return slash === -1 ? "/" : path.slice(0, slash + 1);
  }

  /** Resolve manifest image paths against the writeups folder (GitHub Pages base path safe). */
  function writeupAssetUrl(rel) {
    if (!rel) return "";
    const s = String(rel);
    if (/^(https?:|data:|\/\/)/i.test(s) || s.startsWith("/")) return s;
    try {
      return new URL(s.replace(/^\.\//, ""), window.location.origin + writeupsDir()).href;
    } catch (_) {
      return writeupsDir() + s.replace(/^\.\//, "");
    }
  }

  async function loadManifest() {
    const res = await fetch(writeupAssetUrl("manifest.json"), { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load writeups/manifest.json");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  function postCard(w) {
    const href = w.href
      ? escapeHtml(w.href)
      : `post.html?slug=${encodeURIComponent(w.slug)}`;
    const imgSrc = w.image ? writeupAssetUrl(w.image) : "";
    const img = imgSrc
      ? `<img class="post-thumb" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(w.title || w.slug)}" width="160" height="120" loading="lazy" decoding="async" />`
      : `<span class="post-thumb post-thumb-empty" aria-hidden="true"></span>`;
    return `
        <a class="post-card${imgSrc ? " post-card-media" : ""}" href="${href}">
          ${img}
          <span class="post-body">
            <span class="post-meta">${escapeHtml(formatDate(w.date))}</span>
            <h2 class="post-title">${escapeHtml(w.title || w.slug)}</h2>
            <p class="post-desc">${escapeHtml(w.description || "")}</p>
          </span>
        </a>`;
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

      const seriesOrder = [];
      const bySeries = new Map();
      items.forEach((w) => {
        const key = w.series || "";
        if (!bySeries.has(key)) {
          bySeries.set(key, []);
          seriesOrder.push(key);
        }
        bySeries.get(key).push(w);
      });
      // Preferred shelf order
      const preferred = ["crypto", "heap", "pwnable.kr"];
      seriesOrder.sort((a, b) => {
        const ia = preferred.indexOf(a);
        const ib = preferred.indexOf(b);
        if (ia !== -1 || ib !== -1) {
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }
        if (!a) return 1;
        if (!b) return -1;
        return a.localeCompare(b);
      });

      el.innerHTML = seriesOrder
        .map((key) => {
          const posts = bySeries.get(key);
          const heading = key
            ? `<h2 class="series-heading">${escapeHtml(key)}</h2>`
            : `<h2 class="series-heading">Notes</h2>`;
          return `<section class="series-block">${heading}${posts.map(postCard).join("")}</section>`;
        })
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
      const series = meta.series || listed.series || "";

      document.title = `${title} — Writeups`;
      const titleEl = document.getElementById("writeup-title");
      const dateEl = document.getElementById("writeup-date");
      const descEl = document.getElementById("writeup-desc");
      if (titleEl) titleEl.textContent = title;
      if (dateEl) {
        dateEl.textContent = series
          ? `${series} · ${formatDate(date)}`
          : formatDate(date);
      }
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
      const { src: protectedBody, store: mathStore } = protectMath(body);
      article.innerHTML = restoreMath(marked.parse(protectedBody), mathStore);
      // Soft figure captions from alt text for cleaner screenshot presentation
      article.querySelectorAll("img[alt]").forEach((img) => {
        if (img.closest(".challenge-hero") || img.parentElement?.tagName === "FIGURE") {
          return;
        }
        if (img.classList.contains("challenge-logo") || img.classList.contains("challenge-art")) {
          return;
        }
        const alt = (img.getAttribute("alt") || "").trim();
        if (!alt || alt.length < 12) return;
        const fig = document.createElement("figure");
        fig.className = "md-figure";
        const parent = img.parentElement;
        img.replaceWith(fig);
        fig.appendChild(img);
        const cap = document.createElement("figcaption");
        cap.textContent = alt;
        fig.appendChild(cap);
        // Avoid invalid <p><figure> wrappers from marked
        if (parent && parent.tagName === "P" && parent.childNodes.length === 1 && parent.firstChild === fig) {
          parent.replaceWith(fig);
        }
      });
      if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
        window.MathJax.typesetPromise([article]).catch(() => {});
      }
    } catch (err) {
      article.innerHTML = `<p class="err-msg">${escapeHtml(err.message)}</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderList();
    renderPost();
  });
})();
