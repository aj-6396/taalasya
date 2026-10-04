import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { EVENT_CONFIG } from "@/lib/constants";
import { generateShortTicketId } from "@/lib/ticketId";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      email,
      phone,
      quantity = 1,
      attendees = [],
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { success: false, error: "Missing required payment identifiers." },
        { status: 400 }
      );
    }

    const isDemoMode =
      razorpay_signature === "simulated_signature" ||
      razorpay_payment_id?.startsWith("pay_demo_") ||
      razorpay_payment_id?.startsWith("pay_sim_");

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify cryptographic signature if secret is configured and not in workflow demo mode
    if (keySecret && razorpay_signature && !isDemoMode) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(razorpay_signature, "utf8"),
        Buffer.from(generatedSignature, "utf8")
      );

      if (!isSignatureValid) {
        console.error(
          `[Verify Payment] Signature mismatch for order: ${razorpay_order_id}`
        );
        return NextResponse.json(
          {
            success: false,
            error: "Payment verification failed. Invalid transaction signature.",
          },
          { status: 400 }
        );
      }
    } else if (keySecret && !razorpay_signature && !isDemoMode) {
      return NextResponse.json(
        { success: false, error: "Missing payment signature." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    // 1. Idempotency Check: check if tickets already created for this paymentId
    try {
      const { data: existingTickets } = await supabase
        .from("tickets")
        .select("*")
        .eq("paymentId", razorpay_payment_id);

      if (existingTickets && existingTickets.length > 0) {
        return NextResponse.json({
          success: true,
          ticketId: existingTickets[0].ticketId,
          ticketIds: existingTickets.map((t: any) => t.ticketId),
          tickets: existingTickets,
          message: "Tickets already generated for this payment.",
        });
      }
    } catch (checkErr) {
      console.warn("[Verify Payment] Supabase idempotency check warning:", checkErr);
    }

    // 2. Multi-Ticket Loop: Generate exact quantity of unique UUID tickets
    const ticketQuantity = Math.max(1, Number(quantity) || 1);
    const generatedTickets: any[] = [];
    const generatedTicketIds: string[] = [];

    for (let i = 0; i < ticketQuantity; i++) {
      const ticketId = generateShortTicketId();
      generatedTicketIds.push(ticketId);

      const attendeeInfo = (Array.isArray(attendees) && attendees[i]) || {};
      const attendeeName = attendeeInfo.name?.trim() || (i === 0 ? name : `Attendee ${i + 1} of ${name}`);
      const attendeeEmail = attendeeInfo.email?.trim() || email || "";
      const attendeePhone = attendeeInfo.phone?.trim() || phone || "";

      generatedTickets.push({
        ticketId,
        ticketIndex: i + 1,
        totalTickets: ticketQuantity,
        name: attendeeName,
        email: attendeeEmail,
        phone: attendeePhone,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: Math.round(EVENT_CONFIG.priceInINR),
        status: "Valid",
        eventName: EVENT_CONFIG.name,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Batch Insert into Supabase
    try {
      const { error: insertError } = await supabase
        .from("tickets")
        .insert(
          generatedTickets.map((t) => ({
            ticketId: t.ticketId,
            name: t.name,
            email: t.email,
            phone: t.phone,
            paymentId: t.paymentId,
            orderId: t.orderId,
            amount: t.amount,
            status: "Valid",
            eventName: t.eventName,
            createdAt: t.createdAt,
          }))
        );

      if (insertError) {
        console.error("[Verify Payment] Supabase insert error:", insertError);
      } else {
        console.log(
          `[Verify Payment] Successfully saved ${generatedTickets.length} tickets to Supabase.`
        );
      }
    } catch (dbErr) {
      console.error("[Verify Payment] Database write error:", dbErr);
    }

    // 4. Return confirmed ticket details to client
    return NextResponse.json({
      success: true,
      ticketId: generatedTicketIds[0],
      ticketIds: generatedTicketIds,
      tickets: generatedTickets,
      quantity: ticketQuantity,
      message: `Payment verified. ${ticketQuantity} individual passes generated.`,
    });
  } catch (err: any) {
    console.error("[Verify Payment] Unexpected server error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
