import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { normalizeTicketLookup } from "@/lib/ticketId";
import { DEFAULT_MARSHALS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pin, marshalName, scans = [] } = body;

    const cleanPin = String(pin || "").trim();

    if (!Array.isArray(scans) || scans.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scans to sync.",
        processed: 0,
        synced: 0,
      });
    }

    const adminPin = process.env.ADMIN_SCAN_PIN || process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN || "";
    let isAuthorized = Boolean(adminPin && cleanPin === adminPin);

    if (!isAuthorized) {
      isAuthorized = Boolean(DEFAULT_MARSHALS.some((m) => m.pin && m.pin === cleanPin));
    }

    const supabase = getAdminSupabase();

    if (!isAuthorized && cleanPin) {
      try {
        const { data: dbMarshal } = await supabase
          .from("gate_marshals")
          .select("id")
          .eq("pin", cleanPin)
          .maybeSingle();
        if (dbMarshal) isAuthorized = true;
      } catch {
        // ignore
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Unauthorized PIN. Batch sync rejected." },
        { status: 401 }
      );
    }

    const activeMarshal = marshalName || "Gate Marshal (Offline Sync)";
    let syncedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    for (const scan of scans) {
      const targetTicketId = String(scan.ticketId || "").trim();
      if (!targetTicketId) continue;

      const candidateIds = normalizeTicketLookup(targetTicketId);

      try {
        // Find ticket in database
        let ticketData: any = null;
        const res1 = await supabase
          .from("tickets")
          .select("*")
          .in("ticketId", candidateIds)
          .maybeSingle();

        if (res1.data) {
          ticketData = res1.data;
        } else {
          const res2 = await supabase
            .from("tickets")
            .select("*")
            .in("ticket_id", candidateIds)
            .maybeSingle();
          if (res2.data) ticketData = res2.data;
        }

        if (!ticketData) {
          failedCount++;
          continue;
        }

        const primaryKeyCol = ticketData.ticket_id ? "ticket_id" : (ticketData.ticketid ? "ticketid" : "ticketId");
        const targetId = ticketData.ticket_id || ticketData.ticketid || ticketData.ticketId;
        const currentUsedAt = ticketData.usedAt ?? ticketData.used_at ?? null;
        const currentStatus = String(ticketData.status || "").toLowerCase();

        // Check if already used
        if (Boolean(currentUsedAt) && currentStatus === "used") {
          duplicateCount++;
          try {
            await supabase.from("scan_logs").insert({
              ticketId: targetId,
              marshalName: activeMarshal,
              marshalPin: cleanPin,
              scanStatus: "Duplicate Attempt (Offline Conflict)",
              attendeeName: ticketData.name || "Attendee",
              scannedAt: scan.scannedAt || new Date().toISOString(),
            });
          } catch {
            // ignore
          }
          continue;
        }

        // Mark as used
        const scanTimestamp = scan.scannedAt || new Date().toISOString();
        const updatePayload: Record<string, any> = {
          status: "Used",
          usedAt: scanTimestamp,
          scannedBy: activeMarshal,
          marshalPin: cleanPin,
        };
        if ("used_at" in ticketData || ticketData.ticket_id) {
          updatePayload.used_at = scanTimestamp;
          updatePayload.scanned_by = activeMarshal;
        }

        await supabase
          .from("tickets")
          .update(updatePayload)
          .eq(primaryKeyCol, targetId);

        syncedCount++;

        // Insert audit log
        try {
          await supabase.from("scan_logs").insert({
            ticketId: targetId,
            marshalName: activeMarshal,
            marshalPin: cleanPin,
            scanStatus: "Valid (Offline Sync)",
            attendeeName: ticketData.name || "Attendee",
            scannedAt: scanTimestamp,
          });
        } catch {
          // ignore
        }
      } catch (scanErr) {
        console.warn("[batch-sync] Error syncing ticket:", targetTicketId, scanErr);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} offline scans to database.`,
      processed: scans.length,
      synced: syncedCount,
      alreadyUsed: duplicateCount,
      failed: failedCount,
    });
  } catch (err: any) {
    console.error("[batch-sync] Fatal error during sync:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to process batch sync." },
      { status: 500 }
    );
  }
}
