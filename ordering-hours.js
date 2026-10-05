export const ORDERING_TIME_ZONE = "America/New_York";
export const ORDERING_CLOSED_MESSAGE = "Online ordering is closed. Ordering reopens at 8:00 a.m. Eastern.";

const easternHour = new Intl.DateTimeFormat("en-US", {
  timeZone: ORDERING_TIME_ZONE,
  hour: "numeric",
  hourCycle: "h23"
});

export function isOrderingOpen(now = Date.now()) {
  const hour = Number(easternHour.format(new Date(now)));
  return hour >= 8 && hour < 21;
}
