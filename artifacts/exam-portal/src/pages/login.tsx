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
import { Shield, AlertCircle, Eye, EyeOff, Mail, Lock, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "signin" | "signup";
type Step = "credentials" | "otp";

function getFirebaseError(code: string): string {
  switch (code) {
    case "auth/unauthorized-domain":
      return "Domain not authorized. Add it to Firebase Console → Authentication → Authorized domains.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Sign in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed.";
    default:
      return "Authentication failed. Please try again.";
  }
}

export default function Login() {
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
    if (user && !profileLoading) {
      setLocation(profile ? "/dashboard" : "/register");
    }
  }, [user, profile, profileLoading, setLocation]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendOtp = async (targetEmail: string) => {
    const res = await fetch(`/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send OTP");
    if (data.previewUrl) console.info("[DEV] OTP email preview:", data.previewUrl);
    return data;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (!email.endsWith("@gmail.com")) {
      toast({ variant: "destructive", title: "Access Denied", description: "Only @gmail.com accounts are permitted." });
      return;
    }
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await sendOtp(email);
      setStep("otp");
      setResendCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      toast({ variant: "destructive", title: "Sign Up Failed", description: code ? getFirebaseError(code) : (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      toast({ variant: "destructive", title: "Sign In Failed", description: getFirebaseError(code) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      toast({ title: "Email Verified", description: "Account verified. Setting up your profile..." });
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Verification Failed", description: (err as Error).message });
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) setTimeout(() => handleVerifyOtp(), 50);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); setTimeout(() => handleVerifyOtp(), 50); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await sendOtp(email);
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      toast({ title: "OTP Resent", description: "A new code has been sent to your email." });
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Failed", description: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user.email?.endsWith("@gmail.com")) {
        await auth.signOut();
        toast({ variant: "destructive", title: "Access Denied", description: "Only @gmail.com accounts are permitted." });
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      toast({ variant: "destructive", title: "Sign In Failed", description: getFirebaseError(code) });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-xs font-mono tracking-widest uppercase">Initializing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] opacity-[0.04]" />
      </div>

      <AnimatePresence mode="wait">
        {step === "credentials" ? (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-sm z-10"
          >
            <Card className="border-border bg-card/90 backdrop-blur-xl shadow-2xl">
              <CardHeader className="space-y-3 pb-5 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">ExamPortal</CardTitle>
                  <CardDescription className="mt-1 text-sm">Secure Academic Assessment</CardDescription>
                </div>
                <div className="flex rounded-lg border border-border bg-muted/30 p-1 gap-1">
                  {(["signin", "signup"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${
                        mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "signin" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <form onSubmit={mode === "signup" ? handleSignUp : handleSignIn} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 bg-background" required autoComplete="email" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9 bg-background" required autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : mode === "signin" ? "Sign In" : "Continue"}
                  </Button>
                </form>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Button variant="outline" size="lg" className="w-full h-11 border-border hover:border-primary/40" onClick={handleGoogleSignIn} disabled={isLoading}>
                  <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border">
                  <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Only <span className="text-foreground font-medium">@gmail.com</span> accounts allowed. Sign-up requires email verification.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-sm z-10"
          >
            <Card className="border-border bg-card/90 backdrop-blur-xl shadow-2xl">
              <CardHeader className="space-y-3 pb-5 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Check your email</CardTitle>
                  <CardDescription className="mt-1 text-sm">We sent a 6-digit code to</CardDescription>
                  <p className="text-sm font-medium text-foreground mt-0.5 truncate px-4">{email}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className={`w-11 h-14 text-center text-xl font-bold rounded-lg border bg-background outline-none transition-all ${digit ? "border-primary text-primary" : "border-border"} focus:border-primary focus:ring-2 focus:ring-primary/20`}
                    />
                  ))}
                </div>
                {isLoading && <div className="flex justify-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
                <div className="space-y-2 text-center">
                  <p className="text-xs text-muted-foreground">Didn't receive it?</p>
                  <button onClick={handleResend} disabled={resendCooldown > 0 || isLoading} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center gap-1.5 mx-auto">
                    <RefreshCw className="w-3.5 h-3.5" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border">
                  <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">Code expires in <span className="text-foreground">10 minutes</span>. Check your spam folder if you don't see it.</p>
                </div>
                <button onClick={() => { setStep("credentials"); setOtp(["", "", "", "", "", ""]); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign up
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
