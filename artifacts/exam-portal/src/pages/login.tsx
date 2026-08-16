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
  BarChart3,
  Check
} from "lucide-react";

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

type Step = "roll" | "otp" | "otc_code" | "otc_details" | "success";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("roll");

  // Input states
  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTC states
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
        toast({ variant: "destructive", title: "Not Found", description: data.error || "Roll number not found in database." });
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

  return (
    <div className="min-h-screen flex bg-[#f8fafc]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT PANEL (EXACT ROYAL BLUE MATRIX GRID THEME) ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[50%] relative overflow-hidden p-12 shrink-0"
        style={{
          background: "linear-gradient(165deg, #1e3a8a 0%, #1d4ed8 50%, #1e40af 100%)",
        }}
      >
        {/* Subtle Grid Overlay matching reference */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2.5">
            <Shield className="w-full h-full text-[#1d4ed8]" />
          </div>
          <div>
            <p className="font-extrabold text-white text-lg tracking-tight leading-none">Sphoorthy Engineering College</p>
            <p className="text-blue-200/80 text-xs font-medium mt-1">Online Examination Portal</p>
          </div>
        </div>

        {/* Center Banner Content */}
        <div className="relative z-10 space-y-8 my-auto py-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight">
              Your gateway to<br />
              <span className="text-sky-300">secure online</span><br />
              assessments.
            </h1>
            <p className="text-blue-100/80 text-sm mt-5 leading-relaxed max-w-md font-normal">
              A modern testing portal built for students and faculty — fair, focused, and reliable from registration to result.
            </p>
          </div>

          {/* Feature Check List */}
          <div className="space-y-4 pt-2">
            {[
              { title: "Secure proctored testing", desc: "Tab-switch detection, timer, and auto-submit keep every exam fair." },
              { title: "Instant results & analytics", desc: "See scores, attempt counts, and per-question answers right after submission." },
              { title: "Mock tests & practice papers", desc: "EAPCET-style mocks, custom college tests, and shift-wise practice rounds." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/30 border border-blue-300/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-snug">{f.title}</p>
                  <p className="text-blue-200/70 text-xs mt-0.5 leading-normal">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Credit */}
        <div className="relative z-10 flex items-center justify-between text-xs text-blue-200/60 pt-6 border-t border-white/10">
          <span>Version 17.05.21</span>
          <span>© 2026 Sphoorthy Engineering College</span>
          <span>Powered by <strong className="text-white font-bold">BigBrains</strong></span>
        </div>
      </div>

      {/* ── RIGHT PANEL (LIGHT CLEAN FLOATING CARD) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px]">
          
          {/* Main Floating Card Container */}
          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-slate-100">

            <AnimatePresence mode="wait">

              {/* ── Step 1: Roll Number Input ONLY ── */}
              {step === "roll" && (
                <motion.div
                  key="roll"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h2>
                    <p className="text-slate-500 text-sm mt-1">Sign in to continue to your exams.</p>
                  </div>

                  <form onSubmit={handleSendOTP} className="space-y-5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                        ROLL NUMBER
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-mono font-bold tracking-widest text-slate-900 placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-[#1d4ed8] to-[#0284c7] hover:from-[#1e40af] hover:to-[#0369a1] active:scale-[0.99] transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="animate-spin w-4 h-4" />
                      ) : (
                        <><span>Send OTP</span> <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>

                  {/* Access Code / Contact Help Link */}
                  <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("otc_code");
                        setAccessCodeInput("");
                        if (!otcRollNumber && rollNumber) setOtcRollNumber(rollNumber);
                      }}
                      className="text-xs font-semibold text-[#1d4ed8] hover:text-[#1e40af] hover:underline transition-colors"
                    >
                      Contact Help / Enter One-Time Access Code →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: OTP Verification ── */}
              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => { setStep("roll"); setOtp(["", "", "", "", "", ""]); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>

                  <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-900">Check your email</h2>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      A 6-digit code was sent to your email for{" "}
                      <span className="font-bold text-slate-900 font-mono">{rollNumber}</span>
                    </p>
                  </div>

                  <div className="flex justify-between gap-2 mb-6">
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
                        className="w-11 h-13 text-center text-xl font-bold rounded-xl outline-none border-2 transition-all"
                        style={{
                          backgroundColor: digit ? "#f0f9ff" : "#f8fafc",
                          borderColor: digit ? "#1d4ed8" : "#e2e8f0",
                          color: "#0f172a",
                        }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => handleVerifyOTP()}
                    disabled={isLoading || otp.join("").length !== 6}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-[#1d4ed8] to-[#0284c7] hover:from-[#1e40af] hover:to-[#0369a1] transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <>Verify & Login <ArrowRight className="w-4 h-4" /></>}
                  </button>

                  <div className="mt-5 text-center space-y-2">
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || isLoading}
                      className="text-xs font-semibold text-[#1d4ed8] disabled:opacity-40"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                    </button>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("otc_code");
                          setAccessCodeInput("");
                          if (!otcRollNumber && rollNumber) setOtcRollNumber(rollNumber);
                        }}
                        className="text-xs font-medium text-slate-400 hover:text-slate-600"
                      >
                        Contact Help / Enter Code →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Access Code Entry ── */}
              {step === "otc_code" && (
                <motion.div
                  key="otc_code"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => setStep("roll")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Roll Number
                  </button>

                  <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-900">Enter Access Code</h2>
                    <p className="text-slate-500 text-xs mt-1.5">
                      Enter the one-time access code provided by your exam invigilator.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOTC} className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                        ONE-TIME ACCESS CODE
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. OTC-749201"
                        value={accessCodeInput}
                        onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                        required
                        autoComplete="off"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-mono font-bold tracking-widest text-slate-900 placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-[#1d4ed8] to-[#0284c7] hover:from-[#1e40af] hover:to-[#0369a1] transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <><span>Verify Code & Proceed</span> <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── Student Information ── */}
              {step === "otc_details" && (
                <motion.div
                  key="otc_details"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setStep("otc_code")} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border text-blue-700 bg-blue-50 border-blue-200">
                      CODE: {accessCodeInput}
                    </span>
                  </div>

                  <div className="mb-5">
                    <h2 className="text-xl font-black text-slate-900">Student Details</h2>
                    <p className="text-slate-500 text-xs mt-1">Fill in your information to launch the exam.</p>
                  </div>

                  <form onSubmit={handleOtcDetailsSubmit} className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">FULL NAME</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={otcFullName}
                        onChange={(e) => setOtcFullName(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-[#1d4ed8] transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">ROLL NUMBER</label>
                      <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-emerald-50 border border-emerald-200">
                        <span className="text-sm font-mono tracking-wider font-bold text-slate-900">
                          {otcRollNumber || rollNumber}
                        </span>
                        <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded text-emerald-700 bg-emerald-100 border border-emerald-300 uppercase">
                          ✓ Verified
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">BRANCH / DEPARTMENT</label>
                      <select
                        value={otcBranch}
                        onChange={(e) => setOtcBranch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#1d4ed8] transition-all cursor-pointer"
                      >
                        {BRANCH_OPTIONS.map((b) => (
                          <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-[#1d4ed8] to-[#0284c7] hover:from-[#1e40af] hover:to-[#0369a1] transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
                    >
                      {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <>Start Exam Session <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── Success Screen ── */}
              {step === "success" && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                  <div className="flex flex-col items-center gap-4 text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">
                        Welcome, {studentName.split(" ")[0]}! 👋
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">Preparing your exam workspace…</p>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </div>

          {/* Footer on mobile right view */}
          <div className="mt-8 text-center lg:hidden space-y-1">
            <p className="text-xs text-slate-400">© 2026 Sphoorthy Engineering College</p>
            <p className="text-xs text-slate-400">Powered by <strong className="text-slate-600 font-bold">BigBrains</strong> · DataNauts Club</p>
          </div>

        </div>
      </div>

    </div>
  );
}
