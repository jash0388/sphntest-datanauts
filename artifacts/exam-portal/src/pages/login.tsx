import { useState } from "react";
import { useLocation } from "wouter";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  auth,
} from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, RefreshCw, Hash, ArrowRight, CheckCircle2 } from "lucide-react";

// Derive a deterministic Firebase email + password from roll number
function rollToEmail(roll: string) {
  return `${roll.trim().toLowerCase()}@sphn.datanauts.in`;
}
function rollToPassword(roll: string) {
  return `sphn_exam_${roll.trim().toUpperCase()}_2k25`;
}

type Step = "roll" | "success";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("roll");
  const [rollNumber, setRollNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Already logged in → go to dashboard
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const roll = rollNumber.trim().toUpperCase();
    if (!roll) {
      toast({ variant: "destructive", title: "Required", description: "Please enter your roll number." });
      return;
    }
    if (!fullName.trim()) {
      toast({ variant: "destructive", title: "Required", description: "Please enter your full name." });
      return;
    }

    setIsLoading(true);
    const email = rollToEmail(roll);
    const password = rollToPassword(roll);

    try {
      let firebaseUid: string;

      // Try to sign in first (returning student)
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        firebaseUid = cred.user.uid;
      } catch (signInErr: any) {
        if (
          signInErr.code === "auth/user-not-found" ||
          signInErr.code === "auth/invalid-credential" ||
          signInErr.code === "auth/wrong-password"
        ) {
          // New student — create Firebase account
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          firebaseUid = cred.user.uid;
        } else {
          throw signInErr;
        }
      }

      // Upsert Supabase profile
      await supabase.from("profiles").upsert(
        {
          id: firebaseUid,
          email,
          full_name: fullName.trim(),
          name: roll, // roll number stored in `name` field
          firebase_uid: firebaseUid,
          is_firebase_user: true,
        },
        { onConflict: "id" }
      );

      setStep("success");
      setTimeout(() => setLocation("/dashboard"), 1200);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#0a0a0f" }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #4f7ef5 0%, transparent 70%)", filter: "blur(60px)" }}
        />
      </div>

      <div className="w-full max-w-[380px] relative z-10">
        <AnimatePresence mode="wait">
          {step === "roll" ? (
            <motion.div
              key="roll"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div
                className="rounded-3xl p-8 space-y-7"
                style={{
                  backgroundColor: "#111118",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(79,126,245,0.06)",
                }}
              >
                {/* Logo */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #1a1a35 0%, #0f1128 100%)",
                      border: "1px solid rgba(79,126,245,0.3)",
                      boxShadow: "0 0 30px rgba(79,126,245,0.15)",
                    }}
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Full Name
                    </label>
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3.5"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                    >
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>✦</span>
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoComplete="off"
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none"
                      />
                    </div>
                  </div>

                  {/* Roll Number */}
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

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    style={{
                      background: "linear-gradient(135deg, #5b7ef5 0%, #4466e0 100%)",
                      boxShadow: "0 4px 24px rgba(79,126,245,0.45)",
                    }}
                  >
                    {isLoading ? (
                      <RefreshCw className="animate-spin w-4 h-4" />
                    ) : (
                      <>
                        Enter Exam Portal
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer note */}
                <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Enter your college roll number to access your assigned exam sections
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div
                className="rounded-3xl p-10 flex flex-col items-center gap-5 text-center"
                style={{
                  backgroundColor: "#111118",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
                }}
              >
                <CheckCircle2 className="w-16 h-16" style={{ color: "#22c55e" }} />
                <div>
                  <h2 className="text-2xl font-bold text-white">Welcome, {fullName.split(" ")[0]}!</h2>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Redirecting to dashboard…
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
