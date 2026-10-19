export const ORDERING_TIME_ZONE = "America/New_York";
export const ORDERING_CLOSED_MESSAGE = "We're closed for pickup. Schedule an order for 8:00 a.m. or later, Eastern time.";
const OPEN_MINUTES = 8 * 60;
const CLOSE_MINUTES = 21 * 60;
const SLOT_MINUTES = 15;

const easternTime = new Intl.DateTimeFormat("en-US", {
  timeZone: ORDERING_TIME_ZONE,
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23"
});

function localClock(now) {
  const parts = Object.fromEntries(easternTime.formatToParts(new Date(now)).map(part => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute) + Number(parts.second) / 60 + (now % 1000) / 60000
  };
}

function nextDate(date) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
}

export function getOrderingStatus(now = Date.now()) {
  const { minutes } = localClock(now);
  const open = minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;
  return {
    open,
    closedMessage: open ? "" : `We're closed for pickup. You can order now for ${minutes < OPEN_MINUTES ? "today" : "tomorrow"} starting at 8:00 a.m. Eastern.`
  };
}

export function isOrderingOpen(now = Date.now()) {
  return getOrderingStatus(now).open;
}

export function getPickupSlots(date, now = Date.now()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return [];
  const clock = localClock(now);
  if (date < clock.date) return [];
  const start = date === clock.date ? Math.max(OPEN_MINUTES, Math.ceil(clock.minutes / SLOT_MINUTES) * SLOT_MINUTES) : OPEN_MINUTES;
  const slots = [];
  for (let minutes = start; minutes < CLOSE_MINUTES; minutes += SLOT_MINUTES) {
    const hour = Math.floor(minutes / 60);
    const minute = String(minutes % 60).padStart(2, "0");
    slots.push({ value: `${String(hour).padStart(2, "0")}:${minute}`, label: `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}` });
  }
  return slots;
}

export function minimumPickupDateValue(now = Date.now()) {
  const { date } = localClock(now);
  return getPickupSlots(date, now).length ? date : nextDate(date);
}

export function validatePickupDateTime(date, time, now = Date.now()) {
  return getPickupSlots(date, now).some(slot => slot.value === time)
    ? ""
    : "Choose a future pickup time between 8:00 a.m. and 8:45 p.m. Eastern, in 15-minute intervals.";
}
