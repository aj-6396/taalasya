# 🎟️ JHOOM '26 — Dance Fest cum Dandiya Night
### Taalasya Dance Society • Banaras Hindu University (BHU)

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay_Standard-0C2340?logo=razorpay)](https://razorpay.com/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

A high-performance, full-stack event ticketing, multi-pass booking, and rapid gate entry management web application engineered for **JHOOM '26: Dance Fest cum Dandiya Night** (13th October 2026 at Swatantrata Bhawan, BHU), organized by **Taalasya Dance Society (BHU)** under the aegis of the **Dean of Students, BHU**. 

Designed and engineered with ❤️ by [**AJ**](https://aj-7portfolio.vercel.app/).

---

## 📌 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Application Pages & Routes](#-application-pages--routes)
- [API Reference](#-api-reference)
- [Database Schema (Supabase)](#-database-schema-supabase)
- [Gate Entry Scanner Terminal (`/scan`)](#-gate-entry-scanner-terminal-scan)
- [Admin Portal & Live Export (`/admin`)](#-admin-portal--live-export-admin)
- [Multi-Attendee Booking & PDF Engine](#-multi-attendee-booking--pdf-engine)
- [Environment Configuration](#-environment-configuration)
- [Quick Start Guide](#-quick-start-guide)
- [Razorpay Webhook Configuration](#-razorpay-webhook-configuration)
- [Terms & Entry Regulations](#-terms--entry-regulations)

---

## ✨ Key Features

- **⚡ Modern Mobile-First UX:** Glassmorphic dark aesthetic built with Next.js 16 App Router, React 19, and Tailwind CSS v4.
- **🎟️ Multi-Tier & Multi-Attendee Booking:**
  - Dynamic pricing tiers: **Single Pass (₹299)**, **Duo Pass (₹549)**, and **Group Pass (5 Attendees for ₹1,399)**.
  - Dynamic attendee details form capturing individual names and contact info.
  - Automatic individual ticket generation with unique, human-friendly 4-character ticket codes (`JHM-XXXX`).
- **💳 Robust Payment Pipeline:**
  - Razorpay Standard Checkout integration with dual-channel verification.
  - Instant client-side verification (`/api/verify-payment`) with HMAC-SHA256 signature check.
  - Redundant asynchronous webhook fallback (`/api/webhook`) ensuring zero dropped bookings.
  - Built-in simulation / demo mode for frictionless end-to-end testing without real payments.
- **📄 High-Resolution PDF Ticket Engine:**
  - Automated multi-page PDF generation via `pdfkit` and `qrcode` (`/api/download-tickets`).
  - High-density vector rendering, custom Taalasya event branding, dynamic entry instructions, and printable/mobile-ready format.
- **📱 Private Gate Entry Terminal (`/scan`):**
  - High-speed camera QR code reader powered by `html5-qrcode` with rear/front camera toggle.
  - Fallback manual alphanumeric ticket code lookup (`JHM-XXXX` or 4-digit code) with fuzzy normalization.
  - Role-based PIN security for 4 Gate Marshals (Gate A Lanes 1–2, Gate B Lanes 1–2) and Lead Supervisors.
  - Real-time duplicate entry prevention ("ALREADY SCANNED!" warning buzzer with timestamp & gate staff ID).
  - Web Audio API synthesizer for instant audio feedback (victory chime vs duplicate buzzers).
  - Live gate lane stats and live scan logs audit feed.
- **🛡️ Dedicated Admin Portal (`/admin`):**
  - Protected supervisor login with PIN authentication.
  - Real-time ticket ledger with instant search across ticket IDs, attendee names, phone, email, and order IDs.
  - Live export of the complete attendee database to **Excel (`.xlsx`)** and **CSV (`.csv`)** via SheetJS (`xlsx`).
  - BHU ID card modal preview for identity verification.
  - Automatic test ticket filtering engine (`isTestTicket`) to keep demo and test tickets out of official analytics and gate tallies.
- **📜 Legal Compliance & Terms Check:**
  - Dedicated `/terms` page and interactive modal dialog.
  - Mandatory consent checkbox covering single-entry policy, strict gate closing timings, and refund clauses under Dean of Students, BHU guidelines.
- **🚀 Production SEO & Web Vitals:**
  - Static `robots.txt` and `sitemap.xml` strictly bound to canonical domain `https://taalasya-jhoom-26.vercel.app`.
  - JSON-LD structured schema for Banaras Hindu University cultural events.
  - Google Search Console verification and Vercel Analytics + Speed Insights integration.

---

## ⚡ System Architecture

```
                                  [ Attendee Browser ]
                                           |
                               1. Fills Registration Form
                                (Single, Duo, or Group)
                                           v
                       [ POST /api/create-order (Next.js) ]
                                           |
                              2. Creates Razorpay Order
                                           v
                            [ Razorpay Checkout Modal ]
                                           |
                               3. Completes Payment
                                           |
               +---------------------------+---------------------------+
               |                                                       |
               v                                                       v
     [ Client Redirection ]                                [ Webhook Backup ]
      POST /api/verify-payment                               POST /api/webhook
      • Validates HMAC signature                             • Cryptographic verification
      • Generates JHM-XXXX ticket IDs                        • Idempotent upsert
      • Stores to Supabase `tickets`                         • Writes to Supabase
               |                                                       |
               +---------------------------+---------------------------+
                                           |
                                           v
                                [ /success Screen ]
                                • Confetti Animation
                                • Interactive Live Pass Card
                                • Download Multi-Page PDF Pass
```

```
                                [ Gate Entry Checkpoint ]
                                           |
                                Attendee presents QR Code
                                           v
                           [ /scan Private Marshal Terminal ]
                           • Authenticated via Marshal PIN
                           • html5-qrcode Video Stream
                           • Front / Rear Camera Toggle
                           • Web Audio API Synthesizer
                                           |
                                  Sends Ticket ID + PIN
                                           v
                           [ POST /api/verify-ticket ]
                                           |
                    +----------------------+----------------------+
                    |                                             |
            If status == 'Valid'                          If status == 'Used'
            • 200 OK                                      • 409 Conflict
            • Marks status -> 'Used'                      • "ALREADY SCANNED!" Buzzer
            • Records scannedBy + timestamp               • Shows prior check-in details
            • Appends to `scan_logs` table                • Appends to `scan_logs` audit
            • Plays Upbeat Success Chime                  • Plays Double-Tone Alert
```

---

## 🛠️ Tech Stack

| Category | Technologies / Libraries |
|---|---|
| **Core Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, API Route Handlers, Turbopack) |
| **Frontend Library** | [React 19](https://react.dev/) (Client Components, Hooks, Context) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) (Modern dark UI, glassmorphism, responsive grid layout) |
| **Database** | [Supabase PostgreSQL](https://supabase.com/) (`@supabase/supabase-js` v2) with Row Level Security |
| **Payment Gateway** | [Razorpay Standard Checkout](https://razorpay.com/) & Webhook HMAC Verification (`crypto`) |
| **Document Generation** | [PDFKit](https://pdfkit.org/) (`pdfkit` + `qrcode`) for server-side vector ticket PDF generation |
| **Data Export** | [SheetJS](https://sheetjs.com/) (`xlsx`) for dynamic formatted Excel (.xlsx) and CSV exports |
| **QR Scanning** | [html5-qrcode](https://github.com/mebjas/html5-qrcode) with camera stream management |
| **Audio Synthesis** | Native **Web Audio API** (`AudioContext`) for zero-asset, high-performance sound cues |
| **Analytics & Metrics** | `@vercel/analytics` & `@vercel/speed-insights` |
| **Icons & Effects** | `lucide-react`, `canvas-confetti` |

---

## 🌐 Application Pages & Routes

| Path | Access Level | Description |
|---|---|---|
| `/` | **Public** | Official homepage featuring event details, artists, pass selection, dynamic registration form, FAQ, Instagram feed, and terms modal. |
| `/terms` | **Public** | Comprehensive 15-clause legal agreement & regulations for JHOOM '26 passes under Dean of Students, BHU. |
| `/success` | **Public / Attendee** | Post-payment celebration page with live ticket preview, attendee details, and single-click PDF ticket download. |
| `/scan` | **Private (Gate Staff)** | Entry gate scanner protected by 4-digit marshal PINs. Features live QR camera, manual code search, lane counter, and scan audit log. |
| `/admin` | **Private (Supervisor)** | Administrative management portal protected by Admin PIN. Real-time ticket stats, attendee search, ID previews, and live `.xlsx` / `.csv` export. |

---

## 🔌 API Reference

### 1. Payment & Registration Endpoints

- **`POST /api/create-order`**  
  Creates an authorized Razorpay order for single, duo, or group tickets based on selected tier pricing.

- **`POST /api/verify-payment`**  
  Cryptographically validates Razorpay payment signatures (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`). Generates unique short ticket IDs (`JHM-XXXX`) for each attendee and inserts records into Supabase `tickets` table.

- **`POST /api/webhook`**  
  Asynchronous webhook receiver for `payment.captured` and `order.paid` events. Serves as a reliable fallback to prevent orphaned transactions.

- **`POST /api/download-tickets`**  
  Generates a high-quality, branded, multi-page PDF ticket containing custom QR codes, event guidelines, entry timings, and individual pass pages for group bookings.

### 2. Gate Verification Endpoints

- **`POST /api/verify-marshal-pin`**  
  Validates a 4-digit gate PIN against configured marshals or the Supabase `gate_marshals` table and returns marshal profile info.

- **`POST /api/verify-ticket`**  
  Atomic gate check-in handler. Accepts `ticketId`, `pin`, and `marshalName`. Validates ticket status, marks pass as `Used`, logs redemption time and marshal name, and writes to `scan_logs`.

- **`GET /api/scanner-stats`**  
  Provides real-time gate metrics (admitted count, duplicate attempts, invalid scans) and recent scan activity feed.

### 3. Admin & Export Endpoints

- **`POST /api/admin/tickets`**  
  Protected by Admin PIN. Returns all genuine registered tickets with calculated totals, excluding demo/test tickets.

- **`GET /api/admin/export?pin=...&format=xlsx|csv&status=all|scanned|pending`**  
  Generates downloadable formatted Excel (`.xlsx`) spreadsheets or CSV files directly from live database records, with custom column sizing and IST timestamps.

---

## 🗄️ Database Schema (Supabase)

Execute this script in your **Supabase Dashboard -> SQL Editor -> New Query** to set up all tables, indexes, and Row Level Security policies (also available in [`supabase/schema.sql`](file:///d:/taalsya/supabase/schema.sql)):

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
  "idCardUrl" TEXT,
  "scannedBy" TEXT,
  "marshalPin" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  "usedAt" TIMESTAMPTZ
);

-- Ensure columns exist for backward compatibility
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "idCardUrl" TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "scannedBy" TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "marshalPin" TEXT;

-- 2. Performance Indexes for Rapid Entry Verification
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON public.tickets ("ticketId");
CREATE INDEX IF NOT EXISTS idx_tickets_payment_id ON public.tickets ("paymentId");
CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON public.tickets ("orderId");
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets ("status");

-- 3. Row Level Security for tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access" ON public.tickets;
DROP POLICY IF EXISTS "Allow public read tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow public insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow public update ticket status" ON public.tickets;

CREATE POLICY "Allow service role full access" ON public.tickets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read tickets" ON public.tickets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert tickets" ON public.tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update ticket status" ON public.tickets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Storage Bucket for ID Cards (Optional)
INSERT INTO storage.buckets (id, name, public) VALUES ('id-cards', 'id-cards', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Allow public read id-cards" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'id-cards');
CREATE POLICY "Allow service role upload id-cards" ON storage.objects FOR ALL TO service_role USING (bucket_id = 'id-cards') WITH CHECK (bucket_id = 'id-cards');

-- 5. Gate Marshals Table
CREATE TABLE IF NOT EXISTS public.gate_marshals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL UNIQUE,
  gate TEXT DEFAULT 'Gate A',
  "createdAt" TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Pre-populate default marshals
INSERT INTO public.gate_marshals (id, name, pin, gate) VALUES 
  ('marshal_1', 'Marshal 1' 'Gate A (Lane 1)'),
  ('marshal_2', 'Marshal 2' 'Gate A (Lane 2)'),
  ('marshal_3', 'Marshal 3','Gate B (Lane 1)'),
  ('marshal_4', 'Marshal 4', 'Gate B (Lane 2)'),
  ('admin', 'Lead Supervisor''All Gates (Supervisor)')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pin = EXCLUDED.pin, gate = EXCLUDED.gate;

-- 6. Scan Logs Table for Live Auditing
CREATE TABLE IF NOT EXISTS public.scan_logs (
  id BIGSERIAL PRIMARY KEY,
  "ticketId" TEXT NOT NULL,
  "marshalName" TEXT NOT NULL,
  "marshalPin" TEXT,
  "scanStatus" TEXT NOT NULL,
  "attendeeName" TEXT,
  "scannedAt" TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_scan_logs_ticket ON public.scan_logs ("ticketId");
CREATE INDEX IF NOT EXISTS idx_scan_logs_marshal ON public.scan_logs ("marshalName");
CREATE INDEX IF NOT EXISTS idx_scan_logs_time ON public.scan_logs ("scannedAt");

ALTER TABLE public.gate_marshals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read gate_marshals" ON public.gate_marshals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow service role all gate_marshals" ON public.gate_marshals FOR ALL TO service_role USING (true);
CREATE POLICY "Allow public read scan_logs" ON public.scan_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert scan_logs" ON public.scan_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow service role all scan_logs" ON public.scan_logs FOR ALL TO service_role USING (true);
```

---

## 📱 Gate Entry Scanner Terminal (`/scan`)

The `/scan` route is a dedicated, responsive mobile scanner designed for gate personnel:

1. **Access Control:** Gate staff enter their designated 4-digit PIN.
2. **Scanning Capabilities:**
   - Real-time video viewfinder with camera toggle (Rear environment camera / Front camera).
   - Instant camera flash/torch toggle on supported mobile browsers.
   - **Manual Code Lookup:** If an attendee has a cracked screen, staff can type the 4-character code (e.g., `7K2M` or `JHM-7K2M`).
3. **Auditory & Visual Feedback:**
   - **Valid Pass:** Full-screen green success dialog displaying attendee name, ticket code, and booking tier, accompanied by an uplifting Web Audio harmonic chord.
   - **Duplicate Pass:** Full-screen red warning modal stating `"ALREADY SCANNED!"` showing exact check-in time and marshal who admitted the pass earlier, accompanied by a double-pulse buzzer.
   - **Invalid Pass:** Amber warning dialog indicating unrecognized ticket ID.
4. **Live Lane Statistics:** Real-time counters showing Total Admitted, Duplicate Attempts, and recent scan logs.

---

## 🛡️ Admin Portal & Live Export (`/admin`)

The `/admin` portal provides real-time event analytics and comprehensive attendee management:

- **Authentication:** Protected by the Lead Supervisor Admin PIN (`ADMIN_SCAN_PIN`).
- **Real-Time KPI Counters:**
  - **Total Genuine Registrations:** Total active passes issued.
  - **Admitted Attendees:** Total passes verified at the gate.
  - **Pending Check-ins:** Attendees yet to arrive.
- **Search & Filter:** Instant client-side search across Ticket ID, Name, Phone, Email, Order ID, and Payment ID, with filters for *All*, *Admitted (Used)*, and *Pending*.
- **ID Card Preview:** Modal viewer for uploaded BHU identity cards.
- **Automated Test Ticket Exclusion:** The `isTestTicket` engine automatically strips out simulated orders, `pay_test_` records, and test passes so official figures and exports remain strictly accurate.
- **One-Click Live Export:**
  - **Excel (`.xlsx`):** Professional SheetJS workbook with auto-sized columns, formatted headers, and IST time stamps.
  - **CSV (`.csv`):** UTF-8 BOM formatted CSV compatible with Microsoft Excel, Google Sheets, and CRM tools.

---

## 🎟️ Multi-Attendee Booking & PDF Engine

### Ticket Code Specification
Each ticket generated uses a collision-resistant 4-character alphanumeric format:
```
JHM-XXXX (e.g., JHM-7K2M, JHM-89TA)
```
- Generated from 32 unambiguous characters (excludes lookalikes: `0`, `O`, `1`, `I`, `L`).
- Yields over **1,048,576** unique combinations, guaranteeing zero collisions for 600+ attendees.

### Multi-Ticket Bundles
- When purchasing a **Duo Pass (2)** or **Group Pass (5)**, the buyer provides names for each attendee.
- Each attendee receives their own distinct ticket record and unique QR code.
- The generated PDF document compiles all individual tickets into a clean, multi-page vector PDF ready for sharing via WhatsApp or saving to Apple Wallet / Google Drive.

---

## ⚙️ Environment Configuration

Create a [`.env.local`](file:///d:/taalsya/.env.local) file in the root directory (based on [`.env.example`](file:///d:/taalsya/.env.example)):

```env
# ==============================================================================
# 1. APPLICATION & EVENT SETTINGS
# ==============================================================================
NEXT_PUBLIC_APP_URL=https://taalasya-jhoom-26.vercel.app
NEXT_PUBLIC_EVENT_NAME="JHOOM '26 — Dance Fest cum Dandiya Night"
NEXT_PUBLIC_EVENT_PRICE=299
NEXT_PUBLIC_ADMIN_SCAN_PIN=6028
ADMIN_SCAN_PIN=6028
NEXT_PUBLIC_SUPPORT_EMAIL=taalasyadancesociety.bhu@gmail.com

# ==============================================================================
# 2. RAZORPAY PAYMENT GATEWAY
# (Obtain from https://dashboard.razorpay.com/app/keys)
# ==============================================================================
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YourKeyIdHere
RAZORPAY_KEY_ID=rzp_live_YourKeyIdHere
RAZORPAY_KEY_SECRET=YourRazorpaySecretKeyHere
RAZORPAY_WEBHOOK_SECRET=your_webhook_passphrase_here

# ==============================================================================
# 3. SUPABASE CONFIGURATION
# (Obtain from Supabase Dashboard -> Project Settings -> API)
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# ==============================================================================
# 4. OPTIONAL INTEGRATIONS
# ==============================================================================
GOOGLE_DRIVE_WEBHOOK_URL=https://script.google.com/macros/s/your-app-script-id/exec
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18.18+ or Node.js 20+
- npm or pnpm or yarn
- Supabase project
- Razorpay merchant account

### 1. Clone & Install
```bash
git clone https://github.com/aj-6396/taalasya.git
cd taalsya
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env.local
```
Fill in your Razorpay, Supabase, and PIN values in `.env.local`.

### 3. Initialize Database
Execute the SQL script in [`supabase/schema.sql`](file:///d:/taalsya/supabase/schema.sql) in your Supabase SQL editor.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🔒 Razorpay Webhook Configuration

To guarantee that tickets are generated even if an attendee closes their browser before redirection:

1. Open **Razorpay Dashboard** -> **Account & Settings** -> **Webhooks**.
2. Click **Add New Webhook**.
3. Set **Webhook URL** to:
   ```
   https://taalasya-jhoom-26.vercel.app/api/webhook
   ```
4. Enter the Secret matching your `RAZORPAY_WEBHOOK_SECRET`.
5. Under **Active Events**, select:
   - `payment.captured`
   - `order.paid`
6. Save the webhook.

---

## 📜 Terms & Entry Regulations

- **Event:** JHOOM '26: Dance Fest cum Dandiya Night
- **Date & Venue:** Tuesday, October 13, 2026 | Swatantrata Bhawan, BHU, Varanasi
- **Event Hours:** 03:00 PM – 08:00 PM IST
- **Entry Window:** **02:30 PM – 04:30 PM strictly** (Gates close promptly at 04:30 PM).
- **Single Entry Policy:** Passes allow **one-time entry only**; no re-entry is permitted once checked in.
- **Mandatory Identification:** Entry requires a valid digital pass alongside an official **BHU Student/Staff Identity Card**.
- **Refund Policy:** Passes are non-refundable except in the event of outright cancellation, processed within 30 working days excluding non-refundable payment gateway transaction fees.
- **Paperless:** Digital pass presented on any mobile device is 100% valid. Physical printouts are not required.

---

## 👨‍💻 Author & Credits

Engineered with ❤️ by [**AJ**](https://aj-7portfolio.vercel.app/) for **Taalasya Dance Society**, Banaras Hindu University (BHU).
