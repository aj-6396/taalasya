"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Award,
  Download,
  Plus,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  Mail,
  GraduationCap,
  Sparkles,
  Shield,
  FileText,
  Tag,
  Check,
} from "lucide-react";
import {
  SPECIAL_PASS_CATEGORIES,
  SpecialPassCategory,
} from "@/lib/specialPass";

interface SpecialPassManagerProps {
  adminPin: string;
}

interface SpecialPassRecord {
  ticketId: string;
  name: string;
  category: SpecialPassCategory;
  categoryLabel: string;
  badgeTitle: string;
  accentHex: string;
  email: string;
  phone: string;
  college: string;
  status: string;
  usedAt: string | null;
  scannedBy: string | null;
  createdAt: string | null;
  paymentId: string;
}

export default function SpecialPassManager({ adminPin }: SpecialPassManagerProps) {
  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SpecialPassCategory>("special_pass");
  const [designation, setDesignation] = useState("");
  const [college, setCollege] = useState("Banaras Hindu University (BHU)");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [customTicketId, setCustomTicketId] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Passes list state
  const [loadingPasses, setLoadingPasses] = useState(false);
  const [passes, setPasses] = useState<SpecialPassRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    scanned: 0,
    pending: 0,
    specialPasses: 0,
    mediaInfluencers: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch special passes list
  const fetchPasses = async () => {
    if (!adminPin) return;
    setLoadingPasses(true);
    try {
      const res = await fetch("/api/admin/special-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: adminPin, action: "list" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasses(data.passes || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("[SpecialPassManager] Failed to fetch passes:", err);
    } finally {
      setLoadingPasses(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, [adminPin]);

  // Download PDF for a pass
  const handleDownloadPdf = async (ticket: Partial<SpecialPassRecord> & { ticketId: string; name: string; category?: string; designation?: string; college?: string; phone?: string; email?: string }) => {
    setDownloadingId(ticket.ticketId);
    try {
      const res = await fetch("/api/admin/special-pass/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: adminPin,
          ticketId: ticket.ticketId,
          passData: ticket,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        alert(`Failed to download pass: ${errorJson.message || "Unknown error"}`);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Special_Pass_${ticket.ticketId}_${ticket.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      console.error("[SpecialPassManager] PDF download failed:", err);
      alert("Error generating PDF pass");
    } finally {
      setDownloadingId(null);
    }
  };

  // Submit form: Insert into DB + Trigger immediate PDF download
  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Please enter recipient name");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch("/api/admin/special-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: adminPin,
          action: "create",
          name: name.trim(),
          category,
          designation: designation.trim(),
          college: college.trim(),
          email: email.trim(),
          phone: phone.trim(),
          customTicketId: customTicketId.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "Failed to create special pass");
        setIsSubmitting(false);
        return;
      }

      setFormSuccess(data.message || `Pass created successfully for ${name}! Downloading PDF...`);

      // Trigger instant PDF download for this newly created pass
      if (data.ticket) {
        setPasses((prev) => [data.ticket, ...prev.filter((p) => p.ticketId !== data.ticket.ticketId)]);
        await handleDownloadPdf(data.ticket);
      }

      // Reset form fields
      setName("");
      setDesignation("");
      setEmail("");
      setPhone("");
      setCustomTicketId("");

      // Refresh passes list
      fetchPasses();
    } catch (err: any) {
      console.error("[SpecialPassManager] Create error:", err);
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter passes
  const filteredPasses = useMemo(() => {
    return passes.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        categoryFilter === "all" || p.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [passes, searchQuery, categoryFilter]);

  const activeCategoryConfig = SPECIAL_PASS_CATEGORIES[category];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Category Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Special Passes */}
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold mb-1">
            <span>Special Passes</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.specialPasses}</p>
          <p className="text-[11px] text-amber-300/70 mt-0.5">VIPs & Dignitaries</p>
        </div>

        {/* Media & Influencers */}
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between text-cyan-400 text-xs font-bold mb-1">
            <span>Media & Influencers</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.mediaInfluencers}</p>
          <p className="text-[11px] text-cyan-300/70 mt-0.5">Press & Creators</p>
        </div>

        {/* Total Allocated */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between text-indigo-400 text-xs font-bold mb-1">
            <span>Total Issued</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.total}</p>
          <p className="text-[11px] text-indigo-300/70 mt-0.5">Active Special Passes</p>
        </div>

        {/* Scanned at Gate */}
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold mb-1">
            <span>Scanned at Gate</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">
            {stats.scanned} / {stats.total}
          </p>
          <p className="text-[11px] text-emerald-300/70 mt-0.5">
            {stats.pending} passes pending
          </p>
        </div>
      </div>

      {/* CREATE SPECIAL PASS FORM */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow accent matching category */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: activeCategoryConfig.accentHex }}
        />

        <div className="relative space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border"
                style={{
                  backgroundColor: `${activeCategoryConfig.accentHex}15`,
                  borderColor: `${activeCategoryConfig.accentHex}40`,
                  color: activeCategoryConfig.accentHex,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>SPECIAL ACCESS GENERATOR</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Create & Download Special Pass
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Saved instantly to the database (<code className="text-slate-300">tickets</code> table) and ready for gate QR verification.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Theme:</span>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: `${activeCategoryConfig.accentHex}20`,
                  borderColor: activeCategoryConfig.accentHex,
                  color: "#ffffff",
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeCategoryConfig.accentHex }} />
                {activeCategoryConfig.label}
              </span>
            </div>
          </div>

          <form onSubmit={handleCreatePass} className="space-y-6">
            {/* Category Selection Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                Select Pass Category & Color Theme *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.keys(SPECIAL_PASS_CATEGORIES) as SpecialPassCategory[]).map((catKey) => {
                  const cfg = SPECIAL_PASS_CATEGORIES[catKey];
                  const isSelected = category === catKey;

                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`relative p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? "shadow-lg scale-[1.02]"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100"
                      }`}
                      style={{
                        borderColor: isSelected ? cfg.accentHex : undefined,
                        backgroundColor: isSelected ? `${cfg.accentHex}12` : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border-2"
                          style={{
                            backgroundColor: isSelected ? cfg.accentHex : "transparent",
                            borderColor: cfg.accentHex,
                          }}
                        />
                        <span
                          className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${cfg.accentHex}25`,
                            color: cfg.accentHex,
                          }}
                        >
                          {cfg.shortPrefix}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{cfg.label}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {cfg.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Recipient Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Kumar / Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Designation / Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Role / Designation Title
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. Head of Hospitality / Guest of Honor"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Institute / Faculty / College */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Institute / Faculty / College
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. Faculty of Performing Arts, BHU"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Phone / WhatsApp (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    placeholder="recipient@bhu.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Custom Ticket ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Custom Ticket ID (Optional)
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder={`Leave blank for auto: SP-${activeCategoryConfig.shortPrefix}-XXXXX`}
                    value={customTicketId}
                    onChange={(e) => setCustomTicketId(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Error or Success Notice */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Venue: Swatantrata Bhawan (Near Seer Gate, BHU) • Date: 13 Oct 2026</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-6 py-3 rounded-2xl font-bold text-sm text-white shadow-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 active:scale-95"
                style={{
                  backgroundColor: activeCategoryConfig.accentHex,
                  boxShadow: `0 10px 25px -5px ${activeCategoryConfig.accentHex}40`,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Pass & PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Generate & Download {activeCategoryConfig.label} Pass PDF</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ISSUED SPECIAL PASSES TABLE */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>All Issued Special Passes</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {filteredPasses.length} total
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live records from Supabase <code className="text-slate-300">tickets</code> table. Click Download to fetch official PDF.
            </p>
          </div>

          <button
            onClick={fetchPasses}
            disabled={loadingPasses}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPasses ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, pass ID, institute, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === "all"
                  ? "bg-white text-slate-950 shadow-md font-bold"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              All ({passes.length})
            </button>
            {(Object.keys(SPECIAL_PASS_CATEGORIES) as SpecialPassCategory[]).map((catKey) => {
              const cfg = SPECIAL_PASS_CATEGORIES[catKey];
              const isSelected = categoryFilter === catKey;
              const count = passes.filter((p) => p.category === catKey).length;

              return (
                <button
                  key={catKey}
                  onClick={() => setCategoryFilter(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "text-white shadow-md font-bold border"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${cfg.accentHex}25` : undefined,
                    borderColor: isSelected ? cfg.accentHex : undefined,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.accentHex }} />
                  <span>{cfg.label} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table of Passes */}
        {loadingPasses ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">Loading special passes from database...</p>
          </div>
        ) : filteredPasses.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <Award className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No special passes found</p>
            <p className="text-xs text-slate-500">
              Create your first special pass above using the generator form.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Recipient Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Institute / College</th>
                  <th className="py-3 px-4">Gate Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredPasses.map((p) => {
                  const cfg = SPECIAL_PASS_CATEGORIES[p.category] || SPECIAL_PASS_CATEGORIES.special_pass;
                  const isUsed = p.status === "Used";

                  return (
                    <tr
                      key={p.ticketId}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Pass ID */}
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {p.ticketId}
                        </span>
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        {(p.phone || p.email) && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {p.phone} {p.email ? `• ${p.email}` : ""}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                          style={{
                            backgroundColor: `${cfg.accentHex}18`,
                            borderColor: `${cfg.accentHex}40`,
                            color: cfg.accentHex,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cfg.accentHex }}
                          />
                          <span>{cfg.label}</span>
                        </span>
                      </td>

                      {/* Institute */}
                      <td className="py-3 px-4 text-slate-300 max-w-[180px] truncate">
                        {p.college || "BHU"}
                      </td>

                      {/* Gate Check-in Status */}
                      <td className="py-3 px-4">
                        {isUsed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Scanned ({p.scannedBy || "Gate"})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Valid (Ready)</span>
                          </span>
                        )}
                      </td>

                      {/* Download PDF Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDownloadPdf(p)}
                          disabled={downloadingId === p.ticketId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          style={{
                            backgroundColor: `${cfg.accentHex}20`,
                            color: cfg.accentHex,
                            border: `1px solid ${cfg.accentHex}40`,
                          }}
                          title="Download Official Pass PDF"
                        >
                          {downloadingId === p.ticketId ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              <span>Download PDF</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
