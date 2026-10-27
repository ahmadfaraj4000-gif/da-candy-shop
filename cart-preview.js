(function () {
  const cart = document.getElementById("flowerCart");
  const total = document.getElementById("flowerTotal");
  const count = document.getElementById("headerCartCount");
  const floatingButton = document.getElementById("floatingCartButton");
  if (!cart || !total || !count || !floatingButton) return;

  const dialog = document.createElement("dialog");
  dialog.id = "cartPreview";
  dialog.className = "cart-preview";
  dialog.setAttribute("aria-labelledby", "cartPreviewTitle");
  dialog.innerHTML = `
    <div class="cart-preview-heading">
      <h2 id="cartPreviewTitle">Your cart</h2>
      <button class="order-popup-close" type="button" aria-label="Close cart" autofocus>&times;</button>
    </div>
    <div class="cart-preview-items" aria-label="Cart items"></div>
    <div class="total-row"><span>Total</span><strong class="cart-preview-total"></strong></div>
    <div class="cart-preview-actions">
      <button class="btn primary" type="button" data-checkout>Continue to checkout</button>
      <button class="btn ghost" type="button" data-keep-shopping>Keep shopping</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const items = dialog.querySelector(".cart-preview-items");
  const checkout = dialog.querySelector("[data-checkout]");
  const closeButton = dialog.querySelector("[aria-label='Close cart']");
  let returnFocus = null;

  function syncCart() {
    // Mirror the existing cart, including discounts, without a second pricing model.
    items.replaceChildren(...Array.from(cart.childNodes, node => node.cloneNode(true)));
    dialog.querySelector(".cart-preview-total").textContent = total.textContent;
    document.getElementById("floatingCartCount").textContent = count.textContent;
    const quantity = Number(count.textContent) || 0;
    floatingButton.setAttribute("aria-label", `View cart, ${quantity} item${quantity === 1 ? "" : "s"}`);
    checkout.disabled = quantity === 0;
  }

  const observer = new MutationObserver(syncCart);
  [cart, total, count].forEach(element => observer.observe(element, { childList: true, subtree: true, characterData: true }));
  syncCart();

  window.DCS_openCart = () => {
    if (dialog.open) return;
    returnFocus = document.activeElement;
    syncCart();
    dialog.showModal();
    document.body.classList.add("cart-preview-open");
  };
  floatingButton.setAttribute("aria-controls", dialog.id);
  document.getElementById("headerCart").setAttribute("aria-haspopup", "dialog");
  document.getElementById("headerCart").setAttribute("aria-controls", dialog.id);

  closeButton.addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-keep-shopping]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    document.body.classList.remove("cart-preview-open");
    returnFocus?.focus({ preventScroll: true });
  });
  items.addEventListener("click", event => {
    const remove = event.target.closest("button[data-remove]");
    if (!remove) return;
    // Reuse the storefront's removal handler so both views stay in sync.
    cart.querySelector(`button[data-remove="${remove.dataset.remove}"]`)?.click();
    closeButton.focus({ preventScroll: true });
  });
  checkout.addEventListener("click", () => {
    // Native dialog close restores focus before moving to the checkout heading.
    dialog.addEventListener("close", () => {
      const section = document.getElementById("checkout");
      const heading = section.querySelector("h2");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }, { once: true });
    dialog.close();
  });
})();
