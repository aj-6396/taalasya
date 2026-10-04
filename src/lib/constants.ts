export const EVENT_CONFIG = {
  name: process.env.NEXT_PUBLIC_EVENT_NAME || "TAALSYA 2026: Youth & Cultural Extravaganza",
  tagline: "Celebrate rhythm, talent, and unforgettable moments together.",
  date: "Saturday, November 14, 2026",
  time: "04:00 PM - 10:00 PM IST",
  venue: "Grand Amphitheatre, Cultural District, Bengaluru",
  priceInINR: Number(process.env.NEXT_PUBLIC_EVENT_PRICE) || 499,
  currency: "INR",
  supportEmail: process.env.SMTP_USER || "tickets@taalsya.org",
  organizer: "Taalsya Events & Cultural Council",
  maxTicketsPerBooking: 5,
};
