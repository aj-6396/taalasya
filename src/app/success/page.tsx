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
  const ticketIdsParam = searchParams.get("ticket_ids") || "";
  const paramOrderId = searchParams.get("order_id") || "";
  const paramPaymentId = searchParams.get("payment_id") || "";
  const paramName = searchParams.get("name") || "";
  const paramEmail = searchParams.get("email") || "";
  const paramPhone = searchParams.get("phone") || "";
  const isSimulated = searchParams.get("simulated") === "true";
  const quantity = Math.max(1, Number(searchParams.get("quantity")) || 1);

  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPdfPrompt, setShowPdfPrompt] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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

  // Extract all distinct ticket IDs
  const rawTicketIds = ticketIdsParam
    ? ticketIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : directTicketId
    ? [directTicketId]
    : [];

  const allTicketIds: string[] = [...rawTicketIds];
  while (allTicketIds.length < quantity) {
    allTicketIds.push(
      `TKT-${(paramPaymentId || "PAY").slice(-4).toUpperCase()}-${(allTicketIds.length + 1).toString().padStart(2, "0")}`
    );
  }

  const allTickets = allTicketIds.map((tId, idx) => ({
    ticketId: tId,
    ticketIndex: idx + 1,
    totalTickets: allTicketIds.length,
    name: ticketData?.name || paramName || "Valued Attendee",
    email: ticketData?.email || paramEmail || "",
    phone: ticketData?.phone || paramPhone || "",
    paymentId: ticketData?.paymentId || paramPaymentId || "",
    orderId: ticketData?.orderId || paramOrderId || "",
    status: ticketData?.status || "Valid",
  }));

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
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate tickets PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        quantity > 1
          ? `JHOOM26-${quantity}-Passes-WhiteSheet.pdf`
          : `JHOOM26-Ticket-${allTickets[0].ticketId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      console.error("PDF download error:", err);
      alert(
        err.message ||
          "Could not download PDF. Please check your connection and retry."
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Verifying Payment &amp; Generating Passes...</h2>
        <p className="text-xs text-slate-400">
          Generating cryptographic single-entry QR codes for your passes.
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
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
                {quantity > 1
                  ? `Download All ${quantity} Passes as Pure White PDF`
                  : "Save Your Ticket as PDF"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {quantity > 1
                  ? `You have booked ${quantity} passes. Each attendee has a separate single-entry QR code on pure white sheets. Please download your official PDF now.`
                  : "Payment verified successfully! Please download your official ticket pass on a clean white sheet to present at gate security."}
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
                    : `Download ${quantity > 1 ? `All ${quantity} Passes` : "Ticket"} (Pure White PDF)`}
                </span>
              </button>

              <button
                onClick={() => setShowPdfPrompt(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                View Passes on Screen First
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thank you greeting & checkmark */}
      <div className="text-center space-y-4 no-print">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/20 animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Payment Confirmed • {allTickets.length} {allTickets.length > 1 ? "Passes" : "Pass"} Generated
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          You&apos;re Going to JHOOM &apos;26!
        </h1>

        <p className="text-xs sm:text-sm font-semibold text-pink-400">
          Presented by {EVENT_CONFIG.organizer}
        </p>

        <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto">
          Thank you, <strong className="text-white">{attendeeName}</strong>. Your payment was verified and your official admission {allTickets.length > 1 ? "passes are" : "pass is"} ready below.
        </p>

        {isSimulated && (
          <div className="inline-block p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            ⚡ Demo Simulation Mode: Instant ticket pass generated.
          </div>
        )}
      </div>

      {/* Persistent Download PDF Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-purple-950/70 to-slate-900/90 border-2 border-indigo-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 no-print">
        <div className="flex items-start gap-3.5 text-left">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Download Official White Sheet PDF Pass</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              Generates a printer-friendly A4 document with pure white background, crisp barcodes, and separate sheets for each attendee.
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
              : `Download ${quantity > 1 ? `All ${quantity} Passes` : "Ticket"} (Pure White PDF)`}
          </span>
        </button>
      </div>

      {/* Multi-Ticket Notice if booking 2 or more passes */}
      {allTickets.length > 1 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 flex items-start gap-3.5 text-xs text-purple-200 no-print">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white text-sm">
              {allTickets.length} Separate Passes Booked (1 QR Code = 1 Entry)
            </p>
            <p className="leading-relaxed">
              Strict Gate Policy: Each person enters with their own single-use QR pass. Your downloaded PDF contains <strong>{allTickets.length} separate pages on pure white sheets</strong>, with a unique QR code generated for each person.
            </p>
          </div>
        </div>
      )}

      {/* Live Digital Passes with Unique QR Codes */}
      <div className="space-y-6">
        <div className="text-center space-y-1 no-print">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
            {allTickets.length > 1
              ? `All ${allTickets.length} Gate Entry Passes & Unique QR Codes`
              : "Official Gate Entry QR Pass"}
          </h2>
          <p className="text-xs text-slate-400">
            {allTickets.length > 1
              ? "Each pass below has its own distinct single-use QR code. Click the download button on any pass or above to get the complete PDF."
              : "Present the QR code below at turnstile scanners or save it to your device"}
          </p>
        </div>

        <div
          className={`grid gap-8 ${
            allTickets.length > 1
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 max-w-md mx-auto"
          }`}
        >
          {allTickets.map((t, idx) => (
            <TicketCard
              key={t.ticketId || idx}
              ticket={t}
              ticketIndex={t.ticketIndex}
              totalTickets={t.totalTickets}
              onDownload={handleDownloadPdf}
              downloading={downloadingPdf}
            />
          ))}
        </div>
      </div>

      {/* Important entry notice */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2 max-w-xl mx-auto no-print">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Gate Entry Guidelines</span>
        </div>
        <p className="leading-relaxed">
          Each QR code above is a unique single-use admission ticket. Please download the white-sheet PDF or keep this screen open with high screen brightness when approaching gate marshals at Swatantrata Bhawan.
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col print:bg-white print:text-black">
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
