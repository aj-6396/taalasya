import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function verifyAdminPin(pin: string): boolean {
  const cleanPin = String(pin || "").trim();
  const validAdminPin =
    process.env.ADMIN_SCAN_PIN ||
    process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN ||
    "6028";
  return cleanPin === validAdminPin;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin = String(body.pin || "").trim();

    if (!verifyAdminPin(pin)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Valid Admin PIN required." },
        { status: 401 }
      );
    }

    const supabase = getAdminSupabase();

    // Fetch all tickets from Supabase
    let rawTickets: any[] = [];
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback if column is camelCase createdAt
        const fallback = await supabase
          .from("tickets")
          .select("*")
          .order("createdAt", { ascending: false });
        rawTickets = fallback.data || [];
      } else {
        rawTickets = data || [];
      }
    } catch (err) {
      console.warn("[Admin API] Failed to fetch tickets from Supabase:", err);
    }

    // Normalize tickets
    const normalizedTickets = rawTickets.map((t) => {
      const isUsed =
        t.status === "Used" ||
        t.scanned === true ||
        Boolean(t.usedAt || t.used_at || t.scannedAt || t.scanned_at);

      return {
        ticketId: t.ticketId || t.ticket_id || t.ticketid || "",
        name: t.name || "Attendee",
        email: t.email || "",
        phone: t.phone || "",
        paymentId: t.paymentId || t.payment_id || "",
        orderId: t.orderId || t.order_id || "",
        amount: Number(t.amount || 299),
        status: isUsed ? "Used" : (t.status || "Valid"),
        usedAt: t.usedAt || t.used_at || t.scannedAt || t.scanned_at || null,
        scannedBy: t.scannedBy || t.scanned_by || null,
        createdAt: t.createdAt || t.created_at || null,
        hasIdCard: Boolean(t.idCardUrl || t.id_card_url || t.idcardurl),
        idCardUrl: t.idCardUrl || t.id_card_url || t.idcardurl || null,
      };
    });

    // Compute stats
    const totalTickets = normalizedTickets.length;
    const scannedTickets = normalizedTickets.filter((t) => t.status === "Used").length;
    const pendingTickets = totalTickets - scannedTickets;
    const totalRevenue = normalizedTickets.reduce((acc, t) => acc + (t.amount || 299), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalTickets,
        scannedTickets,
        pendingTickets,
        totalRevenue,
      },
      tickets: normalizedTickets,
    });
  } catch (err: any) {
    console.error("[Admin API] Error in tickets endpoint:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
