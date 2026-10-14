"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Sparkles,
  Star,
  Send,
  CheckCircle2,
  Music,
  Globe,
  Award,
  MessageSquareHeart,
  Loader2,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface FeedbackFormState {
  name: string;
  contact: string;
  college: string;
  overallRating: number;
  eventRating: number;
  websiteRating: number;
  highlights: string[];
  comments: string;
}

const RATING_LABELS: Record<number, { text: string; emoji: string }> = {
  5: { text: "Unforgettable & Mindblowing!", emoji: "🤩" },
  4: { text: "Loved It & Had Great Fun!", emoji: "🎉" },
  3: { text: "Good & Enjoyable Experience!", emoji: "👍" },
  2: { text: "Could Be Better in Some Areas", emoji: "🤔" },
  1: { text: "Needs Significant Improvement", emoji: "😔" },
};

const HIGHLIGHT_OPTIONS = [
  { id: "dandiya", label: "🪩 Dandiya Raas" },
  { id: "dance", label: "💃 Dance Face-Offs" },
  { id: "dj", label: "🎧 DJ Beats" },
  { id: "qr_entry", label: "🎟️ Fast QR Gate Entry" },
  { id: "website", label: "⚡ Website Pass Booking" },
  { id: "venue", label: "🏛️ Venue Atmosphere" },
  { id: "vibe", label: "✨ Lighting & Festive Vibe" },
];

export default function PostEventFeedback() {
  const [formData, setFormData] = useState<FeedbackFormState>({
    name: "",
    contact: "",
    college: "",
    overallRating: 5,
    eventRating: 5,
    websiteRating: 5,
    highlights: ["dandiya", "dance", "dj"],
    comments: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("taalsya_feedback_submitted");
      if (stored === "true") {
        setSubmitted(true);
      }
    }
  }, []);

  const toggleHighlight = (id: string) => {
    setFormData((prev) => {
      const exists = prev.highlights.includes(id);
      return {
        ...prev,
        highlights: exists
          ? prev.highlights.filter((h) => h !== id)
          : [...prev.highlights, id],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Please enter your full name to submit feedback.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setSubmitted(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("taalsya_feedback_submitted", "true");
      }
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      setErrorMsg(
        err.message || "Failed to submit feedback. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="feedback" className="py-10 sm:py-16 scroll-mt-16">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 space-y-8">
        {/* =================================================================== */}
        {/* 1. Grand Thank You Banner Card */}
        {/* =================================================================== */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#110f22] via-[#0c101d] to-[#070b13] border border-pink-500/20 shadow-2xl overflow-hidden backdrop-blur-2xl">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Top highlight gradient strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />

          <div className="p-6 sm:p-10 text-center space-y-6">
            {/* Heart Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs sm:text-sm font-bold shadow-md">
              <Heart className="w-4 h-4 fill-pink-400 text-pink-400 animate-pulse" />
              <span>JHOOM &apos;26 • Successfully Concluded</span>
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Thank You, BHU! ❤️
              </h2>
              <p className="text-base sm:text-xl font-bold bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                Hope You Enjoyed the Magic of JHOOM &apos;26! 🪩✨
              </p>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                The high-octane dance battles, energetic dhol beats, vibrant ethnic attire, and non-stop Dandiya Raas made Swatantrata Bhawan burst with life! On behalf of the entire <strong>Taalasya Dance Society</strong>, we extend our deepest gratitude to every dancer, attendee, volunteer, and supporter who made this night unforgettable.
              </p>
            </div>

            {/* Key Event Recap Stats Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-2xl mx-auto pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/[0.06] text-center">
                <Users className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                <p className="text-xs sm:text-sm font-black text-white">600+ Guests</p>
                <p className="text-[10px] text-slate-400">Packed House</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/[0.06] text-center">
                <Music className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-xs sm:text-sm font-black text-white">5+ Hours</p>
                <p className="text-[10px] text-slate-400">Non-stop Celebration</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/[0.06] text-center">
                <MapPin className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <p className="text-xs sm:text-sm font-black text-white">Swatantrata</p>
                <p className="text-[10px] text-slate-400">Bhawan, BHU</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/[0.06] text-center">
                <Sparkles className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs sm:text-sm font-black text-white">100% Digital</p>
                <p className="text-[10px] text-slate-400">Fast QR Entry</p>
              </div>
            </div>

            {/* Instagram Call to Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={EVENT_CONFIG.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-lg shadow-pink-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>Follow {EVENT_CONFIG.instagramHandle} for Photos &amp; Aftermovie</span>
              </a>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. Interactive Feedback Section */}
        {/* =================================================================== */}
        <div className="relative rounded-3xl bg-[#0b101b]/95 border border-white/[0.08] shadow-2xl overflow-hidden backdrop-blur-2xl">
          <div className="p-5 sm:p-8 md:p-10">
            {submitted ? (
              /* Success Confirmation View */
              <div className="py-8 text-center space-y-5 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Thank You for Your Feedback! 🙏
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Your valuable thoughts and suggestions mean the world to us. They help the Taalasya Dance Society make our cultural events and digital pass experience even better for <strong>JHOOM &apos;27</strong>!
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={EVENT_CONFIG.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-md hover:opacity-95 transition-all"
                  >
                    <InstagramIcon className="w-4 h-4" />
                    <span>Watch Highlights on Instagram</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      if (typeof window !== "undefined") {
                        localStorage.removeItem("taalsya_feedback_submitted");
                      }
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Edit / Submit Another Response
                  </button>
                </div>
              </div>
            ) : (
              /* Main Feedback Form */
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Form Header */}
                <div className="pb-6 border-b border-white/[0.07] space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-[11px] font-bold border border-purple-500/20">
                    <MessageSquareHeart className="w-3.5 h-3.5 text-pink-400" />
                    Event &amp; Website Experience Survey
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Share Your Honest Feedback
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    How was your experience with the event, the dance vibe, and the website? We would love to hear from you!
                  </p>
                </div>

                {/* Question 1: Overall Experience Rating */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      1. Overall JHOOM &apos;26 Experience <span className="text-pink-500">*</span>
                    </label>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      {RATING_LABELS[hoverRating || formData.overallRating]?.emoji}{" "}
                      {RATING_LABELS[hoverRating || formData.overallRating]?.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= (hoverRating ?? formData.overallRating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, overallRating: star }))
                          }
                          className="p-1.5 sm:p-2 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                          title={`${star} Star`}
                        >
                          <Star
                            className={`w-7 h-7 sm:w-9 sm:h-9 transition-colors ${
                              active
                                ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                : "text-slate-600 hover:text-slate-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question 2: Two-column Category Ratings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Event Rating */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-purple-400" />
                        The Event (Dance, Music &amp; Dandiya)
                      </span>
                      <span className="text-xs font-black text-purple-300">
                        {formData.eventRating} / 5
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, eventRating: star }))
                          }
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= formData.eventRating
                                ? "text-purple-400 fill-purple-400"
                                : "text-slate-700 hover:text-slate-500"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Website Rating */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-pink-400" />
                        The Website &amp; Pass Booking
                      </span>
                      <span className="text-xs font-black text-pink-300">
                        {formData.websiteRating} / 5
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, websiteRating: star }))
                          }
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= formData.websiteRating
                                ? "text-pink-400 fill-pink-400"
                                : "text-slate-700 hover:text-slate-500"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Question 3: What did you enjoy the most? */}
                <div className="space-y-2.5">
                  <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    2. What was your favorite part of the evening? (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {HIGHLIGHT_OPTIONS.map((item) => {
                      const selected = formData.highlights.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleHighlight(item.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            selected
                              ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-200 shadow-sm"
                              : "bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                          }`}
                        >
                          <span>{item.label}</span>
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question 4: Comments, Memories & Suggestions */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquareHeart className="w-4 h-4 text-purple-400" />
                    3. Your Comments, Memories &amp; Suggestions for JHOOM &apos;27
                  </label>
                  <textarea
                    rows={4}
                    value={formData.comments}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, comments: e.target.value }))
                    }
                    placeholder="Tell us about your favorite moment, the music, the crowd, or anything we can improve for next year..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all resize-y"
                  />
                </div>

                {/* Question 5: Attendee Details */}
                <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                  <p className="text-xs font-bold text-slate-200">
                    Your Details (Name is required)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Your Full Name <span className="text-pink-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Email or Instagram Handle
                      </label>
                      <input
                        type="text"
                        placeholder="@username or email"
                        value={formData.contact}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, contact: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        College / Faculty
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Science, BHU"
                        value={formData.college}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, college: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-xl shadow-pink-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting Your Feedback...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Your JHOOM &apos;26 Feedback</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
