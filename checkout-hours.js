import { getOrderingStatus, getPickupSlots, minimumPickupDateValue, validatePickupDateTime } from "./ordering-hours.js?v=daily-hours-20261019";

// The server independently validates the selected pickup using its own clock.
export function attachCheckoutHours(form) {
  const button = form.querySelector("button[type='submit']");
  const notice = form.querySelector("[data-ordering-hours]");
  const dateInput = form.elements.pickupDate;
  const timeInput = form.elements.pickupTime;
  let submitting = false;
  let timer;

  function refresh() {
    window.clearTimeout(timer);
    const now = Date.now();
    const { open, closedMessage } = getOrderingStatus(now);
    notice.hidden = open;
    notice.textContent = closedMessage;
    dateInput.min = minimumPickupDateValue(now);
    const rolledOver = !dateInput.value || dateInput.value < dateInput.min;
    if (rolledOver) dateInput.value = dateInput.min;
    const slots = getPickupSlots(dateInput.value, now);
    const previousTime = rolledOver ? "" : timeInput.value;
    timeInput.innerHTML = slots.map(slot => `<option value="${slot.value}">${slot.label}</option>`).join("");
    timeInput.value = slots.some(slot => slot.value === previousTime) ? previousTime : slots[0]?.value || "";
    button.disabled = submitting || !slots.length;
    if (!submitting) button.textContent = open ? "Place Order" : "Schedule Order";
    timer = window.setTimeout(refresh, 60000 - now % 60000);
  }

  dateInput.addEventListener("change", refresh);
  window.addEventListener("focus", refresh);
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", refresh);
  refresh();

  return {
    refresh,
    canSubmit() {
      // Never silently change the requested pickup while submitting a stale tab.
      const error = validatePickupDateTime(dateInput.value, timeInput.value);
      refresh();
      if (error) {
        notice.hidden = false;
        notice.textContent = `${error} Available times have been refreshed; review your pickup and submit again.`;
      }
      return !error && !submitting;
    },
    setSubmitting(value, label = "Placing Order...") {
      submitting = value;
      if (submitting) button.textContent = label;
      refresh();
    }
  };
}
