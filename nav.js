(function () {
  document.querySelectorAll(".nav-toggle").forEach((button) => {
    const header = button.closest(".site-header");
    const nav = header && header.querySelector(".site-nav");
    if (!header || !nav) return;

    button.addEventListener("click", () => {
      const isOpen = header.classList.toggle("nav-open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        header.classList.remove("nav-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open menu");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        header.classList.remove("nav-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open menu");
      }
    });
  });
})();
