import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShoppingBag, ArrowLeft, Phone, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RentalBookingModal from "@/components/RentalBookingModal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Local Assets Fallback
import dress1 from "@/assets/Weddin1.jpg";
import dress2 from "@/assets/Weddin2.jpg";
import dress3 from "@/assets/suit.jpg";
import dress4 from "@/assets/suit1.jpg";
import dress5 from "@/assets/dress2.jpg";
import dress6 from "@/assets/dress3.jpg";
import dress7 from "@/assets/dress4.jpg";
import dress8 from "@/assets/dress5.jpg";
import dirac1 from "@/assets/dirac.jpg";
import dirac2 from "@/assets/dirac1.jpg";
import dirac3 from "@/assets/dirac2.jpg";
import dirac4 from "@/assets/dirac5.jpg";
import dirac5 from "@/assets/dirac6.jpg";

const fallbackDresses = [
  { id: 101, name: "Luxury Somali Dirac", image_url: dirac1, price: 15, tag: "Somali Style" },
  { id: 102, name: "Traditional Bridal Dirac", image_url: dirac2, price: 15, tag: "Classic" },
  { id: 103, name: "Modern Pattern Dirac", image_url: dirac3, price: 15, tag: "New" },
  { id: 104, name: "Elegant Evening Dirac", image_url: dirac4, price: 15, tag: "Trending" },
  { id: 105, name: "Royal Silk Dirac", image_url: dirac5, price: 15, tag: "Premium" },
  { id: 1, name: "Royal Lace Wedding Gown", image_url: dress1, price: 200, tag: "Hot" },
  { id: 2, name: "Classic Pearl Dress", image_url: dress2, price: 180, tag: "Elegant" },
  { id: 3, name: "Classic Groom Suit", image_url: dress3, price: 150, tag: "New" },
  { id: 4, name: "Modern Elegance Suit", image_url: dress4, price: 160, tag: "Premium" },
  { id: 5, name: "Princess Silhouette", image_url: dress5, price: 250, tag: "Luxury" },
  { id: 6, name: "Crystal Embellished", image_url: dress6, price: 280, tag: "Exclusive" },
  { id: 7, name: "Satin Mermaid Dress", image_url: dress7, price: 190, tag: "Classic" },
  { id: 8, name: "Bohemian Chiffon", image_url: dress8, price: 160, tag: "Trending" },
];

const Rentals = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDress, setSelectedDress] = useState<string>();
  const [selectedImage, setSelectedImage] = useState<string>();
  const [selectedId, setSelectedId] = useState<string | number>();
  const [rentalList, setRentalList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('category', 'Dress')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setRentalList(data);
      } else {
        setRentalList(fallbackDresses);
      }
    } catch (error: any) {
      console.error("Error fetching rentals:", error.message);
      setRentalList(fallbackDresses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchRentals();
  }, []);

  const openBooking = (name?: string, img?: string, id?: string | number) => {
    if (authLoading) return;
    if (!user) {
      toast.error("Please login or register to book an appointment.");
      navigate("/login");
      return;
    }
    setSelectedDress(name);
    setSelectedImage(img);
    setSelectedId(id);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans selection:bg-primary/20">
      <Navbar onBookNow={() => openBooking()} />
      
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
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-4">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-primary text-sm font-bold uppercase tracking-widest">Premium Collection</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-medium text-charcoal mb-6">
                Bridal & Suit <span className="text-primary font-serif italic">Rentals</span>
              </h1>
              <p className="text-gray-500 font-body text-lg leading-relaxed">
                Elevate your special day with our curated selection of high-end wedding gowns and professional suits. Luxury within reach.
              </p>
            </div>
            <div className="flex gap-4">
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Quick Inquiries</p>
                    <p className="text-sm font-bold text-charcoal">+252 61 7643394</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {rentalList.map((dress, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              key={dress.id}
              className="group"
            >
              <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-zinc-100 mb-6 shadow-lg shadow-gray-200/50 group-hover:shadow-2xl group-hover:shadow-primary/10 transition-all duration-500">
                <img 
                  src={dress.image_url} 
                  alt={dress.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-black text-zinc-900 shadow-sm uppercase tracking-wider border border-white/20">
                    {dress.tag || dress.category || "Rental"}
                  </span>
                </div>
                <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-primary transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                   <button 
                     onClick={() => openBooking(dress.name, dress.image_url, dress.id)}
                     className="w-full bg-white text-zinc-900 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500"
                   >
                     <ShoppingBag className="w-4 h-4" />
                     Rent Now
                   </button>
                </div>
              </div>
              <div className="space-y-2 px-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-zinc-900 text-lg uppercase tracking-tight">{dress.name}</h3>
                  <p className="text-primary font-bold text-lg">
                    {typeof dress.price === 'number' ? `$${dress.price}` : dress.price}
                    <span className="text-sm text-zinc-400 font-normal ml-0.5">/day</span>
                  </p>
                </div>
                <p className="text-zinc-400 text-sm font-black uppercase tracking-widest mt-1">Available for hire</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="bg-charcoal rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
           
           <h2 className="text-4xl md:text-5xl font-display font-medium text-white mb-8 relative z-10">
              Can't find a specific <span className="text-primary italic">design?</span>
           </h2>
           <p className="text-gray-400 max-w-xl mb-12 relative z-10">
              Contact us for bespoke bridal requests or to see our offline catalog. We have over 50+ designs in our physical showroom.
           </p>
           <button className="bg-primary hover:bg-white hover:text-charcoal text-white px-12 py-5 rounded-2xl font-bold uppercase tracking-wider transition-all relative z-10 shadow-xl shadow-primary/20">
              Contact Showroom
           </button>
        </div>
      </div>

      <Footer />

      <RentalBookingModal 
        isOpen={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          setSelectedDress(undefined);
          setSelectedImage(undefined);
        }}
        dressName={selectedDress}
        dressImage={selectedImage}
        dressPrice={rentalList.find(d => d.name === selectedDress)?.price}
        dressId={selectedId}
      />
    </div>
  );
};

export default Rentals;
