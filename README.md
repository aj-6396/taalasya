# 🎟️ TAALSYA 2026: Zero-Cost Event Ticketing & Entry Management System

A production-ready, full-stack event ticketing and rapid entry management web application built with **Next.js (App Router)**, **Tailwind CSS**, **Firebase Firestore**, and **Razorpay Standard Checkout & Webhooks**.

---

## ⚡ Architecture Overview

```
                      [ Attendee Browser ]
                               |
                   1. Submits Registration Form
                               v
            [ POST /api/create-order (Next.js Serverless) ]
                               |
                   2. Creates Order via Razorpay API
                               v
              [ Razorpay Checkout Modal (Frontend) ]
                               |
                   3. Attendee Completes Payment
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
   [ Frontend Redirect ]            [ Secure Webhook Trigger ]
    `/success?order_id=...`         `POST /api/webhook`
    • Confetti Animation            • Verifies `x-razorpay-signature` HMAC
    • Live Ticket Card Preview      • Generates UUID `ticketId`
    • Instant Print / PDF Save      • Writes to Firestore (`status: 'Valid'`)
                                    • Dispatches HTML Email via Nodemailer
                                      with Embedded QR Code
```

```
                     [ Entry Gate Checkpoint ]
                               |
                     Attendee presents QR Pass
                               v
                 [ /scan Mobile Camera Terminal ]
                 • Powered by `html5-qrcode`
                 • Gate Staff PIN Protection
                 • Front / Rear Camera Switch
                 • Synthesized Web Audio Chimes
                               |
                 Sends QR Ticket UUID to Backend
                               v
               [ POST /api/verify-ticket (Admin SDK) ]
              +----------------+----------------+
              |                                 |
       If status == 'Valid'              If status == 'Used'
       • Green Checkmark Modal           • Red Alert Buzzer
       • Audio Success Chime             • "Already Scanned!"
       • Updates status -> 'Used'        • Entry Denied
```

---

## 🛠️ Tech Stack & Key Libraries

- **Framework:** Next.js (App Router with TypeScript & Turbopack)
- **Styling:** Tailwind CSS (Modern dark mode, glassmorphism, responsive mobile-first UI)
- **Database:** Firebase Firestore
  - **Admin SDK (`firebase-admin`):** Secure serverless writes, idempotent webhook ticket creation, and atomic status updates.
  - **Client SDK (`firebase`):** Read-only configuration for client verification.
- **Payment Gateway:** Razorpay Standard Checkout (`checkout.js`) & HMAC verified Webhooks (`crypto`).
- **QR Scanner:** `html5-qrcode` with live video stream, front/rear camera toggle, and fallback manual ticket ID lookup.
- **Audio Feedback:** Web Audio API synthesizer for zero-dependency gate chimes (success fanfare, double-pulse warning buzzer).
- **Email Service:** `nodemailer` with professional responsive HTML ticket template and dynamic QR code embed (`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticketId}`).
- **Icons & Animation:** `lucide-react` & `canvas-confetti`.

---

## 🗄️ Firestore Database Schema

Collection: **`tickets`**

| Field | Type | Description |
|---|---|---|
| `ticketId` | `String` (UUID v4) | Unique ticket identifier encoded in QR |
| `name` | `String` | Attendee's full name |
| `email` | `String` | Attendee's email address |
| `phone` | `String` | Attendee's mobile/WhatsApp contact |
| `paymentId` | `String` | Razorpay payment identifier (`pay_...`) |
| `orderId` | `String` | Razorpay order identifier (`order_...`) |
| `amount` | `Number` | Total paid in INR |
| `status` | `String` | Default: `'Valid'`, updates to `'Used'` upon scan |
| `createdAt` | `Timestamp` | Date and time payment was confirmed |
| `usedAt` | `Timestamp` | (Optional) Date and time ticket was scanned at gate |

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your credentials in [`.env.local`](file:///d:/taalsya/.env.local):

```env
# 1. App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_EVENT_NAME="TAALSYA 2026: Youth & Cultural Extravaganza"
NEXT_PUBLIC_EVENT_PRICE=499
NEXT_PUBLIC_ADMIN_SCAN_PIN=1234
ADMIN_SCAN_PIN=1234

# 2. Razorpay Gateway Keys (https://dashboard.razorpay.com/app/keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=your_custom_webhook_secret

# 3. Firebase Client SDK (Firebase Console -> Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# 4. Firebase Admin SDK (Project Settings -> Service Accounts -> Generate New Private Key)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# 5. Nodemailer / Gmail SMTP (https://myaccount.google.com/apppasswords)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM="TAALSYA Conclave <tickets@taalsya.org>"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔒 Razorpay Webhook Setup

1. Go to **Razorpay Dashboard** -> **Settings** -> **Webhooks**.
2. Click **Add New Webhook**.
3. Set **Webhook URL** to:
   ```
   https://yourdomain.com/api/webhook
   ```
4. Enter the same passphrase you configured in `RAZORPAY_WEBHOOK_SECRET`.
5. Under **Active Events**, select:
   - `payment.captured`
   - `order.paid`
6. Click **Save**.

The webhook securely validates incoming requests with cryptographic HMAC signatures before creating any ticket or sending confirmation emails.

---

## 📱 Entry Gate Scanner Usage (`/scan`)

1. Open `/scan` on any smartphone or tablet at the entry gate.
2. Enter the Gate PIN (default: `1234`).
3. Allow camera access.
4. Align attendee's QR ticket within the target box:
   - **Valid Pass:** Plays upbeat green chime, flashes full-screen Green Checkmark with attendee name, email, and marks status as `'Used'`.
   - **Already Scanned Pass:** Plays warning buzzer, flashes red alert saying `"ALREADY SCANNED!"` with details of prior redemption.
   - **Invalid Pass:** Triggers error alert.
5. In case of damaged or cracked phone screens, expand **Manual Ticket ID Lookup** to type the UUID directly.

---

## 🛡️ Firestore Security Rules

To ensure client-side tampering is impossible, apply the included [`firestore.rules`](file:///d:/taalsya/firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tickets/{ticketId} {
      allow read: if true;
      allow write: if false; // Tickets can only be created & modified by the backend Admin SDK
    }
  }
}
```
