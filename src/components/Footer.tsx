import Link from "next/link";
import { Ticket, Heart, Shield, Code2, QrCode } from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                TAALSYA 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Zero-Cost Event Ticketing & Rapid Entry Management System powered by Next.js App Router, Firebase Firestore, and Razorpay standard checkout & webhooks.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Code2 className="w-4 h-4 text-purple-400" />
              <span>Full-Stack Next.js Architecture</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Quick Links
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Event Home
                </Link>
              </li>
              <li>
                <a href="#register" className="hover:text-white transition-colors">
                  Registration & Passes
                </a>
              </li>
              <li>
                <a href="#details" className="hover:text-white transition-colors">
                  Schedule & FAQ
                </a>
              </li>
              <li>
                <Link href="/scan" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  Staff Entry Scanner
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Security & Verification
            </p>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>HMAC Verified Webhooks</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Tickets are only written to Firestore upon strict Razorpay cryptographic signature verification.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 {EVENT_CONFIG.organizer}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for seamless event entry.
          </p>
        </div>
      </div>
    </footer>
  );
}
