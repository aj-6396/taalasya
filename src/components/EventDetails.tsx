"use client";

import { useState } from "react";
import {
  Sparkles,
  Music,
  Users,
  Award,
  HelpCircle,
  MapPin,
  Clock,
  Compass,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";

export default function EventDetails() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const highlights = [
    {
      icon: Music,
      title: "Divine Feminine Energy Showcase",
      desc: "Display of 9 forms of Maa Durga, Mahishasurmardan and folk dances celebrating victory.",
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    },
    {
      icon: Sparkles,
      title: "Puja and Maha Aarti",
      desc: "High-voltage choreography face-offs, urban street battles, and synchronized dance crew performances.",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: Users,
      title: "Classical & Semi-Classical Fusion",
      desc: "Spellbinding Kathak, Bharatanatyam, and folk expressions presented by the talented dancers of Taalasya BHU.",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: Award,
      title: "DJ Finale & Festive Dance Floor",
      desc: "Cap off the night with an open DJ dance floor mixing Bollywood anthems, EDM, and high-energy Garba tracks.",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  const faqs = [
    {
      q: "What is JHOOM '26?",
      a: "JHOOM '26 is the annual Dance Fest cum Dandiya Night organized by Taalasya Dance Society, the official dance club of Banaras Hindu University (BHU). Taking place on 13th October 2026 at Swatantrata Bhawan, it unites campus dance lovers for an unforgettable cultural evening.",
    },
    {
      q: "Are Dandiya sticks provided?",
      a: "Yes! Festive Dandiya sticks will be available at designated event counters inside the venue, or you can bring your own pair. Traditional ethnic attire (Kurtas, Chaniya Cholis) is warmly encouraged!",
    },
    {
      q: "How will I receive my entry pass?",
      a: "Immediately upon successful payment, your official digital pass with a unique QR code is displayed on the confirmation screen. You will be prompted to save it as a PDF or screenshot it for gate entry.",
    },
    {
      q: "Who can attend the event?",
      a: "Students of Banaras Hindu University, faculty, alumni, and invited guests with a valid digital QR pass and a matching university/government photo ID are welcome.",
    },
    {
      q: "Where is the Dandiya Night venue located in BHU Varanasi?",
      a: "JHOOM '26 is hosted at the prestigious Swatantrata Bhawan Auditorium inside the Banaras Hindu University (BHU) campus, Varanasi. It is conveniently situated near VT (Vishwanath Temple) and easily accessible from BHU Lanka Gate and Hyderabad Gate.",
    },
  ];

  return (
    <section id="details" className="py-12 sm:py-20 border-t border-white/[0.07] scroll-mt-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
        {/* Features / Highlights */}
        <div>
          <div className="text-center max-w-xl mx-auto space-y-2 mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[11px] font-bold tracking-wider uppercase border border-pink-500/20">
              <Sparkles className="w-3 h-3" />
              Event Lineup &amp; Highlights
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              What to Expect at JHOOM &apos;26
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Curated performances by the finest dancers and choreographers of BHU.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {highlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all backdrop-blur-sm shadow-md"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Venue & Directions */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[11px] font-semibold border border-pink-500/20">
                <MapPin className="w-3.5 h-3.5" />
                BHU Campus Venue
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {EVENT_CONFIG.venue}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Located within the iconic Banaras Hindu University campus in Varanasi. Equipped with world-class stage lighting, acoustic sound systems, and designated entry lanes.
              </p>
              <div className="pt-1 flex flex-wrap gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-pink-400" />
                  <span>Gates close at 04:30 PM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-purple-400" />
                  <span>Near BHU Main Gate (Lanka)</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto border border-pink-500/20">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Need Directions to Venue?</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Navigate directly to Swatantrata Bhavan on Google Maps
                </p>
              </div>
              <a
                href="https://maps.google.com/?q=Swatantrata+Bhavan+BHU+Varanasi"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95 border border-slate-700"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section with Clean Mobile Accordions */}
        <div>
          <div className="text-center max-w-xl mx-auto space-y-2 mb-6 sm:mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-[11px] font-bold tracking-wider uppercase border border-purple-500/20">
              <HelpCircle className="w-3.5 h-3.5" />
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-2.5 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-sm font-bold text-white hover:text-pink-300 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-pink-400 shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-pink-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
