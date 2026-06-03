import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import img1 from "@/assets/pic1.jpg";
import img2 from "@/assets/pic2.jpg";

const AboutUsSection = () => {
  const features = [
    "Highly Experienced Professionals",
    "Modern & Natural Products",
    "Peaceful Environment Exclusive to Women",
    "Quality Services & Care"
  ];

  return (
    <section id="about" className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left: Images */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="flex gap-4">
              <div className="w-1/2 mt-12">
                <img src={img1} alt="Spa treatment" className="w-full h-[300px] object-cover rounded-[2rem] shadow-lg border-4 border-white" />
              </div>
              <div className="w-1/2 relative">
                <img src={img2} alt="Facial treatment" className="w-full h-[350px] object-cover rounded-[2rem] shadow-xl border-4 border-white" />
                <div className="absolute -inset-4 border-2 border-[#E87A5D] rounded-[2.5rem] opacity-20 -z-10"></div>
              </div>
            </div>
            
            {/* Experience badge */}
            <div className="absolute -bottom-6 -left-2 md:-left-6 bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 z-10 border border-gray-50">
              <div className="w-12 h-12 bg-[#E87A5D]/10 rounded-full flex items-center justify-center text-[#E87A5D] font-bold text-xl">
                10+
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Years Of Experience</p>
                <p className="text-xs text-gray-500">Unrivaled Service</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Text */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E87A5D]/10 rounded-full">
              <span className="text-[#E87A5D] text-sm font-bold uppercase tracking-widest">About Qurux Dumar</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-medium text-[#112232] leading-tight mb-6">
              The Best Place for Women's Care & <span className="text-[#E87A5D]">Beauty</span>
            </h2>
            
            <p className="text-gray-500 font-body leading-relaxed text-sm md:text-base">
              Qurux Dumar Spa & Salon is an exclusive center dedicated to women, offering comprehensive beauty services including skincare, hair styling, body massage, and nail care (Manicure & Pedicure).
            </p>
            
            <p className="text-gray-500 font-body leading-relaxed text-sm md:text-base mb-6">
              Our goal is to provide you with a peaceful environment to relax, and receive high-quality natural services. We have professionals with extensive experience in bringing out your natural beauty.
            </p>

            <ul className="grid sm:grid-cols-2 gap-4 pb-4">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E87A5D]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[#E87A5D]" />
                  </span>
                  <span className="text-gray-800 font-medium text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="pt-6 border-t border-gray-100 flex items-center gap-8">
              <div className="flex gap-4 items-center">
                 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                   {/* Phone icon using SVG directly */}
                   <svg className="w-5 h-5 text-[#112232]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                   </svg>
                 </div>
                 <div>
                   <p className="text-xs text-gray-500 mb-0.5 font-medium uppercase tracking-wider">Contact Us</p>
                   <p className="text-lg font-bold text-[#E87A5D]">+252 61 7643394</p>
                 </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
