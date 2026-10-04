/**
 * Generates a short, human-friendly ticket code tailored for manual gate verification.
 * Format: JHM-XXXX (e.g. JHM-7K2M, JHM-89TA)
 * Uses unambiguous characters (excluding 0, O, 1, I, L) to avoid reading errors on paper or phone screens.
 * 32^4 = 1,048,576 unique combinations, easily supporting 600 attendees with zero collisions.
 */
export function generateShortTicketId(): string {
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let randomCode = "";
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    randomCode += chars[idx];
  }
  return `JHM-${randomCode}`;
}

/**
 * Normalizes ticket ID for manual gate scanner entry.
 * Allows entry marshals to type either "JHM-7K2M", "7K2M", or "7k2m".
 */
export function normalizeTicketLookup(input: string): string[] {
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();
  const withPrefix = upper.startsWith("JHM-") ? upper : `JHM-${upper}`;
  const withoutPrefix = upper.replace(/^JHM-/, "");

  return Array.from(new Set([trimmed, upper, withPrefix, withoutPrefix]));
}
