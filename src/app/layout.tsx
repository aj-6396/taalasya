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

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://taalasya-jhoom-26.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JHOOM '26: Dandiya Night in BHU Varanasi | Taalasya Dance Society",
    template: "%s | Taalasya Dance Society — BHU",
  },
  description:
    "Official portal for JHOOM '26: The Grand Dance Fest cum Dandiya Night in BHU Varanasi hosted by Taalasya Dance Society on 13th October 2026 at Swatantrata Bhawan, Banaras Hindu University. Live Dhol beats, Garba, DJ & Dance Face-offs. Book passes starting ₹299!",
  applicationName: "Taalasya Dance Society Event Portal",
  authors: [{ name: "AJ", url: "https://aj-7portfolio.vercel.app/" }],
  creator: "AJ",
  publisher: "Taalasya Dance Society — Banaras Hindu University (BHU)",
  keywords: [
    // Top Google queries for BHU & Varanasi Dandiya
    "dandiya nights in bhu",
    "dandiya night in bhu",
    "dandiya nights near varanasi",
    "dandiya night varanasi",
    "dandiya night in varanasi",
    "dandiya nights varanasi",
    "bhu dandiya night",
    "bhu dandiya night 2026",
    // Society and University queries
    "bhu taalasya dance society",
    "taalasya dance society",
    "taalasya dance society bhu",
    "taalasya bhu",
    "taalasya",
    "banaras hindu university dandiya",
    "banaras hindu university dance fest",
    "bhu dance society",
    "swatantrata bhawan bhu events",
    "swatantrata bhawan dandiya",
    "swatantrata bhawan varanasi",
    // Event names & Fest queries
    "jhoom 26",
    "jhoom 2026",
    "jhoom 26 bhu",
    "jhoom bhu",
    "bhu fest 2026",
    "bhu cultural fest",
    // Festive & Regional keywords
    "garba night in varanasi",
    "garba night varanasi",
    "navratri dandiya varanasi 2026",
    "navratri events varanasi",
    "dandiya raas varanasi",
    "dandiya raas bhu",
    "varanasi events october 2026",
    "dance fest bhu",
    "swatantrata bhawan",
    "AJ portfolio",
  ],
  category: "Events & Entertainment",
  classification: "Cultural Dance Festival, Garba and Dandiya Night",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Taalasya Dance Society — BHU",
    title: "JHOOM '26: Dandiya Night in BHU Varanasi | Taalasya Dance Society",
    description:
      "Join the biggest Dandiya Night & Dance Fest in BHU Varanasi: JHOOM '26 hosted by Taalasya Dance Society on 13th October 2026 at Swatantrata Bhawan, BHU. Live Dhol, Garba, DJ & Dance face-offs. Passes starting ₹299!",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Taalasya Dance Society BHU — JHOOM '26 Dandiya Night",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JHOOM '26: Dandiya Night in BHU Varanasi | Taalasya Dance Society",
    description:
      "Grand Dance Fest cum Dandiya Night in BHU Varanasi on 13 Oct 2026 at Swatantrata Bhawan. Passes starting ₹299. Organized by Taalasya Dance Society.",
    images: ["/logo.png"],
    creator: "@taalasyadancesociety_bhu",
  },
  other: {
    "geo.region": "IN-UP",
    "geo.placename": "Varanasi, Banaras Hindu University (BHU)",
    "geo.position": "25.2677;82.9913",
    "ICBM": "25.2677, 82.9913",
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  },
};

export const viewport: Viewport = {
  themeColor: "#06090e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Event",
      "@id": `${siteUrl}/#event`,
      name: "JHOOM '26: Dance Fest cum Dandiya Night",
      alternateName: [
        "Dandiya Night in BHU",
        "Dandiya Night Varanasi",
        "BHU Dandiya Night 2026",
        "Dandiya Nights near Varanasi",
        "BHU Taalasya Dandiya Night",
      ],
      description:
        "The grandest Dance Fest cum Dandiya Night in BHU Varanasi: JHOOM '26 hosted by Taalasya Dance Society on 13th October 2026 at Swatantrata Bhawan, Banaras Hindu University. High-energy dance face-offs, live dhol beats, Garba and Dandiya Raas celebration.",
      startDate: "2026-10-13T17:00:00+05:30",
      endDate: "2026-10-13T22:30:00+05:30",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: "Swatantrata Bhawan",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Banaras Hindu University (BHU) Campus",
          addressLocality: "Varanasi",
          addressRegion: "Uttar Pradesh",
          postalCode: "221005",
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 25.2677,
          longitude: 82.9913,
        },
      },
      image: [`${siteUrl}/logo.png`],
      organizer: {
        "@type": "Organization",
        name: "Taalasya Dance Society",
        url: "https://www.instagram.com/taalasyadancesociety_bhu/",
        logo: `${siteUrl}/logo.png`,
      },
      offers: {
        "@type": "Offer",
        url: `${siteUrl}/#register`,
        price: "299",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        validFrom: "2026-09-01T00:00:00+05:30",
      },
      performer: {
        "@type": "PerformingGroup",
        name: "Taalasya Dance Society — BHU",
      },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Taalasya Dance Society",
      alternateName: [
        "BHU Taalasya Dance Society",
        "Taalasya Dance Society BHU",
        "Taalasya BHU",
        "Taalasya",
      ],
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      sameAs: [
        "https://www.instagram.com/taalasyadancesociety_bhu/",
        "https://www.instagram.com/taalasyadancesociety_bhu/p/Dd1H4mRi0QP/",
      ],
      parentOrganization: {
        "@type": "CollegeOrUniversity",
        name: "Banaras Hindu University (BHU)",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Varanasi",
          addressRegion: "Uttar Pradesh",
          addressCountry: "IN",
        },
      },
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
