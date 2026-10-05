import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { EVENT_CONFIG, getTierPrice } from "@/lib/constants";
import { generateShortTicketId } from "@/lib/ticketId";

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

    // Load official Taalasya logo if available on disk
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    let logoBuffer: Buffer | null = null;
    try {
      if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath);
      }
    } catch (logoErr) {
      console.warn("[download-tickets] Could not load logo image for PDF:", logoErr);
    }

    // =========================================================================
    // 1. Multi-Ticket Setup: Each attendee gets their own name & ticket ID
    // =========================================================================
    const tickets: Array<{
      ticketId: string;
      ticketIndex: number;
      totalTickets: number;
      name: string;
      buyerName: string;
      email: string;
      phone: string;
      paymentId: string;
      orderId: string;
      status: string;
      eventName: string;
      venue: string;
      date: string;
      time: string;
      createdAt: string;
    }> = [];

    for (let i = 0; i < ticketQuantity; i++) {
      const attendeeInfo = (Array.isArray(attendees) && attendees[i]) || {};
      const ticketId = attendeeInfo.ticketId || generateShortTicketId();
      const attendeeName =
        attendeeInfo.name?.trim() ||
        (i === 0 ? buyerName : `Guest ${i + 1} (${buyerName})`);
      const attendeeEmail = attendeeInfo.email?.trim() || email || "";
      const attendeePhone = attendeeInfo.phone?.trim() || phone || "";

      tickets.push({
        ticketId,
        ticketIndex: i + 1,
        totalTickets: ticketQuantity,
        name: attendeeName,
        buyerName,
        email: attendeeEmail,
        phone: attendeePhone,
        paymentId,
        orderId,
        status: "Valid",
        eventName,
        venue: eventVenue,
        date: eventDate,
        time: eventTime,
        createdAt: new Date().toISOString(),
      });
    }

    // --- Database Writes: Supabase & Firebase Admin Snippet ---
    try {
      const supabase = getAdminSupabase();
      await supabase.from("tickets").insert(
        tickets.map((t) => ({
          ticketId: t.ticketId,
          name: t.name,
          email: t.email,
          phone: t.phone,
          paymentId: t.paymentId,
          orderId: t.orderId,
          amount: Math.round(getTierPrice(ticketQuantity) / ticketQuantity),
          status: "Valid",
          eventName: t.eventName,
          createdAt: t.createdAt,
        }))
      );
    } catch (sbErr) {
      console.warn("[download-tickets] Database insertion note:", sbErr);
    }
    // =========================================================================
    // 2. Multi-Page PDF Generation (Server-Side with PDFKit & QRCode)
    // =========================================================================
    const pdfBuffer = await new Promise<Buffer>(async (resolve, reject) => {
      try {
        // Standard A4 dimensions in points: 595.28 x 841.89
        const doc = new PDFDocument({
          size: "A4",
          margin: 0,
          autoFirstPage: true,
          info: {
            Title: `${eventName} - Official Passes`,
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
              ? `★ OFFICIAL ADMISSION PASS • PASS ${currentTicket.ticketIndex} OF ${currentTicket.totalTickets} ★`
              : "★ OFFICIAL ADMISSION PASS ★";

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
              .text(eventName, 150, headerBoxY + 30, {
                align: "left",
                width: 385,
                lineGap: 2,
              });

            doc
              .fillColor("#cbd5e1")
              .fontSize(9)
              .font("Helvetica")
              .text(organizer, 150, headerBoxY + 86, {
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
              .text(eventName, 54, headerBoxY + 30, {
                align: "center",
                width: 487.28,
                lineGap: 2,
              });

            doc
              .fillColor("#cbd5e1")
              .fontSize(9)
              .font("Helvetica")
              .text(organizer, 54, headerBoxY + 86, {
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
            .text(`${eventDate} • ${eventTime}`, leftColX + 12, row2Top + 24, {
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
            .text(eventVenue, rightColX + 12, row2Top + 24, {
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

          doc
            .fillColor("#0f172a")
            .fontSize(9)
            .font("Courier")
            .text(
              `Booked by: ${currentTicket.buyerName}   |   Payment ID: ${paymentId}   |   Status: VALID PASS`,
              leftColX + 12,
              row3Top + 22
            );

          // Terms & Entry Conditions (Bottom Box)
          const footerTop = row3Top + 54;
          doc
            .roundedRect(leftColX, footerTop, 595.28 - 120, 64, 8)
            .lineWidth(0.5)
            .strokeColor("#cbd5e1")
            .fillAndStroke("#ffffff", "#cbd5e1");

          doc
            .fillColor("#0f172a")
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("ENTRY GUIDELINES & SECURITY RULES:", leftColX + 10, footerTop + 8);

          doc
            .fillColor("#475569")
            .fontSize(7.5)
            .font("Helvetica")
            .text(
              "1. Each QR code is single-use and valid for exactly ONE individual entry at Swatantrata Bhawan gates.\n" +
                "2. Gates close strictly at 04:30 PM. Please arrive on time with this printed sheet or smartphone pass.\n" +
                "3. Admission passes are non-transferable once scanned by gate marshals.",
              leftColX + 10,
              footerTop + 20,
              { width: 595.28 - 140, lineGap: 1.5 }
            );

          doc
            .fillColor("#64748b")
            .fontSize(8)
            .font("Helvetica-Oblique")
            .text(
              `Organized by ${organizer}  •  Swatantrata Bhawan, BHU`,
              leftColX + 10,
              footerTop + 50,
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

    // Return direct PDF download response
    const filename =
      ticketQuantity > 1
        ? `JHOOM26-${ticketQuantity}-Passes-WhiteSheet.pdf`
        : `JHOOM26-Ticket-${tickets[0].name.replace(/\s+/g, "_")}.pdf`;

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
