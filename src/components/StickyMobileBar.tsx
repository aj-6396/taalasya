"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Ticket, Lock, Heart } from "lucide-react";
import { EVENT_CONFIG, isBookingClosed, isEventOver } from "@/lib/constants";

export default function StickyMobileBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [bookingClosed, setBookingClosed] = useState(false);
  const [eventOver, setEventOver] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isTestParam = params.get("test") === "true";
      const isStored = sessionStorage.getItem("taalsya_test_mode") === "true";
      const isEnv = process.env.NEXT_PUBLIC_TEST_MODE === "true";
      if (isTestParam || isStored || isEnv) {
        setIsTestMode(true);
      }
    }

    setBookingClosed(isBookingClosed());
    setEventOver(isEventOver());
    const statusInterval = setInterval(() => {
      setBookingClosed(isBookingClosed());
      setEventOver(isEventOver());
    }, 2000);

    const handleScroll = () => {
      const registerElement = document.getElementById("register") || document.getElementById("feedback");
      if (!registerElement) return;

      const rect = registerElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Show sticky bar only when user has scrolled past top hero,
      // and hide when the user is actively inside the registration/feedback form
      const isPastHero = window.scrollY > 250;
      const isViewingForm = rect.top < windowHeight * 0.7 && rect.bottom > 200;

      setIsVisible(isPastHero && !isViewingForm);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      clearInterval(statusInterval);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (eventOver) {
    if (!isVisible) return null;
    return (
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-[#06090e]/95 backdrop-blur-2xl border-t border-white/[0.1] shadow-2xl animate-in slide-in-from-bottom duration-250">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white leading-tight">Hope you enjoyed JHOOM &apos;26!</p>
              <p className="text-[10px] text-pink-300 font-medium">Share your event feedback</p>
            </div>
          </div>

          <a
            href="#feedback"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 shadow-lg shadow-pink-500/25 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <span>Feedback</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  if (!isVisible || (bookingClosed && !isTestMode)) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-[#06090e]/95 backdrop-blur-2xl border-t border-white/[0.1] shadow-2xl animate-in slide-in-from-bottom duration-250">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400">Early Bird</span>
            <span className="text-xs text-slate-500 line-through font-medium">₹{EVENT_CONFIG.originalPriceInINR}</span>
            <span className="text-base font-black text-white">₹{EVENT_CONFIG.priceInINR}</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              Save ₹{EVENT_CONFIG.originalPriceInINR - EVENT_CONFIG.priceInINR}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            13 Oct • Swatantrata Bhawan
          </p>
        </div>

        <a
          href="#register"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 shadow-lg shadow-pink-500/25 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Book Pass</span>
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
