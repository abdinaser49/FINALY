import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Camera, ChevronLeft, Loader2, User, Phone, Mail, Lock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import BookingModal from "@/components/BookingModal";

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    email: "",
    gender: "Female",
    avatar_url: ""
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // 1. First try to get from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setProfile({
            full_name: data.full_name || user.user_metadata?.full_name || "",
            phone: data.phone || user.user_metadata?.phone || "",
            email: user.email || "",
            gender: user.user_metadata?.gender || "Female",
            avatar_url: data.avatar_url || user.user_metadata?.avatar_url || ""
          });
        } else {
          // 2. If no profile record, fall back to metadata
          setProfile({
            full_name: user.user_metadata?.full_name || "",
            phone: user.user_metadata?.phone || "",
            email: user.email || "",
            gender: user.user_metadata?.gender || "Female",
            avatar_url: user.user_metadata?.avatar_url || ""
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const updates: any = {
        data: { 
          full_name: profile.full_name,
          phone: profile.phone,
          gender: profile.gender,
          avatar_url: profile.avatar_url
        }
      };

      if (profile.email && profile.email !== user?.email) {
        updates.email = profile.email;
      }
      // If phone is different from what's stored in user identity
      if (profile.phone && profile.phone !== user?.phone) {
        updates.phone = profile.phone;
      }
      
      if (password) {
        if (password !== confirmPassword) {
           toast.error("Passwords do not match!");
           setUpdating(false);
           return;
        }
        updates.password = password;
      }

      const { data: { user: updatedUser }, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      if (user?.id) {
        // 1. Update/Create profile record
        await supabase.from('profiles').upsert({
          user_id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        // 2. Also update 'customers' table if this user is a customer
        // We match by the CURRENT user's email
        if (user.email) {
           await supabase.from('customers').update({
             name: profile.full_name,
             phone: profile.phone
           }).eq('email', user.email);
        }
      }

      toast.success("Profile updated successfully!");
      if (password || profile.email !== user?.email || profile.phone !== user?.phone) {
         toast.info("If you changed email, phone, or password, please check for confirmation messages.");
      }
      
      // Update local state if updatedUser is returned
      if (updatedUser) {
        setProfile({
          full_name: updatedUser.user_metadata?.full_name || "",
          phone: updatedUser.user_metadata?.phone || "",
          email: updatedUser.email || "",
          gender: updatedUser.user_metadata?.gender || "Female",
          avatar_url: updatedUser.user_metadata?.avatar_url || ""
        });
      }

      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success("Photo uploaded!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar onBookNow={() => setIsBookingOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 text-zinc-400 mb-8 font-bold text-xs uppercase tracking-widest">
           <Link to="/" className="hover:text-primary flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-3 h-3" /> Home
           </Link>
           <span>/</span>
           <span className="text-zinc-600">Profile Settings</span>
        </div>

        <h1 className="text-5xl font-display font-black text-[#4B0E3D] mb-12 tracking-tight">Profile Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           {/* Profile Card */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-zinc-200/50 border border-white"
           >
              <form onSubmit={handleUpdate} className="space-y-8">
                 {/* Avatar Header */}
                 <div className="flex items-center gap-8 mb-12">
                   <div className="relative group">
                     <div className="w-32 h-32 rounded-full overflow-hidden border-[6px] border-white shadow-2xl relative z-10 transition-transform group-hover:scale-105">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                             <User className="w-12 h-12" />
                          </div>
                        )}
                        {loading && (
                           <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
                              <Loader2 className="w-6 h-6 text-primary animate-spin" />
                           </div>
                        )}
                     </div>
                     <button 
                       type="button" 
                       onClick={() => document.getElementById('avatar-input')?.click()}
                       className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-zinc-400 hover:text-primary transition-all z-20 border border-zinc-100"
                     >
                        <Camera className="w-5 h-5" />
                     </button>
                     <input type="file" id="avatar-input" className="hidden" accept="image/*" onChange={handleFileUpload} />
                   </div>
                   <div>
                     <h2 className="text-3xl font-display font-bold text-charcoal">{profile.full_name || "User"}</h2>
                     <button type="button" onClick={() => document.getElementById('avatar-input')?.click()} className="text-[10px] font-black uppercase tracking-widest text-primary mt-2 flex items-center gap-2 hover:underline">
                        <Camera className="w-3 h-3" /> Upload New Photo
                     </button>
                   </div>
                 </div>

                 {/* Fields */}
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Full Name</label>
                       <input 
                         type="text" 
                         value={profile.full_name} 
                         onChange={e => setProfile({...profile, full_name: e.target.value})}
                         className="w-full p-5 bg-[#FAFAFA] border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold shadow-inner outline-none transition-all"
                       />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Phone</label>
                          <input 
                            type="text" 
                            value={profile.phone} 
                            onChange={e => setProfile({...profile, phone: e.target.value})}
                            className="w-full p-5 bg-[#FAFAFA] border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold shadow-inner outline-none transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email</label>
                          <input 
                            type="email" 
                            value={profile.email}
                            onChange={e => setProfile({...profile, email: e.target.value})}
                            className="w-full p-5 bg-[#FAFAFA] border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold shadow-inner outline-none transition-all"
                          />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Gender</label>
                       <div className="flex gap-4">
                          {["Female", "Male"].map(g => (
                            <button
                              key={g} type="button"
                              onClick={() => setProfile({...profile, gender: g})}
                              className={cn(
                                "flex-1 flex items-center justify-between p-5 rounded-2xl border-2 transition-all font-bold text-sm",
                                profile.gender === g ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-[#FAFAFA] text-zinc-400"
                              )}
                            >
                               {g}
                               <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", profile.gender === g ? "border-primary bg-primary" : "border-zinc-200")}>
                                  {profile.gender === g && <CheckCircle className="w-3 h-3 text-white" />}
                               </div>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-zinc-100">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Change Password</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <input 
                            type="password" 
                            placeholder="New Password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-5 bg-[#FAFAFA] border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold shadow-inner outline-none transition-all"
                          />
                          <input 
                            type="password" 
                            placeholder="Confirm Password" 
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full p-5 bg-[#FAFAFA] border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold shadow-inner outline-none transition-all"
                          />
                       </div>
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   disabled={updating}
                   className="w-full py-6 bg-[#ED8A6F] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mt-10"
                 >
                    {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Profile"}
                 </button>
              </form>
           </motion.div>

           {/* Second Card (Live Preview) */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.1 }}
             className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-zinc-200/50 border border-white hidden md:block"
           >
              <div className="flex items-center gap-8 mb-12">
                 <div className="w-32 h-32 rounded-full overflow-hidden border-[6px] border-white shadow-2xl relative">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                         <User className="w-12 h-12" />
                      </div>
                    )}
                 </div>
                 <div>
                   <h2 className="text-3xl font-display font-bold text-[#4B0E3D]">{profile.full_name || "User Name"}</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2">Live Preview Card</p>
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Contact Details</p>
                    <div className="flex flex-col gap-3">
                       <div className="flex items-center gap-3 text-sm font-bold text-zinc-600">
                          <Mail className="w-4 h-4 text-primary/40" /> {profile.email || 'Email not set'}
                       </div>
                       <div className="flex items-center gap-3 text-sm font-bold text-zinc-600">
                          <Phone className="w-4 h-4 text-primary/40" /> {profile.phone || 'No phone number'}
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Preferences</p>
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-600">
                       <CheckCircle className="w-4 h-4 text-emerald-500" /> Gender: {profile.gender}
                    </div>
                 </div>

                 <div className="p-8 mt-4 rounded-3xl bg-gradient-to-br from-[#4B0E3D] to-[#83215D] text-white overflow-hidden relative">
                    <div className="relative z-10">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Membership Status</p>
                       <h4 className="text-xl font-display font-bold">Qurux Dumar Member</h4>
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                 </div>
              </div>
           </motion.div>
        </div>
      </main>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  );
};

export default Profile;
