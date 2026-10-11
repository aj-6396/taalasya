export type SpecialPassCategory =
  | "special_pass"
  | "media_influencer";

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
  special_pass: {
    key: "special_pass",
    label: "Special Pass",
    badgeTitle: "OFFICIAL SPECIAL PASS",
    shortPrefix: "SPL",
    accentHex: "#f59e0b", // Amber / Gold 500
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
    description: "Dignitaries, VIP guests, performers & special access invitees",
  },
  media_influencer: {
    key: "media_influencer",
    label: "Media and Influencers",
    badgeTitle: "OFFICIAL MEDIA & INFLUENCER PASS",
    shortPrefix: "MED",
    accentHex: "#06b6d4", // Electric Cyan 500
    darkHex: "#164e63",   // Cyan 900
    lightHex: "#ecfeff",  // Cyan 50
    borderHex: "#0891b2", // Cyan 600
    rgb: [6, 182, 212],
    darkRgb: [22, 78, 99],
    badgeBgHex: "#cffafe",
    badgeTextHex: "#155e75",
    tailwindBorder: "border-cyan-500/30",
    tailwindBg: "bg-cyan-500/10",
    tailwindText: "text-cyan-400",
    tailwindRing: "focus:ring-cyan-500",
    description: "Press, photographers, videographers, journalists & content creators",
  },
};

export function getSpecialPassCategory(val?: string | null): SpecialPassCategory {
  if (!val) return "special_pass";
  const clean = String(val).toLowerCase().trim();
  if (
    clean.includes("media") ||
    clean.includes("influencer") ||
    clean.includes("press") ||
    clean === "med" ||
    clean === "inf"
  ) {
    return "media_influencer";
  }
  return "special_pass";
}

export function getSpecialPassConfig(val?: string | null): SpecialPassConfig {
  const cat = getSpecialPassCategory(val);
  return SPECIAL_PASS_CATEGORIES[cat] || SPECIAL_PASS_CATEGORIES.special_pass;
}

export function generateSpecialTicketId(category: SpecialPassCategory): string {
  const cfg = SPECIAL_PASS_CATEGORIES[category] || SPECIAL_PASS_CATEGORIES.special_pass;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 5; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SP-${cfg.shortPrefix}-${randomCode}`;
}
