import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay";
import { EVENT_CONFIG } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, quantity = 1 } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required fields." },
        { status: 400 }
      );
    }

    const price = EVENT_CONFIG.priceInINR;
    const totalAmountInPaise = Math.round(price * quantity * 100);

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    // Check if live Razorpay keys are configured
    if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn(
        "[API create-order] Razorpay credentials not found in env. Returning simulated order for demo."
      );
      const mockOrderId = `order_demo_${Date.now()}`;
      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        amount: totalAmountInPaise,
        currency: EVENT_CONFIG.currency,
        keyId: keyId || "rzp_test_placeholder",
        name,
        email,
        phone,
        isDemo: true,
      });
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
