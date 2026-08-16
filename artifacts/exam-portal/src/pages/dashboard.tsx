import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAvailableExams, useMySubmissions, useMyStats } from "@/hooks/useExamData";
import { signOut, auth } from "@/lib/firebase";
import { 
  LogOut, Activity, Target, ShieldAlert, Award, FileText, Clock, 
  PlayCircle, Shield, History, AlertTriangle, CheckCircle2, User,
  ArrowRight, TrendingUp, BookOpen, Lock, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile(user?.uid);
  const { data: exams } = useAvailableExams();
  const { data: submissions } = useMySubmissions(user?.uid);
  const { data: stats } = useMyStats(user?.uid);

  const submittedExamMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of submissions ?? []) {
      map[s.exam_id] = s.id;
    }
    return map;
  }, [submissions]);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [user, authLoading, setLocation]);

  const handleLogout = async () => {
    const { clearRollSession } = await import("@/hooks/useAuth");
    clearRollSession();
    await signOut(auth).catch(() => {});
    window.location.href = "/";
  };

  if (authLoading || !user) return null;

  const rollNo = profile?.name || (user?.uid?.startsWith("roll_") ? user.uid.replace(/^roll_/, "") : "N/A");
  const studentDisplayName = profile?.full_name || user.displayName || user.email?.split("@")[0] || "Scholar";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      
      {/* ── TOP HEADER NAVBAR ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm p-1">
              <img src="/logo.png" alt="Sphoorthy College Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-base leading-tight block">Sphoorthy Engineering College</span>
              <span className="text-[11px] font-semibold text-slate-500 block">Online Examination Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{studentDisplayName}</p>
              <p className="text-[11px] font-mono text-slate-500 font-semibold">Roll: {rollNo}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold text-xs flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 space-y-8">
        
        {/* ── HERO BANNER ── */}
        <div className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)" }}>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold text-sky-100 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Sphoorthy Examination Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome back, {studentDisplayName}! 👋
              </h1>
              <p className="text-sky-100/90 text-sm mt-1 font-medium font-mono">
                Roll Number: <strong className="text-white">{rollNo}</strong>
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center shrink-0 min-w-[140px]">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-200">Active Exams</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{exams?.length ?? 0}</p>
            </div>
          </div>
        </div>

        {/* ── STATS OVERVIEW CARDS ── */}
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Performance Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Exams Taken", value: stats?.totalAttempts ?? 0, icon: <Target className="w-4 h-4 text-blue-600" />, color: "border-blue-200" },
              { label: "Avg. Score", value: stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : "--", icon: <TrendingUp className="w-4 h-4 text-indigo-600" />, color: "border-indigo-200" },
              { label: "High Score", value: stats?.highestScore != null ? `${Math.round(stats.highestScore)}%` : "--", icon: <Award className="w-4 h-4 text-emerald-600" />, color: "border-emerald-200", accent: true },
              { label: "Violations", value: stats?.totalViolations ?? 0, icon: <ShieldAlert className="w-4 h-4 text-amber-600" />, color: "border-amber-200", danger: true },
            ].map((stat) => (
              <div key={stat.label} className={`bg-white rounded-2xl p-5 border ${stat.color} shadow-sm`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                  {stat.icon}
                </div>
                <div className={`text-2xl sm:text-3xl font-black ${stat.danger ? "text-amber-600" : stat.accent ? "text-emerald-600" : "text-slate-900"}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AVAILABLE EXAMS & HISTORY SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* AVAILABLE ASSESSMENTS (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Available Assessments
            </h2>

            {exams && exams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exams.map((exam: any) => {
                  const existingSubmissionId = submittedExamMap[exam.id];
                  const alreadyTaken = !!existingSubmissionId;
                  return (
                    <div
                      key={exam.id}
                      className={`bg-white rounded-2xl border ${alreadyTaken ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200 hover:border-blue-300"} p-5 flex flex-col justify-between shadow-sm transition-all`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          {alreadyTaken ? (
                            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-100 border border-emerald-200">
                              ✓ COMPLETED
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg text-blue-700 bg-blue-50 border border-blue-200">
                              EXAM
                            </span>
                          )}
                          <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {exam.duration_minutes}m
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-lg leading-snug mb-1">{exam.title}</h3>
                        <p className="text-slate-500 text-xs line-clamp-2 mb-4">{exam.description || "Official college assessment test."}</p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        {!alreadyTaken && (
                          <div className="flex items-center text-xs text-amber-600 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500 shrink-0" />
                            Max Violations: <span className="font-bold text-slate-900 ml-1">{exam.max_violations}</span>
                          </div>
                        )}

                        {alreadyTaken ? (
                          <Button
                            className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs rounded-xl py-2.5 cursor-pointer"
                            onClick={() => setLocation(`/result/${existingSubmissionId}`)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> View Result Report
                          </Button>
                        ) : (
                          <Button
                            className="w-full bg-gradient-to-r from-[#1d4ed8] to-[#0284c7] hover:from-[#1e40af] hover:to-[#0369a1] text-white font-bold text-xs rounded-xl py-2.5 shadow-md shadow-blue-500/20 cursor-pointer"
                            onClick={() => setLocation(`/exam/${exam.id}`)}
                          >
                            <PlayCircle className="w-4 h-4 mr-1.5" /> Start Exam Now
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">No Active Exams Available</p>
                <p className="text-xs text-slate-400 mt-1">Check back soon when an invigilator activates an exam.</p>
              </div>
            )}
          </div>

          {/* SUBMISSION HISTORY (1 Col) */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" /> Exam History
            </h2>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              {submissions && submissions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {submissions.map((sub: any) => {
                    const pct = sub.total_marks ? Math.round((sub.score / sub.total_marks) * 100) : 0;
                    return (
                      <div key={sub.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{sub.exams?.title ?? "Exam"}</p>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {format(new Date(sub.submitted_at), "MMM d, yyyy · HH:mm")}
                            </p>
                          </div>
                          <div className="text-right">
                            {sub.status === "completed" ? (
                              <span className={`font-black text-sm ${pct >= 50 ? "text-emerald-600" : "text-red-500"}`}>{pct}%</span>
                            ) : (
                              <Badge variant="destructive" className="text-[9px]">TERMINATED</Badge>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setLocation(`/result/${sub.id}`)}
                          className="text-xs font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1 mt-1"
                        >
                          View Detailed Report <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No submissions yet.
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 text-center text-xs text-slate-400 space-y-1">
        <p>© 2026 Sphoorthy Engineering College · All rights reserved.</p>
        <p>Powered by <strong className="text-slate-600 font-bold">BigBrains</strong> · DataNauts Club</p>
      </footer>

    </div>
  );
}
