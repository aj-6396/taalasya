import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TAALSYA 2026 | Zero-Cost Event Ticketing & Rapid Entry System",
  description:
    "Official registration, instant QR e-ticket delivery, and rapid turnstile entry management powered by Next.js, Firebase Firestore, and Razorpay.",
  keywords: ["event ticketing", "entry management", "QR scanner", "Razorpay", "Firebase"],
};

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Ensures camera scanner and UI don't accidentally zoom when tapped rapidly
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
