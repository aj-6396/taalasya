import {
  Sparkles,
  Music,
  Users,
  Award,
  HelpCircle,
  MapPin,
  Clock,
  Compass,
} from "lucide-react";
import { EVENT_CONFIG } from "@/lib/constants";

export default function EventDetails() {
  const highlights = [
    {
      icon: Music,
      title: "Headline Performances",
      desc: "Electrifying live bands, acoustic soloists, and DJ sets under the stars.",
      color: "text-indigo-400 bg-indigo-500/10",
    },
    {
      icon: Sparkles,
      title: "Interactive Tech Exhibits",
      desc: "Experience AI creative installations, VR demo booths, and digital arts.",
      color: "text-purple-400 bg-purple-500/10",
    },
    {
      icon: Users,
      title: "Youth Conclave & Talks",
      desc: "Keynotes from visionary creators, entrepreneurs, and artists.",
      color: "text-pink-400 bg-pink-500/10",
    },
    {
      icon: Award,
      title: "Zero-Cost Entry System",
      desc: "Fast-track QR turnstile entry, no paper tickets needed.",
      color: "text-emerald-400 bg-emerald-500/10",
    },
  ];

  const faqs = [
    {
      q: "How will I receive my ticket?",
      a: "Immediately upon successful payment, your official digital pass containing your unique cryptographic QR code is emailed to you. You can also view and screenshot it on the success screen.",
    },
    {
      q: "Can I transfer my pass to a friend?",
      a: "Yes, you can forward the QR code to your guest. However, each QR code can only be scanned once at the security checkpoint.",
    },
    {
      q: "What payment methods are supported?",
      a: "All major payment methods are supported via Razorpay: UPI (GPay, PhonePe, Paytm), Credit/Debit cards, NetBanking, and Wallets.",
    },
    {
      q: "What if my phone battery dies at the gate?",
      a: "Entry marshals have access to an admin lookup console where they can verify your admission with your registered email and valid government ID.",
    },
  ];

  return (
    <section id="details" className="py-16 sm:py-24 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Features / Highlights */}
        <div>
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Why Attend TAALSYA
            </h2>
            <p className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              An Unmatched Experience
            </p>
            <p className="text-sm text-slate-400">
              Curated for creators, students, and culture enthusiasts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all hover:-translate-y-1 shadow-lg"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${item.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Venue & Directions */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                Venue & Location
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {EVENT_CONFIG.venue}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Centrally located with ample on-site parking, dedicated rapid security check-in lanes, food street pavilion, and accessibility ramps.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Entry from 03:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  <span>Metro Gate 3 (500m walk)</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Need Directions?</p>
                <p className="text-xs text-slate-400 mt-1">
                  Navigate directly using Google Maps or Apple Maps
                </p>
              </div>
              <a
                href="https://maps.google.com/?q=Bengaluru"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400">
              Got Questions?
            </h2>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-semibold text-white">{faq.q}</h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
