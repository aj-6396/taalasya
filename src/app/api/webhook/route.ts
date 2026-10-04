import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { EVENT_CONFIG } from "@/lib/constants";

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

    const amountInRupees = paymentEntity.amount
      ? Math.round(paymentEntity.amount / 100)
      : EVENT_CONFIG.priceInINR;

    if (!attendeeEmail) {
      console.warn("[Webhook] Attendee email not found in payment entity or notes:", paymentEntity);
    }

    // Generate unique Ticket ID (UUID v4)
    const ticketId = crypto.randomUUID();

    // Generate dynamic QR Code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticketId}`;

    let savedToDatabase = false;

    // Write to Supabase tickets table
    try {
      const supabase = getAdminSupabase();

      // Idempotency check: see if paymentId already has a generated ticket
      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("ticketId")
        .eq("paymentId", paymentId)
        .maybeSingle();

      if (existingTicket) {
        console.log(`[Webhook] Ticket already generated for paymentId: ${paymentId}`);
        return NextResponse.json(
          { status: "ok", message: "Duplicate payment already processed" },
          { status: 200 }
        );
      }

      // Store in Supabase
      const ticketData = {
        ticketId,
        name: attendeeName,
        email: attendeeEmail || "",
        phone: attendeePhone,
        paymentId,
        orderId,
        amount: amountInRupees,
        status: "Valid",
        eventName: EVENT_CONFIG.name,
        createdAt: new Date().toISOString(),
      };

      const { error: insertErr } = await supabase
        .from("tickets")
        .insert([ticketData]);

      if (insertErr) {
        console.error("[Webhook] Supabase insert error:", insertErr);
      } else {
        savedToDatabase = true;
        console.log(`[Webhook] Ticket ${ticketId} saved to Supabase successfully.`);
      }
    } catch (dbErr) {
      console.error("[Webhook] Failed to save ticket to Supabase:", dbErr);
    }

    return NextResponse.json(
      {
        status: "ok",
        message: "Payment captured and ticket generated",
        ticketId,
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
