import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldAlert,
  ArrowLeft,
  Phone,
  Sparkles,
  FileText,
  BadgeCheck,
  Scale,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { TERMS_AND_CONDITIONS } from "@/lib/termsData";

export const metadata: Metadata = {
  title: "Terms and Conditions for Entry Passes | JHOOM '26 — Taalasya BHU",
  description:
    "Official terms and conditions, entry pass guidelines, code of conduct, and regulations for JHOOM '26 organized by Taalasya Dance Society, Banaras Hindu University under the aegis of Dean of Students, BHU.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
        {/* Back Link & Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-pink-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Event Home</span>
          </Link>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>Official Event Policy</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Terms &amp; Conditions for Entry Passes
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              JHOOM &apos;26 is organised by the{" "}
              <strong className="text-white">
                Taalasya Dance Society, Banaras Hindu University
              </strong>{" "}
              under the aegis of the{" "}
              <strong className="text-white">Dean of Students, BHU</strong>. By
              purchasing an entry pass, you agree to comply with the terms set
              forth below.
            </p>
          </div>
        </div>

        {/* Quick Highlights Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-pink-400 font-bold text-xs">
              <BadgeCheck className="w-4 h-4 shrink-0" />
              <span>Valid BHU ID Required</span>
            </div>
            <p className="text-[11.5px] text-slate-400 leading-normal">
              Entry is permitted strictly on presentation of a valid digital pass
              along with a valid BHU ID card.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Single Entry Only</span>
            </div>
            <p className="text-[11.5px] text-slate-400 leading-normal">
              Each unique QR code admits exactly one person once. Re-entry after
              exit is strictly prohibited.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Proctorial Jurisdiction</span>
            </div>
            <p className="text-[11.5px] text-slate-400 leading-normal">
              All discipline and misconduct matters on campus fall under the
              jurisdiction of the Proctorial Board, BHU.
            </p>
          </div>
        </div>

        {/* Preamble Box */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-pink-950/30 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Preamble &amp; Electronic Agreement</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {TERMS_AND_CONDITIONS.preamble}
          </p>
        </div>

        {/* Detailed Clauses List */}
        <div className="space-y-6">
          {TERMS_AND_CONDITIONS.clauses.map((clause) => (
            <article
              key={clause.number}
              id={`clause-${clause.number}`}
              className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3 shadow-md hover:border-slate-700 transition-colors"
            >
              <div className="flex items-baseline gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {clause.number}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {clause.title}
                </h2>
              </div>

              {clause.content && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-1">
                  {clause.content}
                </p>
              )}

              {clause.subclauses && (
                <div className="space-y-2.5 pl-1 sm:pl-2">
                  {clause.subclauses.map((sub, sIdx) => (
                    <p
                      key={sIdx}
                      className="text-xs sm:text-sm text-slate-300 leading-relaxed"
                    >
                      {sub}
                    </p>
                  ))}
                </div>
              )}

              {clause.points && (
                <ul className="space-y-2 pl-3 sm:pl-4 border-l-2 border-pink-500/30 ml-1.5 my-2">
                  {clause.points.map((pt, pIdx) => (
                    <li
                      key={pIdx}
                      className="text-xs sm:text-sm text-slate-300 leading-relaxed"
                    >
                      {pt}
                    </li>
                  ))}
                </ul>
              )}

              {clause.number === "17" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  {TERMS_AND_CONDITIONS.contacts.map((contact) => (
                    <a
                      key={contact.name}
                      href={`tel:${contact.phone}`}
                      className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">
                          {contact.name}
                        </p>
                        <p className="text-xs text-pink-400 font-medium">
                          {contact.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-indigo-300 group-hover:text-white font-mono bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                        <Phone className="w-3.5 h-3.5 text-pink-400" />
                        <span>{contact.phone}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-pink-900/30 via-purple-900/30 to-indigo-900/30 border border-pink-500/20 text-center space-y-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold uppercase tracking-wider border border-pink-500/20">
            <Sparkles className="w-3 h-3" />
            <span>Join the Celebration</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Ready to Celebrate JHOOM &apos;26?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Book your admission passes now and get your verified digital QR entry
            pass immediately.
          </p>
          <div className="pt-2">
            <Link
              href="/#register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-xl shadow-pink-500/25 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-pink-200" />
              <span>Book Your Entry Pass</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
