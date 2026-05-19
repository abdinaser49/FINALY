import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

import stylist1 from "@/assets/staff.jpeg";
import stylist2 from "@/assets/staf2.jpeg";
import stylist3 from "@/assets/staf3.jpeg";
import stylist4 from "@/assets/st4.jpeg";

const defaultStylists = [
  { name: "Deeqa Axmed", role: "Senior Hair Stylist", image: stylist1 },
  { name: "Layla Cali", role: "Nail Artist", image: stylist2 },
  { name: "Hodan Maxamed", role: "Skin Care Expert", image: stylist3 },
  { name: "Sahra Cabdi", role: "Henna & Hair Removal Expert", image: stylist4 },
];

const fallbackImages = [stylist1, stylist2, stylist3, stylist4];

const StylistsSection = () => {
  const [stylists, setStylists] = useState<any[]>(defaultStylists);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('status', 'Active');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedStaff = data.map((staff: any, index) => ({
            name: staff.name || staff.full_name || "Specialist",
            role: staff.role || "Beauty Specialist",
            image: staff.avatar_url || fallbackImages[index % fallbackImages.length]
          }));
          setStylists(formattedStaff);
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
      }
    };

    fetchStaff();
  }, []);

  return (
    <section className="py-24 md:py-32 bg-[#fdfbf7]" id="team">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="font-serif text-[#e91e63] text-4xl md:text-5xl font-medium mb-4">Our Professional Team</h2>
          <div className="w-24 h-[1px] bg-[#e91e63]/30 mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {stylists.map((stylist, i) => (
            <motion.div
              key={i} // Using index as key since names might duplicate dynamically
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center group cursor-pointer"
            >
              <div className="relative overflow-hidden mb-8 aspect-[3/4] rounded-sm shadow-sm group-hover:shadow-xl transition-shadow duration-500">
                <img
                  src={stylist.image}
                  alt={stylist.name}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
              </div>
              
              <h3 className="font-serif text-2xl text-slate-800 font-medium mb-2 group-hover:text-[#e91e63] transition-colors duration-300">
                {stylist.name}
              </h3>
              
              <p className="text-[#e91e63] font-sans text-xs font-bold uppercase tracking-[0.1em]">
                {stylist.role}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StylistsSection;
