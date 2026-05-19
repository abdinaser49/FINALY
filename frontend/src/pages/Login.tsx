import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, KeyRound, CheckCircle2 } from "lucide-react";
import heroImage from "@/assets/hero-salon.jpg";
import logo from "@/assets/logo.png";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

type ResetStep = "idle" | "enter-email" | "enter-otp" | "done";

const Login = () => {
  const navigate = useNavigate();

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [resetStep, setResetStep] = useState<ResetStep>("idle");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  /* ─── LOGIN ─────────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      const userEmail = data.user?.email?.toLowerCase() || "";
      const isAdmin = ADMIN_EMAILS.includes(userEmail);
      const { data: staffData } = await supabase
        .from("staff")
        .select("*")
        .eq("email", userEmail)
        .maybeSingle();
      const isStaff = !!staffData || isAdmin;
      if (isAdmin) {
        toast.success("Welcome back, Admin!");
        navigate("/dashboard");
      } else if (isStaff) {
        toast.success("Welcome back, Staff!");
        navigate("/dashboard");
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    }
  };

  /* ─── STEP 1: Send OTP to Gmail ─────────────────────────── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: resetEmail.trim(),
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("✅ 6-digit code sent! Check your Gmail.");
      setResetStep("enter-otp");
    }
  };

  /* ─── STEP 2: Verify OTP + Set new password ──────────────── */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim()) return;
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);

    // Verify OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: resetEmail.trim(),
      token: otp.trim(),
      type: "magiclink",
    });

    if (verifyError) {
      setLoading(false);
      toast.error("Invalid or expired code. Please try again.");
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success("🎉 Password reset successfully!");
      setResetStep("done");
      // Sign out so user logs in fresh
      await supabase.auth.signOut();
    }
  };

  const goBackToLogin = () => {
    setResetStep("idle");
    setResetEmail("");
    setOtp("");
    setNewPassword("");
  };

  /* ─── RENDER ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex">
      {/* Left side – image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={heroImage} alt="Salon" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/40" />
        <div className="absolute inset-0 flex items-end p-12">
          <div className="flex flex-col gap-6">
            <Link to="/" className="self-start active:scale-95 transition-transform">
              <img src={logo} alt="Qurux Dumar Logo" className="h-24 w-auto" />
            </Link>
            <div>
              <h2 className="font-display text-4xl text-cream mb-2">Qurux Dumar Beauty Salon</h2>
              <p className="text-cream/70 font-body">Dashboard Management System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side – form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <AnimatePresence mode="wait">

            {/* ── LOGIN FORM ── */}
            {resetStep === "idle" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 text-center">
                  <Link to="/" className="inline-block active:scale-95 transition-transform mb-6">
                    <img src={logo} alt="Logo" className="h-20 w-auto" />
                  </Link>
                  <h1 className="font-display text-3xl mb-2">Welcome back</h1>
                  <p className="text-muted-foreground font-body text-sm">
                    Enter your email and password to login
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block font-body text-sm mb-1.5 text-muted-foreground">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 border border-border bg-background font-body text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-body text-sm text-muted-foreground">Password</label>
                      <button
                        type="button"
                        onClick={() => { setResetStep("enter-email"); setResetEmail(email); }}
                        className="text-xs text-primary hover:underline font-semibold transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-border bg-background font-body text-sm focus:outline-none focus:border-primary transition-colors pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground py-3 font-body text-sm tracking-[0.15em] uppercase disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Login
                  </button>
                </form>

                <p className="mt-6 text-center font-body text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:underline">
                    Create an account
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP 1: Enter Email ── */}
            {resetStep === "enter-email" && (
              <motion.div
                key="enter-email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="font-display text-3xl mb-2">Forgot Password?</h1>
                  <p className="text-muted-foreground font-body text-sm">
                    We'll send a 6-digit code to your Gmail
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block font-body text-sm mb-1.5 text-muted-foreground">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full p-3 border border-border bg-background font-body text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="your@gmail.com"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-primary-foreground py-3 font-body text-sm tracking-[0.15em] uppercase disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Send Code to Gmail
                    </button>
                    <button
                      type="button"
                      onClick={goBackToLogin}
                      className="w-full flex items-center justify-center gap-2 py-2 font-body text-sm text-muted-foreground uppercase hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Login
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 2: Enter OTP + New Password ── */}
            {resetStep === "enter-otp" && (
              <motion.div
                key="enter-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <KeyRound className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="font-display text-3xl mb-2">Enter Code</h1>
                  <p className="text-muted-foreground font-body text-sm">
                    Check your Gmail for the 6-digit code
                  </p>
                  <p className="text-primary font-semibold text-xs mt-1">{resetEmail}</p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block font-body text-sm mb-1.5 text-muted-foreground">
                      6-Digit Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full p-3 border border-border bg-background font-body text-sm focus:outline-none focus:border-primary transition-colors text-center tracking-[0.5em] text-lg font-black"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm mb-1.5 text-muted-foreground">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 border border-border bg-background font-body text-sm focus:outline-none focus:border-primary transition-colors pr-10"
                        placeholder="Min. 6 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full bg-primary text-primary-foreground py-3 font-body text-sm tracking-[0.15em] uppercase disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Reset Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetStep("enter-email")}
                      className="w-full flex items-center justify-center gap-2 py-2 font-body text-sm text-muted-foreground uppercase hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Resend Code
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── DONE ── */}
            {resetStep === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <h1 className="font-display text-3xl mb-2">Password Reset!</h1>
                  <p className="text-muted-foreground font-body text-sm">
                    Your password has been updated successfully.
                  </p>
                </div>
                <button
                  onClick={goBackToLogin}
                  className="w-full bg-primary text-primary-foreground py-3 font-body text-sm tracking-[0.15em] uppercase hover:bg-primary/90 transition-colors"
                >
                  Back to Login
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
