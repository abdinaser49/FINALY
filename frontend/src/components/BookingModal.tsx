import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, X, Check, Sparkles, Phone, CreditCard, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Service Images (Fallback)
import hairImg from "@/assets/hair.jpg";
import nailImg from "@/assets/Nail Art1.jpg";
import facialImg from "@/assets/makeup.jpg";
import bodyImg from "@/assets/service-massage.png";
import aromaticHenna from "@/assets/henna.jpg";
import rentalHero from "@/assets/rentals_hero.png";
import dirac1 from "@/assets/dirac1.jpg";
import dirac2 from "@/assets/dirac2.jpg";
import dirac5 from "@/assets/dirac5.jpg";
import dirac6 from "@/assets/dirac6.jpg";
import dress1 from "@/assets/dress1.jpg";
import dress2 from "@/assets/dress2.jpg";
import dress3 from "@/assets/dress3.jpg";
import dress4 from "@/assets/dress4.jpg";
import dress5 from "@/assets/dress5.jpg";
import diracSt1 from "@/assets/dirac_1.png";
import diracSt2 from "@/assets/dirac_2.png";
import diracSt3 from "@/assets/dirac_3.png";
import wedding1 from "@/assets/Weddin1.jpg";
import wedding2 from "@/assets/Weddin2.jpg";
import wedding4 from "@/assets/Weddin4.png";
import henna2 from "@/assets/henna2.jpg";
import henna3 from "@/assets/henna3.jpg";
import henna4 from "@/assets/henna4.jpg";
import makeup3 from "@/assets/makeup3.jpg";
import makeup4 from "@/assets/makeup4.jpg";
import nails2 from "@/assets/Nail Art2.jpg";
import nails4 from "@/assets/Nail Art4.jpg";
import makeupCatImg from "@/assets/makeup_cat.png";

// Services with price and duration
const categories = [
  { id: "beauty", name: "Beauty & Spa", icon: "✨", image: facialImg },
  { id: "makeup", name: "Makeup Art", icon: "💄", image: makeupCatImg },
  { id: "hair", name: "Hair Styling", icon: "✂️", image: hairImg },
  { id: "nails", name: "Nail Art", icon: "💅", image: nailImg },
  { id: "rentals", name: "Dress Rentals", icon: "👗", image: rentalHero },
  { id: "henna", name: "Henna Art", icon: "🌸", image: aromaticHenna },
];

const services = [
  // Beauty
  { id: 1, category: "beauty", name: "Facial Treatment", price: 120, duration: "60–90 min", image: facialImg },
  { id: 2, category: "beauty", name: "Body & Massage", price: 100, duration: "60–120 min", image: bodyImg },
  { id: 8, category: "makeup", name: "Glam Makeup", price: 150, duration: "90 min", image: makeup3 },
  { id: 9, category: "makeup", name: "Bridal Makeup", price: 250, duration: "120 min", image: makeup4 },
  
  // Hair
  { id: 3, category: "hair", name: "Hair Styling", price: 85, duration: "60–120 min", image: hairImg },
  { id: 10, category: "hair", name: "Bridal Hair", price: 180, duration: "120 min", image: hairImg },
  
  // Nails
  { id: 4, category: "nails", name: "Nail Artistry", price: 55, duration: "45–90 min", image: nailImg },
  { id: 11, category: "nails", name: "Gel Extensions", price: 75, duration: "90 min", image: nails2 },
  { id: 12, category: "nails", name: "Manicure & Art", price: 65, duration: "60 min", image: nails4 },
  
  // Rentals - Dirac VIP and Tash
  { id: 6, category: "rentals", name: "Dirac VIP", price: 15, duration: "1 day", image: dirac1 },
  { id: 23, category: "rentals", name: "Dirac VIP", price: 80, duration: "1 day", image: dirac5 },
  { id: 24, category: "rentals", name: "Dirac VIP", price: 90, duration: "1 day", image: dirac6 },

  { id: 26, category: "rentals", name: "Tash", price: 180, duration: "1 day", image: dress1 },
  { id: 27, category: "rentals", name: "Tash", price: 190, duration: "1 day", image: dress2 },
  { id: 28, category: "rentals", name: "Tash", price: 200, duration: "1 day", image: dress3 },
  { id: 29, category: "rentals", name: "Tash", price: 210, duration: "1 day", image: dress4 },
  { id: 30, category: "rentals", name: "Tash", price: 220, duration: "1 day", image: dress5 },
  
  // Henna
  { id: 7, category: "henna", name: "Henna Session", price: 65, duration: "60–90 min", image: aromaticHenna },
  { id: 20, category: "henna", name: "Bridal Henna", price: 150, duration: "180 min", image: henna2 },
  { id: 21, category: "henna", name: "Modern Henna Art", price: 45, duration: "45 min", image: henna3 },
  { id: 22, category: "henna", name: "Traditional Patterns", price: 55, duration: "60 min", image: henna4 },
];

const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];



interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
  selectedImage?: string;
}

const BookingModal = ({ isOpen, onClose, preselectedService, selectedImage }: BookingModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(services[0]);
  const [localSelectedImage, setLocalSelectedImage] = useState<string | undefined>(selectedImage);
  const [selectedEmployee, setSelectedEmployee] = useState("Any");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("9:00 AM");
  const [endTime, setEndTime] = useState("10:00 AM");
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paid, setPaid] = useState(false);
  const [dbServices, setDbServices] = useState<any[]>(services);
  const [dbStaff, setDbStaff] = useState<any[]>([]);
  
  const bizName = localStorage.getItem('bizName') || "Qurux Dumar Salon";
  const rawPhone = localStorage.getItem('bizPhone') || "617643394";
  const cleanMerchant = rawPhone.replace(/\D/g, '').slice(-9); // Get last 9 digits as EVC merchant code
  const merchantCode = cleanMerchant || "617643394";

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || "");
      setPhone(user.user_metadata?.phone || "");
    }
  }, [user]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*');
        if (error) throw error;
        
        if (data && data.length > 0) {
           const formatted = data.map((d: any) => {
              let catId = "beauty";
              if (d.category === "Dress") catId = "rentals";
              else if (d.category === "Henna") catId = "henna";
              else if (d.name.toLowerCase().includes("hair")) catId = "hair";
              else if (d.name.toLowerCase().includes("nail") || d.name.toLowerCase().includes("manicure") || d.name.toLowerCase().includes("pedicure")) catId = "nails";
              
              return {
                 id: d.id,
                 category: catId,
                 name: d.name,
                 price: d.price,
                 duration: d.duration || "60 min",
                 image: d.image_url || ((catId === "rentals") ? rentalHero : facialImg)
              }
           });
           setDbServices(formatted);
        }
      } catch (err) {
        console.error("Error fetching services for modal:", err);
      }
    };
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('status', 'Active');
        if (error) throw error;
        setDbStaff(data || []);
      } catch (err) {
        console.error("Error fetching staff for modal:", err);
      }
    };

    if (isOpen) {
       fetchServices();
       fetchStaff();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedService && isOpen && dbServices.length > 0) {
       let found = dbServices.find(s => s.name === preselectedService);
       if (!found) {
         // Fallback map
         found = dbServices.find(s => preselectedService.toLowerCase().includes("dirac") && s.category === "rentals") || 
                 dbServices.find(s => s.category === "henna") || dbServices[0];
       }
       if (found) {
         setSelectedService(found);
         setSelectedCategoryId(found.category);
       }
       if (selectedImage) setLocalSelectedImage(selectedImage);
       setStep(2); // Jump straight to time selection!
    } else if (!isOpen) {
       setStep(1); // Reset to step 1 when closed
    }
  }, [preselectedService, isOpen, selectedImage, dbServices]);

  const resetAndClose = () => {
    setStep(1);
    setSelectedCategoryId(null);
    onClose();
  };

  const steps = [
    { id: 1, label: "Choose Service" },
    { id: 2, label: "Time" },
    { id: 3, label: "Details" },
    { id: 4, label: "Payment" },
    { id: 5, label: "Done" },
  ];

  const handleNext = () => {
    if (step === 3) {
      const nameParts = name.trim().split(/\s+/);
      if (nameParts.length < 3) {
        toast.error("Fadlan geli magaca oo saddexan (3 Magac)!");
        return;
      }
      if (!phone.trim() || phone.trim().length < 6) {
        toast.error("Fadlan geli lambarka taleefanka oo sax ah!");
        return;
      }
    }
    setStep(s => Math.min(s + 1, 5));
  };
  const handleBack = () => setStep(s => {
    if (s === 2 && !selectedCategoryId) return 1; // Basic safety
    return Math.max(s - 1, 1);
  });

  const filteredServices = selectedCategoryId 
    ? dbServices.filter(s => s.category === selectedCategoryId)
    : [];

  const handleConfirm = async () => {
    // Allow Guest Booking (user can be null)
    // Ensure we have a valid customer_id to satisfy NOT NULL constraint
    let finalCustomerIdToSubmit = user?.id || null;
    
    if (!finalCustomerIdToSubmit) {
      // Fallback: Fetch any existing profile ID to satisfy constraint for guest booking
      const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
      if (profile) finalCustomerIdToSubmit = profile.id;
    }

    const formatTimeToDb = (time12h: string) => {
      if (!time12h.includes(' ')) return time12h; // Already formatted
      let [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
      return `${hours.padStart(2, '0')}:${minutes}`;
    };
    
    const bookingData = {
      customer_id: finalCustomerIdToSubmit,
      service_id: selectedService.id,
      name: name,
      phone: phone,
      notes: notes,
      service: selectedService.name,
      booking_date: format(date, "yyyy-MM-dd"),
      start_time: formatTimeToDb(startTime),
      end_time: formatTimeToDb(endTime),
      amount: selectedService.price || 0,
      status: "pending",
      image_url: localSelectedImage || selectedService.image || null,
      category: "Online",
      notes: selectedEmployee !== 'Any' ? `${notes}\n(Assigned to: ${selectedEmployee})` : notes
    };

    try {
      const { data, error } = await supabase.from('bookings').insert([bookingData]).select();
      if (error) throw error;
      setStep(5);
      toast.success("Appointment booked!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col font-sans text-slate-700 relative border border-white/20"
      >
        
        {/* Stepper Header */}
        <div className="flex w-full border-b border-gray-100 shrink-0 bg-[#fdfbf7]/50">
          {steps.map((s) => (
            <div 
              key={s.id}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-5 gap-1.5 transition-all relative overflow-hidden",
                step >= s.id ? "text-primary" : "text-slate-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold z-10 transition-colors",
                step >= s.id ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
              )}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{s.label}</span>
              {step === s.id && (
                <motion.div layoutId="step-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
              )}
            </div>
          ))}
        </div>

        {/* Content Area - Scrollable */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} className="space-y-10">
                {!selectedCategoryId ? (
                  <div className="space-y-8">
                    <div className="text-center space-y-2">
                       <h3 className="text-3xl font-display font-bold text-charcoal">Choose a Category</h3>
                       <p className="text-gray-400 text-sm">Select the type of service you are looking for</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className="group flex flex-col items-center gap-4 transition-all"
                        >
                          <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden border-2 border-slate-100 group-hover:border-primary group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all shadow-lg">
                            <img src={cat.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={cat.name} />
                          </div>
                          <span className="font-bold text-xs uppercase tracking-widest text-charcoal/70 group-hover:text-primary">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <button 
                         onClick={() => setSelectedCategoryId(null)}
                         className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
                       >
                         <ArrowLeft className="w-3 h-3" /> Back to Categories
                       </button>
                       <h3 className="text-2xl font-display font-bold text-charcoal">Select Service</h3>
                       <div className="w-20" /> {/* Spacer */}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {filteredServices.map((svc) => (
                         <button
                           key={svc.id}
                           onClick={() => {
                             setSelectedService(svc);
                             setLocalSelectedImage(svc.image);
                             handleNext();
                           }}
                           className={cn(
                             "group text-left p-6 rounded-[2rem] border-2 transition-all flex items-center gap-4",
                             selectedService.id === svc.id ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" : "border-slate-100 hover:border-primary/50 hover:bg-slate-50"
                           )}
                         >
                           <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                             <img src={svc.image} className="w-full h-full object-cover" alt={svc.name} />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="font-bold text-charcoal">{svc.name}</p>
                             <p className="text-primary font-bold text-sm">${svc.price}</p>
                           </div>
                         </button>
                       ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} className="space-y-10">
                <div className="text-center space-y-2">
                   <h3 className="text-3xl font-display font-bold text-charcoal">Appointment Time</h3>
                   <p className="text-gray-400 text-sm">When would you like to visit us?</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-4">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Date</label>
                      <div className="bg-[#fdfbf7] p-2 rounded-[2.5rem] border border-gray-100 shadow-inner">
                        <Calendar 
                          mode="single" 
                          selected={date} 
                          onSelect={(d) => d && setDate(d)} 
                          className="w-full"
                        />
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Available Slots</label>
                        <div className="grid grid-cols-3 gap-3">
                           {timeSlots.map((slot) => (
                             <button
                               key={slot}
                               onClick={() => setStartTime(slot)}
                               className={cn(
                                 "py-4 rounded-2xl font-bold text-xs transition-all border-2",
                                 startTime === slot ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-charcoal border-slate-100 hover:border-primary/50"
                               )}
                             >
                               {slot}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Prefered Employee</label>
                        <select 
                          value={selectedEmployee}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="w-full p-5 bg-[#fdfbf7] border-0 rounded-2xl text-sm font-bold text-charcoal focus:ring-2 focus:ring-primary outline-none"
                        >
                           <option value="Any">Any Available Specialist</option>
                           {dbStaff.map(s => (
                             <option key={s.id} value={s.name}>{s.name} ({s.role || 'Stylist'})</option>
                           ))}
                        </select>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} className="space-y-10 max-w-xl mx-auto">
                <div className="text-center space-y-2">
                   <h3 className="text-3xl font-display font-bold text-charcoal">Personal Details</h3>
                   <p className="text-gray-400 text-sm">Almost there! Just need your contact info</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Maryam Cali Axmed"
                        className="w-full p-5 bg-[#fdfbf7] border-0 rounded-2xl text-sm font-bold text-charcoal focus:ring-2 focus:ring-primary outline-none shadow-inner" 
                      />
                   </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                       <div className="relative">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold border-r pr-3 mr-3">+252</div>
                          <input 
                           type="tel" 
                           value={phone} 
                           onChange={e => setPhone(e.target.value)}
                           placeholder="61XXXXXXX"
                           className="w-full p-5 pl-20 bg-[#fdfbf7] border-0 rounded-2xl text-sm font-bold text-charcoal focus:ring-2 focus:ring-primary outline-none shadow-inner" 
                         />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Additional Notes (Optional)</label>
                       <textarea 
                         value={notes} 
                         onChange={e => setNotes(e.target.value)}
                         placeholder="Any special requests or details..."
                         className="w-full p-5 bg-[#fdfbf7] border-0 rounded-2xl text-sm font-bold text-charcoal focus:ring-2 focus:ring-primary outline-none shadow-inner h-24 resize-none" 
                       />
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-lg shadow-black/5">
                    <img src={localSelectedImage} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-charcoal">{selectedService.name}</h4>
                    <p className="text-xs text-gray-400 font-medium">{format(date, "PPP")} at {startTime}</p>
                    <p className="text-primary font-bold text-lg mt-1">${selectedService.price}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} className="space-y-10 flex flex-col items-center py-4">
                <div className="text-center space-y-2">
                   <h3 className="text-3xl font-display font-bold text-charcoal">Secure Payment</h3>
                   <p className="text-gray-400 text-sm">Please pay to merchant {merchantCode} (EVC Plus)</p>
                </div>

                <div className="w-full max-w-sm bg-zinc-950 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                   <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors" />
                   <div className="flex justify-between items-center opacity-60">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase tracking-widest">Merchant</span>
                        <span className="text-xs font-bold">{bizName.toUpperCase()}</span>
                      </div>
                      <Sparkles className="w-5 h-5 text-primary" />
                   </div>
                   
                   <div className="text-center space-y-2 relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Payment Code</span>
                      <div className="text-4xl font-mono font-bold tracking-[0.2em] text-primary">{merchantCode}</div>
                   </div>

                   <button 
                     onClick={() => setPaid(true)} 
                     className={cn(
                       "w-full py-5 rounded-3xl font-bold uppercase tracking-widest text-[10px] transition-all relative z-10", 
                       paid ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-primary hover:text-white"
                     )}
                   >
                      {paid ? "✔ Payment Verified" : "I have sent the payment"}
                   </button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="flex flex-col items-center py-10 space-y-10">
                <div className="relative">
                   <motion.div 
                     initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10 }}
                     className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 z-10 relative"
                   >
                     <Check className="w-12 h-12 stroke-[3px]" />
                   </motion.div>
                   <div className="absolute -inset-4 bg-emerald-100 rounded-full blur-xl opacity-50 animate-pulse" />
                </div>

                <div className="text-center space-y-2">
                   <h3 className="text-4xl font-display font-bold text-charcoal">Mabruuk!</h3>
                   <p className="text-gray-400 font-medium">Your appointment has been successfully scheduled.</p>
                </div>

                <div className="w-full max-w-sm bg-[#fdfbf7] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/50">
                   <div className="p-8 space-y-6 text-sm">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                         <span className="text-gray-400 font-medium">Service</span>
                         <span className="font-bold text-charcoal">{selectedService.name}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                         <span className="text-gray-400 font-medium">Date</span>
                         <span className="font-bold text-charcoal">{format(date, "PPP")}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                         <span className="text-gray-400 font-medium">Time</span>
                         <span className="font-bold text-charcoal">{startTime}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-inner">
                         <span className="text-gray-400 font-medium text-xs">Total Amount</span>
                         <span className="font-black text-primary text-xl">${selectedService.price}</span>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={resetAndClose} 
                  className="bg-charcoal text-white px-16 py-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-2xl shadow-gray-300 hover:scale-105 active:scale-95 transition-all"
                >
                  Close Window
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        {step < 5 && (
          <div className="p-8 sm:p-10 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
            <button 
              onClick={handleBack}
              disabled={step === 1 && !selectedCategoryId}
              className="group flex items-center gap-2 text-slate-400 hover:text-charcoal px-4 py-2 disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Previous</span>
            </button>
                   <div className="flex items-center gap-2">
                       {step < 4 ? (
                         <button 
                          onClick={handleNext}
                          disabled={step === 1 && !selectedCategoryId}
                          className="bg-primary text-white px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          Next Step
                        </button>
                       ) : (
                         <button 
                          onClick={handleConfirm}
                          className={cn(
                            "px-12 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95",
                            paid ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20" : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                          )}
                        >
                          Confirm & Complete Booking
                        </button>
                       )}
                    </div>
          </div>
        )}
        
        {/* Close button X */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-charcoal transition-colors z-50 p-2 hover:bg-slate-100 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

      </motion.div>
    </div>
  );
};

export default BookingModal;

// Simple internal component for cleaner structure
const ArrowLeft = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
