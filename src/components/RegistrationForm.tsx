"use client";

import { useState, useEffect } from "react";
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
import { EVENT_CONFIG, PASS_TIERS, getTierPrice } from "@/lib/constants";
import { generateShortTicketId } from "@/lib/ticketId";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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
  const [isTestModeActive, setIsTestModeActive] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("live") === "true") {
        setIsTestModeActive(false);
      } else if (params.get("test") === "true") {
        setIsTestModeActive(true);
      }
    }
  }, []);

  const totalAmount = getTierPrice(formData.quantity);

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

    // =========================================================================
    // DIRECT TEST MODE: Instantly generate real tickets without charging money
    // =========================================================================
    if (isTestModeActive) {
      setDemoNotice("⚡ Test Mode Active: Generating admission passes and QR codes...");
      try {
        const simulatedOrderId = `order_test_${Date.now().toString().slice(-8)}`;
        const simulatedPaymentId = `pay_test_${Date.now().toString().slice(-8)}`;

        const verifyRes = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: simulatedOrderId,
            razorpay_payment_id: simulatedPaymentId,
            razorpay_signature: "simulated_signature",
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            quantity: formData.quantity,
            attendees: fullAttendees,
          }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || "Failed to generate test passes.");
        }

        const generatedTicketId =
          verifyData.ticketId || generateShortTicketId();

        const ticketIdsList =
          verifyData.ticketIds && verifyData.ticketIds.length > 0
            ? verifyData.ticketIds.join(",")
            : generatedTicketId;

        router.push(
          `/success?ticket_id=${encodeURIComponent(
            generatedTicketId
          )}&ticket_ids=${encodeURIComponent(
            ticketIdsList
          )}&payment_id=${encodeURIComponent(
            simulatedPaymentId
          )}&order_id=${encodeURIComponent(
            simulatedOrderId
          )}&name=${encodeURIComponent(
            formData.name.trim()
          )}&email=${encodeURIComponent(
            formData.email.trim()
          )}&phone=${encodeURIComponent(
            formData.phone.trim()
          )}&quantity=${formData.quantity}&attendees=${encodeURIComponent(
            JSON.stringify(fullAttendees)
          )}&simulated=true`
        );
        return;
      } catch (testErr: any) {
        console.error("Test pass generation error:", testErr);
        setErrorMessage(
          testErr.message || "Failed to generate test passes."
        );
        setLoading(false);
        setDemoNotice(null);
        return;
      }
    }

    try {
      // 1. Create Order on server
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          quantity: formData.quantity,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to create payment order. Please try again.");
      }

      // 2. Load Razorpay Checkout Script if not already loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || typeof window.Razorpay === "undefined") {
        throw new Error(
          "Payment gateway checkout failed to load. Please check your network connection and retry."
        );
      }

      // Format contact as +91XXXXXXXXXX so Razorpay skips contact collection
      const rawDigits = formData.phone.replace(/\D/g, "");
      const clean10Digits = rawDigits.slice(-10);
      const formattedContact = clean10Digits ? `+91${clean10Digits}` : formData.phone.trim();

      // 3. Configure Razorpay Checkout to open directly to payment methods
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: EVENT_CONFIG.shortName || "JHOOM '26",
        description: `${formData.quantity}x Pass • ${EVENT_CONFIG.name}`,
        order_id: orderData.orderId,
        prefill: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          contact: formattedContact,
        },
        readonly: {
          contact: true,
          email: true,
          name: true,
        },
        send_sms_hash: false,
        remember_customer: false,
        notes: {
          quantity: String(formData.quantity),
          attendeeNames: fullAttendees.map((a) => a.name).join(", "),
        },
        theme: {
          color: "#ec4899",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response: any) => {
          try {
            setLoading(true);

            // 4. Cryptographically verify payment on server & save tickets
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                quantity: formData.quantity,
                attendees: fullAttendees,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            const generatedTicketId =
              verifyData.ticketId || generateShortTicketId();

            const ticketIdsList =
              verifyData.ticketIds && verifyData.ticketIds.length > 0
                ? verifyData.ticketIds.join(",")
                : generatedTicketId;

            // 5. Route to success page for direct ticket display & PDF download
            router.push(
              `/success?ticket_id=${encodeURIComponent(
                generatedTicketId
              )}&ticket_ids=${encodeURIComponent(
                ticketIdsList
              )}&payment_id=${encodeURIComponent(
                response.razorpay_payment_id
              )}&order_id=${encodeURIComponent(
                response.razorpay_order_id
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
          } catch (verifyErr: any) {
            console.error("Payment verification error:", verifyErr);
            setErrorMessage(
              verifyErr.message || "Payment verification failed. Please contact event support."
            );
            setLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", (failRes: any) => {
        console.error("Payment failed:", failRes);
        setErrorMessage(
          failRes?.error?.description || "Payment was cancelled or failed. Please try again."
        );
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Payment initialization error:", err);
      setErrorMessage(
        err.message || "Failed to initialize payment gateway. Please try again."
      );
      setLoading(false);
    }
  };

  const handleQuantitySelect = (newQty: number) => {
    setFormData((prev) => ({ ...prev, quantity: newQty }));
    const neededExtra = Math.max(0, newQty - 1);
    setExtraAttendees((prev) => {
      const next = [...prev];
      while (next.length < neededExtra) {
        next.push({ name: "", email: "", phone: "" });
      }
      return next.slice(0, neededExtra);
    });
    setErrorMessage("");
  };

  return (
    <section id="register" className="py-8 sm:py-16 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-3.5 sm:px-6">
        <div className="relative rounded-3xl bg-[#0b101b]/95 border border-white/[0.08] shadow-2xl overflow-hidden backdrop-blur-2xl">
          {/* Subtle gradient bar at top */}
          <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />

          <div className="p-4 sm:p-8 md:p-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.07]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[11px] font-bold mb-2 border border-pink-500/20">
                  <Sparkles className="w-3 h-3" />
                  JHOOM &apos;26 • Dance Fest cum Dandiya Night
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  Book Your Fest &amp; Dandiya Pass
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Early bird passes available for 1, 2, and 5 attendees with special group discounts!
                </p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-[#070b13] border border-white/[0.06] text-left sm:text-right min-w-[140px] flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Early Bird Offer
                  </p>
                  <div className="flex items-baseline gap-1.5 sm:justify-end">
                    <span className="text-sm sm:text-base text-slate-500 line-through font-semibold">
                      ₹399
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      ₹299
                      <span className="text-xs font-normal text-slate-400 ml-1">/ person</span>
                    </p>
                  </div>
                </div>
                <span className="inline-block sm:block text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mt-0.5">
                  ⚡ Save ₹100 • 0% Fee
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-bold">Unable to proceed</p>
                  <p className="text-rose-400/90 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {demoNotice && (
              <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs sm:text-sm animate-in fade-in duration-200">
                <Loader2 className="w-5 h-5 shrink-0 text-amber-400 animate-spin mt-0.5" />
                <div>
                  <p className="font-bold">Simulating Checkout</p>
                  <p className="text-amber-400/90 mt-0.5">{demoNotice}</p>
                </div>
              </div>
            )}

            {/* Mode Switcher Banner (Live vs Direct Test Mode) */}
            <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-[#070b13] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${isTestModeActive ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Mode:</span>
                    <span className={`text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isTestModeActive
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}>
                      {isTestModeActive ? "⚡ Free Test Mode (Payment Bypassed)" : "💳 Live Razorpay Payment"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isTestModeActive
                      ? "Form bharte hi direct verified tickets aur QR codes generate ho jayenge (No money deducted)."
                      : "Form submit par live Razorpay payment gateway screen open hogi."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTestModeActive((prev) => !prev)}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5 ${
                  isTestModeActive
                    ? "bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-purple-500/20"
                    : "bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-amber-500/20"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isTestModeActive ? "Switch to Live Razorpay" : "Switch to Free Test Mode"}</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Pass Tier Selection (1, 2, 5 Passes) */}
              <div className="p-4 rounded-2xl bg-[#070b13] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-emerald-400" />
                    <span>Select Pass Package</span>
                  </label>
                  <span className="text-xs font-bold text-pink-400">
                    {formData.quantity} {formData.quantity === 1 ? "Pass" : "Passes"} = ₹{totalAmount}
                  </span>
                </div>

                {/* 3 Tier Options: 1, 2, 5 */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3">
                  {PASS_TIERS.map((tier) => {
                    const isSelected = formData.quantity === tier.quantity;
                    return (
                      <button
                        key={tier.quantity}
                        type="button"
                        onClick={() => handleQuantitySelect(tier.quantity)}
                        className={`relative pt-5 sm:pt-6 pb-2.5 sm:pb-3 px-1 sm:px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[110px] sm:min-h-[125px] ${
                          isSelected
                            ? "bg-gradient-to-b from-pink-500/20 via-purple-600/20 to-indigo-600/30 border-pink-500 text-white shadow-lg shadow-pink-500/20 scale-[1.02]"
                            : "bg-slate-900/70 border-white/[0.08] hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        {tier.savings > 0 && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md whitespace-nowrap z-10 pointer-events-none">
                            {tier.tag}
                          </span>
                        )}
                        <span className="text-[11px] sm:text-sm font-bold leading-tight">
                          {tier.name}
                        </span>
                        <div className="my-1 sm:my-1.5">
                          <span className="text-base sm:text-2xl font-black text-white">
                            ₹{tier.price}
                          </span>
                          {tier.savings > 0 && (
                            <span className="block text-[10px] text-slate-400 line-through">
                              ₹{tier.originalPrice}
                            </span>
                          )}
                        </div>
                        <span className="text-[9.5px] sm:text-[11px] font-semibold text-slate-400">
                          {tier.quantity} {tier.quantity === 1 ? "Person" : "Persons"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-400">
                  Each pass generates a separate single-entry QR code for each individual.
                </p>
              </div>

              {/* Attendee 1 (Primary Booker) Card */}
              <div className="p-4 sm:p-6 rounded-2xl bg-[#070b13] border border-white/[0.06] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                      1
                    </span>
                    <span className="text-sm font-bold text-white">
                      Attendee 1 {formData.quantity > 1 ? "(Primary Booker)" : ""}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Main Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      Full Legal Name <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-purple-400" />
                      Email Address <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      placeholder="e.g. priya.sharma@gmail.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-pink-400" />
                    Mobile / WhatsApp Number <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-400">
                    Used for entry verification &amp; festival notifications.
                  </p>
                </div>
              </div>

              {/* Additional Attendees Fields (when quantity > 1) */}
              {formData.quantity > 1 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Users className="w-4 h-4" />
                    <span>
                      Additional Attendee Details ({formData.quantity - 1} more {formData.quantity === 2 ? "person" : "people"})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 -mt-1">
                    Enter the names of accompanying guests so each person gets their own pass with their name printed.
                  </p>

                  <div className="space-y-3">
                    {extraAttendees.map((att, idx) => (
                      <div
                        key={idx}
                        className="p-4 sm:p-5 rounded-2xl bg-[#070b13] border border-white/[0.06] space-y-3 animate-in fade-in duration-200"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center border border-purple-500/30">
                              {idx + 2}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-white">
                              Attendee {idx + 2} Pass
                            </span>
                          </div>
                          <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-semibold">
                            Individual QR Pass
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
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
                              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-pink-400" />
                              Phone Number <span className="text-slate-500 text-[10px]">(Optional)</span>
                            </label>
                            <input
                              type="tel"
                              inputMode="tel"
                              placeholder="e.g. 9876543210"
                              value={att.phone}
                              onChange={(e) =>
                                handleExtraAttendeeChange(idx, "phone", e.target.value)
                              }
                              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Summary Receipt Box */}
              <div className="p-4 rounded-2xl bg-[#070b13] border border-white/[0.08] space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-dashed border-slate-800">
                  <span>
                    {formData.quantity === 1
                      ? "Single Pass (1 Person)"
                      : formData.quantity === 2
                      ? "Duo Pass (2 Persons • Save ₹49)"
                      : "Group Pass (5 Persons • Save ₹96)"}
                  </span>
                  <span className="font-semibold text-white">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-dashed border-slate-800">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Platform Convenience Fee
                  </span>
                  <span className="font-bold text-emerald-400 uppercase text-[11px]">Free (₹0)</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Total Payable
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-white">
                      ₹{totalAmount}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>256-Bit SSL</span>
                  </div>
                </div>
              </div>

              {/* Test Mode Notification Banner */}
              {isTestModeActive && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <div>
                      <p className="font-bold">Test Mode Active (Payment Bypassed)</p>
                      <p className="text-[11px] text-amber-300/80">
                        Passes &amp; QR codes will generate immediately without charging any money.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTestModeActive(false)}
                    className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 shrink-0 cursor-pointer"
                  >
                    Switch to Live
                  </button>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-xl shadow-pink-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing &amp; Generating {formData.quantity} Passes...</span>
                  </>
                ) : isTestModeActive ? (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Generate {formData.quantity > 1 ? `${formData.quantity} Passes` : "Pass"} (Test Mode • Free)</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay ₹{totalAmount} &amp; Get {formData.quantity > 1 ? `${formData.quantity} Passes` : "Pass"}</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  UPI, Cards &amp; NetBanking
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
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
