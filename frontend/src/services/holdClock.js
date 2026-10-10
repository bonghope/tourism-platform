// Prefer the database duration: MySQL DATETIME values do not carry a timezone.
export function holdSeconds(booking) {
  const seconds = booking?.HoldRemainingSeconds;
  if (seconds !== null && seconds !== undefined && seconds !== '') {
    const value = Number(seconds);
    if (Number.isFinite(value)) return Math.max(0, value);
  }
  // Only accept timestamps with an explicit timezone from older API versions.
  const expires = booking?.HoldExpiresAt;
  if (typeof expires !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/i.test(expires)) return null;
  const timestamp = Date.parse(expires);
  return Number.isFinite(timestamp) ? Math.max(0, (timestamp - Date.now()) / 1000) : null;
}
export function remainingSeconds(seconds, receivedAt, now) {
  if (seconds === null) return null;
  return Math.max(0, Math.ceil(seconds - Math.max(0, now - receivedAt) / 1000));
}
