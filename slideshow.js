(function () {
  let timer = null;

  function startSlideshow(container = document.querySelector(".hero-spread")) {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }

    const groups = Array.from(container?.querySelectorAll(".hero-product") || [])
      .map(group => ({ slides: Array.from(group.querySelectorAll("img")), index: 0 }));
    groups.forEach(group => group.slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === 0);
    }));
    const rotatingGroups = groups.filter(group => group.slides.length > 1);
    if (!rotatingGroups.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let nextGroup = 0;
    timer = window.setInterval(() => {
      if (document.hidden) return;
      const group = rotatingGroups[nextGroup];
      const nextIndex = (group.index + 1) % group.slides.length;
      const nextSlide = group.slides[nextIndex];
      // Keep the current image visible until the next upload has loaded.
      if (nextSlide.complete && nextSlide.naturalWidth > 0) {
        group.slides[group.index].classList.remove("active");
        group.index = nextIndex;
        nextSlide.classList.add("active");
      }
      nextGroup = (nextGroup + 1) % rotatingGroups.length;
    }, 5000);
  }

  window.DCS_startSlideshow = startSlideshow;
  startSlideshow();
})();
