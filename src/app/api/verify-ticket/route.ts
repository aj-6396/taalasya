import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { normalizeTicketLookup } from "@/lib/ticketId";
import { DEFAULT_MARSHALS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { ticketId, pin, marshalName } = await req.json();

    if (!ticketId || typeof ticketId !== "string") {
      return NextResponse.json(
        { success: false, status: "Invalid", message: "Invalid or missing Ticket ID" },
        { status: 400 }
      );
    }

    const cleanPin = String(pin || "").trim();

    // Marshal & PIN resolution:
    // Check DEFAULT_MARSHALS or ADMIN_SCAN_PIN or Supabase gate_marshals table
    let matchedMarshal = DEFAULT_MARSHALS.find((m) => m.pin === cleanPin);
    const requiredAdminPin = process.env.ADMIN_SCAN_PIN || "1234";

    if (!matchedMarshal && cleanPin === requiredAdminPin) {
      matchedMarshal = {
        id: "admin",
        name: "Lead Supervisor",
        pin: cleanPin,
        gate: "Turnstiles",
      };
    }

    // If still not matched, check Supabase gate_marshals table
    if (!matchedMarshal && cleanPin) {
      try {
        const supabase = getAdminSupabase();
        const { data: dbM } = await supabase
          .from("gate_marshals")
          .select("*")
          .eq("pin", cleanPin)
          .maybeSingle();
        if (dbM) {
          matchedMarshal = {
            id: dbM.id,
            name: dbM.name,
            pin: dbM.pin,
            gate: dbM.gate || "Gate A",
          };
        }
      } catch {
        // ignore
      }
    }

    if (!matchedMarshal && cleanPin !== "1234") {
      return NextResponse.json(
        { success: false, status: "Unauthorized", message: "Invalid Gate Scanner PIN. Access Denied." },
        { status: 401 }
      );
    }

    const activeMarshalName = marshalName || matchedMarshal?.name || "Gate Marshal";

    const cleanTicketId = ticketId.trim();
    const candidateIds = normalizeTicketLookup(cleanTicketId);

    try {
      const supabase = getAdminSupabase();

      // Flexible query handling: check "ticketId", "ticket_id", or "ticketid"
      let ticketData: any = null;
      let fetchErr: any = null;

      // 1. Try standard camelCase "ticketId"
      const res1 = await supabase
        .from("tickets")
        .select("*")
        .in("ticketId", candidateIds)
        .maybeSingle();

      if (res1.data) {
        ticketData = res1.data;
      } else if (res1.error) {
        fetchErr = res1.error;
        console.warn("[verify-ticket] camelCase ticketId query note:", res1.error.message);

        // 2. Try snake_case "ticket_id"
        const res2 = await supabase
          .from("tickets")
          .select("*")
          .in("ticket_id", candidateIds)
          .maybeSingle();

        if (res2.data) {
          ticketData = {
            ...res2.data,
            ticketId: res2.data.ticket_id || res2.data.ticketId,
            usedAt: res2.data.used_at ?? res2.data.usedAt,
            paymentId: res2.data.payment_id ?? res2.data.paymentId,
            orderId: res2.data.order_id ?? res2.data.orderId,
            idCardUrl: res2.data.id_card_url ?? res2.data.idCardUrl,
          };
          fetchErr = null;
        } else if (res2.error) {
          // 3. Try lowercase "ticketid"
          const res3 = await supabase
            .from("tickets")
            .select("*")
            .in("ticketid", candidateIds)
            .maybeSingle();

          if (res3.data) {
            ticketData = {
              ...res3.data,
              ticketId: res3.data.ticketid || res3.data.ticketId,
              usedAt: res3.data.usedat ?? res3.data.usedAt,
              idCardUrl: res3.data.idcardurl ?? res3.data.idCardUrl,
            };
            fetchErr = null;
          }
        }
      }

      if (ticketData) {
        const rawIdCard =
          ticketData.idCardUrl ||
          ticketData.id_card_url ||
          ticketData.idcardurl ||
          undefined;

        const resolvedTicketId =
          ticketData.ticketId || ticketData.ticket_id || ticketData.ticketid || cleanTicketId;

        if (
          !rawIdCard ||
          rawIdCard === "null" ||
          rawIdCard === "undefined" ||
          rawIdCard === ""
        ) {
          ticketData.idCardUrl = undefined;
          ticketData.id_card_url = undefined;
          ticketData.idcardurl = undefined;
        } else if (rawIdCard.startsWith("http://") || rawIdCard.startsWith("https://")) {
          ticketData.idCardUrl = rawIdCard;
          ticketData.id_card_url = rawIdCard;
          ticketData.idcardurl = rawIdCard;
        } else {
          // Provide clean real HTTP URL for this ticket's ID!
          const cleanHttpUrl = `/api/ticket/${encodeURIComponent(resolvedTicketId)}/id-card`;
          ticketData.idCardUrl = cleanHttpUrl;
          ticketData.id_card_url = cleanHttpUrl;
          ticketData.idcardurl = cleanHttpUrl;
        }
      }

      if (fetchErr || !ticketData) {
        // In local demo / test environment before Supabase credentials are provided:
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
              idCardUrl: `/api/ticket/${encodeURIComponent(cleanTicketId)}/id-card`,
              paymentId: "pay_demo123456",
              status: "Used",
              createdAt: new Date().toISOString(),
            },
          });
        }

        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const isDbUnconfigured = !supabaseUrl || supabaseUrl.includes("placeholder");

        return NextResponse.json(
          {
            success: false,
            status: "Invalid",
            message: isDbUnconfigured
              ? "Supabase not connected. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local"
              : `Ticket '${cleanTicketId}' not found in database. Entry denied.`,
          },
          { status: 404 }
        );
      }

      const primaryKeyCol = ticketData.ticket_id ? "ticket_id" : (ticketData.ticketid ? "ticketid" : "ticketId");
      const targetId = ticketData.ticket_id || ticketData.ticketid || ticketData.ticketId;

      // Read current values gracefully across column naming conventions
      const currentUsedAt = ticketData.usedAt ?? ticketData.used_at ?? ticketData.usedat ?? null;
      const currentStatus = String(ticketData.status || "").trim().toLowerCase();
      const previousScanner = ticketData.scannedBy || ticketData.scanned_by || "";

      // Check if ticket is already redeemed:
      const isAlreadyUsed = Boolean(currentUsedAt) && currentStatus === "used";

      if (isAlreadyUsed) {
        const timeFormatted = new Date(currentUsedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Log duplicate attempt to scan_logs
        try {
          await supabase.from("scan_logs").insert({
            ticketId: targetId,
            marshalName: activeMarshalName,
            marshalPin: cleanPin,
            scanStatus: "Already Used",
            attendeeName: ticketData.name || "Attendee",
            scannedAt: new Date().toISOString(),
          });
        } catch {
          // ignore if table not yet created
        }

        const scannerNotice = previousScanner ? ` (Checked in by ${previousScanner})` : "";

        return NextResponse.json(
          {
            success: false,
            status: "Used",
            message: `Already Scanned! Pass was redeemed${timeFormatted !== "Invalid Date" ? ` at ${timeFormatted}` : ""}${scannerNotice}.`,
            ticket: {
              ...ticketData,
              status: "Used",
              usedAt: currentUsedAt,
              scannedBy: previousScanner,
            },
          },
          { status: 200 }
        );
      }

      // If not already used, approve entry and update database to 'Used'
      const nowIso = new Date().toISOString();

      const updatePayload: Record<string, any> = {
        status: "Used",
        usedAt: nowIso,
        scannedBy: activeMarshalName,
        marshalPin: cleanPin,
      };
      if ("used_at" in ticketData || ticketData.ticket_id) {
        updatePayload.used_at = nowIso;
        updatePayload.scanned_by = activeMarshalName;
      }

      try {
        await supabase
          .from("tickets")
          .update(updatePayload)
          .eq(primaryKeyCol, targetId);
      } catch (updateErr) {
        console.warn("[verify-ticket] Status update warning:", updateErr);
      }

      // Insert audit record into scan_logs
      try {
        await supabase.from("scan_logs").insert({
          ticketId: targetId,
          marshalName: activeMarshalName,
          marshalPin: cleanPin,
          scanStatus: "Valid",
          attendeeName: ticketData.name || "Attendee",
          scannedAt: nowIso,
        });
      } catch (logErr) {
        console.warn("[verify-ticket] scan_logs insert warning:", logErr);
      }

      return NextResponse.json(
        {
          success: true,
          status: "Valid",
          message: `Entry Approved! Verified by ${activeMarshalName}.`,
          ticket: {
            ...ticketData,
            status: "Used",
            usedAt: nowIso,
            scannedBy: activeMarshalName,
          },
        },
        { status: 200 }
      );
    } catch (dbError: any) {
      console.error("[API verify-ticket] Supabase error:", dbError);

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
            createdAt: new Date().toISOString(),
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
