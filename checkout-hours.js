import { getOrderingStatus } from "./ordering-hours.js?v=weekly-hours-20261005";

// The server independently enforces this rule using its own clock.
export function attachCheckoutHours(form) {
  const button = form.querySelector("button[type='submit']");
  const notice = form.querySelector("[data-ordering-hours]");
  let submitting = false;
  let timer;

  function refresh() {
    window.clearTimeout(timer);
    const { open, closedMessage } = getOrderingStatus();
    notice.hidden = open;
    notice.textContent = closedMessage;
    button.disabled = submitting || !open;
    if (!submitting) button.textContent = "Place Order";
    // Align to the next minute, including the exact opening/closing minute.
    timer = window.setTimeout(refresh, 60000 - Date.now() % 60000);
    return open;
  }

  window.addEventListener("focus", refresh);
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", refresh);
  refresh();

  return {
    canSubmit() {
      return refresh() && !submitting;
    },
    setSubmitting(value, label = "Placing Order...") {
      submitting = value;
      if (submitting) button.textContent = label;
      refresh();
    }
  };
}
