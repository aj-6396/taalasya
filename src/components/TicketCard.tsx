"use client";

import { Ticket as TicketIcon, Calendar, MapPin, CheckCircle2, Download, Printer, Shield } from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";
import { Ticket } from "@/types";

interface TicketCardProps {
  ticket: Partial<Ticket> & {
    ticketId: string;
    name: string;
    email: string;
    phone?: string;
    paymentId?: string;
    status?: string;
  };
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    ticket.ticketId
  )}`;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="max-w-md mx-auto print:max-w-none print:w-full">
      {/* Ticket Pass Shell */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden print:border-black print:text-black">
        {/* Top Header of Ticket */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-white" />
              <span className="font-extrabold tracking-wider text-sm uppercase">
                JHOOM &apos;26 PASS
              </span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/20">
              {ticket.status || "VALID PASS"}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black mt-3 tracking-tight">
            {EVENT_CONFIG.name}
          </h3>
          <p className="text-[11px] font-medium text-pink-200 mt-0.5">
            {EVENT_CONFIG.organizer}
          </p>
          <p className="text-xs text-white/80 mt-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {EVENT_CONFIG.date} • {EVENT_CONFIG.time}
          </p>
        </div>

        {/* Middle Perforation Notches */}
        <div className="relative flex items-center justify-between px-4 py-1 bg-slate-900">
          <div className="w-6 h-6 rounded-full bg-slate-950 -ml-7 border-r border-slate-700 print:hidden" />
          <div className="flex-1 border-b-2 border-dashed border-slate-800 mx-2" />
          <div className="w-6 h-6 rounded-full bg-slate-950 -mr-7 border-l border-slate-700 print:hidden" />
        </div>

        {/* QR Code Section */}
        <div className="p-6 text-center bg-slate-900/90 space-y-4">
          <div className="inline-block p-3 rounded-2xl bg-white shadow-xl">
            <img
              src={qrUrl}
              alt={`QR Code for Ticket ${ticket.ticketId}`}
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
            />
          </div>

          <div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-slate-500">
              Unique Gate ID
            </span>
            <p className="font-mono text-xs sm:text-sm font-bold text-indigo-400 select-all tracking-wider break-all mt-0.5">
              {ticket.ticketId}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80">
              <span className="text-slate-400">Attendee Name</span>
              <span className="font-semibold text-white">{ticket.name}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80">
              <span className="text-slate-400">Registered Email</span>
              <span className="font-semibold text-white truncate max-w-[200px]">
                {ticket.email}
              </span>
            </div>
            {ticket.phone && (
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80">
                <span className="text-slate-400">Phone</span>
                <span className="font-semibold text-white">{ticket.phone}</span>
              </div>
            )}
            {ticket.paymentId && (
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/80">
                <span className="text-slate-400">Payment ID</span>
                <span className="font-mono text-[11px] text-slate-300">
                  {ticket.paymentId}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Venue</span>
              <span className="font-semibold text-white text-right max-w-[200px] truncate">
                {EVENT_CONFIG.venue}
              </span>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Present this QR code on your phone or print at the entrance.
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Developed by {EVENT_CONFIG.developer}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white text-xs font-bold border border-indigo-400/30 transition-all cursor-pointer shadow-lg shadow-purple-600/25 active:scale-95"
        >
          <Download className="w-4 h-4 text-white animate-bounce" />
          <span>Save Ticket as PDF / Print</span>
        </button>
      </div>
    </div>
  );
}
