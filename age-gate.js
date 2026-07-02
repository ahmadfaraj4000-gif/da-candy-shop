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
        <img src="assets/logos/da-candy-shop-logo.png" alt="Da Candy Shop" />
      </div>
      <h2 id="ageGateTitle">Are you 21 or older?</h2>
      <label class="age-check"><input id="ageGateCheck" type="checkbox" /> Yes, I am 21 or older.</label>
      <button id="ageGateEnter" class="btn primary full" type="button" disabled>Enter Site</button>
    </div>
  `;
  document.body.appendChild(gate);

  const checkbox = gate.querySelector("#ageGateCheck");
  const enter = gate.querySelector("#ageGateEnter");
  checkbox.focus();
  checkbox.addEventListener("change", () => {
    enter.disabled = !checkbox.checked;
  });
  enter.addEventListener("click", () => {
    if (!checkbox.checked) return;
    localStorage.setItem(key, "yes");
    gate.remove();
  });
})();
