import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { DEFAULT_MARSHALS } from "@/lib/constants";
import { isTestTicket } from "@/lib/isTestTicket";
import {
  SPECIAL_PASS_CATEGORIES,
  getSpecialPassCategory,
} from "@/lib/specialPass";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cleanPin = String(body.pin || "").trim();

    if (!cleanPin) {
      return NextResponse.json(
        { success: false, message: "PIN required to download offline scanner cache." },
        { status: 401 }
      );
    }

    const adminPin = process.env.ADMIN_SCAN_PIN || process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN || "";
    const specialPin = process.env.SPECIAL_PASS_PIN || process.env.NEXT_PUBLIC_SPECIAL_PASS_PIN || "";
    let isAuthorized = Boolean(
      (adminPin && cleanPin === adminPin) ||
      (specialPin && cleanPin === specialPin)
    );

    // Also check DEFAULT_MARSHALS
    if (!isAuthorized) {
      isAuthorized = Boolean(DEFAULT_MARSHALS.some((m) => m.pin && m.pin === cleanPin));
    }

    const supabase = getAdminSupabase();

    // If still not authorized, check gate_marshals table
    if (!isAuthorized) {
      try {
        const { data: dbMarshal } = await supabase
          .from("gate_marshals")
          .select("id")
          .eq("pin", cleanPin)
          .maybeSingle();
        if (dbMarshal) isAuthorized = true;
      } catch {
        // ignore
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Invalid PIN. Access denied." },
        { status: 401 }
      );
    }

    // Fetch all genuine tickets from Supabase
    let rawTickets: any[] = [];
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("ticketId, ticket_id, name, college, phone, email, status, usedAt, used_at, paymentId, payment_id, passType, pass_type, amount");

      if (!error && data) {
        rawTickets = data;
      } else {
        const fallback = await supabase.from("tickets").select("*");
        rawTickets = fallback.data || [];
      }
    } catch (fetchErr) {
      console.warn("[scanner-cache] Error fetching tickets:", fetchErr);
    }

    // Filter genuine (non-simulated) tickets
    const genuineTickets = rawTickets.filter((t) => !isTestTicket(t));

    // Normalize for ultra-lightweight client caching (keeps payload tiny, < 100KB)
    const normalizedTickets = genuineTickets.map((t) => {
      const targetId = String(t.ticketId || t.ticket_id || "").trim();
      const pId = String(t.paymentId || t.payment_id || "");
      const pType = String(t.passType || t.pass_type || "");
      const isUsed =
        t.status === "Used" ||
        Boolean(t.usedAt || t.used_at);

      const isSpecial =
        pId.startsWith("SPECIAL_PASS:") ||
        targetId.startsWith("SP-") ||
        Boolean(pType && pType !== "regular") ||
        (Number(t.amount) === 0 && (pId.includes("PASS") || targetId.startsWith("SP")));

      let specialInfo: any = null;
      if (isSpecial) {
        const rawCat =
          pType ||
          (pId.startsWith("SPECIAL_PASS:") ? pId.replace("SPECIAL_PASS:", "") : null) ||
          (targetId.startsWith("SP-MED") ? "media_influencer" : "special_pass");
        const resolved = getSpecialPassCategory(rawCat);
        const cfg = SPECIAL_PASS_CATEGORIES[resolved];
        specialInfo = {
          isSpecialPass: true,
          category: resolved,
          categoryLabel: cfg.label,
          badgeTitle: cfg.badgeTitle,
          accentHex: cfg.accentHex,
        };
      }

      return {
        ticketId: targetId,
        name: t.name || "Attendee",
        college: t.college || "BHU",
        phone: t.phone || "",
        email: t.email || "",
        status: isUsed ? ("Used" as const) : ("Valid" as const),
        isSpecialPass: Boolean(isSpecial),
        ...(specialInfo || {}),
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: normalizedTickets.length,
      tickets: normalizedTickets,
    });
  } catch (err: any) {
    console.error("[scanner-cache] Error generating cache:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to generate scanner cache." },
      { status: 500 }
    );
  }
}
