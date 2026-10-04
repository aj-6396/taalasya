import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { normalizeTicketLookup } from "@/lib/ticketId";

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
      const supabase = getAdminSupabase();
      const candidateIds = normalizeTicketLookup(id);
      const orClauses = [
        ...candidateIds.map((cid) => `ticketId.eq.${cid}`),
        `paymentId.eq.${id}`,
        `orderId.eq.${id}`,
      ].join(",");

      const { data: ticket, error } = await supabase
        .from("tickets")
        .select("*")
        .or(orClauses)
        .maybeSingle();

      if (error || !ticket) {
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
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      // If part of an order with multiple passes, return all
      const { data: allTickets } = await supabase
        .from("tickets")
        .select("*")
        .or(`orderId.eq.${ticket.orderId},paymentId.eq.${ticket.paymentId}`);

      return NextResponse.json({
        ticket,
        tickets: allTickets && allTickets.length > 0 ? allTickets : [ticket],
      });
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
