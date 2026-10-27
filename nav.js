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
  // Banner height changes can move scrollY through browser scroll anchoring.
  // Measure relative to its height so that resizing is not mistaken for a gesture.
  const bannerHeight = () => document.getElementById("livePromotionBanner")?.getBoundingClientRect().height || 0;
  let scrollAnchor = Math.max(0, window.scrollY) - bannerHeight();
  let framePending = false;

  function setCompact(compact) {
    document.body.classList.toggle("scroll-controls-compact", compact);
    floatingAction.classList.toggle("is-compact", mobile.matches && compact);
  }

  function updateBarSize() {
    framePending = false;
    // Clamp elastic scrolling so a bounce at either edge cannot flip the bar.
    const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const position = Math.min(limit, Math.max(0, window.scrollY));
    const contentPosition = position - bannerHeight();
    if (position < 32) {
      setCompact(false);
      scrollAnchor = contentPosition;
      return;
    }
    const distance = contentPosition - scrollAnchor;
    if (Math.abs(distance) < 12) return;
    // Leave room for the banner to collapse without pulling the page back to the top.
    if (distance > 0 && position < 96 && !document.body.classList.contains("scroll-controls-compact")) return;
    setCompact(distance > 0);
    scrollAnchor = contentPosition;
  }

  window.addEventListener("scroll", () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateBarSize);
  }, { passive: true });
  mobile.addEventListener("change", () => {
    floatingAction.classList.toggle("is-compact", mobile.matches && document.body.classList.contains("scroll-controls-compact"));
  });
  window.addEventListener("pageshow", () => {
    const position = Math.max(0, window.scrollY);
    scrollAnchor = position - bannerHeight();
    setCompact(position > 64);
  });
})();
