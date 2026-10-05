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
  gateCloseTime: "04:30 PM",
  venue: "Swatantrata Bhawan, Banaras Hindu University (BHU), Varanasi",
  city: "Varanasi, Uttar Pradesh",
  priceInINR: Number(process.env.NEXT_PUBLIC_EVENT_PRICE) || 299,
  currency: "INR",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "taalasyadancesociety.bhu@gmail.com",
  organizer: "Taalasya Dance Society — Banaras Hindu University (BHU)",
  developer: "Ambuj Singh",
  instagramHandle: "@taalasyadancesociety_bhu",
  instagramUrl: "https://www.instagram.com/taalasyadancesociety_bhu/",
  instagramPostUrl:
    "https://www.instagram.com/taalasyadancesociety_bhu/p/Dd1H4mRi0QP/",
  maxTicketsPerBooking: 5,
};

export const PASS_TIERS = [
  {
    quantity: 1,
    name: "Single Pass",
    price: 299,
    originalPrice: 299,
    savings: 0,
    tag: "Individual",
  },
  {
    quantity: 2,
    name: "Duo Pass",
    price: 549,
    originalPrice: 598,
    savings: 49,
    tag: "Save ₹49",
  },
  {
    quantity: 5,
    name: "Group Pass (5)",
    price: 1399,
    originalPrice: 1495,
    savings: 96,
    tag: "Save ₹96",
  },
] as const;

export function getTierPrice(quantity: number): number {
  if (quantity === 2) return 549;
  if (quantity === 5) return 1399;
  return 299;
}
