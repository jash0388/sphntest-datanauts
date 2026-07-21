import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { storeRollSession } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  RefreshCw,
  Hash,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

type Step = "roll" | "otp" | "success";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("roll");
  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Already logged in → dashboard
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Send OTP via Rubrix ──────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const roll = rollNumber.trim().toUpperCase();
    if (!roll) {
      toast({ variant: "destructive", title: "Required", description: "Please enter your roll number." });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/roll/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: roll }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "OTP Sent! 📧", description: "Check your registered email for the 6-digit code." });
        setStep("otp");
        setResendCooldown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        toast({ variant: "destructive", title: "Not Found", description: data.error || "Roll number not found in Rubrix." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerifyOTP = async (otpStr?: string) => {
    const code = otpStr ?? otp.join("");
    if (code.length !== 6) {
      toast({ variant: "destructive", title: "Incomplete", description: "Please enter all 6 digits." });
      return;
    }
    const roll = rollNumber.trim().toUpperCase();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/roll/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: roll, otp: code }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        const { user: u, token, expiresAt } = data;
        setStudentName(u.fullName || roll);
        storeRollSession({ rollNumber: u.rollNumber, fullName: u.fullName, email: u.email, token, expiresAt });
        setStep("success");

        setTimeout(() => setLocation("/dashboard"), 1400);
      } else {
        toast({ variant: "destructive", title: "Wrong OTP", description: data.error || "Incorrect or expired code." });
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP input handlers ───────────────────────────────────────────────────────
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.join("").length === 6) handleVerifyOTP(next.join(""));
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      handleVerifyOTP(text);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/roll/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setResendCooldown(60);
        toast({ description: "New code sent to your email!" });
      } else {
        toast({ variant: "destructive", description: data.error || "Failed to resend." });
      }
    } catch {
      toast({ variant: "destructive", description: "Network error." });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared card style ────────────────────────────────────────────────────────
  const cardStyle = {
    backgroundColor: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(79,126,245,0.06)",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#0a0a0f" }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #4f7ef5 0%, transparent 70%)", filter: "blur(60px)" }}
        />
      </div>

      <div className="w-full max-w-[380px] relative z-10">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Roll Number ── */}
          {step === "roll" && (
            <motion.div
              key="roll"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="rounded-3xl p-8 space-y-7" style={cardStyle}>
                {/* Logo */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#1a1a35 0%,#0f1128 100%)", border: "1px solid rgba(79,126,245,0.3)", boxShadow: "0 0 30px rgba(79,126,245,0.15)" }}
                  >
                    <Shield className="w-8 h-8" style={{ color: "#5b7ef5" }} />
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      SPHN <span style={{ color: "#5b7ef5" }}>Online</span>
                    </h1>
                    <p className="text-xs mt-1 font-medium tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
                      DataNauts Hub · Secure Exam Portal
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Roll Number
                    </label>
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3.5"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                    >
                      <Hash className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
                      <input
                        type="text"
                        placeholder="e.g. 24N81A6758"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                        required
                        autoComplete="off"
                        className="flex-1 bg-transparent text-sm text-white font-mono tracking-widest placeholder:text-[rgba(255,255,255,0.25)] placeholder:font-sans placeholder:tracking-normal outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#5b7ef5 0%,#4466e0 100%)", boxShadow: "0 4px 24px rgba(79,126,245,0.45)" }}
                  >
                    {isLoading ? (
                      <RefreshCw className="animate-spin w-4 h-4" />
                    ) : (
                      <>Send OTP <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>

                <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Enter your Rubrix roll number — OTP will be sent to your registered email
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="rounded-3xl p-8 space-y-7" style={cardStyle}>
                {/* Back button */}
                <button
                  onClick={() => { setStep("roll"); setOtp(["", "", "", "", "", ""]); }}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#1a1a35 0%,#0f1128 100%)", border: "1px solid rgba(79,126,245,0.3)", boxShadow: "0 0 30px rgba(79,126,245,0.15)" }}
                  >
                    <span className="text-2xl">📧</span>
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-white">Check your email</h2>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      A 6-digit code was sent to your<br />
                      registered email for{" "}
                      <span className="font-bold text-white/70 font-mono">{rollNumber}</span>
                    </p>
                  </div>
                </div>

                {/* OTP boxes */}
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
                        border: digit ? "1px solid rgba(91,126,245,0.7)" : "1px solid rgba(255,255,255,0.09)",
                        boxShadow: digit ? "0 0 12px rgba(91,126,245,0.2)" : "none",
                      }}
                    />
                  ))}
                </div>

                {/* Manual verify button */}
                <button
                  onClick={() => handleVerifyOTP()}
                  disabled={isLoading || otp.join("").length !== 6}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#5b7ef5 0%,#4466e0 100%)", boxShadow: "0 4px 24px rgba(79,126,245,0.45)" }}
                >
                  {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <>Verify & Login <ArrowRight className="w-4 h-4" /></>}
                </button>

                {/* Resend */}
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                  className="w-full text-center text-sm font-semibold py-1 disabled:opacity-40 transition-colors"
                  style={{ color: "#5b7ef5" }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Success ── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="rounded-3xl p-10 flex flex-col items-center gap-5 text-center" style={cardStyle}>
                <CheckCircle2 className="w-16 h-16" style={{ color: "#22c55e" }} />
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Welcome, {studentName.split(" ")[0]}! 👋
                  </h2>
                  <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Redirecting to your dashboard…
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
