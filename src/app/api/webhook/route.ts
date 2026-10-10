import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { EVENT_CONFIG } from "@/lib/constants";
import { generateShortTicketId } from "@/lib/ticketId";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Check signature presence
    if (!signature) {
      console.error("[Webhook] Missing x-razorpay-signature header");
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 400 }
      );
    }

    // Strictly verify signature if webhook secret is configured
    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(expectedSignature, "utf8")
      );

      if (!isSignatureValid) {
        console.error("[Webhook] Invalid signature verification failed");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
    } else {
      console.warn(
        "[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured. Skipping HMAC validation for test environment."
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle payment.captured (and order.paid as fallback)
    if (event !== "payment.captured" && event !== "order.paid") {
      console.log(`[Webhook] Ignored event type: ${event}`);
      return NextResponse.json({ status: "ignored", event }, { status: 200 });
    }

    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity) {
      console.error("[Webhook] No payment entity found in payload");
      return NextResponse.json(
        { error: "Invalid payment payload" },
        { status: 400 }
      );
    }

    const paymentId = paymentEntity.id;
    const orderId = paymentEntity.order_id || "";
    const notes = paymentEntity.notes || {};

    const attendeeName =
      notes.attendeeName ||
      notes.name ||
      paymentEntity.notes?.name ||
      paymentEntity.description ||
      "Valued Attendee";

    const attendeeEmail =
      notes.attendeeEmail ||
      notes.email ||
      paymentEntity.email;

    const attendeePhone =
      notes.attendeePhone ||
      notes.phone ||
      paymentEntity.contact ||
      "N/A";

    const attendeeCollege =
      notes.attendeeCollege ||
      notes.college ||
      "";

    const amountInRupees = paymentEntity.amount
      ? Math.round(paymentEntity.amount / 100)
      : EVENT_CONFIG.priceInINR;

    if (!attendeeEmail) {
      console.warn("[Webhook] Attendee email not found in payment entity or notes:", paymentEntity);
    }

    // Multi-Ticket setup from notes
    const ticketQuantity = Math.max(1, Number(notes.ticketQuantity) || 1);
    const rawNames = notes.attendeeNames ? String(notes.attendeeNames).split(",") : [];
    const namesList = rawNames.map((s: string) => s.trim()).filter(Boolean);

    let savedToDatabase = false;
    const generatedTicketIds: string[] = [];

    // Write to Supabase tickets table
    try {
      const supabase = getAdminSupabase();

      // Idempotency check: see if paymentId already has generated tickets
      const { data: existingTickets } = await supabase
        .from("tickets")
        .select("ticketId")
        .eq("paymentId", paymentId);

      if (existingTickets && existingTickets.length >= ticketQuantity) {
        console.log(`[Webhook] All ${ticketQuantity} tickets already generated for paymentId: ${paymentId}`);
        return NextResponse.json(
          { status: "ok", message: "Duplicate payment already processed" },
          { status: 200 }
        );
      }

      // Generate all tickets
      const ticketsToInsert = [];
      for (let i = 0; i < ticketQuantity; i++) {
        const ticketId = generateShortTicketId();
        generatedTicketIds.push(ticketId);
        const indName = namesList[i] || (i === 0 ? attendeeName : `Attendee ${i + 1} of ${attendeeName}`);

        ticketsToInsert.push({
          ticketId,
          name: indName,
          email: attendeeEmail || "",
          phone: attendeePhone,
          college: attendeeCollege || null,
          paymentId,
          orderId,
          amount: Math.round(amountInRupees / ticketQuantity),
          status: "Valid",
          eventName: EVENT_CONFIG.name,
          createdAt: new Date().toISOString(),
        });
      }

      const { error: insertErr } = await supabase
        .from("tickets")
        .insert(ticketsToInsert);

      if (insertErr) {
        console.warn("[Webhook] Primary Supabase insert warning:", insertErr.message);
        // Fallback: retry without college column if column doesn't exist
        const fallbackTickets = ticketsToInsert.map(({ college, ...rest }) => rest);
        const { error: fallbackErr } = await supabase.from("tickets").insert(fallbackTickets);
        if (fallbackErr) {
          console.error("[Webhook] Fallback Supabase insert error:", fallbackErr.message);
        } else {
          savedToDatabase = true;
          console.log(`[Webhook] ${fallbackTickets.length} tickets saved to Supabase via fallback.`);
        }
      } else {
        savedToDatabase = true;
        console.log(`[Webhook] ${ticketsToInsert.length} tickets saved to Supabase successfully.`);
      }
    } catch (dbErr) {
      console.error("[Webhook] Failed to save ticket to Supabase:", dbErr);
    }

    return NextResponse.json(
      {
        status: "ok",
        message: "Payment captured and tickets generated",
        ticketId: generatedTicketIds[0] || null,
        ticketIds: generatedTicketIds,
        savedToDatabase,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[Webhook] Fatal error processing webhook:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
