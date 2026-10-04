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

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const pricePerTicket = EVENT_CONFIG.priceInINR;
  const totalAmount = pricePerTicket * formData.quantity;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Razorpay) {
        return resolve(true);
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Math.max(1, Number(value)) : value,
    }));
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setDemoNotice(null);

    // Basic Validation
    if (!formData.name.trim()) {
      setErrorMessage("Please enter your full legal name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please enter a valid email address to receive your ticket.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 8) {
      setErrorMessage("Please enter a valid mobile number for entry verification.");
      return;
    }

    setLoading(true);

    try {
      // 1. Call /api/create-order
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

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to initialize payment order.");
      }

      // 2. Load Razorpay Checkout Script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded && !orderData.isDemo) {
        throw new Error("Unable to connect to Razorpay payment gateway. Please check your internet connection.");
      }

      // If in local demo mode without live Razorpay keys configured:
      if (orderData.isDemo || !window.Razorpay) {
        setDemoNotice(
          "Running in Test Simulation Mode. Verifying payment and generating QR pass..."
        );
        try {
          const mockPaymentId = `pay_sim_${Date.now().toString().slice(-8)}`;
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: orderData.orderId,
              razorpay_payment_id: mockPaymentId,
              razorpay_signature: "simulated_signature",
              name: formData.name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              quantity: formData.quantity,
            }),
          });
          const verifyData = await verifyRes.json();
          setTimeout(() => {
            router.push(
              `/success?ticket_id=${encodeURIComponent(
                verifyData.ticketId || `TKT-${mockPaymentId.slice(-8).toUpperCase()}`
              )}&payment_id=${encodeURIComponent(
                mockPaymentId
              )}&name=${encodeURIComponent(
                formData.name
              )}&email=${encodeURIComponent(
                formData.email
              )}&phone=${encodeURIComponent(formData.phone)}&simulated=true`
            );
          }, 1000);
        } catch {
          const mockPaymentId = `pay_sim_${Date.now().toString().slice(-8)}`;
          router.push(
            `/success?order_id=${encodeURIComponent(
              orderData.orderId
            )}&payment_id=${encodeURIComponent(
              mockPaymentId
            )}&name=${encodeURIComponent(
              formData.name
            )}&email=${encodeURIComponent(
              formData.email
            )}&phone=${encodeURIComponent(formData.phone)}&simulated=true`
          );
        }
        return;
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: EVENT_CONFIG.name,
        description: `Admission Pass (${formData.quantity} Attendee${
          formData.quantity > 1 ? "s" : ""
        }) — ${EVENT_CONFIG.theme}`,
        image: "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TAALSYA",
        order_id: orderData.orderId,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          eventName: EVENT_CONFIG.name,
          ticketQuantity: String(formData.quantity),
          society: EVENT_CONFIG.societyName,
        },
        theme: {
          color: "#ec4899",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async function (response: any) {
          // Razorpay payment completed!
          // Now verify signature on server & generate verified ticket in Supabase
          setLoading(true);
          try {
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
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(
                verifyData.error || "Payment verification failed on server."
              );
            }

            // Redirect to success page with verified ticket ID
            router.push(
              `/success?ticket_id=${encodeURIComponent(
                verifyData.ticketId
              )}&payment_id=${encodeURIComponent(
                response.razorpay_payment_id
              )}&name=${encodeURIComponent(
                formData.name
              )}&email=${encodeURIComponent(
                formData.email
              )}&phone=${encodeURIComponent(formData.phone)}`
            );
          } catch (verifyErr: any) {
            console.error("Payment verification error:", verifyErr);
            setErrorMessage(
              verifyErr.message ||
                "Payment was processed, but ticket generation encountered an issue. Please contact support with Payment ID: " +
                  response.razorpay_payment_id
            );
            setLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (response: any) {
        setErrorMessage(
          response.error?.description || "Payment was rejected or cancelled."
        );
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Order processing error:", err);
      setErrorMessage(err.message || "An unexpected error occurred. Please retry.");
      setLoading(false);
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-400" />
                    Full Name <span className="text-pink-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-purple-400" />
                    Email Address <span className="text-pink-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. priya.sharma@gmail.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Required for attendee registration & entry verification.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-pink-400" />
                    Phone / WhatsApp <span className="text-pink-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">For SMS entry backup & updates.</p>
                </div>

                {/* Ticket Quantity */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-emerald-400" />
                    Pass Quantity
                  </label>
                  <select
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Pass" : "Passes"} — ₹{pricePerTicket * num}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">Max 5 passes per booking.</p>
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Total Payable</p>
                  <p className="text-xl sm:text-2xl font-black text-white">
                    ₹{totalAmount}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">
                      (Inclusive of taxes)
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
                    <span>Connecting Razorpay Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay ₹{totalAmount} & Get JHOOM &apos;26 Pass</span>
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
