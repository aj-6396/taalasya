import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay";
import { EVENT_CONFIG, getTierPrice } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, quantity = 1, attendeeNames } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required fields." },
        { status: 400 }
      );
    }

    const numQty = Number(quantity) || 1;
    const totalAmountInPaise = Math.round(getTierPrice(numQty) * 100);

    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Payment gateway credentials are not configured in environment variables." },
        { status: 500 }
      );
    }

    const razorpay = getRazorpayClient();

    const orderOptions = {
      amount: totalAmountInPaise,
      currency: EVENT_CONFIG.currency,
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        attendeeName: name,
        attendeeEmail: email,
        attendeePhone: phone,
        ticketQuantity: String(quantity),
        attendeeNames: attendeeNames ? String(attendeeNames).slice(0, 500) : name,
        eventName: EVENT_CONFIG.name,
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      name,
      email,
      phone,
    });
  } catch (err: any) {
    console.error("[API create-order] Error creating Razorpay order:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
