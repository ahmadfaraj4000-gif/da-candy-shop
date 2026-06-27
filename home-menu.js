(function () {
  const strainImages = [
    "weed-1.avif",
    "weed-2.avif",
    "weed-3.avif",
    "weed-4.avif",
    "weed-5.avif",
    "weed-6.avif",
    "weed-7.avif",
    "weed-8.avif",
    "weed-9.avif"
  ].map(name => `assets/images/${name}`);

  const fallback = [
    ["Purple Planet", 20, "Hybrid", "High", "Fresh flower from the current shelf.", 98],
    ["Biscotti", 20, "Indica", "High", "Fresh flower from the current shelf.", 97],
    ["Blueberry", 20, "Indica", "High", "Fresh flower from the current shelf.", 96],
    ["Couchlock Candy", 25, "Indica", "High", "Fresh flower from the current shelf.", 100],
    ["LFG", 25, "Hybrid", "High", "Fresh flower from the current shelf.", 99],
    ["Russian Runtz", 25, "Hybrid", "High", "Fresh flower from the current shelf.", 98],
    ["Gelato 41", 25, "Hybrid", "High", "Fresh flower from the current shelf.", 97],
    ["Gruntz", 25, "Hybrid", "High", "Fresh flower from the current shelf.", 96],
    ["Papaya Runtz", 15, "Hybrid", "High", "Fresh flower from the current shelf.", 95],
    ["Strawberry Cough", 15, "Sativa", "High", "Fresh flower from the current shelf.", 94],
    ["Pink Candy", 10, "Hybrid", "Medium", "Fresh flower from the current shelf.", 93]
  ].map((strain, index) => ({
    id: String(index + 1),
    name: strain[0],
    price: strain[1],
    onlinePrice: strain[1],
    grams: 3.5,
    strainType: strain[2],
    potency: strain[3],
    description: strain[4],
    popularity: strain[5],
    available: true,
    featured: index < 3,
    image: strainImages[index % strainImages.length]
  }));

  const slideshow = document.getElementById("homeSlideshow");
  const grid = document.getElementById("homeFeaturedGrid");

  function convexUrl() {
    return window.DCS_CONVEX_URL || localStorage.getItem("DCS_CONVEX_URL") || "";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  async function convexCall(kind, path, args) {
    const base = convexUrl();
    if (!base) throw new Error("Convex URL is not configured.");
    const response = await fetch(`${base.replace(/\/$/, "")}/api/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args, format: "json" })
    });
    if (!response.ok) throw new Error("Convex request failed.");
    const payload = await response.json();
    if (payload.status === "error") throw new Error(payload.errorMessage || "Convex request failed.");
    return payload.value;
  }

  function normalizeRows(rows) {
    return rows.map((item, index) => ({
      ...item,
      id: item._id || item.id || String(index + 1),
      price: Number(item.price || 0),
      onlinePrice: Number(item.onlinePrice ?? item.price ?? 0),
      grams: Number(item.grams ?? 3.5),
      available: item.available ?? Number(item.quantity ?? 0) > 0,
      featured: item.featured ?? false,
      image: item.image || strainImages[index % strainImages.length],
      popularity: item.popularity || 0
    }));
  }

  function chooseFeatured(rows) {
    const featured = rows.filter(item => item.featured && item.available !== false).slice(0, 3);
    if (featured.length) return featured;
    return [...rows]
      .filter(item => item.available !== false)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 3);
  }

  function renderSlideshow(rows) {
    if (!slideshow) return;
    const slides = rows.filter(item => item.image);
    slideshow.innerHTML = slides.length
      ? slides.map((item, index) => `<img class="${index === 0 ? "active" : ""}" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)} strain photo" ${index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} />`).join("")
      : `<img class="active" src="assets/images/flower-placeholder.svg" alt="Flower placeholder" loading="eager" fetchpriority="high" />`;

    if (window.DCS_startSlideshow) window.DCS_startSlideshow(slideshow);
  }

  function renderFeatured(rows) {
    if (!grid) return;
    grid.innerHTML = rows.length
      ? rows.map(item => {
          const onlineLabel = Number(item.onlinePrice ?? item.price) === Number(item.price) ? "in menu" : `online ${money(item.onlinePrice)}`;
          return `<article class="product-card">
            <span class="badge">${escapeHtml(item.strainType || "Flower")}</span>
            <div class="product-art ${(item.strainType || "hybrid").toLowerCase()}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)} strain" /></div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.description || "Fresh flower from the current shelf.")}</p>
            <div class="price-row"><strong>Pickup ${money(item.price)}</strong><span>${escapeHtml(onlineLabel)}</span></div>
            <a class="btn small" href="flower.html">View Menu</a>
          </article>`;
        }).join("")
      : `<div class="state-card glass">No featured strains are available right now.</div>`;
  }

  async function loadHomeMenu() {
    let rows = fallback;
    try {
      const live = await convexCall("query", "inventory:listInventory", {});
      if (Array.isArray(live) && live.length) rows = normalizeRows(live);
    } catch (error) {
      console.warn(error);
    }

    const availableRows = rows.filter(item => item.available !== false);
    renderSlideshow(availableRows.length ? availableRows : rows);
    renderFeatured(chooseFeatured(rows));
  }

  loadHomeMenu();
})();
