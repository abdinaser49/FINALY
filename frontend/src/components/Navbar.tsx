import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, LogIn, User, Settings, LogOut, ChevronDown, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

interface NavbarProps {
  onBookNow: () => void;
}

const Navbar = ({ onBookNow }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email?.toLowerCase() || "") : false;
  const [profileOpen, setProfileOpen] = useState(false);
  const { signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top",
      scrolled ? "bg-background/95 backdrop-blur-md shadow-md h-16 sm:h-20" : "bg-transparent h-20 sm:h-24"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img src={logo} alt="Qurux Dumar Logo" className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-110" />
          <span className={cn(
            "font-display text-lg sm:text-2xl transition-colors drop-shadow-sm whitespace-nowrap max-md:text-[14px] max-[380px]:text-[12px] max-[340px]:hidden",
            scrolled ? "text-primary" : "text-[#112232]"
          )}>Qurux Dumar</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <div className="hidden md:flex items-center gap-7 lg:gap-8 font-body text-sm">
            <button onClick={() => navigate("/rentals")} className={cn(
               "transition-colors font-medium text-[15px]",
               scrolled ? "text-foreground hover:text-primary" : "text-[#112232] hover:text-[#E87A5D]"
            )}>Rentals</button>

            <button onClick={() => scrollTo("services")} className={cn(
               "transition-colors font-medium text-[15px]",
               scrolled ? "text-foreground hover:text-primary" : "text-[#112232] hover:text-[#E87A5D]"
            )}>Services</button>

            <button onClick={() => scrollTo("about")} className={cn(
               "transition-colors font-medium text-[15px]",
               scrolled ? "text-foreground hover:text-primary" : "text-[#112232] hover:text-[#E87A5D]"
            )}>About Us</button>

            <button onClick={() => navigate("/team")} className={cn(
               "transition-colors font-medium text-[15px]",
               scrolled ? "text-foreground hover:text-primary" : "text-[#112232] hover:text-[#E87A5D]"
            )}>Team</button>

            <button onClick={() => navigate("/contact")} className={cn(
               "transition-colors font-medium text-[15px]",
               scrolled ? "text-foreground hover:text-primary" : "text-[#112232] hover:text-[#E87A5D]"
            )}>Contact</button>

            {/* Added a vertical divider for auth links if needed */}
            <div className="w-px h-4 bg-gray-300 mx-2 hidden lg:block" />
            {user ? (
               <div className="relative">
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={cn(
                      "flex items-center gap-3 pl-5 border-l border-gray-200/50 transition-all hover:opacity-90 group",
                      scrolled ? "text-foreground" : "text-[#112232]"
                    )}
                  >
                     <div className="text-right hidden lg:block tracking-tight">
                        <p className="text-sm font-black uppercase tracking-[0.15em] text-zinc-500 mb-0.5">Welcome,</p>
                        <p className={cn("text-sm font-black truncate max-w-[120px]", scrolled ? "text-foreground" : "text-[#112232]")}>
                           {user.user_metadata?.full_name || "User"}
                        </p>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <div className="w-11 h-11 rounded-full border-[3px] border-white shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[#F5E6EC] flex items-center justify-center text-[#7E1F4A] font-black text-lg transition-transform group-hover:scale-105">
                           {user.user_metadata?.avatar_url ? (
                             <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
                           ) : (
                             (user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()
                           )}
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", profileOpen && "rotate-180")} />
                     </div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
                          onClick={() => setProfileOpen(false)}
                        />
                        <motion.div 
                          initial={{ x: "100%" }}
                          animate={{ x: 0 }}
                          exit={{ x: "100%" }}
                          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                          className="fixed top-0 right-0 h-screen w-[320px] sm:w-[380px] bg-white shadow-2xl border-l border-zinc-100 z-[100] flex flex-col"
                        >
                           <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                              <h3 className="font-display font-black text-xl text-[#112232]">My Profile</h3>
                              <button onClick={() => setProfileOpen(false)} className="p-2 rounded-full hover:bg-zinc-200 transition-colors">
                                 <X className="w-5 h-5 text-zinc-600" />
                              </button>
                           </div>
                           
                           <div className="p-8 flex flex-col items-center border-b border-zinc-100 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-[#F5E6EC]/60 to-transparent z-0" />
                              
                              <div className="w-28 h-28 rounded-full border-[6px] border-white shadow-xl overflow-hidden bg-[#F5E6EC] flex items-center justify-center text-[#7E1F4A] font-black text-5xl mb-5 z-10">
                                {user.user_metadata?.avatar_url ? (
                                  <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                  (user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()
                                )}
                              </div>
                              <h2 className="text-2xl font-black text-[#112232] text-center z-10 leading-tight">
                                {user.user_metadata?.full_name || "User"}
                              </h2>
                              <p className="text-[13px] font-bold text-zinc-400 mt-2 text-center bg-white/80 px-4 py-1.5 rounded-full z-10">
                                {user.email}
                              </p>
                              {user.user_metadata?.phone && (
                                <p className="text-[13px] font-bold text-zinc-400 mt-2 text-center bg-white/80 px-4 py-1.5 rounded-full z-10">
                                  📞 {user.user_metadata.phone}
                                </p>
                              )}
                           </div>

                           <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto">
                               <Link to="/profile" onClick={() => { setProfileOpen(false); sessionStorage.setItem('profileTab', 'history'); }} className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-zinc-50 transition-colors font-bold text-sm text-[#112232] group">
                                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Calendar className="w-5 h-5 text-zinc-600" /> 
                                  </div>
                                  My Bookings
                               </Link>

                               <Link to="/profile" onClick={() => { setProfileOpen(false); sessionStorage.setItem('profileTab', 'info'); }} className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-zinc-50 transition-colors font-bold text-sm text-[#112232] group">
                                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Settings className="w-5 h-5 text-zinc-600" /> 
                                  </div>
                                  Profile Settings
                               </Link>

                               {isAdmin && (
                                 <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-primary/5 transition-colors font-bold text-sm text-primary group">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                                      <LayoutDashboard className="w-5 h-5 text-primary" /> 
                                    </div>
                                    Admin Dashboard
                                 </Link>
                               )}
                           </div>
                           
                           <div className="p-4 border-t border-zinc-100 flex items-center justify-between gap-3 bg-white">
                               <button 
                                 onClick={async () => { 
                                   try {
                                     await signOut(); 
                                   } catch (err) {
                                     console.error("Logout error:", err);
                                   }
                                   setProfileOpen(false); 
                                   navigate("/", { replace: true }); 
                                 }}
                                 className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[1.5rem] bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors font-black text-xs uppercase tracking-[0.2em] active:scale-95"
                               >
                                  <LogOut className="w-4 h-4" /> Sign Out
                               </button>
                               <a 
                                 href="https://wa.me/252617643394" 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0"
                               >
                                 <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                               </a>
                           </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
               </div>
            ) : (
              <Link
                to="/login"
                className={cn(
                  "flex items-center gap-2 transition-colors font-semibold",
                  scrolled ? "text-foreground hover:text-primary" : "text-gray-800 hover:text-[#E87A5D]"
                )}
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>

          {!user && (
             <div className="md:hidden shrink-0">
                <Link to="/login" className="p-2 text-primary flex items-center justify-center">
                  <User className="w-5 h-5" />
                </Link>
             </div>
          )}

          {user && (
            <button 
              onClick={() => setProfileOpen(true)} 
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full border-2 border-white shadow-sm overflow-hidden bg-[#F5E6EC] flex items-center justify-center text-[#7E1F4A] font-black text-sm active:scale-95 transition-transform"
            >
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
              ) : (
                (user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()
              )}
            </button>
          )}

          <button
            onClick={onBookNow}
            className={cn(
              "px-3 sm:px-8 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] uppercase transition-all shadow-md active:scale-95 font-bold shrink-0",
              scrolled 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-[#E87A5D] text-white hover:bg-[#d66a4f]"
            )}
          >
            Book Now
          </button>

          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className={cn(
              "md:hidden p-2 rounded-full transition-colors",
              scrolled ? "text-primary hover:bg-primary/10" : "text-[#112232] hover:bg-black/5"
            )}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile-only visible quick-nav (Horizontal Scrolling) */}
      <div className="md:hidden bg-background/80 backdrop-blur-md border-b border-border/50 h-14 flex items-center overflow-x-auto no-scrollbar px-6 gap-8 sticky top-0 shadow-sm">
          <button onClick={() => navigate("/rentals")} className="whitespace-nowrap text-sm font-black uppercase tracking-[0.15em] text-charcoal opacity-80 active:text-primary">Rentals</button>
          <button onClick={() => scrollTo("services")} className="whitespace-nowrap text-sm font-black uppercase tracking-[0.15em] text-charcoal opacity-80 active:text-primary">Services</button>
          <button onClick={() => scrollTo("about")} className="whitespace-nowrap text-sm font-black uppercase tracking-[0.15em] text-charcoal opacity-80 active:text-primary">About</button>
          <button onClick={() => navigate("/team")} className="whitespace-nowrap text-sm font-black uppercase tracking-[0.15em] text-charcoal opacity-80 active:text-primary">Team</button>
          <button onClick={() => navigate("/contact")} className="whitespace-nowrap text-sm font-black uppercase tracking-[0.15em] text-charcoal opacity-80 active:text-primary">Contact</button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6">
              <div className="space-y-4">
                <button onClick={() => { navigate("/rentals"); setMobileOpen(false); }} className="flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-lg">Rentals</button>
                <button onClick={() => { scrollTo("services"); setMobileOpen(false); }} className="flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-lg">Services</button>
                <button onClick={() => { scrollTo("about"); setMobileOpen(false); }} className="flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-lg">About Us</button>
                <button onClick={() => { navigate("/team"); setMobileOpen(false); }} className="flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-lg">Team</button>
                <button onClick={() => { navigate("/contact"); setMobileOpen(false); }} className="flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-lg">Contact</button>
              </div>
              
              <div className="pt-6 border-t border-border">
                {user ? (
                  <>
                    <Link 
                      to="/profile"
                      onClick={() => { setMobileOpen(false); sessionStorage.setItem('profileTab', 'history'); }}
                      className="flex items-center justify-between w-full py-4 text-charcoal font-black uppercase tracking-widest text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-zinc-400" />
                        My Bookings
                      </div>
                    </Link>

                    <Link 
                      to="/profile"
                      onClick={() => { setMobileOpen(false); sessionStorage.setItem('profileTab', 'info'); }}
                      className="flex items-center justify-between w-full py-4 text-charcoal font-black uppercase tracking-widest text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-zinc-400" />
                        My Profile Settings
                      </div>
                    </Link>

                    {isAdmin && (
                      <Link 
                        to="/dashboard" 
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 w-full py-4 text-primary font-black uppercase tracking-widest text-xs"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Admin Dashboard
                      </Link>
                    )}

                    <button 
                      onClick={async () => {
                        setMobileOpen(false);
                        try {
                          await signOut();
                        } catch (err) {
                          console.error("Logout error:", err);
                        }
                        navigate("/", { replace: true });
                      }}
                      className="flex items-center gap-3 w-full py-4 text-rose-500 font-black uppercase tracking-widest text-xs"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 w-full py-4 text-charcoal font-black uppercase tracking-widest text-xs"
                  >
                    <LogIn className="w-5 h-5" />
                    Login Account
                  </Link>
                )}

                <button
                  onClick={() => { onBookNow(); setMobileOpen(false); }}
                  className="w-full mt-4 bg-primary text-primary-foreground py-5 rounded-[1.5rem] text-sm tracking-[0.2em] uppercase font-black shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  Book Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
