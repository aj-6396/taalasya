"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Download,
  Printer,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  FileText,
  AlertTriangle,
  X,
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
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const directTicketId = searchParams.get("ticket_id") || "";
  const isSimulated = searchParams.get("simulated") === "true";

  const [ticketId] = useState(
    directTicketId || `TKT-${paymentId.slice(-8).toUpperCase()}`
  );
  const [showPdfPrompt, setShowPdfPrompt] = useState(false);

  useEffect(() => {
    // Show PDF prompt modal shortly after load
    const timer = setTimeout(() => {
      setShowPdfPrompt(true);
    }, 600);

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

    return () => clearTimeout(timer);
  }, []);

  const handleSavePdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
      {/* Save PDF Modal Prompt */}
      {showPdfPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div className="relative max-w-md w-full rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl shadow-indigo-500/20 text-center space-y-5">
            <button
              onClick={() => setShowPdfPrompt(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white tracking-tight">
                Save Your Ticket as PDF
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Payment verified successfully! Email delivery is turned off for this event. Please download or save your pass as a PDF now to present at gate security.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowPdfPrompt(false);
                  handleSavePdf();
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Save Ticket as PDF Now</span>
              </button>

              <button
                onClick={() => setShowPdfPrompt(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                I&apos;ll Screenshot Instead
              </button>
            </div>
          </div>
        </div>
      )}

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
          You&apos;re Going to JHOOM &apos;26!
        </h1>

        <p className="text-xs sm:text-sm font-semibold text-pink-400">
          Presented by {EVENT_CONFIG.organizer}
        </p>

        <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto">
          Thank you, <strong className="text-white">{name}</strong>. Your payment was successful and your official BHU dance pass is ready below.
        </p>

        {isSimulated && (
          <div className="inline-block p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            ⚡ Demo Simulation Mode: Razorpay Webhook demo ticket generated.
          </div>
        )}
      </div>

      {/* Persistent Save PDF Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-purple-950/70 to-slate-900/90 border-2 border-indigo-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 no-print">
        <div className="flex items-start gap-3.5 text-left">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Prompt: Save Your Ticket as PDF</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              No automated emails are dispatched. Please save or print your ticket pass as a PDF now to ensure smooth gate entry.
            </p>
          </div>
        </div>

        <button
          onClick={handleSavePdf}
          className="w-full sm:w-auto shrink-0 px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Save as PDF / Print</span>
        </button>
      </div>

      {/* Live Digital Pass Preview with QR Code */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
            Official Gate Entry QR Pass
          </h2>
          <p className="text-xs text-slate-400">
            Present the QR code below at turnstile scanners or save it to your device
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

      {/* Important entry notice */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2 max-w-xl mx-auto">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Gate Entry Guidelines</span>
        </div>
        <p className="leading-relaxed">
          The QR code above is your unique single-use admission ticket. Please save the PDF or keep this screen open with high screen brightness when approaching gate marshals.
        </p>
      </div>

      {/* Return home link */}
      <div className="text-center pt-4 no-print">
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
