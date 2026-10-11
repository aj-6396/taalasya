import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { EVENT_CONFIG } from "@/lib/constants";
import {
  SPECIAL_PASS_CATEGORIES,
  SpecialPassCategory,
  getSpecialPassCategory,
} from "@/lib/specialPass";

export const dynamic = "force-dynamic";

function verifySpecialPassPin(pin?: string | null): boolean {
  const cleanPin = String(pin || "").trim();
  const validSpecialPin =
    process.env.SPECIAL_PASS_PIN ||
    process.env.NEXT_PUBLIC_SPECIAL_PASS_PIN;
  const validAdminPin =
    process.env.ADMIN_SCAN_PIN ||
    process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN;

  return (
    cleanPin === validSpecialPin ||
    Boolean(validAdminPin && cleanPin === validAdminPin)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ticketId, pin, passData } = body;

    // Check PIN authorization
    if (!verifySpecialPassPin(pin)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Valid Passcode required." },
        { status: 401 }
      );
    }

    let ticket: any = null;

    // If ticketId is passed, fetch from Supabase
    if (ticketId) {
      try {
        const supabase = getAdminSupabase();
        const { data } = await supabase
          .from("tickets")
          .select("*")
          .or(`ticketId.eq.${ticketId},ticket_id.eq.${ticketId}`)
          .maybeSingle();
        if (data) ticket = data;
      } catch (err) {
        console.warn("[special-pass/download] Supabase lookup warn:", err);
      }
    }

    // If not found in DB or passing direct passData
    if (!ticket && passData) {
      ticket = passData;
    }

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found or no pass data provided." },
        { status: 404 }
      );
    }

    // Determine category
    const rawCat =
      ticket.category ||
      ticket.passType ||
      ticket.pass_type ||
      (typeof ticket.paymentId === "string" && ticket.paymentId.replace("SPECIAL_PASS:", "")) ||
      (String(ticket.ticketId || ticket.ticket_id || "").startsWith("SP-MED") ? "media_influencer" : "special_pass");

    const resolvedCategory: SpecialPassCategory =
      getSpecialPassCategory(rawCat);
    const cfg = SPECIAL_PASS_CATEGORIES[resolvedCategory];

    const currentTicketId =
      ticket.ticketId || ticket.ticket_id || ticket.ticketid || "SP-SPL-00000";
    const recipientName = (ticket.name || "Special Guest").trim();
    const designation =
      ticket.designation ||
      ticket.role ||
      (resolvedCategory === "media_influencer"
        ? "Media & Influencer Partner"
        : "Special Guest / Dignitary");
    const college =
      ticket.college || ticket.institute || "Banaras Hindu University (BHU)";
    const email = ticket.email || "";
    const phone = ticket.phone || "";

    // Load official Taalasya logo if available on disk
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    let logoBuffer: Buffer | null = null;
    try {
      if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath);
      }
    } catch (logoErr) {
      console.warn("[special-pass/download] Logo read warning:", logoErr);
    }

    // Generate QR Code with matching category accent
    const qrBuffer = await QRCode.toBuffer(currentTicketId, {
      type: "png",
      width: 240,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    // Build PDFKit Document (A4 portrait: 595.28 x 841.89)
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        autoFirstPage: true,
        info: {
          Title: `Special Pass - ${cfg.label} - ${recipientName}`,
          Author: "Taalasya Dance Society (BHU)",
          Subject: "Special Entry Gate Pass",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // 1. Page background (Clean Pure White)
      doc.rect(0, 0, 595.28, 841.89).fill("#FFFFFF");

      // 2. Outer decorative border with Category Accent
      doc
        .roundedRect(30, 24, 535.28, 792, 16)
        .lineWidth(2.5)
        .strokeColor(cfg.accentHex)
        .stroke();

      // Inner subtle border
      doc
        .roundedRect(34, 28, 527.28, 784, 13)
        .lineWidth(0.8)
        .strokeColor("#cbd5e1")
        .stroke();

      // 3. Top Ribbon Banner: "★ OFFICIAL SPECIAL PASS ★"
      const ribbonY = 32;
      const ribbonHeight = 30;
      doc
        .roundedRect(36, ribbonY, 523.28, ribbonHeight, 8)
        .fill(cfg.accentHex);

      doc
        .fillColor("#FFFFFF")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("OFFICIAL SPECIAL ACCESS PASS", 36, ribbonY + 9, {
          align: "center",
          width: 523.28,
          characterSpacing: 2,
        });

      // 4. Header Box (Deep Dark slate box with category ambient glow)
      const headerBoxY = 68;
      const headerBoxHeight = 110;
      doc
        .roundedRect(40, headerBoxY, 515.28, headerBoxHeight, 10)
        .fillAndStroke("#090d16", cfg.accentHex);

      // Logo + Event Header inside Dark Box
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 52, headerBoxY + 14, {
            width: 82,
            height: 82,
          });
        } catch {
          // ignore
        }

        // Category Badge pill in header
        doc
          .roundedRect(148, headerBoxY + 14, 180, 20, 10)
          .fill(cfg.badgeBgHex);
        doc
          .fillColor(cfg.badgeTextHex)
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .text(cfg.badgeTitle, 148, headerBoxY + 19, {
            align: "center",
            width: 180,
          });

        doc
          .fillColor("#FFFFFF")
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("JHOOM '26: DANCE FEST", 148, headerBoxY + 39, {
            align: "left",
            width: 395,
          });

        doc
          .fillColor("#f1f5f9")
          .fontSize(11)
          .font("Helvetica")
          .text("Dandiya Night cum Garba Celebration", 148, headerBoxY + 63, {
            align: "left",
            width: 395,
          });

        doc
          .fillColor(cfg.accentHex)
          .fontSize(9.5)
          .font("Helvetica-Bold")
          .text(
            "Taalasya Dance Society • Banaras Hindu University (BHU)",
            148,
            headerBoxY + 84,
            { align: "left", width: 395 }
          );
      } else {
        doc
          .fillColor(cfg.accentHex)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(cfg.badgeTitle, 40, headerBoxY + 16, {
            align: "center",
            width: 515.28,
          });

        doc
          .fillColor("#FFFFFF")
          .fontSize(20)
          .font("Helvetica-Bold")
          .text("JHOOM '26: DANCE FEST CUM DANDIYA NIGHT", 40, headerBoxY + 36, {
            align: "center",
            width: 515.28,
          });

        doc
          .fillColor("#94a3b8")
          .fontSize(10.5)
          .font("Helvetica")
          .text(
            "Taalasya Dance Society • Banaras Hindu University (BHU)",
            40,
            headerBoxY + 70,
            { align: "center", width: 515.28 }
          );
      }

      // 5. Main Recipient Showcase Card
      const recBoxY = 188;
      const recBoxHeight = 145;
      doc
        .roundedRect(40, recBoxY, 515.28, recBoxHeight, 10)
        .fillAndStroke(cfg.lightHex, cfg.accentHex);

      // Section label
      doc
        .fillColor(cfg.darkHex)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("PASS HOLDER DETAILS", 56, recBoxY + 12, {
          characterSpacing: 1,
        });

      // Name
      doc
        .fillColor("#0f172a")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(recipientName, 56, recBoxY + 28, {
          width: 480,
        });

      // Designation Pill
      const pillY = recBoxY + 60;
      doc
        .roundedRect(56, pillY, 260, 22, 6)
        .fill(cfg.badgeBgHex);
      doc
        .fillColor(cfg.badgeTextHex)
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .text(designation, 62, pillY + 5.5, {
          width: 248,
          align: "center",
        });

      // College / Department
      doc
        .fillColor("#334155")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Institute / Faculty:", 56, recBoxY + 92);
      doc
        .fillColor("#0f172a")
        .fontSize(10.5)
        .font("Helvetica")
        .text(college, 155, recBoxY + 92, { width: 375 });

      // Pass ID display
      doc
        .fillColor("#334155")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Pass ID (Serial):", 56, recBoxY + 112);
      doc
        .fillColor(cfg.darkHex)
        .fontSize(11)
        .font("Courier-Bold")
        .text(currentTicketId, 155, recBoxY + 111);

      if (phone) {
        doc
          .fillColor("#64748b")
          .fontSize(9)
          .font("Helvetica")
          .text(`Contact: ${phone} ${email ? `• ${email}` : ""}`, 310, recBoxY + 112, {
            width: 230,
            align: "right",
          });
      }

      // 6. QR Code Section & Gate Instructions
      const qrSectionY = 344;
      const qrSectionHeight = 250;

      // Dark card container for QR
      doc
        .roundedRect(40, qrSectionY, 515.28, qrSectionHeight, 10)
        .fillAndStroke("#0f172a", "#1e293b");

      // QR Code Box (white frame)
      const qrBoxSize = 180;
      const qrBoxX = 58;
      const qrBoxY = qrSectionY + 20;

      doc
        .roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 8)
        .fillAndStroke("#FFFFFF", cfg.accentHex);

      try {
        doc.image(qrBuffer, qrBoxX + 10, qrBoxY + 10, {
          width: 160,
          height: 160,
        });
      } catch {
        // ignore
      }

      // Monospace ID below QR
      doc
        .fillColor("#FFFFFF")
        .fontSize(10)
        .font("Courier-Bold")
        .text(currentTicketId, qrBoxX, qrBoxY + 188, {
          width: qrBoxSize,
          align: "center",
        });

      // Verification info next to QR code
      const qrInfoX = 258;
      const qrInfoY = qrSectionY + 24;

      // Pill: 1 QR = AUTHORIZED ADMISSION
      doc
        .roundedRect(qrInfoX, qrInfoY, 280, 24, 6)
        .fill(cfg.badgeBgHex);
      doc
        .fillColor(cfg.badgeTextHex)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("1 SCAN = 1 AUTHORIZED ENTRY ONLY", qrInfoX, qrInfoY + 6.5, {
          width: 280,
          align: "center",
          characterSpacing: 0.5,
        });

      doc
        .fillColor("#FFFFFF")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("Gate Access Verification", qrInfoX, qrInfoY + 36);

      doc
        .fillColor("#94a3b8")
        .fontSize(8.8)
        .font("Helvetica")
        .text(
          "This QR code contains authenticated cryptographic credentials stored in the official Taalasya database. Gate marshals will scan this pass at the entrance terminal.",
          qrInfoX,
          qrInfoY + 54,
          { width: 280, lineGap: 3 }
        );

      // Access Level Badge
      const accLevelY = qrInfoY + 106;
      doc
        .roundedRect(qrInfoX, accLevelY, 280, 48, 6)
        .fillAndStroke("#1e293b", cfg.accentHex);

      doc
        .fillColor(cfg.accentHex)
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text("ACCESS CLEARANCE LEVEL", qrInfoX + 12, accLevelY + 8);

      doc
        .fillColor("#FFFFFF")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(cfg.label.toUpperCase() + " ACCESS", qrInfoX + 12, accLevelY + 22);

      doc
        .fillColor("#cbd5e1")
        .fontSize(8)
        .font("Helvetica")
        .text("Valid at Swatantrata Bhawan Entrance", qrInfoX + 12, accLevelY + 36);

      // 7. Event Schedule & Venue (Landmark: Near Seer Gate, BHU)
      const evBoxY = 604;
      const evBoxHeight = 110;

      doc
        .roundedRect(40, evBoxY, 515.28, evBoxHeight, 10)
        .fillAndStroke("#f8fafc", "#e2e8f0");

      doc
        .fillColor(cfg.accentHex)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("EVENT SCHEDULE & VENUE", 56, evBoxY + 12, { characterSpacing: 1 });

      // Left column: Date & Time
      doc
        .fillColor("#64748b")
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text("DATE & REPORTING TIME", 56, evBoxY + 30);
      doc
        .fillColor("#0f172a")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Tuesday, 13th October 2026", 56, evBoxY + 44);
      doc
        .fillColor("#059669")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("5:00 PM Onwards", 56, evBoxY + 60);

      // Right column: Venue & Landmark (Near Seer Gate BHU)
      const venueColX = 290;
      doc
        .fillColor("#64748b")
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text("VENUE & LANDMARK", venueColX, evBoxY + 30);
      doc
        .fillColor("#0f172a")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Swatantrata Bhawan", venueColX, evBoxY + 44);
      doc
        .fillColor("#475569")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Near Seer Gate, BHU Campus, Varanasi", venueColX, evBoxY + 60);
      doc
        .fillColor("#64748b")
        .fontSize(8)
        .font("Helvetica")
        .text("Pincode: 221005 • Banaras Hindu University", venueColX, evBoxY + 74);

      // 8. Security & Instructions Box
      const secBoxY = 722;
      const secBoxHeight = 84;

      doc
        .roundedRect(40, secBoxY, 515.28, secBoxHeight, 8)
        .fill("#0f172a");

      doc
        .fillColor(cfg.accentHex)
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text("IMPORTANT INSTRUCTIONS FOR PASS HOLDERS", 56, secBoxY + 10);

      doc
        .fillColor("#cbd5e1")
        .fontSize(7.8)
        .font("Helvetica")
        .text(
          "1. This is an official complimentary Special Pass issued by Taalasya Dance Society. It is strictly non-transferable and not for resale.\n2. Pass holder must present this QR code (printed or on mobile) along with their University ID or Govt. Issued Photo ID at the entry gate.\n3. Re-entry into Swatantrata Bhawan is not permitted once scanned.\n4. For official queries, contact Taalasya Dance Society Core Committee, Banaras Hindu University.",
          56,
          secBoxY + 24,
          { width: 483.28, lineGap: 2 }
        );

      doc.end();
    });

    const safeFilename = `Special_Pass_${cfg.shortPrefix}_${recipientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("[special-pass/download] Error generating special pass PDF:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to generate pass PDF" },
      { status: 500 }
    );
  }
}
