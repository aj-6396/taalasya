import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function verifyAdminPin(pin: string): boolean {
  const cleanPin = String(pin || "").trim();
  const validAdminPin =
    process.env.ADMIN_SCAN_PIN ||
    process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN ||
    "6028";
  return cleanPin === validAdminPin;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get("pin") || "";
    const format = (searchParams.get("format") || "xlsx").toLowerCase(); // "xlsx" or "csv"
    const filterStatus = (searchParams.get("status") || "all").toLowerCase(); // "all", "scanned", "pending"

    if (!verifyAdminPin(pin)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Valid Admin PIN required to export data." },
        { status: 401 }
      );
    }

    const supabase = getAdminSupabase();

    let rawTickets: any[] = [];
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const fallback = await supabase
          .from("tickets")
          .select("*")
          .order("createdAt", { ascending: false });
        rawTickets = fallback.data || [];
      } else {
        rawTickets = data || [];
      }
    } catch (err) {
      console.warn("[Admin Export] Error fetching tickets:", err);
    }

    // Filter if needed
    let filtered = rawTickets.map((t, idx) => {
      const isUsed =
        t.status === "Used" ||
        t.scanned === true ||
        Boolean(t.usedAt || t.used_at || t.scannedAt || t.scanned_at);

      return {
        rawIdx: idx + 1,
        ticketId: t.ticketId || t.ticket_id || t.ticketid || "",
        name: t.name || "Attendee",
        email: t.email || "",
        phone: t.phone || "",
        paymentId: t.paymentId || t.payment_id || "",
        orderId: t.orderId || t.order_id || "",
        amount: Number(t.amount || 299),
        status: isUsed ? "Checked In (Used)" : "Valid (Pending)",
        isUsed,
        usedAt: t.usedAt || t.used_at || t.scannedAt || t.scanned_at || "",
        scannedBy: t.scannedBy || t.scanned_by || "",
        createdAt: t.createdAt || t.created_at || "",
        hasIdCard: Boolean(t.idCardUrl || t.id_card_url || t.idcardurl) ? "Yes" : "No",
      };
    });

    if (filterStatus === "scanned") {
      filtered = filtered.filter((t) => t.isUsed);
    } else if (filterStatus === "pending") {
      filtered = filtered.filter((t) => !t.isUsed);
    }

    // Prepare human-readable spreadsheet rows
    const excelRows = filtered.map((t, index) => ({
      "S.No": index + 1,
      "Ticket ID": t.ticketId,
      "Attendee Name": t.name,
      "Email Address": t.email,
      "Phone Number": t.phone,
      "Payment ID": t.paymentId,
      "Order ID": t.orderId,
      "Amount (₹)": t.amount,
      "Entry Status": t.status,
      "Check-in Timestamp": t.usedAt ? new Date(t.usedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Not Admitted",
      "Scanned By Marshal": t.scannedBy || "-",
      "Booking Time": t.createdAt ? new Date(t.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-",
      "BHU ID Attached": t.hasIdCard,
    }));

    // Create SheetJS Workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Set auto-styled column widths
    worksheet["!cols"] = [
      { wch: 6 },   // S.No
      { wch: 22 },  // Ticket ID
      { wch: 24 },  // Attendee Name
      { wch: 28 },  // Email
      { wch: 16 },  // Phone
      { wch: 24 },  // Payment ID
      { wch: 24 },  // Order ID
      { wch: 12 },  // Amount
      { wch: 18 },  // Entry Status
      { wch: 24 },  // Check-in Timestamp
      { wch: 20 },  // Scanned By Marshal
      { wch: 24 },  // Booking Time
      { wch: 16 },  // BHU ID Attached
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "All Attendees");

    const dateSlug = new Date().toISOString().slice(0, 10);
    const filterSlug = filterStatus !== "all" ? `_${filterStatus}` : "";

    if (format === "csv") {
      const csvData = "\uFEFF" + XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="taalasya_attendees_${dateSlug}${filterSlug}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // Default: XLSX Excel file
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="taalasya_attendees_${dateSlug}${filterSlug}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[Admin Export] Export generation error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to generate Excel export." },
      { status: 500 }
    );
  }
}
