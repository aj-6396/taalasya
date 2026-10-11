"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  Unlock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Award,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SpecialPassManager from "@/components/admin/SpecialPassManager";

export default function AdminSpecialPassPage() {
  const [pinInput, setPinInput] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState("");

  // Restore authenticated session from sessionStorage
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("taalsya_admin_auth");
    const savedPin = sessionStorage.getItem("taalsya_admin_pin");
    if (savedAuth === "true" && savedPin) {
      setAdminPin(savedPin);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin) return;

    setIsVerifying(true);
    setPinError("");

    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: cleanPin }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdminPin(cleanPin);
        setIsAuthenticated(true);
        sessionStorage.setItem("taalsya_admin_auth", "true");
        sessionStorage.setItem("taalsya_admin_pin", cleanPin);
      } else {
        setPinError(data.message || "Invalid Admin PIN. Access Denied.");
      }
    } catch {
      setPinError("Connection error while verifying credentials");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("taalsya_admin_auth");
    sessionStorage.removeItem("taalsya_admin_pin");
    setIsAuthenticated(false);
    setAdminPin("");
    setPinInput("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {/* Navigation header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>General Admin Portal</span>
            </Link>
            <span className="text-slate-700">•</span>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Homepage
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
              <Award className="w-3.5 h-3.5" />
              Special Pass Portal
            </span>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-rose-400 hover:text-rose-300 hover:border-rose-500/30 transition-all cursor-pointer font-semibold"
              >
                Lock Portal
              </button>
            )}
          </div>
        </div>

        {/* LOCKED LOGIN VIEW */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto py-12">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-600/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>INTERNAL BACKEND ONLY</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Special Pass Portal
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Enter Lead Supervisor PIN to issue Volunteers, Special Guests, and Core Committee passes.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="Enter Admin PIN"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError("");
                    }}
                    autoFocus
                    className="w-full text-center tracking-[0.3em] font-mono text-2xl py-3 px-4 rounded-2xl bg-black/60 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                  {pinError && (
                    <p className="text-xs text-rose-400 mt-2 font-medium flex items-center justify-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{pinError}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !pinInput.trim()}
                  className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 shadow-lg shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying PIN...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Unlock Special Pass Portal</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                Authorized access only • Taalasya Dance Society, BHU
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED SPECIAL PASS MANAGER */
          <SpecialPassManager adminPin={adminPin} />
        )}
      </main>
    </div>
  );
}
