"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Mail,
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldCheck,
  Share2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TicketCard from "@/components/TicketCard";
import { EVENT_CONFIG } from "@/lib/constants";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "";
  const paymentId = searchParams.get("payment_id") || "pay_verified";
  const name = searchParams.get("name") || "Valued Guest";
  const email = searchParams.get("email") || "your email address";
  const phone = searchParams.get("phone") || "";
  const directTicketId = searchParams.get("ticket_id") || "";
  const isSimulated = searchParams.get("simulated") === "true";

  const [ticketId, setTicketId] = useState(
    directTicketId || `TKT-${paymentId.slice(-8).toUpperCase()}`
  );

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      const end = Date.now() + 2.5 * 1000;
      const colors = ["#6366f1", "#a855f7", "#ec4899", "#10b981"];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch (e) {
      console.warn("Confetti error:", e);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
      {/* Thank you greeting & checkmark */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/20 animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Payment Confirmed & Verified
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          You&apos;re Going to {EVENT_CONFIG.name}!
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto">
          Thank you, <strong className="text-white">{name}</strong>. Your transaction has been recorded.
        </p>

        {isSimulated && (
          <div className="inline-block p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            ⚡ Demo Simulation Mode: In production, Razorpay Webhook creates the live ticket in Firestore and triggers SMTP email.
          </div>
        )}
      </div>

      {/* Confirmation notification banner */}
      <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Ticket Emailed to:</p>
            <p className="text-xs sm:text-sm text-indigo-300 font-mono">{email}</p>
          </div>
        </div>
        <div className="text-xs text-slate-400 max-w-xs text-center sm:text-right">
          Please check your inbox (and spam folder) for your official pass and entry QR barcode.
        </div>
      </div>

      {/* Live Digital Pass Preview */}
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
            Instant Pass Preview
          </p>
          <p className="text-xs text-slate-500">
            You can take a screenshot or print this pass for fast entry
          </p>
        </div>

        <TicketCard
          ticket={{
            ticketId,
            name,
            email,
            phone,
            paymentId,
            status: "Valid",
          }}
        />
      </div>

      {/* Important instructions */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2 max-w-xl mx-auto">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Entry Verification Notice</span>
        </div>
        <p className="leading-relaxed">
          The QR code above will be scanned at the gate terminal. Each QR pass can only be used once. Please have your brightness turned up when approaching the scanning turnstiles.
        </p>
      </div>

      {/* Return home link */}
      <div className="text-center pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Event Homepage</span>
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="py-24 text-center text-slate-400">
              Loading confirmation...
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
