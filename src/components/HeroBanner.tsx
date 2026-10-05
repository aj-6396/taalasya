"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, ShieldCheck, Zap, ArrowRight, Sparkles } from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";

export default function HeroBanner() {
  const [timeLeft, setTimeLeft] = useState({
    days: 42,
    hours: 14,
    minutes: 36,
    seconds: 20,
  });

  useEffect(() => {
    const targetDate = new Date(EVENT_CONFIG.eventDateISO).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden pt-6 pb-10 sm:pt-12 sm:pb-16">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] h-[260px] sm:h-[350px] bg-gradient-to-tr from-pink-600/20 via-purple-600/25 to-indigo-500/20 blur-[100px] sm:blur-[140px] -z-10 pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 sm:space-y-6">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-purple-500/30 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-purple-200 tracking-wide uppercase">
              Taalasya Dance Society • BHU Presents
            </span>
          </div>

          {/* Main Title */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none">
              JHOOM &apos;26
            </h1>
            <p className="text-lg sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Dance Fest cum Dandiya Night! 🪩✨
            </p>
          </div>

          <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            Experience the ultimate fusion of high-energy stage performances, live dhol, and vibrant Dandiya Raas at Swatantrata Bhawan, BHU. Early bird passes starting at{" "}
            <strong className="text-pink-400 font-bold">₹{EVENT_CONFIG.priceInINR} only</strong>!
          </p>

          {/* Mobile-first compact key event fact chips */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xl mx-auto pt-1">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto mb-1">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Date</p>
              <p className="text-[11px] sm:text-xs font-bold text-white truncate">{EVENT_CONFIG.date}</p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-1">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Gates Open</p>
              <p className="text-[11px] sm:text-xs font-bold text-white truncate">{EVENT_CONFIG.time}</p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-1">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Venue</p>
              <p className="text-[11px] sm:text-xs font-bold text-white truncate">Swatantrata Bhawan</p>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="pt-2 sm:pt-4">
            <p className="text-[10px] sm:text-xs uppercase tracking-widest text-pink-400 font-bold mb-2.5">
              Countdown to Dandiya Night • 13th Oct 2026
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Mins", value: timeLeft.minutes },
                { label: "Secs", value: timeLeft.seconds },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md backdrop-blur-sm"
                >
                  <span className="text-base sm:text-xl font-black text-white font-mono leading-none">
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase text-slate-400 mt-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
            <a
              href="#register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-lg shadow-pink-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Get Dandiya Pass — ₹{EVENT_CONFIG.priceInINR} Only</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </a>
            <a
              href="#details"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-xs sm:text-sm text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all active:scale-95"
            >
              Show Lineup &amp; Details
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Official BHU Society Pass
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Instant PDF &amp; QR Ticket
            </span>
            <span>•</span>
            <a
              href={EVENT_CONFIG.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-pink-400 hover:text-pink-300 font-medium"
            >
              {EVENT_CONFIG.instagramHandle}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
