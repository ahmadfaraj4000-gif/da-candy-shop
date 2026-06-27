(function () {
  let timer = null;

  function startSlideshow(container = document.querySelector(".hero-slideshow")) {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }

    const slides = Array.from(container?.querySelectorAll("img") || []);
    if (slides.length < 2) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let index = 0;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("active", slideIndex === index);
    });

    timer = window.setInterval(() => {
      slides[index].classList.remove("active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
    }, 3000);
  }

  window.DCS_startSlideshow = startSlideshow;
  startSlideshow();
})();
