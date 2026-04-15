import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  signInWithPopup,
  googleProvider,
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertCircle, RefreshCw, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup";
type Step = "credentials" | "otp";

function getFirebaseError(code: string): string {
  switch (code) {
    case "auth/unauthorized-domain":
      return "Domain not authorized. Add it to Firebase Console.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    default:
      return "Authentication failed. Please try again.";
  }
}

// --- Desktop Login (Old Style) ---
function DesktopLogin({ props }: any) {
  const { mode, setMode, step, setStep, email, setEmail, password, setPassword, showPassword, setShowPassword, otp, setOtp, isLoading, resendCooldown, handleSignUp, handleSignIn, handleGoogleSignIn, handleResend, handleOtpChange, handleOtpKeyDown, handleOtpPaste, otpRefs }: any = props;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] opacity-[0.04]" />
      </div>

      <AnimatePresence mode="wait">
        {step === "credentials" ? (
          <motion.div key="credentials" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="w-full max-w-sm z-10">
            <Card className="border-border bg-card/90 shadow-2xl">
              <CardHeader className="space-y-3 pb-5 text-center">
                <div className="mx-auto w-12 h-12 flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">SPHN Online | Student Exam Portal</h1>
                  <CardDescription className="mt-1 text-sm">Secure Academic Assessment Platform</CardDescription>
                  <p className="mt-2 text-sm text-muted-foreground">Welcome to SPHN Online, your trusted platform for SPHN tests and exams. Access secure student assessments, track your progress, and achieve academic excellence with our comprehensive exam portal. Whether you're taking SPHN exams or preparing for tests, our platform ensures a smooth and reliable experience.</p>
                </div>
                <div className="flex rounded-lg border border-border bg-muted/30 p-1 gap-1">
                  {["signin", "signup"].map((m) => (
                    <button key={m} onClick={() => setMode(m as Mode)} className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {m === "signin" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={mode === "signup" ? handleSignUp : handleSignIn} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={isLoading}>{isLoading ? <RefreshCw className="animate-spin" /> : "Continue"}</Button>
                </form>
                <div className="relative flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
                <Button variant="outline" className="w-full h-11" onClick={handleGoogleSignIn} disabled={isLoading}>Continue with Google</Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="otp" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm z-10">
            <Card className="border-border bg-card/90 shadow-2xl">
              <CardContent className="pt-6 space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold">Check your email</h2>
                  <p className="text-sm text-muted-foreground">We sent a code to {email}</p>
                </div>
                <div className="flex justify-center gap-2">
                  {otp.map((digit: string, i: number) => (
                    <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} onPaste={i === 0 ? handleOtpPaste : undefined} className="w-11 h-14 text-center text-xl font-bold rounded-lg border bg-background" />
                  ))}
                </div>
                <div className="text-center">
                  <button onClick={handleResend} disabled={resendCooldown > 0} className="text-sm font-medium text-primary">Resend code {resendCooldown > 0 && `(${resendCooldown}s)`}</button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEO Content Section */}
      <div className="mt-16 max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Welcome to SPHN Online</h2>
        <p className="text-lg mb-6">Your trusted platform for SPHN tests and SPHN exams. Access comprehensive student assessments with confidence.</p>
        
        <h3 className="text-2xl font-semibold mb-3">Why Choose SPHN Online?</h3>
        <p className="mb-4">SPHN Online provides a secure and reliable environment for taking SPHN exams. Our platform ensures that your SPHN test results are accurate and protected. Students can easily access their SPHN exam portal through sphn.online, making it convenient to manage academic assessments.</p>
        
        <h3 className="text-2xl font-semibold mb-3">Features of Our SPHN Exam Platform</h3>
        <ul className="text-left max-w-2xl mx-auto mb-6">
          <li>• Secure SPHN test environment with advanced authentication</li>
          <li>• Real-time monitoring for fair SPHN exams</li>
          <li>• Comprehensive dashboard for SPHN test results</li>
          <li>• Mobile-friendly access to sphn.online</li>
          <li>• 24/7 support for SPHN exam queries</li>
        </ul>
        
        <h3 className="text-2xl font-semibold mb-3">About SPHN Tests</h3>
        <p className="mb-4">SPHN tests are designed to evaluate student knowledge and skills in various academic subjects. Our SPHN exam portal at sphn.online offers a wide range of assessments to help students prepare and excel. Whether you're taking a SPHN test for certification or regular evaluation, our platform provides the tools you need for success.</p>
        
        <p className="text-sm text-muted-foreground">Visit sphn.online today to experience the best in student exam technology. Join thousands of students who trust SPHN Online for their academic assessments.</p>
      </div>
    </div>
  );
}

// --- Mobile Login (Premium Dark) ---
function MobileLogin({ props }: any) {
  const { mode, setMode, step, email, setEmail, password, setPassword, otp, isLoading, resendCooldown, handleSignUp, handleSignIn, handleGoogleSignIn, handleResend, handleOtpChange, handleOtpKeyDown, handleOtpPaste, otpRefs }: any = props;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 w-[360px] h-[360px] rounded-full" style={{ background: "radial-gradient(circle, rgba(79,126,245,0.15) 0%, transparent 70%)" }} />
      <div className="fixed bottom-0 right-0 -z-10 w-[260px] h-[260px] rounded-full translate-x-1/2 translate-y-1/2" style={{ background: "radial-gradient(circle, rgba(79,126,245,0.08) 0%, transparent 70%)" }} />

      <header className="w-full px-6 pt-14 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-xl font-bold text-foreground font-headline tracking-tight">SPHN Web Test</span>
      </header>

      <main className="flex-grow flex items-end justify-center px-4 pb-0">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="mb-8 px-1">
                  <h1 className="text-4xl font-extrabold text-foreground font-headline tracking-tighter mb-2">
                    {mode === "signin" ? "SPHN Online Login" : "Join SPHN Online"}
                  </h1>
                  <p className="text-muted-foreground text-sm">Welcome back to DataNauts Hub.</p>
                </div>

                {/* Toggle */}
                <div className="flex rounded-2xl p-1 mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {["signin", "signup"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m as any)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={mode === m ? {
                        background: "linear-gradient(135deg, #4f7ef5, #3d6bd4)",
                        color: "#fff",
                        boxShadow: "0 2px 12px rgba(79,126,245,0.4)"
                      } : { color: "rgba(255,255,255,0.4)" }}
                    >
                      {m === "signin" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                <div className="rounded-3xl p-6 pb-10 space-y-4" style={{ background: "linear-gradient(180deg, rgba(19,19,31,0.95) 0%, rgba(9,9,15,0.98) 100%)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}>
                  <form className="space-y-3" onSubmit={mode === "signup" ? handleSignUp : handleSignIn}>
                    <input
                      className="w-full rounded-xl py-4 px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      placeholder="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(79,126,245,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(79,126,245,0.1)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                      required
                    />
                    <input
                      className="w-full rounded-xl py-4 px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      placeholder="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(79,126,245,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(79,126,245,0.1)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 rounded-xl font-bold text-white transition-all duration-200 active:scale-[0.98] mt-2"
                      style={{ background: "linear-gradient(135deg, #4f7ef5 0%, #3d6bd4 100%)", boxShadow: "0 4px 20px rgba(79,126,245,0.4), 0 1px 0 rgba(255,255,255,0.1) inset" }}
                    >
                      {isLoading ? <RefreshCw className="animate-spin mx-auto w-5 h-5" /> : (mode === "signin" ? "Sign In" : "Continue")}
                    </button>
                  </form>

                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">or</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 text-foreground"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </button>

                  <div className="text-center pt-1">
                    <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-semibold text-sm">
                      {mode === "signin" ? "Don't have an account? Sign Up" : "Already registered? Login"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="pb-0"
              >
                <div className="mb-8 px-1">
                  <h1 className="text-4xl font-extrabold text-foreground font-headline tracking-tighter mb-2">Enter Code</h1>
                  <p className="text-muted-foreground text-sm">Check {email} for verification code.</p>
                </div>
                <div className="rounded-3xl p-6 pb-10 space-y-6" style={{ background: "linear-gradient(180deg, rgba(19,19,31,0.95) 0%, rgba(9,9,15,0.98) 100%)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}>
                  <div className="flex justify-center gap-2.5">
                    {otp.map((digit: string, i: number) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-14 text-center text-2xl font-bold rounded-xl transition-all duration-200 text-foreground"
                        style={{ background: "rgba(255,255,255,0.05)", border: digit ? "1px solid rgba(79,126,245,0.6)" : "1px solid rgba(255,255,255,0.08)", boxShadow: digit ? "0 0 12px rgba(79,126,245,0.2)" : "none" }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="w-full text-center text-sm font-semibold text-primary py-2 disabled:opacity-40"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* SEO Content Section */}
      <div className="mt-16 max-w-4xl mx-auto px-4 text-center pb-8">
        <h2 className="text-3xl font-bold mb-4 text-foreground">Welcome to SPHN Online</h2>
        <p className="text-lg mb-6 text-muted-foreground">Your trusted platform for SPHN tests and SPHN exams. Access comprehensive student assessments with confidence.</p>
        
        <h3 className="text-2xl font-semibold mb-3 text-foreground">Why Choose SPHN Online?</h3>
        <p className="mb-4 text-muted-foreground">SPHN Online provides a secure and reliable environment for taking SPHN exams. Our platform ensures that your SPHN test results are accurate and protected. Students can easily access their SPHN exam portal through sphn.online, making it convenient to manage academic assessments.</p>
        
        <h3 className="text-2xl font-semibold mb-3 text-foreground">Features of Our SPHN Exam Platform</h3>
        <ul className="text-left max-w-2xl mx-auto mb-6 text-muted-foreground">
          <li>• Secure SPHN test environment with advanced authentication</li>
          <li>• Real-time monitoring for fair SPHN exams</li>
          <li>• Comprehensive dashboard for SPHN test results</li>
          <li>• Mobile-friendly access to sphn.online</li>
          <li>• 24/7 support for SPHN exam queries</li>
        </ul>
        
        <h3 className="text-2xl font-semibold mb-3 text-foreground">About SPHN Tests</h3>
        <p className="mb-4 text-muted-foreground">SPHN tests are designed to evaluate student knowledge and skills in various academic subjects. Our SPHN exam portal at sphn.online offers a wide range of assessments to help students prepare and excel. Whether you're taking a SPHN test for certification or regular evaluation, our platform provides the tools you need for success.</p>
        
        <p className="text-sm text-muted-foreground">Visit sphn.online today to experience the best in student exam technology. Join thousands of students who trust SPHN Online for their academic assessments.</p>
      </div>
    </div>
  );
}

// --- Combined Login Page ---
export default function Login() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyingRef = useRef(false);
  const { data: profile, isLoading: profileLoading } = useProfile(user?.uid);

  useEffect(() => {
    // Don't redirect if user is in the middle of OTP verification
    if (user && !profileLoading && step !== "otp") { setLocation(profile ? "/dashboard" : "/register"); }
  }, [user, profile, profileLoading, setLocation, step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith("@gmail.com")) return toast({ variant: "destructive", title: "Denied", description: "Only @gmail.com accounts." });
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await fetch(`/api/auth/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setStep("otp"); setResendCooldown(60);
    } catch (err: any) { toast({ variant: "destructive", description: getFirebaseError(err.code) }); }
    finally { setIsLoading(false); }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (err: any) { toast({ variant: "destructive", description: getFirebaseError(err.code) }); }
    finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setIsLoading(true);
    try {
      const code = otpValue ?? otp.join("");
      const res = await fetch(`/api/auth/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp: code }) });
      if (!res.ok) throw new Error("Invalid or expired code. Please try again.");
      toast({ title: "Verified!", description: "Email verified successfully." });
      // Allow redirect now that OTP is confirmed
      setStep("credentials");
    } catch (err: any) { toast({ variant: "destructive", description: err.message }); }
    finally { setIsLoading(false); verifyingRef.current = false; }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[index] = digit; setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) handleVerifyOtp(next.join(""));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); handleVerifyOtp(pasted); }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try { await fetch(`/api/auth/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); setResendCooldown(60); }
    catch (err: any) { toast({ variant: "destructive", description: err.message }); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user.email?.endsWith("@gmail.com")) { await auth.signOut(); throw new Error("Only @gmail.com accounts allowed."); }
    } catch (err: any) { toast({ variant: "destructive", description: err.message || getFirebaseError(err.code) }); }
    finally { setIsLoading(false); }
  };

  if (authLoading || profileLoading) return null;

  const props = { mode, setMode, step, setStep, email, setEmail, password, setPassword, showPassword, setShowPassword, otp, setOtp, isLoading, resendCooldown, handleSignUp, handleSignIn, handleGoogleSignIn, handleResend, handleOtpChange, handleOtpKeyDown, handleOtpPaste, otpRefs };

  return isMobile ? <MobileLogin props={props} /> : <DesktopLogin props={props} />;
}
