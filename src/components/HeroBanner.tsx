"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, ShieldCheck, Zap, ArrowRight } from "lucide-react";
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
    <div className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-pink-600/20 via-purple-600/25 to-indigo-500/20 blur-[130px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-pink-500/10 blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-purple-500/30 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            <span className="text-xs font-semibold text-purple-200 tracking-wide uppercase">
              Taalasya Dance Society • BHU Presents
            </span>
          </div>

          {/* Main Title */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
              JHOOM &apos;26
            </h1>
            <p className="text-xl sm:text-3xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Dance Fest cum Dandiya Night! 🪩✨
            </p>
          </div>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Experience the ultimate fusion of high-energy stage performances, live dhol, and vibrant Dandiya Raas at Swatantrata Bhawan, BHU. Early bird passes starting at <strong className="text-pink-400 font-bold">₹{EVENT_CONFIG.priceInINR} only</strong>!
          </p>

          {/* Key event facts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center justify-center sm:justify-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 font-medium">Date</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-200">{EVENT_CONFIG.date}</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 font-medium">Gates Open</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-200">{EVENT_CONFIG.time}</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 font-medium">Venue</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[170px] sm:max-w-none">
                  Swatantrata Bhawan, BHU
                </p>
              </div>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="pt-4 pb-2">
            <p className="text-xs uppercase tracking-widest text-pink-400 font-bold mb-3">
              Countdown to Dandiya Night • 13th Oct 2026
            </p>
            <div className="flex items-center justify-center gap-2.5 sm:gap-4">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Minutes", value: timeLeft.minutes },
                { label: "Seconds", value: timeLeft.seconds },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg"
                >
                  <span className="text-xl sm:text-2xl font-black text-white font-mono">
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 active:scale-95 transition-all cursor-pointer"
            >
              <span>Get Dandiya Pass — ₹{EVENT_CONFIG.priceInINR} Only</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#details"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
            >
              Show Lineup &amp; Details
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Official BHU Society Pass
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Instant PDF & QR Ticket
            </span>
            <span>•</span>
            <a
              href={EVENT_CONFIG.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-pink-400 hover:text-pink-300 underline font-medium"
            >
              {EVENT_CONFIG.instagramHandle}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
