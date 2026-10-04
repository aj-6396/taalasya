import nodemailer from "nodemailer";
import { EVENT_CONFIG } from "./constants";

export interface SendTicketEmailParams {
  toEmail: string;
  recipientName: string;
  ticketId: string;
  paymentId: string;
  amount: number;
  qrCodeUrl: string;
}

export async function sendTicketConfirmationEmail({
  toEmail,
  recipientName,
  ticketId,
  paymentId,
  amount,
  qrCodeUrl,
}: SendTicketEmailParams) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"${EVENT_CONFIG.name}" <${user || "no-reply@taalsya.org"}>`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://taalsya.org";
  const onlineTicketUrl = `${appUrl}/success?ticket_id=${ticketId}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Event Ticket - ${EVENT_CONFIG.name}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #334155;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      padding: 36px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #f1f5f9;
    }
    .ticket-badge {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff;
      font-weight: 600;
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .qr-card {
      background-color: #0f172a;
      border: 2px dashed #475569;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .qr-image {
      background: #ffffff;
      padding: 12px;
      border-radius: 12px;
      display: inline-block;
      max-width: 220px;
      height: auto;
    }
    .ticket-id {
      margin-top: 14px;
      font-family: monospace;
      font-size: 15px;
      color: #38bdf8;
      letter-spacing: 1px;
      word-break: break-all;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .details-table td {
      padding: 10px 0;
      border-bottom: 1px solid #334155;
      font-size: 14px;
    }
    .details-table .label {
      color: #94a3b8;
      width: 35%;
    }
    .details-table .value {
      color: #f8fafc;
      font-weight: 600;
      text-align: right;
    }
    .guidelines {
      background-color: rgba(99, 102, 241, 0.1);
      border-left: 4px solid #6366f1;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin: 24px 0;
      font-size: 13px;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .guidelines strong {
      color: #818cf8;
    }
    .btn {
      display: block;
      text-align: center;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 24px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      margin: 24px 0 12px;
    }
    .footer {
      text-align: center;
      padding: 24px;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${EVENT_CONFIG.name}</h1>
      <p>Official Event Entry Pass</p>
    </div>
    <div class="content">
      <div class="greeting">
        Hello <strong>${recipientName}</strong>,
      </div>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Your payment has been successfully verified! Below is your unique admission ticket. Please present this QR code at the entry checkpoint for fast gate clearance.
      </p>

      <div class="qr-card">
        <div class="ticket-badge">CONFIRMED PASS</div>
        <br />
        <img class="qr-image" src="${qrCodeUrl}" alt="Event Ticket QR Code" width="220" height="220" />
        <div class="ticket-id">ID: ${ticketId}</div>
        <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">Single admission scan only</p>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Date & Time</td>
          <td class="value">${EVENT_CONFIG.date} • ${EVENT_CONFIG.time}</td>
        </tr>
        <tr>
          <td class="label">Venue</td>
          <td class="value">${EVENT_CONFIG.venue}</td>
        </tr>
        <tr>
          <td class="label">Attendee</td>
          <td class="value">${recipientName}</td>
        </tr>
        <tr>
          <td class="label">Payment ID</td>
          <td class="value" style="font-family: monospace;">${paymentId}</td>
        </tr>
        <tr>
          <td class="label">Amount Paid</td>
          <td class="value">₹${amount}</td>
        </tr>
      </table>

      <a href="${onlineTicketUrl}" class="btn">View Digital Pass Online</a>

      <div class="guidelines">
        <strong>Important Entry Guidelines:</strong>
        <ul style="margin: 6px 0 0; padding-left: 20px;">
          <li>Doors open 1 hour before scheduled time. Early arrival is recommended.</li>
          <li>Carry a government-issued photo ID matching your registration name.</li>
          <li>Each QR code can only be scanned ONCE at the security turnstiles.</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>Sent with pride by ${EVENT_CONFIG.organizer}</p>
      <p>Need support? Reply to this email or contact ${EVENT_CONFIG.supportEmail}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // If SMTP is not provided, gracefully log
  if (!user || !pass) {
    console.warn(
      "[Nodemailer] SMTP_USER or SMTP_PASS not set. Skipping actual email delivery. " +
      `Ticket generated for ${recipientName} (${toEmail}) with Ticket ID: ${ticketId}. QR: ${qrCodeUrl}`
    );
    return { success: true, mocked: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from,
    to: toEmail,
    subject: `🎟️ Your Entry Ticket for ${EVENT_CONFIG.name} (Pass #${ticketId.slice(0, 8)})`,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Nodemailer] Ticket email sent to ${toEmail}. Message ID: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
}
