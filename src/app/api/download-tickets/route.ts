import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { EVENT_CONFIG } from "@/lib/constants";

// Optional: If Firebase Admin SDK is installed and configured in your project:
// import admin from "firebase-admin";
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({ ... }),
//   });
// }

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
    } = body;

    const ticketQuantity = Math.max(1, Number(quantity) || 1);

    const eventName = eventDetails.name || EVENT_CONFIG.name;
    const eventDate = eventDetails.date || EVENT_CONFIG.date;
    const eventTime = eventDetails.time || EVENT_CONFIG.time;
    const eventVenue = eventDetails.venue || EVENT_CONFIG.venue;
    const organizer = eventDetails.organizer || EVENT_CONFIG.organizer;

    // =========================================================================
    // 2. Multi-Ticket Loop & Database Insertion
    // =========================================================================
    const tickets: Array<{
      ticketId: string;
      ticketIndex: number;
      totalTickets: number;
      name: string;
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
      const ticketId = crypto.randomUUID();
      tickets.push({
        ticketId,
        ticketIndex: i + 1,
        totalTickets: ticketQuantity,
        name: buyerName,
        email: email || "",
        phone: phone || "",
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
          amount: Math.round(EVENT_CONFIG.priceInINR),
          status: "Valid",
          eventName: t.eventName,
          createdAt: t.createdAt,
        }))
      );
    } catch (sbErr) {
      console.warn("[download-tickets] Database insertion note:", sbErr);
    }

    // --- Firebase Admin Code Snippet (as requested) ---
    // If you are using Firebase Admin SDK:
    // const firebasePromises = tickets.map((t) =>
    //   admin.firestore().collection("tickets").doc(t.ticketId).set({
    //     ticketId: t.ticketId,
    //     buyerName: t.name,
    //     email: t.email,
    //     phone: t.phone,
    //     paymentId: t.paymentId,
    //     orderId: t.orderId,
    //     status: "Valid",
    //     eventName: t.eventName,
    //     venue: t.venue,
    //     date: t.date,
    //     createdAt: admin.firestore.FieldValue.serverTimestamp(),
    //   })
    // );
    // await Promise.all(firebasePromises);

    // =========================================================================
    // 3. Multi-Page PDF Generation (Server-Side using PDFKit & QRCode)
    // =========================================================================
    const pdfBuffer = await new Promise<Buffer>(async (resolve, reject) => {
      try {
        // Standard A4 dimensions in points: 595.28 x 841.89
        const doc = new PDFDocument({
          size: "A4",
          margin: 0,
          autoFirstPage: true,
          info: {
            Title: `${eventName} - Admission Passes`,
            Author: "Taalasya Dance Society (BHU)",
            Subject: "Official Event Tickets",
            Keywords: "JHOOM, Dandiya, BHU, Taalasya, Ticket",
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
            width: 220,
            margin: 1,
            errorCorrectionLevel: "M",
            color: {
              dark: "#0f172a",
              light: "#ffffff",
            },
          });

          // Pure white background
          doc.rect(0, 0, 595.28, 841.89).fill("#FFFFFF");

          // Elegant Outer Ticket Border
          doc
            .roundedRect(36, 36, 523.28, 769.89, 16)
            .lineWidth(1.5)
            .strokeColor("#0f172a")
            .stroke();

          // Inner Decorative Header Strip (Dark Indigo)
          doc
            .roundedRect(44, 44, 507.28, 95, 12)
            .fillAndStroke("#0f172a", "#0f172a");

          // Header Text Elements
          doc
            .fillColor("#ec4899")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("★ OFFICIAL ADMISSION PASS ★", 56, 58, {
              align: "center",
              width: 483.28,
            });

          doc
            .fillColor("#FFFFFF")
            .fontSize(22)
            .font("Helvetica-Bold")
            .text(eventName, 56, 74, {
              align: "center",
              width: 483.28,
            });

          doc
            .fillColor("#cbd5e1")
            .fontSize(10)
            .font("Helvetica")
            .text(organizer, 56, 106, {
              align: "center",
              width: 483.28,
            });

          // Single-Entry Highlighting Badge (Yellow / Amber Pill)
          doc
            .roundedRect(197.64, 150, 200, 26, 13)
            .fillAndStroke("#fef3c7", "#f59e0b");

          doc
            .fillColor("#92400e")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("1 QR CODE = 1 ENTRY ONLY", 197.64, 158, {
              align: "center",
              width: 200,
            });

          // Central QR Code Container Box
          doc
            .roundedRect(177.64, 190, 240, 240, 16)
            .lineWidth(1)
            .strokeColor("#e2e8f0")
            .fillAndStroke("#ffffff", "#e2e8f0");

          // Centrally Embed QR Code
          doc.image(qrBuffer, 187.64, 200, {
            width: 220,
            height: 220,
            align: "center",
          });

          // Unique Gate Ticket ID Under QR
          doc
            .fillColor("#64748b")
            .fontSize(9)
            .font("Helvetica")
            .text("UNIQUE GATE TICKET ID (SCAN READY)", 56, 440, {
              align: "center",
              width: 483.28,
            });

          doc
            .fillColor("#0f172a")
            .fontSize(11)
            .font("Courier-Bold")
            .text(currentTicket.ticketId, 56, 454, {
              align: "center",
              width: 483.28,
            });

          // Perforation Line with Scissor Indicator
          doc
            .dash(5, { space: 4 })
            .moveTo(56, 485)
            .lineTo(539.28, 485)
            .strokeColor("#94a3b8")
            .stroke()
            .undash();

          doc
            .fillColor("#94a3b8")
            .fontSize(8)
            .font("Helvetica")
            .text("✂ CUT OR FOLD HERE FOR GATE SCANNING ✂", 56, 492, {
              align: "center",
              width: 483.28,
            });

          // Ticket Metadata Grid Table
          const tableTop = 515;
          const leftColX = 65;
          const rightColX = 310;
          const colWidth = 220;

          // Box 1: Attendee Name & Pass Counter
          doc
            .roundedRect(leftColX, tableTop, colWidth, 54, 8)
            .fillAndStroke("#f8fafc", "#e2e8f0");

          doc
            .fillColor("#64748b")
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("ATTENDEE / BUYER", leftColX + 12, tableTop + 10);

          doc
            .fillColor("#0f172a")
            .fontSize(12)
            .font("Helvetica-Bold")
            .text(currentTicket.name, leftColX + 12, tableTop + 24, {
              width: colWidth - 24,
              ellipsis: true,
            });

          // Box 2: Pass Count (e.g. Pass 1 of 3)
          doc
            .roundedRect(rightColX, tableTop, colWidth, 54, 8)
            .fillAndStroke("#f8fafc", "#e2e8f0");

          doc
            .fillColor("#64748b")
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("PASS NUMBER", rightColX + 12, tableTop + 10);

          doc
            .fillColor("#6366f1")
            .fontSize(13)
            .font("Helvetica-Bold")
            .text(
              `Pass ${currentTicket.ticketIndex} of ${currentTicket.totalTickets}`,
              rightColX + 12,
              tableTop + 24
            );

          // Box 3: Date & Time
          const row2Top = tableTop + 64;
          doc
            .roundedRect(leftColX, row2Top, colWidth, 54, 8)
            .fillAndStroke("#f8fafc", "#e2e8f0");

          doc
            .fillColor("#64748b")
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("EVENT DATE & TIME", leftColX + 12, row2Top + 10);

          doc
            .fillColor("#0f172a")
            .fontSize(10)
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
            .text("VENUE", rightColX + 12, row2Top + 10);

          doc
            .fillColor("#0f172a")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(eventVenue, rightColX + 12, row2Top + 24, {
              width: colWidth - 24,
            });

          // Box 5: Payment Ref & Verification
          const row3Top = row2Top + 64;
          doc
            .roundedRect(leftColX, row3Top, 595.28 - 130, 46, 8)
            .fillAndStroke("#f8fafc", "#e2e8f0");

          doc
            .fillColor("#64748b")
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("TRANSACTION REFERENCE & GATE STATUS", leftColX + 12, row3Top + 8);

          doc
            .fillColor("#0f172a")
            .fontSize(9)
            .font("Courier")
            .text(
              `Payment ID: ${paymentId}   |   Status: VALID PASS   |   Issued: ${new Date().toLocaleDateString("en-IN")}`,
              leftColX + 12,
              row3Top + 22
            );

          // Terms & Entry Conditions (Bottom Box)
          const footerTop = 712;
          doc
            .roundedRect(leftColX, footerTop, 595.28 - 130, 68, 8)
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
                "2. Please present this printed sheet or keep this pass ready on your smartphone screen with high brightness.\n" +
                "3. Admission passes are non-transferable once scanned by gate marshals.",
              leftColX + 10,
              footerTop + 20,
              { width: 595.28 - 150, lineGap: 1.5 }
            );

          doc
            .fillColor("#64748b")
            .fontSize(8)
            .font("Helvetica-Oblique")
            .text(
              `Developer Credits: ${EVENT_CONFIG.developer}  |  Organized by ${organizer}`,
              leftColX + 10,
              footerTop + 54,
              { align: "center", width: 595.28 - 150 }
            );

          // Add a new page if this is not the last ticket in the loop
          if (i < tickets.length - 1) {
            doc.addPage();
          }
        }

        // Complete the PDF document
        doc.end();
      } catch (pdfErr) {
        reject(pdfErr);
      }
    });

    // =========================================================================
    // 4. Direct Response (File Download)
    // =========================================================================
    const filename =
      ticketQuantity > 1
        ? `JHOOM26-Tickets-${ticketQuantity}-Passes.pdf`
        : `JHOOM26-Ticket-${tickets[0].ticketId.slice(0, 8)}.pdf`;

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
