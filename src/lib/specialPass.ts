export type SpecialPassCategory =
  | "volunteer"
  | "special_guest"
  | "core_committee"
  | "organizer";

export interface SpecialPassConfig {
  key: SpecialPassCategory;
  label: string;
  badgeTitle: string;
  shortPrefix: string;
  accentHex: string;
  darkHex: string;
  lightHex: string;
  borderHex: string;
  rgb: [number, number, number];
  darkRgb: [number, number, number];
  badgeBgHex: string;
  badgeTextHex: string;
  tailwindBorder: string;
  tailwindBg: string;
  tailwindText: string;
  tailwindRing: string;
  description: string;
}

export const SPECIAL_PASS_CATEGORIES: Record<SpecialPassCategory, SpecialPassConfig> = {
  volunteer: {
    key: "volunteer",
    label: "Volunteer",
    badgeTitle: "OFFICIAL VOLUNTEER PASS",
    shortPrefix: "VOL",
    accentHex: "#10b981", // Emerald 500
    darkHex: "#064e3b",   // Emerald 900
    lightHex: "#ecfdf5",  // Emerald 50
    borderHex: "#059669", // Emerald 600
    rgb: [16, 185, 129],
    darkRgb: [6, 78, 59],
    badgeBgHex: "#d1fae5",
    badgeTextHex: "#065f46",
    tailwindBorder: "border-emerald-500/30",
    tailwindBg: "bg-emerald-500/10",
    tailwindText: "text-emerald-400",
    tailwindRing: "focus:ring-emerald-500",
    description: "Event operations, stage management, crowd marshals & technical crew",
  },
  special_guest: {
    key: "special_guest",
    label: "Special Guest / VIP",
    badgeTitle: "SPECIAL GUEST & VIP PASS",
    shortPrefix: "GST",
    accentHex: "#f59e0b", // Amber 500
    darkHex: "#78350f",   // Amber 900
    lightHex: "#fffbeb",  // Amber 50
    borderHex: "#d97706", // Amber 600
    rgb: [245, 158, 11],
    darkRgb: [120, 53, 15],
    badgeBgHex: "#fef3c7",
    badgeTextHex: "#92400e",
    tailwindBorder: "border-amber-500/30",
    tailwindBg: "bg-amber-500/10",
    tailwindText: "text-amber-400",
    tailwindRing: "focus:ring-amber-500",
    description: "Dignitaries, guest performers, university professors & invited guests",
  },
  core_committee: {
    key: "core_committee",
    label: "Core Committee Member",
    badgeTitle: "CORE COMMITTEE PASS",
    shortPrefix: "COR",
    accentHex: "#f43f5e", // Rose 500 / Crimson
    darkHex: "#881337",   // Rose 900
    lightHex: "#fff1f2",  // Rose 50
    borderHex: "#e11d48", // Rose 600
    rgb: [244, 63, 94],
    darkRgb: [136, 19, 55],
    badgeBgHex: "#ffe4e6",
    badgeTextHex: "#9f1239",
    tailwindBorder: "border-rose-500/30",
    tailwindBg: "bg-rose-500/10",
    tailwindText: "text-rose-400",
    tailwindRing: "focus:ring-rose-500",
    description: "Taalasya executive leadership, core organizing leads & club heads",
  },
  organizer: {
    key: "organizer",
    label: "Organizer / Faculty Coordinator",
    badgeTitle: "ORGANIZER & FACULTY PASS",
    shortPrefix: "ORG",
    accentHex: "#8b5cf6", // Purple 500
    darkHex: "#4c1d95",   // Purple 900
    lightHex: "#f5f3ff",  // Purple 50
    borderHex: "#7c3aed", // Purple 600
    rgb: [139, 92, 246],
    darkRgb: [76, 29, 149],
    badgeBgHex: "#ede9fe",
    badgeTextHex: "#5b21b6",
    tailwindBorder: "border-purple-500/30",
    tailwindBg: "bg-purple-500/10",
    tailwindText: "text-purple-400",
    tailwindRing: "focus:ring-purple-500",
    description: "Faculty advisors, chief patrons & society coordinators",
  },
};

export function getSpecialPassCategory(val?: string | null): SpecialPassCategory | null {
  if (!val) return null;
  const clean = val.toLowerCase().trim();
  if (clean.includes("volunteer") || clean === "vol") return "volunteer";
  if (clean.includes("guest") || clean.includes("vip") || clean === "gst") return "special_guest";
  if (clean.includes("core") || clean.includes("committee") || clean === "cor") return "core_committee";
  if (clean.includes("organizer") || clean.includes("faculty") || clean === "org") return "organizer";
  return null;
}

export function generateSpecialTicketId(category: SpecialPassCategory): string {
  const cfg = SPECIAL_PASS_CATEGORIES[category] || SPECIAL_PASS_CATEGORIES.volunteer;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 5; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SP-${cfg.shortPrefix}-${randomCode}`;
}
