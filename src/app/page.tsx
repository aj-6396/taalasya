import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import RegistrationForm from "@/components/RegistrationForm";
import EventDetails from "@/components/EventDetails";
import Footer from "@/components/Footer";
import StickyMobileBar from "@/components/StickyMobileBar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <HeroBanner />
        <RegistrationForm />
        <EventDetails />
      </main>
      <Footer />
      <StickyMobileBar />
    </div>
  );
}
