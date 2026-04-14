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
                  <CardTitle className="text-2xl font-bold tracking-tight">SPHN Web Test</CardTitle>
                  <CardDescription className="mt-1 text-sm">Secure Academic Assessment</CardDescription>
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
    </div>
  );
}

// --- Mobile Login (Academic Atelier Style) ---
function MobileLogin({ props }: any) {
  const { mode, setMode, step, setStep, email, setEmail, password, setPassword, showPassword, setShowPassword, otp, setOtp, isLoading, resendCooldown, handleSignUp, handleSignIn, handleGoogleSignIn, handleResend, handleOtpChange, handleOtpKeyDown, handleOtpPaste, otpRefs }: any = props;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="fixed top-0 right-0 -z-10 w-[400px] h-[400px] bg-sky-100/30 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
      
      <header className="w-full px-6 py-8 flex items-center gap-3">
         <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
         <span className="text-2xl font-bold text-primary font-headline tracking-tight">SPHN Web Test</span>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          <div className="bg-surface-container-lowest rounded-2xl premium-shadow p-8 border border-outline-variant/10">
            <AnimatePresence mode="wait">
              {step === "credentials" ? (
                <motion.div key="credentials" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tighter mb-2">{mode === "signin" ? "Login" : "Join"}</h1>
                    <p className="text-on-surface-variant text-sm">Welcome back to DataNauts Hub.</p>
                  </div>
                  <form className="space-y-5" onSubmit={mode === "signup" ? handleSignUp : handleSignIn}>
                    <input className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20" placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20" type="submit" disabled={isLoading}>
                      {isLoading ? <RefreshCw className="animate-spin mx-auto w-5 h-5" /> : (mode === "signin" ? "Sign In" : "Continue")}
                    </button>
                    <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/20"></div></div><div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-outline-variant bg-surface-container-lowest px-4">OR</div></div>
                    <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full bg-white border border-outline-variant/30 py-4 rounded-xl font-bold flex items-center justify-center gap-2">Continue with Google</button>
                  </form>
                  <div className="mt-8 text-center text-sm">
                    <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-bold">
                      {mode === "signin" ? "Don't have an account? Sign Up" : "Already registered? Login"}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="otp" className="text-center space-y-6">
                  <h2 className="text-2xl font-bold">Enter Code</h2>
                  <p className="text-sm text-on-surface-variant">Check {email} for verification code.</p>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit: string, i: number) => (
                      <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} className="w-10 h-14 text-center text-xl font-bold bg-surface-container-high rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
                    ))}
                  </div>
                  <button onClick={handleResend} disabled={resendCooldown > 0} className="text-primary font-bold">{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <style>{`.font-variation-fill { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>
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
  const { data: profile, isLoading: profileLoading } = useProfile(user?.uid);

  useEffect(() => {
    if (user && !profileLoading) { setLocation(profile ? "/dashboard" : "/register"); }
  }, [user, profile, profileLoading, setLocation]);

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

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp: otp.join("") }) });
      if (!res.ok) throw new Error("Invalid code");
      toast({ title: "Verified" });
    } catch (err: any) { toast({ variant: "destructive", description: err.message }); }
    finally { setIsLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[index] = digit; setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) handleVerifyOtp();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); handleVerifyOtp(); }
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
