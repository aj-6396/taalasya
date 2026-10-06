import Link from "next/link";
import Image from "next/image";
import { Heart, Shield, Code2, ExternalLink } from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#06090e] text-slate-400 text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-32 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="sm:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 to-indigo-500 shadow-md shadow-pink-500/10 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Taalasya Dance Society Logo"
                  width={36}
                  height={36}
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight block">
                  TAALASYA DANCE SOCIETY
                </span>
                <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">
                  Banaras Hindu University (BHU) • JHOOM &apos;26
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Official digital ticketing &amp; gate entry portal for JHOOM &apos;26: Dance Fest cum Dandiya Night, hosted by Taalasya Dance Society, Banaras Hindu University (BHU), Varanasi.
            </p>
            <div className="flex flex-col gap-1 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Powered by Next.js, Supabase &amp; Razorpay</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium pl-6">
                <span>Developer:</span>
                <a
                  href={EVENT_CONFIG.developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-bold hover:text-pink-400 transition-colors inline-flex items-center gap-1 group"
                  title="Visit Developer Portfolio"
                >
                  <span className="underline underline-offset-2">{EVENT_CONFIG.developer}</span>
                  <ExternalLink className="w-3 h-3 text-pink-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
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
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Security &amp; Gate Entry
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>Verified QR Admission</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Passes are stored securely in Supabase with cryptographic Razorpay verification. Each QR code is strictly single-use at turnstiles.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
          <p>© 2026 {EVENT_CONFIG.organizer}. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1.5 text-slate-400 font-medium">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>by</span>
            <a
              href={EVENT_CONFIG.developerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold bg-white/5 hover:bg-pink-500/15 hover:text-pink-300 hover:border-pink-500/30 px-2 py-0.5 rounded-md border border-white/10 transition-all inline-flex items-center gap-1 group cursor-pointer shadow-sm"
              title="Visit AJ's Portfolio"
            >
              <span>{EVENT_CONFIG.developer}</span>
              <ExternalLink className="w-3 h-3 text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
