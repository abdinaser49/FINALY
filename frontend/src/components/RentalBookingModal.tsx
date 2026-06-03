import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ShoppingBag, CheckCircle2, Phone, User, Clock, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { resolveBookingServiceId } from '@/lib/utils';

interface RentalBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dressName?: string;
  dressImage?: string;
  dressPrice?: number;
  dressId?: string | number;
}

const RentalBookingModal = ({ isOpen, onClose, dressName, dressImage, dressPrice, dressId }: RentalBookingModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: format(new Date(), "yyyy-MM-dd"),
    days: '1',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = (dressPrice || 0) * parseInt(formData.days || '1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustomerId = user?.id;
      if (!finalCustomerId) {
        const { data: p } = await supabase.from('profiles').select('id').limit(1).single();
        if (p) finalCustomerId = p.id;
      }
      const dressServiceId = dressId?.toString();
      const resolvedServiceId = await resolveBookingServiceId(supabase, dressServiceId, dressName || 'Dress Rental', {
        price: totalAmount,
        image_url: dressImage || null,
        category: 'Dress',
      });
      if (!resolvedServiceId) throw new Error('Unable to resolve a valid service id for rental booking.');

      const { error } = await supabase.from('bookings').insert([{
        customer_id: finalCustomerId,
        service_id: resolvedServiceId,
        name: formData.name,
        phone: formData.phone,
        notes: `Duration: ${formData.days} days. ${formData.notes}`,
        service: dressName ? `${dressName} (${formData.days} Days)` : "Dress Rental",
        booking_date: formData.date,
        start_time: "00:00",
        end_time: "23:59",
        amount: totalAmount,
        status: "pending",
        image_url: dressImage,
        category: "Online"
      }]);

      if (error) {
        // Fallback for if category/image_url don't exist yet
        if (error.message.includes("column")) {
           const { error: fallbackError } = await supabase.from('bookings').insert([{
            customer_id: user?.id,
            service_id: resolvedServiceId,
            name: formData.name,
            phone: formData.phone,
            notes: formData.notes,
            service: `${dressName} (${formData.days} Days Rental)`,
            booking_date: formData.date,
            start_time: "00:00",
            end_time: "23:59",
            amount: totalAmount,
            status: "pending"
          }]);
          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }

      setStep(3);
      toast.success("Your request has been submitted!");
    } catch (err: any) {
      toast.error("Sorry, an error occurred: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-black text-zinc-900 uppercase tracking-widest">Rent this Dress</h2>
                <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Rental Request Form</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            {step < 3 && (
              <div className="flex gap-4 mb-8">
                <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary' : 'bg-zinc-100'}`} />
                <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary' : 'bg-zinc-100'}`} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                    <img src={dressImage} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-zinc-900 uppercase tracking-tight">{dressName}</h3>
                    <p className="text-xl font-black text-emerald-600 tracking-tighter">${dressPrice}<span className="text-sm text-zinc-400 font-normal lowercase tracking-normal">/day</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">Date</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">Duration (Days)</label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                      <select 
                        value={formData.days}
                        onChange={(e) => setFormData({...formData, days: e.target.value})}
                        className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Day' : 'Days'}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Total Price:</span>
                  <span className="text-2xl font-black text-primary tracking-tighter">${totalAmount}</span>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-zinc-900/10"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6 text-center">
                <div className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">Your Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text" 
                        required
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-zinc-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="tel" 
                        required
                        placeholder="061XXXXXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-zinc-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">Additional Notes</label>
                    <div className="relative group">
                      <Info className="absolute left-4 top-6 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                      <textarea 
                        rows={3}
                        placeholder="Example: Preferred size or specific requirements..."
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-zinc-300 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-zinc-100 text-zinc-500 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Book Now'}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="font-display text-3xl font-black text-zinc-900 uppercase tracking-tight mb-4">Congratulations!</h3>
                <p className="text-zinc-500 text-sm font-bold max-w-[280px] mx-auto leading-relaxed">
                  Your request has been received! We will contact you at <span className="text-zinc-900">{formData.phone}</span> to confirm this rental.
                </p>
                <button  
                  onClick={onClose}
                  className="mt-12 w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
                >
                  Done
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RentalBookingModal;
