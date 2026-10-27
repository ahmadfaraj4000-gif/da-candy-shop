(function () {
  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a").forEach(link => {
    if (link.getAttribute("href") === page) link.setAttribute("aria-current", "page");
  });

  document.querySelectorAll(".nav-toggle").forEach((button) => {
    const header = button.closest(".site-header");
    const nav = header && header.querySelector(".site-nav");
    if (!header || !nav) return;
    nav.id ||= "primary-navigation";
    button.setAttribute("aria-controls", nav.id);

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
      if (event.key === "Escape" && header.classList.contains("nav-open")) {
        header.classList.remove("nav-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open menu");
        button.focus();
      }
    });
  });

  const cartButton = document.getElementById("headerCart");
  const floatingAction = document.createElement(cartButton ? "button" : "a");
  floatingAction.className = "floating-action";
  if (cartButton) {
    floatingAction.type = "button";
    floatingAction.id = "floatingCartButton";
    floatingAction.setAttribute("aria-haspopup", "dialog");
    floatingAction.innerHTML = '<span class="header-cart-icon" aria-hidden="true"></span><span>View Cart</span><span id="floatingCartCount" class="floating-cart-count">0</span>';
    floatingAction.addEventListener("click", () => cartButton.click());
  } else {
    floatingAction.href = "flower.html";
    floatingAction.textContent = "Order Online";
  }
  document.body.classList.add("has-floating-action");
  document.body.appendChild(floatingAction);

  const mobile = window.matchMedia("(max-width: 920px)");
  let scrollAnchor = Math.max(0, window.scrollY);
  let framePending = false;

  function updateBarSize() {
    framePending = false;
    // Clamp elastic scrolling so a bounce at either edge cannot flip the bar.
    const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const position = Math.min(limit, Math.max(0, window.scrollY));
    if (!mobile.matches || position < 32) {
      floatingAction.classList.remove("is-compact");
      scrollAnchor = position;
      return;
    }
    const distance = position - scrollAnchor;
    if (Math.abs(distance) < 12) return;
    floatingAction.classList.toggle("is-compact", distance > 0);
    scrollAnchor = position;
  }

  window.addEventListener("scroll", () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateBarSize);
  }, { passive: true });
  mobile.addEventListener("change", updateBarSize);
  window.addEventListener("pageshow", () => {
    scrollAnchor = Math.max(0, window.scrollY);
    floatingAction.classList.toggle("is-compact", mobile.matches && scrollAnchor > 64);
  });
})();
