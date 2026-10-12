import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { EVENT_CONFIG } from "@/lib/constants";
import { generateShortTicketId } from "@/lib/ticketId";
import { isTestTicket } from "@/lib/isTestTicket";

export const dynamic = "force-dynamic";

function verifyAdminPin(pin?: string | null): boolean {
  const cleanPin = String(pin || "").trim();
  const validAdminPin =
    process.env.ADMIN_SCAN_PIN ||
    process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN;
  const validSpecialPin =
    process.env.SPECIAL_PASS_PIN ||
    process.env.NEXT_PUBLIC_SPECIAL_PASS_PIN;

  return Boolean(
    (validAdminPin && cleanPin === validAdminPin) ||
    (validSpecialPin && cleanPin === validSpecialPin)
  );
}

// Fetch all captured payments directly from Razorpay API with automatic pagination
async function fetchAllCapturedRazorpayPayments(keyId: string, keySecret: string): Promise<any[]> {
  const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const capturedPayments: any[] = [];
  let skip = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`https://api.razorpay.com/v1/payments?count=${limit}&skip=${skip}`, {
      headers: {
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Razorpay API responded with status ${res.status}: ${err}`);
    }

    const data = await res.json();
    const items = data.items || [];

    for (const item of items) {
      if (item.status === "captured") {
        capturedPayments.push(item);
      }
    }

    if (items.length < limit) {
      hasMore = false;
    } else {
      skip += limit;
    }
  }

  return capturedPayments;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pin, action = "preview" } = body;

    if (!verifyAdminPin(pin)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Valid Admin Passcode required." },
        { status: 401 }
      );
    }

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay credentials not configured in environment.",
        },
        { status: 500 }
      );
    }

    // 1. Fetch live captured payments from Razorpay
    const capturedPayments = await fetchAllCapturedRazorpayPayments(
      razorpayKeyId,
      razorpayKeySecret
    );

    // 2. Fetch existing tickets from Supabase
    const supabase = getAdminSupabase();
    let supabaseTickets: any[] = [];

    try {
      const { data, error } = await supabase.from("tickets").select("*");
      if (!error && data) {
        supabaseTickets = data;
      } else {
        console.warn("[reconcile] Supabase query warning:", error?.message);
      }
    } catch (dbErr) {
      console.warn("[reconcile] Database fetch note:", dbErr);
    }

    // Identify dummy/test tickets in Supabase
    const dummyTicketsInDb = supabaseTickets.filter((t) => isTestTicket(t));
    const genuineTicketsInDb = supabaseTickets.filter((t) => !isTestTicket(t));

    // Group genuine database tickets by paymentId
    const ticketsByPaymentId: Record<string, any[]> = {};
    for (const t of genuineTicketsInDb) {
      const pId = String(t.paymentId || t.payment_id || "").trim();
      if (!pId) continue;
      if (!ticketsByPaymentId[pId]) ticketsByPaymentId[pId] = [];
      ticketsByPaymentId[pId].push(t);
    }

    // 3. Reconcile each Razorpay captured payment
    let totalRazorpayTickets = 0;
    const missingPayments: any[] = [];
    const partiallyMissingPayments: any[] = [];
    const ticketsToInsert: any[] = [];

    for (const payment of capturedPayments) {
      const pId = payment.id;
      const amtInRs = Math.round(payment.amount / 100);
      const notes = payment.notes || {};

      // Determine required ticket quantity
      let quantity = Number(notes.ticketQuantity || notes.quantity);
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        if (amtInRs === 299) quantity = 1;
        else if (amtInRs === 549) quantity = 2;
        else if (amtInRs === 999) quantity = 4;
        else if (amtInRs === 1249) quantity = 5;
        else quantity = Math.max(1, Math.round(amtInRs / 299));
      }

      totalRazorpayTickets += quantity;

      const rawAttendeeNames = notes.attendeeNames
        ? String(notes.attendeeNames)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const buyerName = (
        notes.name ||
        notes.attendeeName ||
        payment.description ||
        "Valued Attendee"
      ).trim();

      const buyerEmail = notes.email || notes.attendeeEmail || payment.email || "";
      const buyerPhone = notes.phone || notes.attendeePhone || payment.contact || "N/A";
      const buyerCollege = notes.college || notes.attendeeCollege || "";

      const existingForPayment = ticketsByPaymentId[pId] || [];
      const missingCount = quantity - existingForPayment.length;

      if (existingForPayment.length === 0) {
        // Completely missing from Supabase!
        missingPayments.push({
          paymentId: pId,
          orderId: payment.order_id,
          buyerName,
          email: buyerEmail,
          phone: buyerPhone,
          amount: amtInRs,
          expectedTickets: quantity,
          existingTickets: 0,
          missingTickets: quantity,
          date: new Date(payment.created_at * 1000).toISOString(),
        });

        // Prepare new tickets for insertion
        for (let i = 0; i < quantity; i++) {
          const attendeeName =
            rawAttendeeNames[i] ||
            (i === 0 ? buyerName : `Attendee ${i + 1} of ${buyerName}`);

          ticketsToInsert.push({
            ticketId: generateShortTicketId(),
            name: attendeeName,
            email: buyerEmail,
            phone: buyerPhone,
            college: buyerCollege || null,
            paymentId: pId,
            orderId: payment.order_id || null,
            amount: Math.round(amtInRs / quantity),
            status: "Valid",
            eventName: EVENT_CONFIG.name,
            createdAt: new Date(payment.created_at * 1000).toISOString(),
          });
        }
      } else if (missingCount > 0) {
        // Partially missing (e.g. bought 4, but only 1 ticket row exists!)
        partiallyMissingPayments.push({
          paymentId: pId,
          orderId: payment.order_id,
          buyerName,
          email: buyerEmail,
          phone: buyerPhone,
          amount: amtInRs,
          expectedTickets: quantity,
          existingTickets: existingForPayment.length,
          missingTickets: missingCount,
          date: new Date(payment.created_at * 1000).toISOString(),
        });

        // Insert only the missing remaining tickets
        for (let i = existingForPayment.length; i < quantity; i++) {
          const attendeeName =
            rawAttendeeNames[i] || `Attendee ${i + 1} of ${buyerName}`;

          ticketsToInsert.push({
            ticketId: generateShortTicketId(),
            name: attendeeName,
            email: buyerEmail,
            phone: buyerPhone,
            college: buyerCollege || null,
            paymentId: pId,
            orderId: payment.order_id || null,
            amount: Math.round(amtInRs / quantity),
            status: "Valid",
            eventName: EVENT_CONFIG.name,
            createdAt: new Date(payment.created_at * 1000).toISOString(),
          });
        }
      }
    }

    const totalMissingTickets = ticketsToInsert.length;

    // 4. ACTION: SYNC (Insert missing tickets into Supabase)
    let insertedCount = 0;
    let syncError: string | null = null;

    if (action === "sync" && totalMissingTickets > 0) {
      try {
        // Insert in batches of 50 to avoid payload limit
        const chunkSize = 50;
        for (let i = 0; i < ticketsToInsert.length; i += chunkSize) {
          const chunk = ticketsToInsert.slice(i, i + chunkSize);
          const { error: insertErr } = await supabase.from("tickets").insert(chunk);

          if (insertErr) {
            console.warn("[reconcile] Primary insert warning, trying fallback:", insertErr.message);
            // Fallback without college column
            const fallbackChunk = chunk.map(({ college, ...rest }) => rest);
            const { error: fallbackErr } = await supabase
              .from("tickets")
              .insert(fallbackChunk);

            if (fallbackErr) {
              throw new Error(fallbackErr.message);
            }
          }
          insertedCount += chunk.length;
        }
      } catch (insertErr: any) {
        console.error("[reconcile] Sync insert error:", insertErr);
        syncError = insertErr.message || "Failed to insert some missing tickets.";
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        razorpayCapturedPayments: capturedPayments.length,
        razorpayTotalTicketsSold: totalRazorpayTickets,
        supabaseTotalRows: supabaseTickets.length,
        supabaseDummyTickets: dummyTicketsInDb.length,
        supabaseGenuineTickets: genuineTicketsInDb.length,
        completelyMissingOrdersCount: missingPayments.length,
        partiallyMissingOrdersCount: partiallyMissingPayments.length,
        totalMissingTicketsCount: totalMissingTickets,
        insertedCount: action === "sync" ? insertedCount : 0,
        syncError,
      },
      missingOrders: [...missingPayments, ...partiallyMissingPayments],
      dummyTicketsCount: dummyTicketsInDb.length,
    });
  } catch (err: any) {
    console.error("[reconcile] Handler error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
