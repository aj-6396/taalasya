"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  Ticket,
  Eye,
  X,
  ExternalLink,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { isTestTicket } from "@/lib/isTestTicket";

type TicketRecord = {
  ticketId: string;
  name: string;
  email: string;
  phone: string;
  paymentId: string;
  orderId: string;
  amount: number;
  status: string;
  usedAt: string | null;
  scannedBy: string | null;
  createdAt: string | null;
  hasIdCard: boolean;
  idCardUrl: string | null;
};

type AdminStats = {
  totalTickets: number;
  scannedTickets: number;
  pendingTickets: number;
};

export default function AdminPage() {
  const [pinInput, setPinInput] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState("");

  const [loadingData, setLoadingData] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"xlsx" | "csv" | null>(null);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalTickets: 0,
    scannedTickets: 0,
    pendingTickets: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scanned" | "pending">("all");
  const [previewIdUrl, setPreviewIdUrl] = useState<string | null>(null);

  // Restore authenticated session
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("taalsya_admin_auth");
    const savedPin = sessionStorage.getItem("taalsya_admin_pin");
    if (savedAuth === "true" && savedPin) {
      setAdminPin(savedPin);
      setIsAuthenticated(true);
      loadAdminData(savedPin);
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
        setTickets(data.tickets || []);
        if (data.stats) setStats(data.stats);
        setPinInput("");
      } else {
        setPinError(data.message || "Invalid Admin PIN. Please check and retry.");
      }
    } catch {
      setPinError("Connection error while verifying Admin PIN.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("taalsya_admin_auth");
    sessionStorage.removeItem("taalsya_admin_pin");
    setIsAuthenticated(false);
    setAdminPin("");
    setTickets([]);
  };

  const loadAdminData = async (pin: string) => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTickets(data.tickets || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleExport = async (format: "xlsx" | "csv") => {
    if (!adminPin) return;
    setExportingFormat(format);

    try {
      const url = `/api/admin/export?pin=${encodeURIComponent(adminPin)}&format=${format}&status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Export failed.");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `taalasya_attendees_${dateStr}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
    } catch (err: any) {
      alert(err.message || "Could not download export file.");
    } finally {
      setExportingFormat(null);
    }
  };

  // Filtered tickets (strictly excludes any test/simulated tickets)
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Exclude test/demo tickets
      if (isTestTicket(t)) return false;

      // Status filter
      if (statusFilter === "scanned" && t.status !== "Used") return false;
      if (statusFilter === "pending" && t.status === "Used") return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.ticketId.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.paymentId.toLowerCase().includes(q)
      );
    });
  }, [tickets, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {/* Navigation header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Homepage</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Lead Supervisor Portal
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center mx-auto text-pink-400 shadow-lg shadow-pink-500/10">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Admin Database Portal
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Enter Lead Supervisor PIN to access attendee records and export Excel reports.
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
                    className="w-full text-center tracking-[0.3em] font-mono text-2xl py-3 px-4 rounded-2xl bg-black/60 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
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
                  className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-lg shadow-pink-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying PIN...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Unlock Database</span>
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
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <span>Supabase Registrations</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold">
                    Live Data
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Export complete attendee records, verify gate check-in status, and monitor ticket sales.
                </p>
              </div>

              {/* Excel & CSV Export Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => handleExport("xlsx")}
                  disabled={Boolean(exportingFormat)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Download Microsoft Excel File"
                >
                  {exportingFormat === "xlsx" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  <span>Export to Excel (.xlsx)</span>
                </button>

                <button
                  onClick={() => handleExport("csv")}
                  disabled={Boolean(exportingFormat)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Download Standard CSV File"
                >
                  {exportingFormat === "csv" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-300" />
                  )}
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => loadAdminData(adminPin)}
                  disabled={loadingData}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                  title="Refresh Database"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin text-pink-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Metrics Grid (Revenue Removed as requested) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Confirmed Passes</span>
                  <Ticket className="w-4 h-4 text-pink-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalTickets}</p>
                <p className="text-[11px] text-slate-400 mt-1">Confirmed in Supabase</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Admitted at Gate</span>
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {stats.scannedTickets}
                  <span className="text-xs text-slate-400 font-normal ml-2">
                    ({stats.totalTickets > 0 ? Math.round((stats.scannedTickets / stats.totalTickets) * 100) : 0}%)
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Scanned QR Codes</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Entry</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-amber-300">{stats.pendingTickets}</p>
                <p className="text-[11px] text-slate-400 mt-1">Awaiting gate arrival</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Name, Phone, Email, Ticket ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/50 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "all"
                      ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  All ({tickets.length})
                </button>
                <button
                  onClick={() => setStatusFilter("scanned")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "scanned"
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Admitted ({stats.scannedTickets})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "pending"
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Pending ({stats.pendingTickets})
                </button>
              </div>
            </div>

            {/* Attendees Data Table */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5">#</th>
                      <th className="py-3 px-3.5">Ticket ID</th>
                      <th className="py-3 px-3.5">Attendee</th>
                      <th className="py-3 px-3.5">Contact</th>
                      <th className="py-3 px-3.5">Payment</th>
                      <th className="py-3 px-3.5">Entry Status</th>
                      <th className="py-3 px-3.5">Scanned Info</th>
                      <th className="py-3 px-3.5 text-center">BHU ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {loadingData ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin text-pink-400 mx-auto mb-2" />
                          <span>Loading Supabase records...</span>
                        </td>
                      </tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No attendee records matching your search/filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((t, idx) => {
                        const isUsed = t.status === "Used";
                        return (
                          <tr key={t.ticketId || idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-3.5 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-3 px-3.5">
                              <span className="font-mono text-white font-bold bg-black/40 px-2 py-0.5 rounded border border-slate-700">
                                {t.ticketId}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 font-semibold text-white">
                              {t.name}
                            </td>
                            <td className="py-3 px-3.5">
                              <div>{t.phone}</div>
                              <div className="text-[11px] text-slate-400">{t.email}</div>
                            </td>
                            <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400">
                              <div className="text-white font-semibold">₹{t.amount}</div>
                              <div className="truncate max-w-[120px]" title={t.paymentId}>
                                {t.paymentId}
                              </div>
                            </td>
                            <td className="py-3 px-3.5">
                              {isUsed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Admitted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-[11px] text-slate-400">
                              {isUsed ? (
                                <div>
                                  <div className="text-slate-200">
                                    {t.usedAt
                                      ? new Date(t.usedAt).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "-"}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{t.scannedBy || "Marshal"}</div>
                                </div>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              {t.hasIdCard && t.idCardUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewIdUrl(t.idCardUrl)}
                                  className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors cursor-pointer"
                                  title="View Uploaded BHU ID Card"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-600">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong>{filteredTickets.length}</strong> of <strong>{tickets.length}</strong> passes
                </span>
                <span>Sorted by latest registration</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Modal for ID Card Screenshot */}
      {previewIdUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewIdUrl(null)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified BHU ID Screenshot
              </span>
              <button
                type="button"
                onClick={() => setPreviewIdUrl(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 w-full max-h-[68vh] overflow-auto rounded-2xl bg-black/70 flex items-center justify-center p-2 border border-slate-800">
              <img
                src={previewIdUrl}
                alt="BHU ID Screenshot"
                className="max-h-[62vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
