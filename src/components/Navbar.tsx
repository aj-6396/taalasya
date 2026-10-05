import Link from "next/link";
import { QrCode, Ticket, Sparkles } from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#06090e]/85 border-b border-white/[0.07] transition-all">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-0.5 shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Ticket className="w-4 h-4 text-pink-400 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  TAALASYA
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  BHU
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 tracking-wider font-semibold uppercase leading-tight">
                JHOOM &apos;26 • Dance Society
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={EVENT_CONFIG.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-slate-400 hover:text-pink-400 transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <span>{EVENT_CONFIG.instagramHandle}</span>
            </a>

            <Link
              href="#register"
              className="hidden xs:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/25 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Book Pass</span>
            </Link>

            <Link
              href="/scan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-sm active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Gate</span>
              <span>Scanner</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Staff
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
