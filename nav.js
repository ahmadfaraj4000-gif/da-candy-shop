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
})();
