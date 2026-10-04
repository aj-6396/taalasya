import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { ticketId, pin } = await req.json();

    if (!ticketId || typeof ticketId !== "string") {
      return NextResponse.json(
        { success: false, status: "Invalid", message: "Invalid or missing Ticket ID" },
        { status: 400 }
      );
    }

    // Optional admin security pin verification
    const requiredPin = process.env.ADMIN_SCAN_PIN;
    if (requiredPin && pin !== requiredPin) {
      return NextResponse.json(
        { success: false, status: "Unauthorized", message: "Invalid Gate Scanner PIN" },
        { status: 401 }
      );
    }

    const cleanTicketId = ticketId.trim();

    try {
      const db = getAdminFirestore();
      const ticketRef = db.collection("tickets").doc(cleanTicketId);
      const ticketSnap = await ticketRef.get();

      if (!ticketSnap.exists) {
        // Query by ticketId field as fallback in case custom doc ID was used
        const querySnap = await db
          .collection("tickets")
          .where("ticketId", "==", cleanTicketId)
          .limit(1)
          .get();

        if (querySnap.empty) {
          return NextResponse.json(
            {
              success: false,
              status: "Invalid",
              message: "Ticket not found in database. Entry denied.",
            },
            { status: 404 }
          );
        }

        const doc = querySnap.docs[0];
        const ticketData = doc.data();

        if (ticketData.status === "Used") {
          return NextResponse.json(
            {
              success: false,
              status: "Used",
              message: "Already Scanned! This ticket was already redeemed.",
              ticket: ticketData,
            },
            { status: 200 }
          );
        }

        if (ticketData.status === "Valid") {
          // Update status to 'Used'
          const usedAt = new Date();
          await doc.ref.update({
            status: "Used",
            usedAt,
          });

          return NextResponse.json(
            {
              success: true,
              status: "Valid",
              message: "Access Granted! Welcome to the event.",
              ticket: { ...ticketData, status: "Used", usedAt },
            },
            { status: 200 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            status: ticketData.status || "Invalid",
            message: `Ticket is in '${ticketData.status}' status.`,
            ticket: ticketData,
          },
          { status: 200 }
        );
      }

      const ticketData = ticketSnap.data();
      if (!ticketData) {
        return NextResponse.json(
          { success: false, status: "Invalid", message: "Invalid ticket record." },
          { status: 404 }
        );
      }

      if (ticketData.status === "Used") {
        return NextResponse.json(
          {
            success: false,
            status: "Used",
            message: "Already Scanned! This ticket was already redeemed.",
            ticket: ticketData,
          },
          { status: 200 }
        );
      }

      if (ticketData.status === "Valid") {
        // Mark as used
        const usedAt = new Date();
        await ticketRef.update({
          status: "Used",
          usedAt,
        });

        return NextResponse.json(
          {
            success: true,
            status: "Valid",
            message: "Access Granted! Welcome to the event.",
            ticket: { ...ticketData, status: "Used", usedAt },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          status: ticketData.status || "Invalid",
          message: `Ticket is marked as ${ticketData.status}`,
          ticket: ticketData,
        },
        { status: 200 }
      );
    } catch (dbError: any) {
      console.error("[API verify-ticket] Firestore error:", dbError);

      // In local demo / test environment before Firestore credentials are provided:
      if (cleanTicketId.startsWith("demo_") || cleanTicketId.includes("test")) {
        return NextResponse.json({
          success: true,
          status: "Valid",
          message: "[Demo Mode] Access Granted for Test Ticket!",
          ticket: {
            ticketId: cleanTicketId,
            name: "Demo Attendee",
            email: "attendee@example.com",
            phone: "+91 98765 43210",
            paymentId: "pay_demo123456",
            status: "Used",
            createdAt: new Date(),
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          status: "Error",
          message: dbError.message || "Database connection error during verification",
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[API verify-ticket] Request processing error:", err);
    return NextResponse.json(
      { success: false, status: "Error", message: "Failed to process scan request" },
      { status: 500 }
    );
  }
}
