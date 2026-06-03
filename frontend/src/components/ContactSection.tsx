import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { toast } from "sonner";

const ContactSection = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Your message has been sent successfully! We will get back to you soon.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E87A5D]/10 rounded-full mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#E87A5D]"></span>
            <span className="text-[#E87A5D] text-sm font-bold uppercase tracking-widest">Contact Us</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-medium text-[#112232] mb-4"
          >
            Have Any Questions?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 max-w-2xl mx-auto font-body"
          >
            We're here to serve you. Please reach out if you need more information or have any questions.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Address */}
              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#E87A5D]/10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-[#E87A5D]" />
                </div>
                <h3 className="text-lg font-semibold text-[#112232] mb-2 font-display">Address</h3>
                <p className="text-gray-500 text-sm font-body leading-relaxed">Makka Al Mukarama Road<br/>Mogadishu, Somalia</p>
              </div>

              {/* Phone */}
              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#E87A5D]/10 rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-[#E87A5D]" />
                </div>
                <h3 className="text-lg font-semibold text-[#112232] mb-2 font-display">Phone</h3>
                <p className="text-gray-500 text-sm font-body leading-relaxed">+252 61 7643394<br/>+252 62 111 5678</p>
              </div>

              {/* Email */}
              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#E87A5D]/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#E87A5D]" />
                </div>
                <h3 className="text-lg font-semibold text-[#112232] mb-2 font-display">Email</h3>
                <p className="text-gray-500 text-sm font-body leading-relaxed">info@quruxdumar.so<br/>booking@quruxdumar.so</p>
              </div>

              {/* Hours */}
              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#E87A5D]/10 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-[#E87A5D]" />
                </div>
                <h3 className="text-lg font-semibold text-[#112232] mb-2 font-display">Business Hours</h3>
                <p className="text-gray-500 text-sm font-body leading-relaxed">Sat - Thu: 8am - 8pm<br/>Fri: 2pm - 8pm</p>
              </div>
            </div>
            
            {/* Map removed as requested */}
          </motion.div>

          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100"
          >
            <h3 className="text-2xl font-display font-semibold text-[#112232] mb-6">Send Us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-body">Full Name</label>
                  <input required type="text" className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E87A5D]/50 focus:border-[#E87A5D] transition-all placeholder:text-gray-400 text-sm font-body" placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-body">Phone / Email</label>
                  <input required type="text" className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E87A5D]/50 focus:border-[#E87A5D] transition-all placeholder:text-gray-400 text-sm font-body" placeholder="Your contact info" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-body">Subject</label>
                <input required type="text" className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E87A5D]/50 focus:border-[#E87A5D] transition-all placeholder:text-gray-400 text-sm font-body" placeholder="How can we help?" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-body">Your Message</label>
                <textarea required rows={5} className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E87A5D]/50 focus:border-[#E87A5D] transition-all resize-none placeholder:text-gray-400 text-sm font-body" placeholder="Please write your message here..."></textarea>
              </div>
              <button type="submit" className="w-full bg-[#E87A5D] hover:bg-[#d66a4f] text-white py-3.5 rounded-xl font-bold tracking-wide transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#E87A5D]/20 active:scale-[0.98]">
                <span>Send Message</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
