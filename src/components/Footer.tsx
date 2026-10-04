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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-indigo-500 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-pink-400" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight block">
                  TAALASYA DANCE SOCIETY
                </span>
                <span className="text-[11px] text-pink-400 font-semibold">
                  Banaras Hindu University (BHU) • JHOOM &apos;26
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Official digital ticketing &amp; gate entry portal for JHOOM &apos;26: Dance Fest cum Dandiya Night, hosted by Taalasya Dance Society, Banaras Hindu University (BHU), Varanasi.
            </p>
            <div className="flex flex-col gap-1 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>Powered by Next.js, Supabase &amp; Razorpay</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-indigo-300 font-medium pl-6">
                <span>Developer:</span>
                <span className="text-white font-semibold">{EVENT_CONFIG.developer}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Navigation
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Event Home
                </Link>
              </li>
              <li>
                <a href="#register" className="hover:text-white transition-colors">
                  Book Dandiya &amp; Dance Pass
                </a>
              </li>
              <li>
                <a href="#details" className="hover:text-white transition-colors">
                  Dandiya Night &amp; Venue
                </a>
              </li>
              <li>
                <a
                  href={EVENT_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-pink-400 hover:text-pink-300 transition-colors"
                >
                  Instagram ({EVENT_CONFIG.instagramHandle})
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
              Security &amp; Gate Entry
            </p>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Verified QR Admission</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Passes are stored securely in Supabase with cryptographic Razorpay verification. Each QR code is strictly single-use at turnstiles.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 {EVENT_CONFIG.organizer}. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>by</span>
            <strong className="text-slate-200 font-semibold">{EVENT_CONFIG.developer}</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
