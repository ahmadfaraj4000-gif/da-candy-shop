(async function () {
  const { promotionLabel, promotionTerms } = await import("./promotion-pricing.js");
  const convexBase = window.DCS_CONVEX_URL || "https://opulent-panda-156.convex.cloud";
  let promotion = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function discountLabel(item) {
    return promotionLabel(item);
  }

  async function convexQuery(path, args = {}) {
    const response = await fetch(`${convexBase.replace(/\/$/, "")}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args, format: "json" })
    });
    if (!response.ok) throw new Error("Promotion request failed.");
    const payload = await response.json();
    if (payload.status === "error") throw new Error(payload.errorMessage || "Promotion request failed.");
    return payload.value;
  }

  function focusPromotedFlower() {
    if (!promotion) return;
    if (!document.getElementById("flowerSearch")) {
      window.location.href = `flower.html?promotion=${encodeURIComponent(promotion._id)}#flowerGrid`;
      return;
    }
    const search = document.getElementById("flowerSearch");
    search.value = "";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("flowerGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showBanner() {
    if (!promotion || document.getElementById("livePromotionBanner")) return;
    const banner = document.createElement("aside");
    banner.id = "livePromotionBanner";
    banner.className = "live-promotion-banner";
    banner.setAttribute("aria-label", "Current promotion");
    banner.innerHTML = `
      <div>
        <span>Live promotion</span>
        <strong>${escapeHtml(promotion.headline)}</strong>
        <small>${escapeHtml(promotion.flowerName)} · ${escapeHtml(discountLabel(promotion))}</small>
        <small>${escapeHtml(promotionTerms(promotion))}</small>
      </div>
      <button class="btn small" type="button">Shop this deal</button>
    `;
    banner.querySelector("button").addEventListener("click", focusPromotedFlower);
    document.querySelector(".site-header")?.insertAdjacentElement("afterend", banner);
  }

  function closePopup(popup) {
    popup.remove();
  }

  function showPopupAfterAgeGate() {
    if (!promotion || localStorage.getItem("dcs-age-verified") !== "yes") return;
    const seenKey = `dcs-promotion-seen-${promotion._id}-${promotion.updatedAt}`;
    if (localStorage.getItem(seenKey) === "yes" || document.getElementById("livePromotionPopup")) return;
    localStorage.setItem(seenKey, "yes");

    const popup = document.createElement("div");
    popup.id = "livePromotionPopup";
    popup.className = "promotion-popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "true");
    popup.setAttribute("aria-labelledby", "promotionPopupTitle");
    popup.innerHTML = `
      <div class="promotion-popup-card">
        <button class="promotion-popup-close" type="button" aria-label="Close promotion">&times;</button>
        <p class="eyebrow">Now live</p>
        <h2 id="promotionPopupTitle">${escapeHtml(promotion.headline)}</h2>
        <p>${escapeHtml(promotion.description)}</p>
        <div class="promotion-popup-offer">
          <strong>${escapeHtml(discountLabel(promotion))}</strong>
          <span>${escapeHtml(promotion.flowerName)}</span>
          <small>${escapeHtml(promotionTerms(promotion))}</small>
        </div>
        <div class="promotion-popup-actions">
          <a class="btn primary" href="flower.html?promotion=${encodeURIComponent(promotion._id)}#flowerGrid">Shop promotion</a>
          <button class="btn ghost" type="button">Maybe later</button>
        </div>
      </div>
    `;
    popup.querySelector(".promotion-popup-close").addEventListener("click", () => closePopup(popup));
    popup.querySelector(".promotion-popup-actions button").addEventListener("click", () => closePopup(popup));
    popup.addEventListener("click", event => {
      if (event.target === popup) closePopup(popup);
    });
    document.body.appendChild(popup);
    popup.querySelector(".promotion-popup-close").focus();
  }

  async function loadPromotion() {
    try {
      promotion = await convexQuery("promotions:getLivePromotionForMenu", { supportsBundles: true });
      window.DCS_LIVE_PROMOTION = promotion;
      window.dispatchEvent(new CustomEvent("dcs:promotion-loaded", { detail: promotion }));
      if (!promotion) return;
      showBanner();
      showPopupAfterAgeGate();

      const requestedPromotion = new URLSearchParams(window.location.search).get("promotion");
      if (requestedPromotion === promotion._id) window.setTimeout(focusPromotedFlower, 100);
    } catch (error) {
      console.warn(error);
      window.DCS_LIVE_PROMOTION = null;
      window.dispatchEvent(new CustomEvent("dcs:promotion-loaded", { detail: null }));
    }
  }

  window.addEventListener("dcs:age-verified", showPopupAfterAgeGate);
  loadPromotion();
})();
