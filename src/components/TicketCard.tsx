"use client";

import {
  Calendar,
  Download,
  Shield,
  Loader2,
  Sparkles,
} from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";
import { Ticket } from "@/types";

interface TicketCardProps {
  ticket: Partial<Ticket> & {
    ticketId: string;
    name: string;
    email: string;
    phone?: string;
    college?: string;
    paymentId?: string;
    status?: string;
  };
  ticketIndex?: number;
  totalTickets?: number;
  onDownload?: () => void;
  downloading?: boolean;
}

export default function TicketCard({
  ticket,
  ticketIndex,
  totalTickets,
  onDownload,
  downloading,
}: TicketCardProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    ticket.ticketId
  )}`;

  const handleAction = () => {
    if (onDownload) {
      onDownload();
    } else if (typeof window !== "undefined") {
      window.print();
    }
  };

  const passBadgeText =
    totalTickets && totalTickets > 1 && ticketIndex
      ? `PASS ${ticketIndex} OF ${totalTickets}`
      : ticket.status || "VALID PASS";

  return (
    <div className="max-w-md mx-auto print:max-w-none print:w-full ticket-print-page">
      {/* Ticket Pass Shell */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden print:bg-white print:border-black print:text-black print:shadow-none">
        {/* Top Header of Ticket */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative print:bg-none print:bg-slate-900 print:text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full p-0.5 bg-white shrink-0 shadow-sm">
                <img
                  src="/logo.png"
                  alt="Taalasya Logo"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <span className="font-extrabold tracking-wider text-xs sm:text-sm uppercase block leading-tight">
                  JHOOM &apos;26 PASS
                </span>
                <span className="text-[9px] text-pink-200 font-semibold block leading-tight">
                  Taalasya Dance Society
                </span>
              </div>
            </div>
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/30 text-white tracking-wide">
              {passBadgeText}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black mt-3 tracking-tight">
            {EVENT_CONFIG.name}
          </h3>
          <p className="text-[11px] font-medium text-pink-200 mt-0.5 print:text-slate-300">
            {EVENT_CONFIG.organizer}
          </p>
          <p className="text-xs text-white/90 mt-1.5 flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {EVENT_CONFIG.date} • {EVENT_CONFIG.time}
          </p>
        </div>

        {/* Middle Perforation Notches */}
        <div className="relative flex items-center justify-between px-4 py-1 bg-slate-900 print:bg-white">
          <div className="w-6 h-6 rounded-full bg-slate-950 -ml-7 border-r border-slate-700 print:hidden" />
          <div className="flex-1 border-b-2 border-dashed border-slate-800 mx-2 print:border-slate-400" />
          <div className="w-6 h-6 rounded-full bg-slate-950 -mr-7 border-l border-slate-700 print:hidden" />
        </div>

        {/* QR Code Section */}
        <div className="p-6 text-center bg-slate-900/90 space-y-4 print:bg-white print:text-black">
          {/* Badge: 1 QR Code = 1 Entry */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold print:bg-amber-100 print:text-amber-900 print:border-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1 QR Code = 1 Entry Only</span>
          </div>

          <div className="inline-block p-3 rounded-2xl bg-white shadow-xl print:shadow-none print:border print:border-slate-300">
            <img
              src={qrUrl}
              alt={`QR Code for Ticket ${ticket.ticketId}`}
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
            />
          </div>

          <div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-slate-500 print:text-slate-700">
              Unique Gate ID (Single-Use)
            </span>
            <p className="font-mono text-xs sm:text-sm font-bold text-indigo-400 select-all tracking-wider break-all mt-0.5 print:text-black">
              {ticket.ticketId}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2 print:bg-slate-50 print:border-slate-300 print:text-black">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600">Attendee Name</span>
              <span className="font-semibold text-white print:text-black">{ticket.name}</span>
            </div>
            {totalTickets && totalTickets > 1 && (
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">Pass Allocation</span>
                <span className="font-bold text-indigo-400 print:text-indigo-700">
                  Pass {ticketIndex} of {totalTickets}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600">Registered Email</span>
              <span className="font-semibold text-white truncate max-w-[200px] print:text-black">
                {ticket.email}
              </span>
            </div>
            {ticket.phone && (
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">Phone</span>
                <span className="font-semibold text-white print:text-black">{ticket.phone}</span>
              </div>
            )}
            {ticket.college && (
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">College / Institute</span>
                <span className="font-semibold text-white print:text-black truncate max-w-[200px]" title={ticket.college}>
                  {ticket.college}
                </span>
              </div>
            )}
            {(ticket.idCardUrl || (ticket as any).hasIdCard) && (
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">ID Card Attached</span>
                <span className="font-semibold text-emerald-400 print:text-emerald-700 text-[11px] flex items-center gap-1">
                  ✓ Verified Screenshot
                </span>
              </div>
            )}
            {ticket.paymentId && (
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">Payment ID</span>
                <span className="font-mono text-[11px] text-slate-300 print:text-black">
                  {ticket.paymentId}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400 print:text-slate-600">Venue</span>
              <span className="font-semibold text-white text-right max-w-[200px] truncate print:text-black">
                {EVENT_CONFIG.venue}
              </span>
            </div>
          </div>

          <div className="pt-1">
            <p className="text-[11px] text-amber-300 print:text-red-700 flex items-center justify-center gap-1.5 text-center leading-tight">
              <Shield className="w-3.5 h-3.5 text-amber-400 print:text-red-700 shrink-0" />
              <span>Passes are valid for a single entry. Re-entry is not permitted hence do not leave the venue.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 print:hidden">
        <button
          onClick={handleAction}
          disabled={downloading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white text-xs font-bold border border-indigo-400/30 transition-all cursor-pointer shadow-lg shadow-purple-600/25 active:scale-95 disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Download className="w-4 h-4 text-white" />
          )}
          <span>
            {downloading
              ? "Generating Pure White PDF..."
              : totalTickets && totalTickets > 1
              ? `Download All ${totalTickets} Passes (Pure White PDF)`
              : "Download Ticket (Pure White PDF)"}
          </span>
        </button>
      </div>
    </div>
  );
}
