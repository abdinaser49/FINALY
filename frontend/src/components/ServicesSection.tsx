import { motion } from "framer-motion";
import { Scissors, Sparkles, Hand, Leaf, Bath, Flower2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, any> = {
  "Hair": Scissors,
  "Makeup": Sparkles,
  "Nails": Hand,
  "Skin": Leaf,
  "Body": Bath,
  "Massage": Flower2,
  "Henna": Sparkles
};

const defaultServices = [
  { 
    name: "Haircut & Styling", 
    description: "Professional cutting, coloring, and styling services tailored to your face shape and personal style.", 
    icon_name: "Hair" 
  },
  { 
    name: "Makeup", 
    description: "Expert makeup application for weddings, parties, and special events using premium products.", 
    icon_name: "Makeup" 
  },
  { 
    name: "Manicure & Pedicure", 
    description: "Complete hand and foot care including nail shaping, cuticle treatment, and artistic polishing.", 
    icon_name: "Nails" 
  },
  { 
    name: "Skin Care", 
    description: "Rejuvenating facial treatments designed to restore your skin's natural glow and hydration.", 
    icon_name: "Skin" 
  },
  { 
    name: "Body Treatment", 
    description: "Full body exfoliation and nourishment for smooth, healthy-looking skin all year round.", 
    icon_name: "Body" 
  },
  { 
    name: "Massage", 
    description: "Relaxing body therapy to reduce stress, tension, and promote overall physical well-being.", 
    icon_name: "Massage" 
  },
];

interface ServicesSectionProps {
  onSelectService: (serviceName: string) => void;
}

const ServicesSection = ({ onSelectService }: ServicesSectionProps) => {
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .neq('category', 'Dress')
          .neq('category', 'Henna')
          .order('name', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Merge logic: Use DB services, and add default ones that aren't in DB (by name)
          const merged = [...data];
          defaultServices.forEach(ds => {
            const exists = data.some(d => d.name.toLowerCase() === ds.name.toLowerCase());
            if (!exists) {
              merged.push(ds);
            }
          });
          setDbServices(merged);
        } else {
          setDbServices(defaultServices);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        setDbServices(defaultServices);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const getIcon = (item: any) => {
    const IconComponent = iconMap[item.icon_name] || iconMap[Object.keys(iconMap).find(k => item.name.includes(k)) || "Makeup"] || Sparkles;
    return <IconComponent className="w-10 h-10 stroke-[1.5px]" />;
  };

  return (
    <section id="services" className="py-24 bg-[#fdfbf7] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="font-serif text-[#e91e63] text-4xl md:text-5xl font-medium mb-4">Our Premium Services</h2>
          
          {/* Lotus Decoration */}
          <div className="flex items-center justify-center gap-4 mb-8 text-[#e91e63]/40">
            <div className="h-[1px] w-12 bg-gradient-to-l from-current to-transparent" />
            <div className="relative">
              <Flower2 className="w-8 h-8 text-[#e91e63]" />
              <div className="absolute -inset-2 border border-current rounded-full opacity-20 scale-150" />
            </div>
            <div className="h-[1px] w-12 bg-gradient-to-r from-current to-transparent" />
          </div>

          <p className="max-w-2xl mx-auto text-slate-500 text-sm md:text-base leading-relaxed font-light italic">
            "Curated beauty treatments designed to enhance your natural elegance and restore your inner peace."
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-slate-100">
          {(dbServices.length > 0 ? dbServices : (loading ? [] : defaultServices)).map((service, i) => (
            <motion.div
              key={service.name || i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              whileHover={{ 
                y: -15,
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelectService(service.name)}
              className="group relative p-12 text-center border-r border-b border-slate-100 transition-all duration-500 cursor-pointer hover:bg-slate-50/50"
            >
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-[#e91e63] transition-transform duration-500 group-hover:scale-110">
                  {getIcon(service)}
                </div>
                
                <h3 className="font-serif text-2xl text-slate-800 font-medium group-hover:text-[#e91e63] transition-colors">
                  {service.name}
                </h3>
                
                <p className="text-slate-400 text-sm leading-relaxed max-w-[260px] mx-auto">
                  {service.description}
                </p>
                
                {/* Subtle Hover Indicator */}
                <div className="w-8 h-[1px] bg-[#e91e63] scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};


// Helper function locally since we are in a component
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default ServicesSection;

