import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gate Scanner Terminal — Confidential Staff Only",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
