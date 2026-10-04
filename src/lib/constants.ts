export const EVENT_CONFIG = {
  name:
    process.env.NEXT_PUBLIC_EVENT_NAME ||
    "JHOOM '26 — Dance Fest cum Dandiya Night",
  shortName: "JHOOM '26",
  theme: "Dance Fest cum Dandiya Night",
  societyName: "Taalasya Dance Society",
  institution: "Banaras Hindu University (BHU)",
  tagline:
    "Get ready for JHOOM '26: Dance Fest cum Dandiya Night! Experience electrifying dance face-offs, live dhol beats, and an unforgettable Dandiya Raas celebration! 🪩✨",
  date: "Tuesday, October 13, 2026",
  eventDateISO: "2026-10-13T17:00:00+05:30",
  time: "05:00 PM - 10:30 PM IST",
  venue: "Swatantrata Bhawan, Banaras Hindu University (BHU), Varanasi",
  city: "Varanasi, Uttar Pradesh",
  priceInINR: Number(process.env.NEXT_PUBLIC_EVENT_PRICE) || 299,
  currency: "INR",
  supportEmail:
    process.env.SMTP_USER || "taalasyadancesociety.bhu@gmail.com",
  organizer: "Taalasya Dance Society — Banaras Hindu University (BHU)",
  developer: "Ambuj Singh",
  instagramHandle: "@taalasyadancesociety_bhu",
  instagramUrl: "https://www.instagram.com/taalasyadancesociety_bhu/",
  instagramPostUrl:
    "https://www.instagram.com/taalasyadancesociety_bhu/p/Dd1H4mRi0QP/",
  maxTicketsPerBooking: 5,
};
