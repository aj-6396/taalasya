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
  title: "JHOOM '26: Dance Fest cum Dandiya Night | Taalasya Dance Society — BHU",
  description:
    "Official event portal for JHOOM '26: Dance Fest cum Dandiya Night on 13th October 2026 at Swatantrata Bhawan, Banaras Hindu University (BHU). Passes starting at ₹299 only. Developed by Ambuj Singh.",
  authors: [{ name: "Ambuj Singh" }],
  keywords: [
    "JHOOM 26",
    "Dance Fest cum Dandiya Night",
    "Dandiya Night BHU",
    "Taalasya",
    "Taalasya Dance Society",
    "BHU Varanasi",
    "Swatantrata Bhawan",
    "Ambuj Singh",
    "QR Ticket",
  ],
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
