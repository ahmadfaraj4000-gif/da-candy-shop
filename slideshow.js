(function () {
  const slides = Array.from(document.querySelectorAll(".hero-slideshow img"));
  if (slides.length < 2) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let index = 0;
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === index);
  });

  window.setInterval(() => {
    slides[index].classList.remove("active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }, 3000);
})();
