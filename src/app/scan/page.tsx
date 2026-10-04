"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, QrCode, Shield, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

// Dynamically import Scanner with ssr: false so camera & navigator APIs are only accessed on the client
const Scanner = dynamic(() => import("@/components/Scanner"), {
  ssr: false,
  loading: () => (
    <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-xs font-semibold">Initializing Gate Terminal Camera...</p>
    </div>
  ),
});

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal</span>
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Staff Turnstile Mode</span>
          </div>
        </div>

        <Scanner />
      </main>
    </div>
  );
}
