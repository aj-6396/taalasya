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
      title: "Dandiya Raas & Live Dhol",
      desc: "Traditional Garba circles, pounding live dhol beats, vibrant festive attire, and non-stop Dandiya Raas under the stars.",
      color: "text-pink-400 bg-pink-500/10",
    },
    {
      icon: Sparkles,
      title: "Stage Dance Battles & Showcases",
      desc: "High-voltage choreography face-offs, urban street battles, and synchronized dance crew performances.",
      color: "text-purple-400 bg-purple-500/10",
    },
    {
      icon: Users,
      title: "Classical & Semi-Classical Fusion",
      desc: "Spellbinding Kathak, Bharatanatyam, and folk expressions presented by the talented dancers of Taalasya BHU.",
      color: "text-indigo-400 bg-indigo-500/10",
    },
    {
      icon: Award,
      title: "DJ Finale & Festive Dance Floor",
      desc: "Cap off the night with an open DJ dance floor mixing Bollywood anthems, EDM, and high-energy Garba tracks.",
      color: "text-emerald-400 bg-emerald-500/10",
    },
  ];

  const faqs = [
    {
      q: "What is JHOOM '26?",
      a: "JHOOM '26 is the annual Dance Fest cum Dandiya Night organized by Taalasya Dance Society, the official dance club of Banaras Hindu University (BHU). Taking place on 13th October 2026 at Swatantrata Bhawan, it unites campus dance lovers for an unforgettable cultural evening.",
    },
    {
      q: "Are Dandiya sticks provided?",
      a: "Yes! Festive Dandiya sticks will be available at designated event counters inside the venue, or you can bring your own pair. Traditional ethnic attire (Kurtas, Chaniya Cholis) is warmly encouraged!",
    },
    {
      q: "How will I receive my entry pass?",
      a: "Immediately upon successful payment, your official digital pass with a unique QR code is displayed on the confirmation screen. You will be prompted to save it as a PDF or screenshot it for gate entry.",
    },
    {
      q: "Who can attend the event?",
      a: "Students of Banaras Hindu University, faculty, alumni, and invited guests with a valid digital QR pass and a matching university/government photo ID are welcome.",
    },
  ];

  return (
    <section id="details" className="py-16 sm:py-24 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Features / Highlights */}
        <div>
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-pink-400">
              Taalasya Dance Society BHU
            </h2>
            <p className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              What to Expect at JHOOM &apos;26
            </p>
            <p className="text-sm text-slate-400">
              Curated performances by the finest dancers and choreographers of BHU.
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
                BHU Campus Venue
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {EVENT_CONFIG.venue}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Located within the iconic Banaras Hindu University campus in Varanasi. Equipped with world-class stage lighting, acoustic sound systems, and designated entry lanes.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-400" />
                  <span>Gates open at 05:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  <span>Near BHU Main Gate (Lanka)</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center">
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Need Directions to Venue?</p>
                <p className="text-xs text-slate-400 mt-1">
                  Navigate directly to Swatantrata Bhavan on Google Maps
                </p>
              </div>
              <a
                href="https://maps.google.com/?q=Swatantrata+Bhavan+BHU+Varanasi"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Open in Google Maps
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
                  <HelpCircle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
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
