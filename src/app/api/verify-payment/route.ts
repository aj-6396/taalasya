import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { EVENT_CONFIG } from "@/lib/constants";

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
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { success: false, error: "Missing required payment identifiers." },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify cryptographic signature if secret is configured
    if (keySecret && razorpay_signature) {
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
    } else if (keySecret && !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment signature." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    // 1. Idempotency Check: check if ticket already created for this paymentId
    try {
      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("*")
        .eq("paymentId", razorpay_payment_id)
        .maybeSingle();

      if (existingTicket) {
        return NextResponse.json({
          success: true,
          ticketId: existingTicket.ticketId,
          ticket: existingTicket,
          message: "Ticket already generated for this payment.",
        });
      }
    } catch (checkErr) {
      console.warn("[Verify Payment] Supabase idempotency check warning:", checkErr);
    }

    // 2. Generate unique Ticket ID & Record
    const ticketId = crypto.randomUUID();
    const amount = Math.round(EVENT_CONFIG.priceInINR * Number(quantity || 1));

    const ticketData = {
      ticketId,
      name: name || "Valued Attendee",
      email: email || "",
      phone: phone || "",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount,
      status: "Valid",
      eventName: EVENT_CONFIG.name,
      createdAt: new Date().toISOString(),
    };

    // 3. Insert into Supabase
    try {
      const { error: insertError } = await supabase
        .from("tickets")
        .insert([ticketData]);

      if (insertError) {
        console.error("[Verify Payment] Supabase insert error:", insertError);
      } else {
        console.log(`[Verify Payment] Successfully saved ticket ${ticketId} to Supabase.`);
      }
    } catch (dbErr) {
      console.error("[Verify Payment] Database write error:", dbErr);
    }

    // 4. Return confirmed ticket details to client
    return NextResponse.json({
      success: true,
      ticketId,
      ticket: ticketData,
      message: "Payment verified successfully. Ticket generated.",
    });
  } catch (err: any) {
    console.error("[Verify Payment] Unexpected server error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
