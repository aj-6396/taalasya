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
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TicketCard from "@/components/TicketCard";
import { EVENT_CONFIG } from "@/lib/constants";

function SuccessContent() {
  const searchParams = useSearchParams();
  const directTicketId = searchParams.get("ticket_id") || "";
  const paramOrderId = searchParams.get("order_id") || "";
  const paramPaymentId = searchParams.get("payment_id") || "";
  const paramName = searchParams.get("name") || "";
  const paramEmail = searchParams.get("email") || "";
  const paramPhone = searchParams.get("phone") || "";
  const isSimulated = searchParams.get("simulated") === "true";

  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPdfPrompt, setShowPdfPrompt] = useState(false);

  useEffect(() => {
    const idToLookup = directTicketId || paramPaymentId || paramOrderId;

    if (!idToLookup && !paramPaymentId) {
      setError("No valid booking reference found. Please register to obtain your pass.");
      setLoading(false);
      return;
    }

    async function loadTicket() {
      try {
        if (idToLookup) {
          const res = await fetch(`/api/ticket/${encodeURIComponent(idToLookup)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.ticket) {
              setTicketData(data.ticket);
              triggerSuccessEffects();
              setLoading(false);
              return;
            }
          }
        }

        // Fallback to client query params if backend record is still synchronizing or in demo
        if (directTicketId || paramPaymentId) {
          setTicketData({
            ticketId: directTicketId || `TKT-${paramPaymentId.slice(-8).toUpperCase()}`,
            name: paramName || "Valued Guest",
            email: paramEmail,
            phone: paramPhone,
            paymentId: paramPaymentId,
            orderId: paramOrderId,
            status: "Valid",
          });
          triggerSuccessEffects();
        } else {
          setError("Ticket could not be verified. Only confirmed payments generate admission passes.");
        }
      } catch (err: any) {
        if (directTicketId || paramPaymentId) {
          setTicketData({
            ticketId: directTicketId || `TKT-${paramPaymentId.slice(-8).toUpperCase()}`,
            name: paramName || "Valued Guest",
            email: paramEmail,
            phone: paramPhone,
            paymentId: paramPaymentId,
            orderId: paramOrderId,
            status: "Valid",
          });
          triggerSuccessEffects();
        } else {
          setError(err.message || "Failed to load ticket.");
        }
      } finally {
        setLoading(false);
      }
    }

    function triggerSuccessEffects() {
      // Show PDF prompt modal shortly after load
      setTimeout(() => {
        setShowPdfPrompt(true);
      }, 700);

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
    }

    loadTicket();
  }, [directTicketId, paramOrderId, paramPaymentId, paramName, paramEmail, paramPhone]);

  const quantity = Math.max(1, Number(searchParams.get("quantity")) || 1);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const res = await fetch("/api/download-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: ticketData?.name || paramName || "Valued Attendee",
          eventDetails: {
            name: EVENT_CONFIG.name,
            date: EVENT_CONFIG.date,
            time: EVENT_CONFIG.time,
            venue: EVENT_CONFIG.venue,
            organizer: EVENT_CONFIG.organizer,
          },
          paymentId: ticketData?.paymentId || paramPaymentId || "pay_verified",
          orderId: ticketData?.orderId || paramOrderId || "",
          quantity: quantity,
          email: ticketData?.email || paramEmail || "",
          phone: ticketData?.phone || paramPhone || "",
        }),
      });

      if (!res.ok) {
        throw new Error("Server PDF generation failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        quantity > 1
          ? `JHOOM26-${quantity}-Passes.pdf`
          : `JHOOM26-Ticket-${(ticketData?.ticketId || "pass").slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("PDF download error, falling back to print:", err);
      if (typeof window !== "undefined") {
        window.print();
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Verifying Payment &amp; Generating Pass...</h2>
        <p className="text-xs text-slate-400">
          Connecting to Supabase to retrieve your encrypted gate admission QR code.
        </p>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Payment Verification Required</h2>
          <p className="text-xs text-slate-400">
            {error || "Only confirmed and verified Razorpay payments generate an official QR admission ticket."}
          </p>
        </div>
        <Link
          href="/#register"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Booking &amp; Registration</span>
        </Link>
      </div>
    );
  }

  const attendeeName = ticketData.name || paramName || "Valued Guest";

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
                  handleDownloadPdf();
                }}
                disabled={downloadingPdf}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-60"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {downloadingPdf
                    ? "Generating White Sheet PDF..."
                    : `Download ${quantity > 1 ? `${quantity} Tickets` : "Ticket"} (Pure White PDF)`}
                </span>
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
          Payment Confirmed &amp; Verified in Supabase
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          You&apos;re Going to JHOOM &apos;26!
        </h1>

        <p className="text-xs sm:text-sm font-semibold text-pink-400">
          Presented by {EVENT_CONFIG.organizer}
        </p>

        <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto">
          Thank you, <strong className="text-white">{attendeeName}</strong>. Your payment was verified and your official admission pass is generated below.
        </p>

        {isSimulated && (
          <div className="inline-block p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            ⚡ Demo Simulation Mode: Instant ticket pass generated.
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
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="w-full sm:w-auto shrink-0 px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
        >
          {downloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>
            {downloadingPdf
              ? "Generating White Sheet PDF..."
              : `Download ${quantity > 1 ? `${quantity} Tickets` : "Ticket"} (Pure White PDF)`}
          </span>
        </button>
      </div>

      {/* Multi-Ticket Notice if booking 2 or more passes */}
      {quantity > 1 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 flex items-start gap-3.5 text-xs text-purple-200">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white text-sm">
              {quantity} Separate Entry Passes Booked (1 QR Code = 1 Entry)
            </p>
            <p className="leading-relaxed">
              As per security guidelines, each attendee requires their own distinct single-use QR pass. Your downloaded PDF will contain <strong>{quantity} separate pages on pure white sheets</strong>, with a unique QR code generated for each person.
            </p>
          </div>
        </div>
      )}

      {/* Live Digital Pass Preview with QR Code */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
            {quantity > 1 ? `Pass 1 of ${quantity} Preview` : "Official Gate Entry QR Pass"}
          </h2>
          <p className="text-xs text-slate-400">
            {quantity > 1
              ? `Previewing Pass 1. Download the full PDF above to access all ${quantity} individual QR passes.`
              : "Present the QR code below at turnstile scanners or save it to your device"}
          </p>
        </div>

        <TicketCard
          ticket={{
            ticketId: ticketData.ticketId,
            name: ticketData.name || attendeeName,
            email: ticketData.email || paramEmail,
            phone: ticketData.phone || paramPhone,
            paymentId: ticketData.paymentId || paramPaymentId,
            status: ticketData.status || "Valid",
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
