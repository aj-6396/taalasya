import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#06090e]/85 border-b border-white/[0.07] transition-all">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/logo.png"
                alt="Taalasya BHU Logo"
                width={36}
                height={36}
                className="w-full h-full rounded-full object-cover bg-white"
                priority
              />
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 shadow-md shadow-pink-500/20 hover:opacity-95 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-200" />
              <span>Book Pass</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
