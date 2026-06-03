import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShoppingBag, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Henna Images
import henna1 from "@/assets/henna.jpg";
import henna2 from "@/assets/henna1.jpg";
import henna3 from "@/assets/henna2.jpg";
import henna4 from "@/assets/henna3.jpg";
import henna5 from "@/assets/henna4.jpg";

interface BridalRentalsSectionProps {}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const defaultHenna = [
  { img: henna1, label: "Bridal Full Hand", price: "$65" },
  { img: henna2, label: "Intricate Arabic Design", price: "$45" },
  { img: henna3, label: "Simple Floral Pattern", price: "$30" },
  { img: henna4, label: "Traditional Somali Style", price: "$55" },
  { img: henna5, label: "Minimalist Henna", price: "$25" },
];

const BridalRentalsSection = () => {
  const navigate = useNavigate();
  const [dbHenna, setDbHenna] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHenna = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('category', 'Henna')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDbHenna(data && data.length > 0 ? data.map(i => ({ img: i.image_url, label: i.name, price: `$${i.price}` })) : defaultHenna);
      } catch (err) {
        console.error("Error fetching henna:", err);
        setDbHenna(defaultHenna);
      } finally {
        setLoading(false);
      }
    };
    fetchHenna();
  }, []);

  const hennaImages = dbHenna;

  return (
    <section id="bridal" className="py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary text-sm font-bold uppercase tracking-widest">Master Artistry</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-display font-medium text-charcoal mb-8 leading-[1.1]">
              Exquisite Henna <br />
              <span className="text-primary font-serif italic italic-shadow">Art Designs</span>
            </h2>
            <p className="text-gray-500 font-body text-lg leading-relaxed max-w-xl">
              From traditional bridal patterns to modern minimalist strokes, our master artists bring your vision to life with organic, rich-stain henna.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 shrink-0 shadow-2xl shadow-gray-100 rounded-[2.5rem] bg-[#fdfbf7] p-8 border border-gray-100"
          >
             <div className="space-y-4">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Want to see Dresses?</p>
                <h4 className="text-xl font-display font-bold text-charcoal pr-8">Premium Rental <br/>Collection</h4>
                <button 
                  onClick={() => navigate("/rentals")}
                  className="bg-primary hover:bg-charcoal text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  View Rentals
                </button>
             </div>
          </motion.div>
        </div>

        {/* Masonry-style Gallery */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
          {hennaImages.map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              key={idx}
              className="break-inside-avoid group relative rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm"
            >
              <img 
                src={item.img} 
                alt={item.label} 
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex justify-between items-end mb-4">
                      <div>
                        <h3 className="text-white font-display font-bold text-xl mb-1">{item.label}</h3>
                     </div>
                     <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                        <Eye className="w-5 h-5" />
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom spacer instead of CTA */}
        <div className="mt-20 flex flex-col items-center">
        </div>

      </div>
    </section>
  );
};

export default BridalRentalsSection;
