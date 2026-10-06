"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  X,
  ShieldAlert,
  FileText,
  ExternalLink,
  Phone,
  CheckCircle,
} from "lucide-react";
import { TERMS_AND_CONDITIONS } from "@/lib/termsData";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export default function TermsModal({
  isOpen,
  onClose,
  onAccept,
}: TermsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-[#0a0f18] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Terms &amp; Conditions for Entry Passes
              </h2>
              <p className="text-[11px] text-pink-300 font-medium">
                JHOOM &apos;26 • Taalasya Dance Society (BHU)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Terms modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed custom-scrollbar">
          {/* Preamble Callout */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/20 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Official University Notice</span>
            </div>
            <p className="text-[11.5px] text-slate-300 leading-relaxed">
              {TERMS_AND_CONDITIONS.preamble}
            </p>
          </div>

          {/* Clauses List */}
          <div className="space-y-4">
            {TERMS_AND_CONDITIONS.clauses.map((clause) => (
              <div
                key={clause.number}
                className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/70 space-y-2"
              >
                <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="text-pink-400 font-mono">
                    {clause.number}.
                  </span>
                  <span>{clause.title}</span>
                </h3>

                {clause.content && (
                  <p className="text-slate-300 text-[11.5px]">
                    {clause.content}
                  </p>
                )}

                {clause.subclauses && (
                  <div className="space-y-1.5 pl-1">
                    {clause.subclauses.map((sub, sIdx) => (
                      <p
                        key={sIdx}
                        className="text-[11.5px] text-slate-300 leading-relaxed"
                      >
                        {sub}
                      </p>
                    ))}
                  </div>
                )}

                {clause.points && (
                  <ul className="space-y-1 pl-3 border-l-2 border-pink-500/20 ml-1">
                    {clause.points.map((pt, pIdx) => (
                      <li
                        key={pIdx}
                        className="text-[11px] text-slate-300 leading-normal"
                      >
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}

                {clause.number === "17" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {TERMS_AND_CONDITIONS.contacts.map((c) => (
                      <a
                        key={c.name}
                        href={`tel:${c.phone}`}
                        className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <p className="font-bold text-white text-[11px]">
                            {c.name}
                          </p>
                          <p className="text-[10px] text-pink-400 font-medium">
                            {c.role}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-indigo-300 group-hover:text-white font-mono">
                          <Phone className="w-3 h-3 text-pink-400" />
                          <span>{c.phone}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <Link
            href="/terms"
            target="_blank"
            className="text-[11px] text-slate-400 hover:text-pink-300 inline-flex items-center gap-1 transition-colors"
          >
            <span>Open in dedicated page</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>I Understand &amp; Agree</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
