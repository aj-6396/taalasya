# 🎟️ JHOOM '26: Dance Fest cum Dandiya Night — Taalasya Dance Society (BHU)

A production-ready, full-stack event ticketing and rapid entry management web application built for **JHOOM '26: Dance Fest cum Dandiya Night** (13th October 2026 at Swatantrata Bhawan, BHU) organized by **Taalasya Dance Society (BHU)**. Starting at ₹299 only. Developed by [**AJ**](https://aj-7portfolio.vercel.app/).

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
    • Save Ticket as PDF Prompt     • Writes to Supabase (`status: 'Valid'`)
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
               [ POST /api/verify-ticket (Supabase SDK) ]
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
- **Database:** Supabase (`@supabase/supabase-js`)
  - **Service Role SDK (`getAdminSupabase`):** Secure serverless writes, idempotent webhook ticket creation, and atomic status updates.
  - **Client SDK (`getSupabaseClient`):** Client-side connectivity and data fetching.
- **Payment Gateway:** Razorpay Standard Checkout (`checkout.js`) & HMAC verified Webhooks (`crypto`).
- **QR Scanner:** `html5-qrcode` with live video stream, front/rear camera toggle, and fallback manual ticket ID lookup.
- **Audio Feedback:** Web Audio API synthesizer for zero-dependency gate chimes (success fanfare, double-pulse warning buzzer).
- **Icons & Animation:** `lucide-react` & `canvas-confetti`.

---

## 🗄️ Supabase Database Setup & Schema

To create the table in Supabase:
1. Open your **Supabase Dashboard** ([supabase.com/dashboard](https://supabase.com/dashboard)).
2. Select your project and navigate to **SQL Editor** (left sidebar).
3. Click **New Query**, paste the SQL script below (or copy from [`supabase/schema.sql`](file:///d:/taalsya/supabase/schema.sql)), and click **Run**.

```sql
-- 1. Create the tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  "ticketId" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "paymentId" TEXT,
  "orderId" TEXT,
  "amount" NUMERIC DEFAULT 299,
  "status" TEXT NOT NULL DEFAULT 'Valid',
  "eventName" TEXT DEFAULT 'JHOOM ''26 — Dance Fest cum Dandiya Night',
  "createdAt" TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  "usedAt" TIMESTAMPTZ
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON public.tickets ("ticketId");
CREATE INDEX IF NOT EXISTS idx_tickets_payment_id ON public.tickets ("paymentId");
CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON public.tickets ("orderId");
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets ("status");

-- 3. Row Level Security (RLS) & Policies
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access"
ON public.tickets FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read tickets"
ON public.tickets FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert tickets"
ON public.tickets FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public update ticket status"
ON public.tickets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
```

### Table Column Details: **`tickets`**

| Column | Type | Description |
|---|---|---|
| `"ticketId"` | `text` (PRIMARY KEY) | Short unique code (e.g. `JHM-7K2M`) or UUID encoded in QR |
| `"name"` | `text NOT NULL` | Individual attendee full name |
| `"email"` | `text` | Attendee email address |
| `"phone"` | `text` | Attendee mobile / WhatsApp number |
| `"paymentId"` | `text` | Razorpay payment identifier (`pay_...`) |
| `"orderId"` | `text` | Razorpay order identifier (`order_...`) |
| `"amount"` | `numeric` | Total paid in INR (default: 299) |
| `"status"` | `text` | Default: `'Valid'`, updates to `'Used'` upon gate scan |
| `"eventName"` | `text` | Event name |
| `"createdAt"` | `timestamptz` | Ticket generation timestamp |
| `"usedAt"` | `timestamptz` | Gate redemption timestamp |

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
NEXT_PUBLIC_EVENT_NAME="JHOOM '26 — Dance Fest cum Dandiya Night"
NEXT_PUBLIC_EVENT_PRICE=299
NEXT_PUBLIC_ADMIN_SCAN_PIN=1234
ADMIN_SCAN_PIN=1234

# 2. Razorpay Gateway Keys (https://dashboard.razorpay.com/app/keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=your_custom_webhook_secret

# 3. Supabase Configuration (Supabase Dashboard -> Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
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
