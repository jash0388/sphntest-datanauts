import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { storeRollSession, useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { validateAccessCode, markAccessCodeUsed } from "@/lib/accessCodes";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  RefreshCw,
  Hash,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Key,
  HelpCircle,
  X,
  User,
  BookOpen,
  Building,
  KeyRound
} from "lucide-react";

type AuthMode = "rubrix" | "otc";
type Step = "roll" | "otp" | "otc_code" | "otc_details" | "success";

const BRANCH_OPTIONS = [
  { value: "DS", label: "CSE - Data Science (DS)" },
  { value: "CSE", label: "Computer Science & Engineering (CSE)" },
  { value: "CS", label: "CSE - Cyber Security (CS)" },
  { value: "AIML", label: "CSE - Artificial Intelligence & ML (AIML)" },
  { value: "IT", label: "Information Technology (IT)" },
  { value: "ECE", label: "Electronics & Communication (ECE)" },
  { value: "EEE", label: "Electrical & Electronics (EEE)" },
  { value: "MECH", label: "Mechanical Engineering (MECH)" },
  { value: "CIVIL", label: "Civil Engineering (CIVIL)" },
  { value: "OTHER", label: "Other Branch / Specialization" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [authMode, setAuthMode] = useState<AuthMode>("rubrix");
  const [step, setStep] = useState<Step>("roll");

  // Rubrix Auth State
  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTC Auth State
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [otcFullName, setOtcFullName] = useState("");
  const [otcRollNumber, setOtcRollNumber] = useState("");
  const [otcBranch, setOtcBranch] = useState("DS");

  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

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

  // Handle Auth Mode switch
  const handleModeSwitch = (mode: AuthMode) => {
    setAuthMode(mode);
    if (mode === "rubrix") {
      setStep("roll");
    } else {
      setStep("otc_code");
    }
  };

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

  // ── Handle OTC Verification ──────────────────────────────────────────────────
  const handleVerifyOTC = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = accessCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      toast({ variant: "destructive", title: "Required", description: "Please enter your access code." });
      return;
    }
    setIsLoading(true);
    try {
      const { valid, message } = await validateAccessCode(cleanCode);
      if (valid) {
        toast({ title: "Code Verified 🔑", description: "Please enter your student details to proceed." });
        setStep("otc_details");
      } else {
        toast({ variant: "destructive", title: "Invalid Code", description: message || "Code invalid or already used." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Verification error." });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle OTC Details Submission ─────────────────────────────────────────────
  const handleOtcDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = otcFullName.trim();
    const roll = otcRollNumber.trim().toUpperCase();
    if (!fullName || !roll) {
      toast({ variant: "destructive", title: "Incomplete", description: "Please fill in all details." });
      return;
    }

    setIsLoading(true);
    try {
      // Mark code as used
      await markAccessCodeUsed(accessCodeInput, roll, fullName);

      // Create / upsert profile in Supabase
      const uid = `roll_${roll}`;
      await supabase.from("profiles").upsert(
        {
          id: uid,
          email: `${roll.toLowerCase()}@datanauts.in`,
          full_name: fullName,
          name: roll,
          role: otcBranch,
          college: "SPHN",
          firebase_uid: uid,
          is_firebase_user: false,
        },
        { onConflict: "id" }
      );

      // Store Roll Session for student with isOtcUser flag
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      storeRollSession({
        rollNumber: roll,
        fullName,
        email: `${roll.toLowerCase()}@datanauts.in`,
        token: `otc_session_${Date.now()}`,
        isOtcUser: true,
        expiresAt,
      });

      setStudentName(fullName);
      setStep("success");
      setTimeout(() => setLocation("/dashboard"), 1400);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Registration Error", description: "Could not save details." });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared Card Style ────────────────────────────────────────────────────────
  const cardStyle = {
    backgroundColor: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(79,126,245,0.06)",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ backgroundColor: "#0a0a0f" }}>
      {/* Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #4f7ef5 0%, transparent 70%)", filter: "blur(60px)" }}
        />
      </div>

      <div className="w-full max-w-[420px] relative z-10 space-y-4">
        
        {/* Mode Selector Tabs (only on initial step) */}
        {(step === "roll" || step === "otc_code") && (
          <div className="flex bg-[#111118] p-1.5 rounded-2xl border border-white/10 shadow-lg">
            <button
              onClick={() => handleModeSwitch("rubrix")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                authMode === "rubrix"
                  ? "bg-[#5b7ef5] text-white shadow-md"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Hash className="w-3.5 h-3.5" /> Roll Number & OTP
            </button>
            <button
              onClick={() => handleModeSwitch("otc")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                authMode === "otc"
                  ? "bg-[#5b7ef5] text-white shadow-md"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Key className="w-3.5 h-3.5" /> One-Time Code
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 1: Roll Number (Rubrix Mode) ── */}
          {step === "roll" && (
            <motion.div
              key="roll"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
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

          {/* ── Step 2: OTP Verification ── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
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
                <div className="flex justify-center gap-2">
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
                      className="w-11 h-14 text-center text-2xl font-bold rounded-xl text-white outline-none transition-all duration-200"
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

                {/* Resend & Help */}
                <div className="space-y-2 text-center">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-xs font-semibold py-1 disabled:opacity-40 transition-colors block w-full text-center"
                    style={{ color: "#5b7ef5" }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[11px] font-medium text-white/40 hover:text-white/80 transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Didn't receive OTP? Contact Help
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 1 (OTC Mode): Access Code Entry ── */}
          {step === "otc_code" && (
            <motion.div
              key="otc_code"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="rounded-3xl p-8 space-y-7" style={cardStyle}>
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#2e2609 0%,#1a1505 100%)", border: "1px solid rgba(234,179,8,0.3)", boxShadow: "0 0 30px rgba(234,179,8,0.15)" }}
                  >
                    <Key className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-white">Enter One-Time Code</h2>
                    <p className="text-xs mt-1 leading-relaxed text-white/50">
                      Enter the one-time access code provided by your exam invigilator.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifyOTC} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-white/40">
                      One-Time Code
                    </label>
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3.5"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                    >
                      <KeyRound className="w-4 h-4 shrink-0 text-yellow-500/70" />
                      <input
                        type="text"
                        placeholder="e.g. SPHN2026 or OTC-749201"
                        value={accessCodeInput}
                        onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                        required
                        autoComplete="off"
                        className="flex-1 bg-transparent text-sm text-yellow-400 font-mono tracking-widest placeholder:text-white/20 placeholder:font-sans placeholder:tracking-normal outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#eab308 0%,#ca8a04 100%)", boxShadow: "0 4px 24px rgba(234,179,8,0.35)" }}
                  >
                    {isLoading ? <RefreshCw className="animate-spin w-4 h-4 text-black" /> : <span className="text-black font-bold flex items-center gap-2">Verify Code & Enter <ArrowRight className="w-4 h-4" /></span>}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── Step 2 (OTC Mode): Student Identity Details ── */}
          {step === "otc_details" && (
            <motion.div
              key="otc_details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="rounded-3xl p-8 space-y-6" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep("otc_code")}
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-white"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <span className="text-[10px] font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-md border border-yellow-500/20">
                    CODE: {accessCodeInput}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">Student Enrollment</h2>
                  <p className="text-xs text-white/50 mt-1">
                    Enter your details to generate your exam session.
                  </p>
                </div>

                <form onSubmit={handleOtcDetailsSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Full Name</label>
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/5 border border-white/10">
                      <User className="w-4 h-4 text-white/30 shrink-0" />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={otcFullName}
                        onChange={(e) => setOtcFullName(e.target.value)}
                        required
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  {/* Roll Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Roll Number / Student ID</label>
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/5 border border-white/10">
                      <Hash className="w-4 h-4 text-white/30 shrink-0" />
                      <input
                        type="text"
                        placeholder="e.g. 24N81A6758"
                        value={otcRollNumber}
                        onChange={(e) => setOtcRollNumber(e.target.value.toUpperCase())}
                        required
                        className="flex-1 bg-transparent text-sm text-white font-mono tracking-wider outline-none placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  {/* Branch Selection Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Branch / Department</label>
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/5 border border-white/10">
                      <Building className="w-4 h-4 text-white/30 shrink-0" />
                      <select
                        value={otcBranch}
                        onChange={(e) => setOtcBranch(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-white outline-none cursor-pointer"
                      >
                        {BRANCH_OPTIONS.map((b) => (
                          <option key={b.value} value={b.value} className="bg-[#111118] text-white">
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    style={{ background: "linear-gradient(135deg,#5b7ef5 0%,#4466e0 100%)", boxShadow: "0 4px 24px rgba(79,126,245,0.45)" }}
                  >
                    {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <>Start Exam Session <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Success Screen ── */}
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
                    Preparing your exam workspace…
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Footer Admin Link */}
        <div className="text-center pt-2">
          <button
            onClick={() => setLocation("/admin")}
            className="text-[11px] font-mono text-white/30 hover:text-white/70 transition-colors"
          >
            Admin Panel 🔑
          </button>
        </div>

      </div>

      {/* ── OTP Help Modal / Overlay ── */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#141420] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-white space-y-5 shadow-2xl relative"
          >
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-base">OTP Support & Help</h3>
                <p className="text-xs text-white/50">Troubleshooting code issues</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-white/80">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="font-bold text-white mb-1">1. Check Spam / Junk Folder</p>
                <p className="text-white/60">OTP emails from Rubrix may take up to 60 seconds or land in your spam folder.</p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="font-bold text-white mb-1">2. Contact Invigilator / Help Desk</p>
                <p className="text-white/60">If you still haven't received it, request a <strong>One-Time Access Code</strong> from your invigilator or email <span className="text-blue-400 font-mono">support@datanauts.in</span>.</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => { setShowHelpModal(false); setStep("roll"); }}
                className="flex-1 border-white/10 text-xs text-white hover:bg-white/10"
              >
                Re-enter Roll No.
              </Button>
              <Button
                onClick={() => { setShowHelpModal(false); handleModeSwitch("otc"); }}
                className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400 text-xs font-bold"
              >
                Use Access Code
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
