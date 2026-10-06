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
  displayDate: "13 Oct 2026",
  dayOfWeek: "Tuesday",
  eventDateISO: "2026-10-13T17:00:00+05:30",
  time: "05:00 PM - 10:30 PM IST",
  gateCloseTime: "04:30 PM",
  venue: "Swatantrata Bhawan, Banaras Hindu University (BHU), Varanasi",
  shortVenue: "Swatantrata Bhawan",
  city: "Varanasi, Uttar Pradesh",
  originalPriceInINR: 399,
  priceInINR: Number(process.env.NEXT_PUBLIC_EVENT_PRICE) || 299,
  currency: "INR",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "taalasyadancesociety.bhu@gmail.com",
  organizer: "Taalasya Dance Society — Banaras Hindu University (BHU)",
  developer: "AJ",
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
    originalPrice: 399,
    savings: 100,
    tag: "Early Bird",
  },
  {
    quantity: 2,
    name: "Duo Pass",
    price: 549,
    originalPrice: 798,
    savings: 249,
    tag: "Save ₹249",
  },
  {
    quantity: 5,
    name: "Group Pass (5)",
    price: 1399,
    originalPrice: 1995,
    savings: 596,
    tag: "Save ₹596",
  },
] as const;

export function getTierPrice(quantity: number): number {
  if (quantity === 2) return 549;
  if (quantity === 5) return 1399;
  return 299;
}

export interface GateMarshal {
  id: string;
  name: string;
  pin: string;
  gate: string;
}

export const DEFAULT_MARSHALS: GateMarshal[] = [
  { id: "marshal_1", name: "Marshal 1", pin: "4821", gate: "Gate A (Lane 1)" },
  { id: "marshal_2", name: "Marshal 2", pin: "7395", gate: "Gate A (Lane 2)" },
  { id: "marshal_3", name: "Marshal 3", pin: "2964", gate: "Gate B (Lane 1)" },
  { id: "marshal_4", name: "Marshal 4", pin: "8153", gate: "Gate B (Lane 2)" },
  { id: "admin", name: "Lead Supervisor", pin: process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN || process.env.ADMIN_SCAN_PIN || "6028", gate: "All Gates (Supervisor)" },
];

