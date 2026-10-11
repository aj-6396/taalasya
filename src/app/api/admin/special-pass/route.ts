import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  SPECIAL_PASS_CATEGORIES,
  SpecialPassCategory,
  generateSpecialTicketId,
  getSpecialPassCategory,
} from "@/lib/specialPass";

export const dynamic = "force-dynamic";

function verifySpecialPassPin(pin?: string | null): boolean {
  const cleanPin = String(pin || "").trim();
  const validSpecialPin =
    process.env.SPECIAL_PASS_PIN ||
    process.env.NEXT_PUBLIC_SPECIAL_PASS_PIN;
  const validAdminPin =
    process.env.ADMIN_SCAN_PIN ||
    process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN;

  return (
    cleanPin === validSpecialPin ||
    Boolean(validAdminPin && cleanPin === validAdminPin)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pin, action = "list" } = body;

    if (!verifySpecialPassPin(pin)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Valid Passcode required." },
        { status: 401 }
      );
    }

    if (action === "verify") {
      return NextResponse.json({ success: true, message: "Access Granted." });
    }

    const supabase = getAdminSupabase();

    // =========================================================================
    // 1. ACTION: CREATE SPECIAL PASS
    // =========================================================================
    if (action === "create") {
      const {
        name,
        category = "volunteer",
        designation = "",
        college = "Banaras Hindu University (BHU)",
        email = "",
        phone = "",
        customTicketId = "",
      } = body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { success: false, message: "Recipient name is required." },
          { status: 400 }
        );
      }

      const resolvedCategory: SpecialPassCategory =
        getSpecialPassCategory(category) || "volunteer";
      const cfg = SPECIAL_PASS_CATEGORIES[resolvedCategory];

      const cleanTicketId =
        customTicketId && typeof customTicketId === "string" && customTicketId.trim()
          ? customTicketId.trim().toUpperCase()
          : generateSpecialTicketId(resolvedCategory);

      const resolvedDesignation =
        designation.trim() ||
        (resolvedCategory === "volunteer"
          ? "Event Volunteer"
          : resolvedCategory === "special_guest"
          ? "Special Guest"
          : resolvedCategory === "core_committee"
          ? "Core Committee Member"
          : "Organizer");

      const nowIso = new Date().toISOString();
      const paymentIdentifier = `SPECIAL_PASS:${resolvedCategory}`;
      const orderIdentifier = `SP_${cfg.shortPrefix}_${Date.now()}`;

      // Insert object - include both camelCase and fallback fields
      const newTicketPayload: Record<string, any> = {
        ticketId: cleanTicketId,
        name: name.trim(),
        email: email.trim() || `${cleanTicketId.toLowerCase()}@specialpass.taalasya`,
        phone: phone.trim() || "N/A",
        college: college.trim() || "Banaras Hindu University (BHU)",
        paymentId: paymentIdentifier,
        orderId: orderIdentifier,
        amount: 0,
        status: "Valid",
        eventName: "JHOOM '26 — Dance Fest cum Dandiya Night",
        createdAt: nowIso,
      };

      // Check if Supabase credentials are configured
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const isDbConfigured = Boolean(
        supabaseUrl &&
        !supabaseUrl.includes("placeholder") &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      );

      let insertResult: any = null;
      let isSavedToDb = false;
      let dbWarningNote: string | null = null;

      if (!isDbConfigured) {
        dbWarningNote = "Supabase not connected. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.";
        console.warn("[special-pass]", dbWarningNote);
      } else {
        try {
          const resWithPassType = await supabase
            .from("tickets")
            .insert({
              ...newTicketPayload,
              passType: resolvedCategory,
            })
            .select()
            .maybeSingle();

          if (resWithPassType.error) {
            console.warn("[special-pass] Insert with passType note:", resWithPassType.error.message);
            const resFallback = await supabase
              .from("tickets")
              .insert(newTicketPayload)
              .select()
              .maybeSingle();

            if (resFallback.error) {
              console.warn("[special-pass] Fallback insert warning:", resFallback.error.message);
              dbWarningNote = `Database insert notice: ${resFallback.error.message}`;
            } else {
              insertResult = resFallback.data;
              isSavedToDb = true;
            }
          } else {
            insertResult = resWithPassType.data;
            isSavedToDb = true;
          }
        } catch (insertErr: any) {
          console.warn("[special-pass] Network/Database insert warning:", insertErr);
          dbWarningNote = `Database network error (${insertErr.message || "fetch failed"}). Pass generated in local mode.`;
        }
      }

      const createdTicket = {
        ...(insertResult || newTicketPayload),
        ticketId: cleanTicketId,
        name: name.trim(),
        category: resolvedCategory,
        designation: resolvedDesignation,
        college: college.trim() || "Banaras Hindu University (BHU)",
        email: email.trim(),
        phone: phone.trim(),
        status: "Valid",
        createdAt: nowIso,
      };

      return NextResponse.json({
        success: true,
        message: isSavedToDb
          ? `Special Pass for ${name.trim()} (${cfg.label}) created and saved to database!`
          : `Special Pass for ${name.trim()} (${cfg.label}) generated successfully! ${dbWarningNote ? `(${dbWarningNote})` : ""}`,
        ticket: createdTicket,
        savedToDb: isSavedToDb,
      });
    }

    // =========================================================================
    // 2. ACTION: LIST SPECIAL PASSES
    // =========================================================================
    // Fetch all tickets that match special pass criteria
    let rawTickets: any[] = [];
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDbConfigured = Boolean(
      supabaseUrl &&
      !supabaseUrl.includes("placeholder") &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    );

    if (isDbConfigured) {
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select("*")
          .order("createdAt", { ascending: false });

        if (error) {
          const fallback = await supabase
            .from("tickets")
            .select("*")
            .order("created_at", { ascending: false });
          rawTickets = fallback.data || [];
        } else {
          rawTickets = data || [];
        }
      } catch (dbErr) {
        console.warn("[special-pass] DB query warning:", dbErr);
      }
    }

    // Filter only special passes
    const specialPasses = rawTickets
      .filter((t) => {
        const pId = String(t.paymentId || t.payment_id || "");
        const tId = String(t.ticketId || t.ticket_id || "");
        const pType = String(t.passType || t.pass_type || "");
        const amt = Number(t.amount);

        return (
          pId.startsWith("SPECIAL_PASS:") ||
          tId.startsWith("SP-") ||
          Boolean(pType && pType !== "regular") ||
          (amt === 0 && (pId.includes("PASS") || pId.includes("COMP") || tId.startsWith("SP")))
        );
      })
      .map((t) => {
        const pId = String(t.paymentId || t.payment_id || "");
        const rawCategory =
          t.passType ||
          t.pass_type ||
          (pId.startsWith("SPECIAL_PASS:") ? pId.replace("SPECIAL_PASS:", "") : null) ||
          "volunteer";

        const category = getSpecialPassCategory(rawCategory) || "volunteer";
        const cfg = SPECIAL_PASS_CATEGORIES[category];

        const isUsed =
          t.status === "Used" ||
          Boolean(t.usedAt || t.used_at || t.scannedBy || t.scanned_by);

        return {
          ticketId: t.ticketId || t.ticket_id || "",
          name: t.name || "Special Guest",
          category,
          categoryLabel: cfg.label,
          badgeTitle: cfg.badgeTitle,
          accentHex: cfg.accentHex,
          email: t.email || "",
          phone: t.phone || "",
          college: t.college || "Banaras Hindu University (BHU)",
          status: isUsed ? "Used" : (t.status || "Valid"),
          usedAt: t.usedAt || t.used_at || null,
          scannedBy: t.scannedBy || t.scanned_by || null,
          createdAt: t.createdAt || t.created_at || null,
          paymentId: pId,
        };
      });

    // Calculate category breakdown stats
    const stats = {
      total: specialPasses.length,
      scanned: specialPasses.filter((p) => p.status === "Used").length,
      pending: specialPasses.filter((p) => p.status !== "Used").length,
      volunteers: specialPasses.filter((p) => p.category === "volunteer").length,
      specialGuests: specialPasses.filter((p) => p.category === "special_guest").length,
      coreCommittee: specialPasses.filter((p) => p.category === "core_committee").length,
      organizers: specialPasses.filter((p) => p.category === "organizer").length,
    };

    return NextResponse.json({
      success: true,
      stats,
      passes: specialPasses,
    });
  } catch (err: any) {
    console.error("[special-pass] Handler error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
