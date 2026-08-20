(function () {
  const key = "dcs-age-verified";
  const params = new URLSearchParams(window.location.search);
  if (params.get("resetAge") === "1") {
    localStorage.removeItem(key);
  }
  if (localStorage.getItem(key) === "yes") return;

  const gate = document.createElement("div");
  gate.className = "age-gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "ageGateTitle");
  gate.innerHTML = `
    <div class="age-gate-panel">
      <div class="age-gate-brand">
        <img src="assets/logos/da-candy-shop-logo.webp" alt="Da Candy Shop" />
      </div>
      <p class="eyebrow">Age verification</p>
      <h2 id="ageGateTitle">Welcome to<br />Da Candy Shop.</h2>
      <p class="age-gate-copy">You must be 21 or older to enter this website.</p>
      <div class="age-gate-actions">
        <button id="ageGateEnter" class="btn primary full" type="button">I&rsquo;m 21 or older</button>
        <button id="ageGateExit" class="btn ghost full" type="button">I&rsquo;m under 21</button>
      </div>
      <p class="age-gate-note">By entering, you confirm that you are of legal age.</p>
    </div>
  `;
  document.body.appendChild(gate);

  const enter = gate.querySelector("#ageGateEnter");
  const exit = gate.querySelector("#ageGateExit");
  enter.focus();
  enter.addEventListener("click", () => {
    localStorage.setItem(key, "yes");
    gate.remove();
  });
  exit.addEventListener("click", () => {
    gate.querySelector(".age-gate-panel").innerHTML = `
      <div class="age-gate-brand">
        <img src="assets/logos/da-candy-shop-logo.webp" alt="Da Candy Shop" />
      </div>
      <p class="eyebrow">Sorry</p>
      <h2>You must be 21 or older.</h2>
      <p class="age-gate-copy">This website is not available to visitors under 21.</p>
    `;
  });
})();
