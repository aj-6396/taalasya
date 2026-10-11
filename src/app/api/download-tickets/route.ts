import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { EVENT_CONFIG } from "@/lib/constants";
import { generateShortTicketId, normalizeTicketLookup } from "@/lib/ticketId";

export const dynamic = "force-dynamic";

interface TicketPdfItem {
  ticketId: string;
  ticketIndex: number;
  totalTickets: number;
  name: string;
  buyerName: string;
  email: string;
  phone: string;
  college?: string;
  paymentId: string;
  orderId: string;
  status: string;
  eventName: string;
  venue: string;
  date: string;
  time: string;
  createdAt: string;
}

interface EventPdfConfig {
  eventName: string;
  organizer: string;
  eventVenue: string;
  eventDate: string;
  eventTime: string;
  paymentId: string;
}

// =========================================================================
// Core PDF Generator Engine (PDFKit & High-Resolution QR Vector)
// =========================================================================
async function generateTicketsPdf(
  tickets: TicketPdfItem[],
  config: EventPdfConfig,
  logoBuffer: Buffer | null
): Promise<Buffer> {
  return new Promise<Buffer>(async (resolve, reject) => {
    try {
      // Standard A4 dimensions in points: 595.28 x 841.89
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        autoFirstPage: true,
        info: {
          Title: `${config.eventName} - Official Passes`,
          Author: "Taalasya Dance Society (BHU)",
          Subject: "Official Gate Entry Tickets",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      for (let i = 0; i < tickets.length; i++) {
        const currentTicket = tickets[i];

        // Generate zero-latency high-resolution QR Code Buffer
        const qrBuffer = await QRCode.toBuffer(currentTicket.ticketId, {
          type: "png",
          width: 200,
          margin: 1,
          errorCorrectionLevel: "M",
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });

        // Pure white background
        doc.rect(0, 0, 595.28, 841.89).fill("#FFFFFF");

        // Outer Ticket Boundary (Crisp dark border on white sheet)
        doc
          .roundedRect(36, 30, 523.28, 780, 14)
          .lineWidth(1.5)
          .strokeColor("#0f172a")
          .stroke();

        // Header Box (Dark Indigo block at top)
        const headerBoxY = 40;
        const headerBoxHeight = 115;
        doc
          .roundedRect(44, headerBoxY, 507.28, headerBoxHeight, 10)
          .fillAndStroke("#0f172a", "#0f172a");

        // 1. Badge, Event Title & Organizer inside Header
        const badgeText =
          currentTicket.totalTickets > 1
            ? `OFFICIAL ADMISSION PASS • PASS ${currentTicket.ticketIndex} OF ${currentTicket.totalTickets}`
            : "OFFICIAL ADMISSION PASS";

        if (logoBuffer) {
          // Draw Official Taalasya Circular Crest in Header Box
          try {
            doc.image(logoBuffer, 56, headerBoxY + 16, {
              width: 82,
              height: 82,
            });
          } catch (drawErr) {
            console.warn("Could not draw logo image:", drawErr);
          }

          doc
            .fillColor("#ec4899")
            .fontSize(8.5)
            .font("Helvetica-Bold")
            .text(badgeText, 150, headerBoxY + 14, {
              align: "left",
              width: 385,
            });

          doc
            .fillColor("#FFFFFF")
            .fontSize(16)
            .font("Helvetica-Bold")
            .text(config.eventName, 150, headerBoxY + 30, {
              align: "left",
              width: 385,
              lineGap: 2,
            });

          doc
            .fillColor("#cbd5e1")
            .fontSize(9)
            .font("Helvetica")
            .text(config.organizer, 150, headerBoxY + 86, {
              align: "left",
              width: 385,
            });
        } else {
          doc
            .fillColor("#ec4899")
            .fontSize(9)
            .font("Helvetica-Bold")
            .text(badgeText, 54, headerBoxY + 12, {
              align: "center",
              width: 487.28,
            });

          doc
            .fillColor("#FFFFFF")
            .fontSize(17)
            .font("Helvetica-Bold")
            .text(config.eventName, 54, headerBoxY + 30, {
              align: "center",
              width: 487.28,
              lineGap: 2,
            });

          doc
            .fillColor("#cbd5e1")
            .fontSize(9)
            .font("Helvetica")
            .text(config.organizer, 54, headerBoxY + 86, {
              align: "center",
              width: 487.28,
            });
        }

        // Yellow Badge: "1 QR CODE = 1 ENTRY ONLY"
        const pillY = 168;
        const pillWidth = 220;
        const pillX = (595.28 - pillWidth) / 2;
        doc
          .roundedRect(pillX, pillY, pillWidth, 26, 13)
          .fillAndStroke("#fef3c7", "#f59e0b");

        doc
          .fillColor("#92400e")
          .fontSize(9.5)
          .font("Helvetica-Bold")
          .text("1 QR CODE = 1 ENTRY ONLY", pillX, pillY + 8, {
            align: "center",
            width: pillWidth,
          });

        // QR Code Card Container
        const qrBoxY = 204;
        const qrBoxSize = 210;
        const qrBoxX = (595.28 - qrBoxSize) / 2;
        doc
          .roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 12)
          .lineWidth(1)
          .strokeColor("#e2e8f0")
          .fillAndStroke("#ffffff", "#e2e8f0");

        // Draw QR Code centered inside the card
        doc.image(qrBuffer, qrBoxX + 10, qrBoxY + 10, {
          width: 190,
          height: 190,
          align: "center",
        });

        // Unique Gate Ticket ID Text under QR
        doc
          .fillColor("#64748b")
          .fontSize(8.5)
          .font("Helvetica")
          .text("UNIQUE GATE TICKET ID (SCAN READY)", 54, 426, {
            align: "center",
            width: 487.28,
          });

        doc
          .fillColor("#0f172a")
          .fontSize(10.5)
          .font("Courier-Bold")
          .text(currentTicket.ticketId, 54, 439, {
            align: "center",
            width: 487.28,
          });

        // Scissor Perforation Cut Line
        doc
          .dash(5, { space: 4 })
          .moveTo(54, 464)
          .lineTo(541.28, 464)
          .strokeColor("#94a3b8")
          .stroke()
          .undash();

        doc
          .fillColor("#94a3b8")
          .fontSize(7.5)
          .font("Helvetica")
          .text("✂ CUT OR FOLD HERE FOR GATE SCANNING ✂", 54, 470, {
            align: "center",
            width: 487.28,
          });

        // Metadata Grid Table (Clean 2-Column Layout)
        const tableTop = 490;
        const leftColX = 60;
        const rightColX = 305;
        const colWidth = 230;

        // Box 1: Attendee / Pass Holder Name (Individual!)
        doc
          .roundedRect(leftColX, tableTop, colWidth, 54, 8)
          .fillAndStroke("#f8fafc", "#e2e8f0");

        doc
          .fillColor("#64748b")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("ATTENDEE / TICKET HOLDER", leftColX + 12, tableTop + 9);

        doc
          .fillColor("#0f172a")
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(currentTicket.name, leftColX + 12, tableTop + 24, {
            width: colWidth - 24,
            ellipsis: true,
          });

        // Box 2: Pass Count
        doc
          .roundedRect(rightColX, tableTop, colWidth, 54, 8)
          .fillAndStroke("#f8fafc", "#e2e8f0");

        doc
          .fillColor("#64748b")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("PASS NUMBER", rightColX + 12, tableTop + 9);

        doc
          .fillColor("#4338ca")
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(
            `Pass ${currentTicket.ticketIndex} of ${currentTicket.totalTickets}`,
            rightColX + 12,
            tableTop + 24
          );

        // Box 3: Event Date & Time
        const row2Top = tableTop + 62;
        doc
          .roundedRect(leftColX, row2Top, colWidth, 54, 8)
          .fillAndStroke("#f8fafc", "#e2e8f0");

        doc
          .fillColor("#64748b")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("EVENT DATE & TIME", leftColX + 12, row2Top + 9);

        doc
          .fillColor("#0f172a")
          .fontSize(9.5)
          .font("Helvetica-Bold")
          .text(`${config.eventDate} • ${config.eventTime}`, leftColX + 12, row2Top + 24, {
            width: colWidth - 24,
          });

        // Box 4: Venue
        doc
          .roundedRect(rightColX, row2Top, colWidth, 54, 8)
          .fillAndStroke("#f8fafc", "#e2e8f0");

        doc
          .fillColor("#64748b")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("VENUE", rightColX + 12, row2Top + 9);

        doc
          .fillColor("#0f172a")
          .fontSize(9.5)
          .font("Helvetica-Bold")
          .text(config.eventVenue, rightColX + 12, row2Top + 24, {
            width: colWidth - 24,
          });

        // Box 5: Booker Name & Payment ID
        const row3Top = row2Top + 62;
        doc
          .roundedRect(leftColX, row3Top, 595.28 - 120, 46, 8)
          .fillAndStroke("#f8fafc", "#e2e8f0");

        doc
          .fillColor("#64748b")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("BOOKING & PAYMENT REFERENCE", leftColX + 12, row3Top + 8);

        const collegeDetail = currentTicket.college ? `   |   College: ${currentTicket.college}` : "";
        doc
          .fillColor("#0f172a")
          .fontSize(8.5)
          .font("Courier")
          .text(
            `Booked by: ${currentTicket.buyerName}${collegeDetail}   |   Payment ID: ${currentTicket.paymentId || config.paymentId}`,
            leftColX + 12,
            row3Top + 22,
            { width: 595.28 - 144, ellipsis: true }
          );

        // Terms & Entry Conditions (Bottom Box)
        const footerTop = row3Top + 54;
        doc
          .roundedRect(leftColX, footerTop, 595.28 - 120, 76, 8)
          .lineWidth(0.8)
          .strokeColor("#f87171")
          .fillAndStroke("#fff1f2", "#f87171");

        doc
          .fillColor("#991b1b")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("CRITICAL ADVISORY & ENTRY RULES:", leftColX + 10, footerTop + 8);

        doc
          .fillColor("#b91c1c")
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(
            "• Passes are valid for a single entry. Re-entry is not permitted hence do not leave the venue.",
            leftColX + 10,
            footerTop + 20,
            { width: 595.28 - 140 }
          );

        doc
          .fillColor("#334155")
          .fontSize(7.2)
          .font("Helvetica")
          .text(
            "• Entry time is strictly 02:30 PM - 04:30 PM (Gates close at 04:30 PM). Valid BHU ID card or Govt. Issued Photo ID card required.\n" +
              "• Each QR code is strictly single-use and non-transferable once scanned by gate marshals.",
            leftColX + 10,
            footerTop + 33,
            { width: 595.28 - 140, lineGap: 1.5 }
          );

        doc
          .fillColor("#64748b")
          .fontSize(7.5)
          .font("Helvetica-Oblique")
          .text(
            `Organized by ${config.organizer}  •  Swatantrata Bhawan, BHU`,
            leftColX + 10,
            footerTop + 61,
            { align: "center", width: 595.28 - 140 }
          );

        // Add a new page if this is not the last ticket in the loop
        if (i < tickets.length - 1) {
          doc.addPage();
        }
      }

      doc.end();
    } catch (pdfErr) {
      reject(pdfErr);
    }
  });
}

function getLogoBuffer(): Buffer | null {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  try {
    if (fs.existsSync(logoPath)) {
      return fs.readFileSync(logoPath);
    }
  } catch {
    // ignore
  }
  return null;
}

// =========================================================================
// GET: Direct Re-Download of Paid Passes by Ticket ID, Payment ID, Order ID, or Phone
// Usage: /api/download-tickets?ticket_id=TAAL-XXXX
// =========================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticket_id") || searchParams.get("ticketId");
    const paymentId = searchParams.get("payment_id") || searchParams.get("paymentId");
    const orderId = searchParams.get("order_id") || searchParams.get("orderId");
    const phone = searchParams.get("phone");

    const queryKey = ticketId || paymentId || orderId || phone;
    if (!queryKey) {
      return NextResponse.json(
        { error: "Missing query parameter. Please provide ticket_id, payment_id, order_id, or phone." },
        { status: 400 }
      );
    }

    const cleanKey = queryKey.trim();

    // Check demo / test passes
    if (cleanKey.startsWith("demo_") || cleanKey.startsWith("order_demo_")) {
      const demoTicket: TicketPdfItem = {
        ticketId: cleanKey,
        ticketIndex: 1,
        totalTickets: 1,
        name: "Demo Attendee",
        buyerName: "Demo Attendee",
        email: "demo@taalasya.bhu.ac.in",
        phone: "+91 99999 88888",
        college: "Banaras Hindu University",
        paymentId: "pay_demo123456",
        orderId: "order_demo123456",
        status: "Valid",
        eventName: EVENT_CONFIG.name,
        venue: EVENT_CONFIG.venue,
        date: EVENT_CONFIG.date,
        time: EVENT_CONFIG.time,
        createdAt: new Date().toISOString(),
      };

      const pdfBuffer = await generateTicketsPdf(
        [demoTicket],
        {
          eventName: EVENT_CONFIG.name,
          organizer: EVENT_CONFIG.organizer,
          eventVenue: EVENT_CONFIG.venue,
          eventDate: EVENT_CONFIG.date,
          eventTime: EVENT_CONFIG.time,
          paymentId: "pay_demo123456",
        },
        getLogoBuffer()
      );

      return new NextResponse(pdfBuffer as any, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="JHOOM26-Demo-Ticket.pdf"`,
          "Content-Length": String(pdfBuffer.length),
        },
      });
    }

    const supabase = getAdminSupabase();
    let dbTickets: any[] = [];

    if (ticketId) {
      const candidateIds = normalizeTicketLookup(cleanKey);
      const res1 = await supabase.from("tickets").select("*").in("ticketId", candidateIds);
      if (res1.data && res1.data.length > 0) {
        dbTickets = res1.data;
      } else {
        const res2 = await supabase.from("tickets").select("*").in("ticket_id", candidateIds);
        if (res2.data && res2.data.length > 0) dbTickets = res2.data;
      }

      // If this single ticket belongs to an order with multiple passes, fetch all related tickets
      if (dbTickets.length > 0) {
        const primary = dbTickets[0];
        const ordId = primary.orderId || primary.order_id;
        const payId = primary.paymentId || primary.payment_id;
        if (ordId || payId) {
          const { data: siblings } = await supabase
            .from("tickets")
            .select("*")
            .or(`orderId.eq.${ordId || "none"},paymentId.eq.${payId || "none"}`)
            .order("createdAt", { ascending: true });
          if (siblings && siblings.length > dbTickets.length) {
            dbTickets = siblings;
          }
        }
      }
    } else if (paymentId) {
      const res1 = await supabase.from("tickets").select("*").eq("paymentId", cleanKey);
      if (res1.data && res1.data.length > 0) {
        dbTickets = res1.data;
      } else {
        const res2 = await supabase.from("tickets").select("*").eq("payment_id", cleanKey);
        if (res2.data && res2.data.length > 0) dbTickets = res2.data;
      }
    } else if (orderId) {
      const res1 = await supabase.from("tickets").select("*").eq("orderId", cleanKey);
      if (res1.data && res1.data.length > 0) {
        dbTickets = res1.data;
      } else {
        const res2 = await supabase.from("tickets").select("*").eq("order_id", cleanKey);
        if (res2.data && res2.data.length > 0) dbTickets = res2.data;
      }
    } else if (phone) {
      const cleanPhone = cleanKey.replace(/[^0-9]/g, "").slice(-10);
      if (cleanPhone.length >= 10) {
        const res = await supabase.from("tickets").select("*").ilike("phone", `%${cleanPhone}%`);
        if (res.data && res.data.length > 0) dbTickets = res.data;
      }
    }

    if (!dbTickets || dbTickets.length === 0) {
      return NextResponse.json(
        { error: `No ticket found for reference '${cleanKey}'.` },
        { status: 404 }
      );
    }

    const first = dbTickets[0];
    const buyerName = first.name || "Valued Attendee";
    const refPaymentId = first.paymentId || first.payment_id || "pay_verified";

    const formattedTickets: TicketPdfItem[] = dbTickets.map((t, idx) => ({
      ticketId: t.ticketId || t.ticket_id || generateShortTicketId(),
      ticketIndex: idx + 1,
      totalTickets: dbTickets.length,
      name: t.name || `Guest ${idx + 1} (${buyerName})`,
      buyerName: buyerName,
      email: t.email || "",
      phone: t.phone || "",
      college: t.college || "",
      paymentId: t.paymentId || t.payment_id || refPaymentId,
      orderId: t.orderId || t.order_id || "",
      status: t.status || "Valid",
      eventName: EVENT_CONFIG.name,
      venue: EVENT_CONFIG.venue,
      date: EVENT_CONFIG.date,
      time: EVENT_CONFIG.time,
      createdAt: t.createdAt || t.created_at || new Date().toISOString(),
    }));

    const pdfBuffer = await generateTicketsPdf(
      formattedTickets,
      {
        eventName: EVENT_CONFIG.name,
        organizer: EVENT_CONFIG.organizer,
        eventVenue: EVENT_CONFIG.venue,
        eventDate: EVENT_CONFIG.date,
        eventTime: EVENT_CONFIG.time,
        paymentId: refPaymentId,
      },
      getLogoBuffer()
    );

    const safeName = (formattedTickets[0].name || "Attendee").replace(/\s+/g, "_");
    const filename =
      formattedTickets.length > 1
        ? `JHOOM26-${formattedTickets.length}-Passes-${safeName}.pdf`
        : `JHOOM26-Ticket-${safeName}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[download-tickets GET] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to download tickets." },
      { status: 500 }
    );
  }
}

// =========================================================================
// POST: Standard Ticket PDF Generation from Registration Flow
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      buyerName = "Valued Attendee",
      eventDetails = {},
      paymentId = `pay_${Date.now().toString().slice(-8)}`,
      orderId = `order_${Date.now().toString().slice(-8)}`,
      quantity = 1,
      email = "",
      phone = "",
      attendees = [],
    } = body;

    const ticketQuantity = Math.max(1, Number(quantity) || 1);

    const eventName = eventDetails.name || EVENT_CONFIG.name;
    const eventDate = eventDetails.date || EVENT_CONFIG.date;
    const eventTime = eventDetails.time || EVENT_CONFIG.time;
    const eventVenue = eventDetails.venue || EVENT_CONFIG.venue;
    const organizer = eventDetails.organizer || EVENT_CONFIG.organizer;

    const logoBuffer = getLogoBuffer();

    // Look up existing DB tickets for this payment if available
    let dbTickets: any[] = [];
    if (paymentId && !paymentId.startsWith("pay_sim_") && !paymentId.startsWith("pay_test_")) {
      try {
        const supabase = getAdminSupabase();
        const { data } = await supabase
          .from("tickets")
          .select("*")
          .eq("paymentId", paymentId)
          .order("createdAt", { ascending: true });
        if (data && data.length > 0) {
          dbTickets = data;
        }
      } catch (err) {
        console.warn("[download-tickets] DB lookup warning:", err);
      }
    }

    const tickets: TicketPdfItem[] = [];

    for (let i = 0; i < ticketQuantity; i++) {
      const attendeeInfo = (Array.isArray(attendees) && attendees[i]) || {};
      const matchedDb = dbTickets[i];
      const ticketId =
        attendeeInfo.ticketId ||
        matchedDb?.ticketId ||
        matchedDb?.ticket_id ||
        generateShortTicketId();
      const attendeeName =
        attendeeInfo.name?.trim() ||
        matchedDb?.name ||
        (i === 0 ? buyerName : `Guest ${i + 1} (${buyerName})`);
      const attendeeEmail =
        attendeeInfo.email?.trim() || matchedDb?.email || email || "";
      const attendeePhone =
        attendeeInfo.phone?.trim() || matchedDb?.phone || phone || "";
      const attendeeCollege =
        attendeeInfo.college?.trim() || matchedDb?.college || body.college?.trim() || "";

      tickets.push({
        ticketId,
        ticketIndex: i + 1,
        totalTickets: ticketQuantity,
        name: attendeeName,
        buyerName,
        email: attendeeEmail,
        phone: attendeePhone,
        college: attendeeCollege,
        paymentId,
        orderId,
        status: "Valid",
        eventName,
        venue: eventVenue,
        date: eventDate,
        time: eventTime,
        createdAt: matchedDb?.createdAt || new Date().toISOString(),
      });
    }

    const pdfBuffer = await generateTicketsPdf(
      tickets,
      {
        eventName,
        organizer,
        eventVenue,
        eventDate,
        eventTime,
        paymentId,
      },
      logoBuffer
    );

    const safeName = (tickets[0].name || "Attendee").replace(/\s+/g, "_");
    const filename =
      ticketQuantity > 1
        ? `JHOOM26-${ticketQuantity}-Passes-WhiteSheet.pdf`
        : `JHOOM26-Ticket-${safeName}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[download-tickets] Error generating PDF ticket:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate tickets PDF" },
      { status: 500 }
    );
  }
}
