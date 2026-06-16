(function () {
  document.querySelectorAll(".nav-toggle").forEach((button) => {
    const header = button.closest(".site-header");
    const nav = header && header.querySelector(".site-nav");
    if (!header || !nav) return;

    button.addEventListener("click", () => {
      header.classList.add("nav-open");
      button.setAttribute("aria-expanded", "true");
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        header.classList.remove("nav-open");
        button.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        header.classList.remove("nav-open");
        button.setAttribute("aria-expanded", "false");
      }
    });
  });
})();
