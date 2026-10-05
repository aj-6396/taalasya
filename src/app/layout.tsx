import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
  themeColor: "#06090e",
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
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#06090e] text-slate-100 font-sans selection:bg-pink-500 selection:text-white antialiased">
        {children}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

