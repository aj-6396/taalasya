import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing ticket id" }, { status: 400 });
    }

    try {
      const db = getAdminFirestore();
      const docSnap = await db.collection("tickets").doc(id).get();

      if (!docSnap.exists) {
        // Query by paymentId or orderId or ticketId field
        const querySnap = await db
          .collection("tickets")
          .where("ticketId", "==", id)
          .limit(1)
          .get();

        if (querySnap.empty) {
          return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        return NextResponse.json({ ticket: querySnap.docs[0].data() });
      }

      return NextResponse.json({ ticket: docSnap.data() });
    } catch (err: any) {
      // In demo test mode:
      if (id.startsWith("demo_") || id.startsWith("order_demo_")) {
        return NextResponse.json({
          ticket: {
            ticketId: id,
            name: "Demo Attendee",
            email: "attendee@example.com",
            phone: "+91 99999 88888",
            paymentId: "pay_mock_test",
            status: "Valid",
            createdAt: new Date().toISOString(),
          },
        });
      }
      return NextResponse.json(
        { error: err.message || "Failed to fetch ticket" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
