import { motion } from "framer-motion";
import { MessageCircle, Zap, ShieldCheck, HeartPulse } from "lucide-react";

const SupportSection = () => {
  const openWhatsApp = () => {
    const phoneNumber = "252617643394";
    const message = "Hello! I have a question about your services and would like to chat with an expert.";
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-48 -mb-48" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="bg-charcoal rounded-[3rem] p-12 md:p-20 shadow-2xl shadow-charcoal/20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-white text-sm font-bold uppercase tracking-[0.2em]">Instant Support</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-white leading-[1.1]">
                Need Help? <br />
                <span className="text-primary italic font-serif">Chat with us</span> Live
              </h2>
              
              <p className="text-gray-400 text-lg font-body leading-relaxed max-w-lg">
                Have a specific question or want a custom beauty package? Talk directly with our salon experts right now. We are online and ready to assist you.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-white font-medium text-sm">Professional Advice</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                    <HeartPulse className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-white font-medium text-sm">Personalized Care</span>
                </div>
              </div>

              <button
                onClick={openWhatsApp}
                className="group inline-flex items-center gap-4 bg-primary hover:bg-white hover:text-charcoal text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                Start Live Chat
              </button>
            </motion.div>

            {/* Right: Visual Element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative hidden lg:block"
            >
              <div className="aspect-square bg-gradient-to-tr from-primary/20 to-transparent rounded-[4rem] flex items-center justify-center p-12 border border-white/5">
                <div className="relative w-full h-full bg-white/5 rounded-[3rem] backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center mb-6 shadow-2xl relative">
                     <MessageCircle className="w-12 h-12" />
                     <div className="absolute top-0 right-0 w-6 h-6 bg-green-500 border-4 border-charcoal rounded-full animate-pulse" />
                  </div>
                  <h4 className="text-white text-2xl font-display font-bold mb-2">Expert Online</h4>
                  <p className="text-gray-400 text-sm">Typical response time: <br/><strong>Under 2 minutes</strong></p>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 transform rotate-6">
                 <p className="text-xs font-bold text-primary tracking-widest uppercase">Direct Talk</p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default SupportSection;
