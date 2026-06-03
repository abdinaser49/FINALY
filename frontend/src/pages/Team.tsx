import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StylistsSection from "@/components/StylistsSection";

const TeamPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans selection:bg-primary/20">
      <Navbar onBookNow={() => navigate("/")} />
      
      {/* Hero Section */}
      <div className="pt-32 pb-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Home</span>
          </button>
          
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-4">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-primary text-sm font-bold uppercase tracking-widest">Expert Stylists</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-medium text-charcoal mb-6 leading-[1.1]">
              Our Professional <span className="text-primary font-serif italic">Team</span>
            </h1>
            <p className="text-gray-500 font-body text-lg leading-relaxed max-w-xl">
              Meet the artists behind your transformation. Our team consists of highly skilled professionals dedicated to bringing out your natural beauty and providing a peaceful salon experience.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#fdfbf7]">
        <StylistsSection />
      </div>

      <Footer />
    </div>
  );
};

export default TeamPage;
