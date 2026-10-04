import Link from "next/link";
import { QrCode, Ticket, Sparkles, ShieldCheck } from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Ticket className="w-5 h-5 text-pink-400 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  TAALASYA
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  BHU
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">
                JHOOM &apos;26 • Dance Society
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href={EVENT_CONFIG.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-slate-400 hover:text-pink-400 transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <span>{EVENT_CONFIG.instagramHandle}</span>
            </a>

            <Link
              href="/#register"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors hidden md:inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
              Book Passes
            </Link>

            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-600 transition-all shadow-sm active:scale-95"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Gate Scanner</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Staff
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
