// Pre-typed WhatsApp/SMS message templates for the manual booking-reminder
// flow (Phase 1 — owner taps a button, nothing is sent automatically).
// Keep these warm and plain, under ~300 chars, at most one emoji — this
// reads as a personal message from a Nigerian salon, not a notification.

function firstNameOf(clientName) {
  return (clientName ?? '').trim().split(/\s+/)[0] || 'there';
}

function lagosDateKey(d) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function lagosTimeLabel(d) {
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(d).toLowerCase().replace(/\s+/g, '');
  return label.replace(':00', '');
}

/**
 * Formats a timestamptz appointment start as natural language relative to
 * "now" — "today at 2pm", "tomorrow at 2pm", or "Wed, Aug 6 at 2pm".
 */
export function formatFriendlyWhen(startsAt) {
  if (!startsAt) return 'your appointment time';
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return 'your appointment time';

  const todayKey    = lagosDateKey(new Date());
  const tomorrowKey = lagosDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const apptKey     = lagosDateKey(date);
  const time        = lagosTimeLabel(date);

  if (apptKey === todayKey)    return `today at ${time}`;
  if (apptKey === tomorrowKey) return `tomorrow at ${time}`;

  const weekdayMonthDay = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: 'numeric',
  }).format(date);
  return `${weekdayMonthDay} at ${time}`;
}

/** Sent right after a booking is confirmed. */
export function confirmationMessage(booking, business) {
  const first = firstNameOf(booking.client_name);
  const when = formatFriendlyWhen(booking.starts_at);
  return `Hi ${first}, this is ${business.name}. Your ${booking.service_name} appointment is confirmed for ${when}. See you then!`;
}

/** Sent the day before the appointment. */
export function reminderMessage(booking, business) {
  const first = firstNameOf(booking.client_name);
  const when = formatFriendlyWhen(booking.starts_at);
  return `Hi ${first}, just a reminder from ${business.name} — your ${booking.service_name} appointment is ${when}. Looking forward to seeing you!`;
}

/** Sent after the appointment, inviting the client to rebook. */
export function followUpMessage(booking, business) {
  const first = firstNameOf(booking.client_name);
  return `Hi ${first}, thank you for coming in for your ${booking.service_name} at ${business.name}! We'd love to see you again — reply here to book your next appointment.`;
}
