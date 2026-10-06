import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { DEFAULT_MARSHALS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminSupabase();

    // 1. Fetch Marshals from database, or fallback to default configuration
    let marshalsList = [...DEFAULT_MARSHALS];
    try {
      const { data: dbMarshals } = await supabase
        .from("gate_marshals")
        .select("*")
        .order("pin", { ascending: true });

      if (dbMarshals && dbMarshals.length > 0) {
        marshalsList = dbMarshals.map((m) => ({
          id: m.id,
          name: m.name,
          pin: m.pin,
          gate: m.gate || "Gate A",
        }));
      }
    } catch {
      // gate_marshals table might not exist yet; use DEFAULT_MARSHALS
    }

    // 2. Fetch Tickets Stats (Admitted / Total)
    let validCount = 0;
    let totalTickets = 0;
    const marshalScanCounts: Record<string, number> = {};

    try {
      const { data: ticketsData, error: ticketsErr } = await supabase
        .from("tickets")
        .select("status, scannedBy, scanned_by, usedAt, used_at");

      if (!ticketsErr && ticketsData) {
        totalTickets = ticketsData.length;
        ticketsData.forEach((t) => {
          const status = String(t.status || "").toLowerCase();
          if (status === "used") {
            validCount++;
            const marshal = (t.scannedBy || t.scanned_by || "").trim();
            if (marshal) {
              marshalScanCounts[marshal] = (marshalScanCounts[marshal] || 0) + 1;
            }
          }
        });
      }
    } catch (tErr) {
      console.warn("[scanner-stats] Tickets count query error:", tErr);
    }

    // 3. Fetch Recent Scan Logs & Duplicate/Invalid counts from scan_logs
    let recentScans: any[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;

    try {
      const { data: logsData, error: logsErr } = await supabase
        .from("scan_logs")
        .select("*")
        .order("id", { ascending: false })
        .limit(60);

      if (!logsErr && logsData && logsData.length > 0) {
        recentScans = logsData.map((log) => ({
          id: log.id,
          ticketId: log.ticketId || log.ticket_id || "",
          attendeeName: log.attendeeName || log.attendee_name || "Attendee",
          marshalName: log.marshalName || log.marshal_name || "Gate Staff",
          scanStatus: log.scanStatus || log.scan_status || "Valid",
          scannedAt: log.scannedAt || log.scanned_at || new Date().toISOString(),
        }));

        logsData.forEach((l) => {
          const st = String(l.scanStatus || l.scan_status || "").toLowerCase();
          if (st.includes("duplicate") || st.includes("used") || st.includes("already")) {
            duplicateCount++;
          } else if (st.includes("invalid") || st.includes("error")) {
            invalidCount++;
          }
        });
      } else {
        // Fallback: If scan_logs not yet populated, read from tickets where status = Used
        const { data: recentTickets } = await supabase
          .from("tickets")
          .select("ticketId, ticket_id, name, scannedBy, scanned_by, usedAt, used_at, status")
          .eq("status", "Used")
          .order("usedAt", { ascending: false })
          .limit(30);

        if (recentTickets) {
          recentScans = recentTickets.map((t, idx) => ({
            id: idx + 1,
            ticketId: t.ticketId || t.ticket_id || "",
            attendeeName: t.name || "Attendee",
            marshalName: t.scannedBy || t.scanned_by || "Gate Marshal",
            scanStatus: "Valid",
            scannedAt: t.usedAt || t.used_at || new Date().toISOString(),
          }));
        }
      }
    } catch (lErr) {
      console.warn("[scanner-stats] Scan logs query note:", lErr);
    }

    // Combine marshal definitions with their calculated scan counts
    const marshalsWithCounts = marshalsList.map((m) => {
      // Find count matching by name or id or pin
      const count =
        marshalScanCounts[m.name] ||
        marshalScanCounts[`${m.name} (${m.gate})`] ||
        marshalScanCounts[m.pin] ||
        0;

      return {
        ...m,
        scannedCount: count,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        validCount,
        alreadyUsedCount: duplicateCount,
        invalidCount,
        totalTickets,
      },
      marshals: marshalsWithCounts,
      recentScans,
    });
  } catch (error: any) {
    console.error("[scanner-stats] Route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load scanner stats" },
      { status: 500 }
    );
  }
}
