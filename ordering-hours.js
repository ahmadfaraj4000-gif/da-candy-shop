export const ORDERING_TIME_ZONE = "America/New_York";
// Retained for older cached checkout modules; current callers use the next opening time.
export const ORDERING_CLOSED_MESSAGE = "Online ordering is closed. Ordering opens at 8:00 a.m. Monday–Saturday and 10:00 a.m. Sunday, Eastern time.";

const easternTime = new Intl.DateTimeFormat("en-US", {
  timeZone: ORDERING_TIME_ZONE,
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23"
});

const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = {
  Sun: [10 * 60, 21 * 60 + 30],
  Mon: [8 * 60, 21 * 60],
  Tue: [8 * 60, 21 * 60],
  Wed: [8 * 60, 21 * 60],
  Thu: [8 * 60, 21 * 60],
  Fri: [8 * 60, 22 * 60],
  Sat: [8 * 60, 22 * 60]
};

export function getOrderingStatus(now = Date.now()) {
  const parts = Object.fromEntries(easternTime.formatToParts(new Date(now)).map(part => [part.type, part.value]));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const [opens, closes] = hours[parts.weekday];
  const open = minutes >= opens && minutes < closes;
  const nextDay = week[(week.indexOf(parts.weekday) + 1) % 7];
  const nextOpening = minutes < opens ? opens : hours[nextDay][0];
  return {
    open,
    closedMessage: open ? "" : `Online ordering is closed. Ordering reopens at ${nextOpening / 60}:00 a.m. Eastern.`
  };
}

export function isOrderingOpen(now = Date.now()) {
  return getOrderingStatus(now).open;
}
