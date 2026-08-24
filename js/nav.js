/* CyberOps — shared nav (mobile menu) */
(function () {
  function initNav(root) {
    const toggle = root.querySelector("[data-nav-toggle]");
    const panel = root.querySelector("[data-nav-panel]");
    if (!toggle || !panel) return;

    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", () => {
      setOpen(!panel.classList.contains("is-open"));
    });

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) setOpen(false);
    });
  }

  document.querySelectorAll(".site-header").forEach(initNav);
})();
