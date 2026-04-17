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
import { Shield, RefreshCw, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

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
  const verifyingRef = useRef(false);
  const { data: profile, isLoading: profileLoading } = useProfile(user?.uid);

  useEffect(() => {
    if (user && !profileLoading && step !== "otp") {
      setLocation(profile ? "/dashboard" : "/register");
    }
  }, [user, profile, profileLoading, setLocation, step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith("@gmail.com"))
      return toast({ variant: "destructive", title: "Denied", description: "Only @gmail.com accounts." });
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await fetch(`/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStep("otp");
      setResendCooldown(60);
    } catch (err: any) {
      toast({ variant: "destructive", description: getFirebaseError(err.code) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      toast({ variant: "destructive", description: getFirebaseError(err.code) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      toast({ variant: "destructive", description: getFirebaseError(err.code) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setIsLoading(true);
    try {
      const code = otpValue ?? otp.join("");
      const res = await fetch(`/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      if (!res.ok) throw new Error("Invalid or expired code. Please try again.");
      toast({ title: "Verified!", description: "Email verified successfully." });
      setStep("credentials");
    } catch (err: any) {
      toast({ variant: "destructive", description: err.message });
    } finally {
      setIsLoading(false);
      verifyingRef.current = false;
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await fetch(`/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendCooldown(60);
      toast({ description: "New code sent!" });
    } catch {
      toast({ variant: "destructive", description: "Failed to resend." });
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d) && next.join("").length === 6) handleVerifyOtp(next.join(""));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      handleVerifyOtp(text);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#0a0a0f" }}
    >
      <div className="w-full max-w-[360px]">
        <AnimatePresence mode="wait">
          {step === "credentials" ? (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {/* Card */}
              <div
                className="rounded-3xl p-7 space-y-6"
                style={{
                  backgroundColor: "#111118",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                }}
              >
                {/* Logo + Title */}
                <div className="flex flex-col items-center gap-3 pt-1">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#1a1a35", border: "1px solid rgba(79,126,245,0.3)" }}
                  >
                    <Shield className="w-7 h-7" style={{ color: "#5b7ef5" }} />
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-white tracking-tight">ExamPortal</h1>
                    <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Secure Academic Assessment
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <div
                  className="flex rounded-xl p-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {(["signin", "signup"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                      style={
                        mode === m
                          ? {
                              background: "linear-gradient(135deg, #5b7ef5, #4466e0)",
                              color: "#fff",
                              boxShadow: "0 2px 12px rgba(79,126,245,0.35)",
                            }
                          : { color: "rgba(255,255,255,0.35)" }
                      }
                    >
                      {m === "signin" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={mode === "signup" ? handleSignUp : handleSignIn} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Email
                    </label>
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                      onFocus={() => {}}
                    >
                      <Mail className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
                      <input
                        type="email"
                        placeholder="you@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Password
                    </label>
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                    >
                      <Lock className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 active:scale-[0.98] mt-1"
                    style={{
                      background: "linear-gradient(135deg, #5b7ef5 0%, #4466e0 100%)",
                      boxShadow: "0 4px 20px rgba(79,126,245,0.4)",
                    }}
                  >
                    {isLoading ? (
                      <RefreshCw className="animate-spin mx-auto w-4 h-4" />
                    ) : mode === "signin" ? (
                      "Sign In"
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
                    or continue with
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                </div>

                {/* Google */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 text-white"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>

                {/* Notice */}
                <div
                  className="flex items-start gap-2.5 rounded-xl p-3.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Only <span className="font-bold text-white/70">@gmail.com</span> accounts allowed. Please use your official email.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* OTP Step */
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="rounded-3xl p-7 space-y-6"
                style={{
                  backgroundColor: "#111118",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                }}
              >
                <div className="flex flex-col items-center gap-3 pt-1">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#1a1a35", border: "1px solid rgba(79,126,245,0.3)" }}
                  >
                    <Mail className="w-7 h-7" style={{ color: "#5b7ef5" }} />
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Check your email</h1>
                    <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                      We sent a 6-digit code to<br />
                      <span className="text-white/70 font-medium">{email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-2.5">
                  {otp.map((digit, i) => (
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
                      className="w-12 h-14 text-center text-2xl font-bold rounded-xl text-white outline-none transition-all duration-200"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: digit
                          ? "1px solid rgba(91,126,245,0.7)"
                          : "1px solid rgba(255,255,255,0.09)",
                        boxShadow: digit ? "0 0 12px rgba(91,126,245,0.2)" : "none",
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="w-full text-center text-sm font-semibold py-2 disabled:opacity-40"
                  style={{ color: "#5b7ef5" }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
