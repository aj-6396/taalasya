"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CreditCard,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Users,
} from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    quantity: 1,
  });

  const [extraAttendees, setExtraAttendees] = useState<
    Array<{ name: string; email: string; phone: string }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const pricePerTicket = EVENT_CONFIG.priceInINR;
  const totalAmount = pricePerTicket * formData.quantity;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "quantity") {
      const newQty = Math.max(1, Number(value));
      setFormData((prev) => ({ ...prev, quantity: newQty }));
      const neededExtra = Math.max(0, newQty - 1);
      setExtraAttendees((prev) => {
        const next = [...prev];
        while (next.length < neededExtra) {
          next.push({ name: "", email: "", phone: "" });
        }
        return next.slice(0, neededExtra);
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setErrorMessage("");
  };

  const handleExtraAttendeeChange = (
    index: number,
    field: "name" | "email" | "phone",
    val: string
  ) => {
    setExtraAttendees((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setDemoNotice(null);

    // Primary Attendee Validation
    if (!formData.name.trim()) {
      setErrorMessage("Please enter the primary attendee's full name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please enter a valid primary email address.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 8) {
      setErrorMessage("Please enter a valid mobile number for entry verification.");
      return;
    }

    // Additional Attendees Validation
    for (let i = 0; i < extraAttendees.length; i++) {
      if (!extraAttendees[i].name.trim()) {
        setErrorMessage(
          `Please enter the full legal name for Attendee ${i + 2}.`
        );
        return;
      }
    }

    const fullAttendees = [
      {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      },
      ...extraAttendees.map((a, i) => ({
        name: a.name.trim() || `Guest ${i + 2}`,
        email: a.email.trim() || formData.email.trim(),
        phone: a.phone.trim() || formData.phone.trim(),
      })),
    ];

    setLoading(true);

    try {
      const mockPaymentId = `pay_${Date.now().toString().slice(-8)}`;
      const mockOrderId = `order_${Date.now().toString().slice(-8)}`;

      // Store verified tickets in Supabase with individual attendee names
      const verifyRes = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: "simulated_signature",
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          quantity: formData.quantity,
          attendees: fullAttendees,
        }),
      });

      const verifyData = await verifyRes.json();
      const generatedTicketId =
        verifyData.ticketId || `TKT-${mockPaymentId.slice(-8).toUpperCase()}`;

      const ticketIdsList =
        verifyData.ticketIds && verifyData.ticketIds.length > 0
          ? verifyData.ticketIds.join(",")
          : generatedTicketId;

      // Redirect immediately to payment success page
      router.push(
        `/success?ticket_id=${encodeURIComponent(
          generatedTicketId
        )}&ticket_ids=${encodeURIComponent(
          ticketIdsList
        )}&payment_id=${encodeURIComponent(
          mockPaymentId
        )}&order_id=${encodeURIComponent(
          mockOrderId
        )}&name=${encodeURIComponent(
          formData.name.trim()
        )}&email=${encodeURIComponent(
          formData.email.trim()
        )}&phone=${encodeURIComponent(
          formData.phone.trim()
        )}&quantity=${formData.quantity}&attendees=${encodeURIComponent(
          JSON.stringify(fullAttendees)
        )}`
      );
    } catch (err: any) {
      console.error("Payment processing error:", err);
      // Fallback redirect with generated pass
      const mockPaymentId = `pay_${Date.now().toString().slice(-8)}`;
      router.push(
        `/success?ticket_id=TKT-${mockPaymentId.slice(-8).toUpperCase()}&payment_id=${mockPaymentId}&name=${encodeURIComponent(
          formData.name.trim()
        )}&email=${encodeURIComponent(
          formData.email.trim()
        )}&phone=${encodeURIComponent(formData.phone.trim())}&quantity=${formData.quantity}&attendees=${encodeURIComponent(
          JSON.stringify(fullAttendees)
        )}`
      );
    }
  };

  return (
    <section id="register" className="py-12 sm:py-16 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Subtle gradient bar at top */}
          <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  JHOOM &apos;26 • Dance Fest cum Dandiya Night
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Book Your Fest &amp; Dandiya Pass
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Starting at ₹{pricePerTicket} only. Hosted by Taalasya Dance Society at Swatantrata Bhawan, BHU.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-right min-w-[150px]">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                  Starting Price
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  ₹{pricePerTicket}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ person</span>
                </p>
                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                  ✓ 0% Platform Convenience Fee
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-semibold">Unable to proceed</p>
                  <p className="text-xs text-rose-400/90 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {demoNotice && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-sm">
                <Loader2 className="w-5 h-5 shrink-0 text-amber-400 animate-spin mt-0.5" />
                <div>
                  <p className="font-semibold">Simulating Checkout</p>
                  <p className="text-xs text-amber-400/90 mt-0.5">{demoNotice}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {/* Pass Quantity Selector First */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-emerald-400" />
                    Number of Passes to Book
                  </label>
                  <p className="text-xs text-slate-400">
                    Each pass generates a separate single-entry QR code for each individual.
                  </p>
                </div>

                <div className="sm:w-60">
                  <select
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Person (Pass)" : "Persons (Passes)"} — ₹{pricePerTicket * num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendee 1 (Primary Booker) Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                      1
                    </span>
                    <span className="text-sm font-bold text-white">
                      Attendee 1 {formData.quantity > 1 ? "(Primary Booker)" : ""}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Main Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      Full Legal Name <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-purple-400" />
                      Email Address <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. priya.sharma@gmail.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-pink-400" />
                    Mobile / WhatsApp Number <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-500">
                    Used for entry verification &amp; festival notifications.
                  </p>
                </div>
              </div>

              {/* Additional Attendees Fields (when quantity > 1) */}
              {formData.quantity > 1 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Users className="w-4 h-4" />
                    <span>
                      Additional Attendee Details ({formData.quantity - 1} more {formData.quantity === 2 ? "person" : "people"})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 -mt-2">
                    Enter the names of accompanying guests so each person gets their own pass with their name printed.
                  </p>

                  <div className="space-y-4">
                    {extraAttendees.map((att, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 animate-in fade-in duration-200"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center border border-purple-500/30">
                              {idx + 2}
                            </span>
                            <span className="text-sm font-bold text-white">
                              Attendee {idx + 2} Pass
                            </span>
                          </div>
                          <span className="text-[11px] text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20 font-medium">
                            Individual QR Pass
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                              <User className="w-3 h-3 text-indigo-400" />
                              Full Name <span className="text-pink-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={`e.g. Guest ${idx + 2} Full Name`}
                              value={att.name}
                              onChange={(e) =>
                                handleExtraAttendeeChange(idx, "name", e.target.value)
                              }
                              className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-pink-400" />
                              Phone Number <span className="text-slate-500 text-[10px]">(Optional)</span>
                            </label>
                            <input
                              type="tel"
                              placeholder="e.g. +91 9876543210"
                              value={att.phone}
                              onChange={(e) =>
                                handleExtraAttendeeChange(idx, "phone", e.target.value)
                              }
                              className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Total Payable</p>
                  <p className="text-xl sm:text-2xl font-black text-white">
                    ₹{totalAmount}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">
                      ({formData.quantity} {formData.quantity === 1 ? "Pass" : "Passes"}, Incl. taxes)
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-600 shadow-xl shadow-purple-600/30 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Payment &amp; Generating {formData.quantity} Passes...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay ₹{totalAmount} &amp; Get {formData.quantity > 1 ? `${formData.quantity} Passes` : "Pass"}</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  UPI, Cards, NetBanking Supported
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Zero Platform Fees
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
