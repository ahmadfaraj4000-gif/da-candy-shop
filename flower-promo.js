(function () {
  if (!/flower\.html(?:$|[?#])/.test(window.location.pathname)) return;

  function showPromo() {
    if (document.querySelector(".age-gate") || document.querySelector(".flower-promo")) {
      window.setTimeout(showPromo, 250);
      return;
    }

    const promo = document.createElement("div");
    promo.className = "flower-promo";
    promo.setAttribute("role", "dialog");
    promo.setAttribute("aria-modal", "true");
    promo.setAttribute("aria-labelledby", "flowerPromoTitle");
    promo.innerHTML = `
      <section class="flower-promo-panel">
        <button class="flower-promo-close" type="button" aria-label="Close promotion">×</button>
        <img class="flower-promo-logo" src="assets/logos/da-candy-shop-logo.png" alt="Da Candy Shop" />
        <p class="eyebrow">New Customer Special</p>
        <h2 id="flowerPromoTitle">Free gram for new customers</h2>
        <p>Place your first pickup order and ask the counter about the new customer free gram.</p>
        <button class="btn primary full flower-promo-shop" type="button">Shop Flower</button>
      </section>
    `;
    document.body.appendChild(promo);

    const close = () => promo.remove();
    promo.querySelector(".flower-promo-close").addEventListener("click", close);
    promo.querySelector(".flower-promo-shop").addEventListener("click", () => {
      close();
      document.querySelector(".flower-menu-shell")?.scrollIntoView({ behavior: "smooth" });
    });
    promo.addEventListener("click", event => {
      if (event.target === promo) close();
    });
    document.addEventListener("keydown", function onKeydown(event) {
      if (event.key !== "Escape") return;
      close();
      document.removeEventListener("keydown", onKeydown);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showPromo);
  } else {
    showPromo();
  }
})();
