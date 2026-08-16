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
  User,
  BookOpen,
  Building,
  KeyRound,
  Lock,
  Zap,
  BarChart3
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

  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [otcFullName, setOtcFullName] = useState("");
  const [otcRollNumber, setOtcRollNumber] = useState("");
  const [otcBranch, setOtcBranch] = useState("DS");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleModeSwitch = (mode: AuthMode) => {
    setAuthMode(mode);
    setStep(mode === "rubrix" ? "roll" : "otc_code");
  };

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

  const handleOtcDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = otcFullName.trim();
    const roll = (rollNumber || otcRollNumber || "").trim().toUpperCase();
    if (!fullName || !roll) {
      toast({ variant: "destructive", title: "Incomplete", description: "Please fill in all details." });
      return;
    }
    setIsLoading(true);
    try {
      await markAccessCodeUsed(accessCodeInput, roll, fullName);
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

  // ── Shared right-panel form card style (white/light)
  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400";
  const btnCls = "w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] relative overflow-hidden p-10"
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 35%, #10b981 70%, #34d399 100%)",
        }}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        {/* Glow blobs */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute bottom-32 left-10 w-48 h-48 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", filter: "blur(50px)" }} />

        {/* Top logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-none">SPHN Online</p>
            <p className="text-white/70 text-xs mt-0.5">DataNauts Hub · Exam Portal</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Your gateway to<br />
              <span className="text-white/90">secure online</span><br />
              assessments.
            </h1>
            <p className="text-white/75 text-sm mt-4 leading-relaxed max-w-xs">
              A modern testing portal built for students and faculty — fair, focused, and reliable from registration to result.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              { icon: Lock, title: "Secure proctored testing", desc: "Tab-switch detection, timer, and auto-submit keep every exam fair." },
              { icon: BarChart3, title: "Instant results & analytics", desc: "See scores, attempt counts, and per-question answers right after submission." },
              { icon: BookOpen, title: "Mock tests & practice papers", desc: "EAPCET-style mocks, custom college tests, and shift-wise practice rounds." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer credit */}
        <div className="relative z-10 space-y-1">
          <p className="text-white/50 text-xs">Version 17.05.21</p>
          <p className="text-white/60 text-xs">© 2026 Sphoorthy Engineering College</p>
          <p className="text-white/50 text-xs">Powered by <span className="font-bold text-white/80">BigBrains</span> · DataNauts Hub</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0ea5e9, #10b981)" }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SPHN <span style={{ color: "#0ea5e9" }}>Online</span></span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── Roll Number Step ── */}
            {step === "roll" && (
              <motion.div key="roll" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-gray-900">Welcome back 👋</h2>
                  <p className="text-gray-500 text-sm mt-1">Sign in to continue to your exams.</p>
                </div>

                {/* Mode tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  <button
                    onClick={() => handleModeSwitch("rubrix")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === "rubrix" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                  >
                    Rubrix Login
                  </button>
                  <button
                    onClick={() => handleModeSwitch("otc")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === "otc" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                  >
                    Access Code
                  </button>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Roll Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. 24N81A6758"
                        value={rollNumber}
                        onChange={(e) => {
                          setRollNumber(e.target.value.toUpperCase());
                          if (!otcRollNumber) setOtcRollNumber(e.target.value.toUpperCase());
                        }}
                        required
                        autoComplete="off"
                        className={`${inputCls} pl-10 font-mono tracking-widest`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={btnCls}
                    style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)", boxShadow: "0 4px 20px rgba(14,165,233,0.4)" }}
                  >
                    {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <><span>Send OTP</span> <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-5">
                  Enter your Rubrix roll number — OTP will be sent to your registered email
                </p>

                <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400">Don't have Rubrix access?</p>
                  <button
                    onClick={() => handleModeSwitch("otc")}
                    className="text-xs font-semibold mt-1 transition-colors"
                    style={{ color: "#0ea5e9" }}
                  >
                    Use One-Time Access Code instead →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── OTP Step ── */}
            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>
                <button onClick={() => { setStep("roll"); setOtp(["", "", "", "", "", ""]); }} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors mb-8">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #e0f2fe, #d1fae5)" }}>
                    <span className="text-2xl">📧</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Check your email</h2>
                  <p className="text-gray-500 text-sm mt-1.5">
                    A 6-digit code was sent to your registered email for{" "}
                    <span className="font-bold text-gray-800 font-mono">{rollNumber}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-2 mb-6">
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
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all duration-200 border-2"
                      style={{
                        backgroundColor: digit ? "#f0f9ff" : "#f9fafb",
                        borderColor: digit ? "#0ea5e9" : "#e5e7eb",
                        color: "#0c4a6e",
                        boxShadow: digit ? "0 0 0 3px rgba(14,165,233,0.15)" : "none",
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => handleVerifyOTP()}
                  disabled={isLoading || otp.join("").length !== 6}
                  className={`${btnCls} disabled:opacity-50`}
                  style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)", boxShadow: "0 4px 20px rgba(14,165,233,0.4)" }}
                >
                  {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <>Verify & Login <ArrowRight className="w-4 h-4" /></>}
                </button>

                <div className="space-y-2 text-center pt-4">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-xs font-semibold disabled:opacity-40 transition-colors"
                    style={{ color: "#0ea5e9" }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                  <div>
                    <button
                      onClick={() => { setStep("otc_code"); setAccessCodeInput(""); if (!otcRollNumber && rollNumber) setOtcRollNumber(rollNumber); }}
                      className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors block mx-auto"
                    >
                      Didn't receive OTP? Use Access Code →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Access Code Entry ── */}
            {step === "otc_code" && (
              <motion.div key="otc_code" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>
                <button onClick={() => setStep("otp")} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors mb-8">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Email OTP
                </button>

                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #fef3c7, #d1fae5)" }}>
                    <Key className="w-7 h-7" style={{ color: "#f59e0b" }} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Enter Access Code</h2>
                  <p className="text-gray-500 text-sm mt-1.5">
                    Enter your one-time access code provided by your exam invigilator.
                  </p>
                </div>

                <form onSubmit={handleVerifyOTC} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">One-Time Access Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                      <input
                        type="text"
                        placeholder="e.g. SPHN2026 or OTC-749201"
                        value={accessCodeInput}
                        onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                        required
                        autoComplete="off"
                        className={`${inputCls} pl-10 font-mono tracking-widest`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={btnCls}
                    style={{ background: "linear-gradient(135deg, #f59e0b 0%, #10b981 100%)", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}
                  >
                    {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <><span>Verify Code & Proceed</span> <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Student Details ── */}
            {step === "otc_details" && (
              <motion.div key="otc_details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>
                <div className="flex items-center justify-between mb-8">
                  <button onClick={() => setStep("otc_code")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border" style={{ color: "#0ea5e9", backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }}>
                    CODE: {accessCodeInput}
                  </span>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-black text-gray-900">Student Information</h2>
                  <p className="text-gray-500 text-sm mt-1">Enter your details to generate your exam session.</p>
                </div>

                <form onSubmit={handleOtcDetailsSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={otcFullName}
                        onChange={(e) => setOtcFullName(e.target.value)}
                        required
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Roll Number / Student ID</label>
                    {otcRollNumber || rollNumber ? (
                      <div className="flex items-center justify-between rounded-xl px-4 py-3 border-2" style={{ backgroundColor: "#f0fdf4", borderColor: "#86efac" }}>
                        <div className="flex items-center gap-3">
                          <Hash className="w-4 h-4 shrink-0" style={{ color: "#16a34a" }} />
                          <span className="text-sm font-mono tracking-wider font-bold text-gray-900">{otcRollNumber || rollNumber}</span>
                        </div>
                        <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border uppercase" style={{ color: "#16a34a", backgroundColor: "#dcfce7", borderColor: "#86efac" }}>
                          ✓ Verified
                        </span>
                      </div>
                    ) : (
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="e.g. 24N81A6758"
                          value={otcRollNumber}
                          onChange={(e) => setOtcRollNumber(e.target.value.toUpperCase())}
                          required
                          className={`${inputCls} pl-10 font-mono tracking-widest`}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Branch / Department</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={otcBranch}
                        onChange={(e) => setOtcBranch(e.target.value)}
                        className={`${inputCls} pl-10 cursor-pointer appearance-none`}
                      >
                        {BRANCH_OPTIONS.map((b) => (
                          <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`${btnCls} mt-2`}
                    style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)", boxShadow: "0 4px 20px rgba(14,165,233,0.4)" }}
                  >
                    {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <>Start Exam Session <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Success ── */}
            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <div className="flex flex-col items-center gap-5 text-center py-8">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>
                    <CheckCircle2 className="w-10 h-10" style={{ color: "#10b981" }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">
                      Welcome, {studentName.split(" ")[0]}! 👋
                    </h2>
                    <p className="text-sm mt-1.5 text-gray-500">Preparing your exam workspace…</p>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#10b981", animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Footer on right side */}
          <div className="mt-10 text-center lg:hidden">
            <p className="text-xs text-gray-400">© 2026 Sphoorthy Engineering College</p>
            <p className="text-xs text-gray-400 mt-0.5">Powered by <span className="font-bold text-gray-500">BigBrains</span> · DataNauts Hub</p>
          </div>

        </div>
      </div>

    </div>
  );
}
