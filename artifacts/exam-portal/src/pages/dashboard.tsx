import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAvailableExams, useMySubmissions, useMyStats } from "@/hooks/useExamData";
import { signOut, auth } from "@/lib/firebase";
import { 
  LogOut, Activity, Target, ShieldAlert, Award, FileText, Clock, 
  PlayCircle, Shield, History, AlertTriangle, CheckCircle2, User,
  ArrowRight, TrendingUp, BookOpen, Layout, Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

// --- Desktop UI Components (Old Style) ---
function DesktopDashboard({ user, profile, exams, submissions, stats, submittedExamMap, handleLogout, setLocation }: any) {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain rounded-md" />
            <span className="font-semibold tracking-tight text-sm sm:text-base">SPHN Web Test</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="hidden sm:block text-right min-w-0">
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</p>
              {profile && <p className="text-xs text-foreground font-medium truncate max-w-[180px]">{profile.college}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 mt-6 sm:mt-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 sm:space-y-10">
          <motion.div variants={item}>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, {user?.email?.split("@")[0] || "Scholar"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile ? `Roll Number: ${profile.name}` : user.email}
            </p>
          </motion.div>

          <motion.div variants={item}>
            <h2 className="text-base sm:text-lg font-medium tracking-tight mb-3 sm:mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Exams Taken", value: stats?.totalAttempts ?? 0, icon: <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
                { label: "Avg. Score", value: stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : "--", icon: <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
                { label: "High Score", value: stats?.highestScore != null ? `${Math.round(stats.highestScore)}%` : "--", icon: <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />, accent: true },
                { label: "Violations", value: stats?.totalViolations ?? 0, icon: <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, danger: true },
              ].map((stat) => (
                <Card key={stat.label} className={`bg-card/50 ${stat.danger ? "border-destructive/20" : "border-border"} relative overflow-hidden`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className={`flex items-center justify-between mb-3 ${stat.danger ? "text-destructive/80" : "text-muted-foreground"}`}>
                      <span className="text-xs sm:text-sm font-medium">{stat.label}</span>
                      {stat.icon}
                    </div>
                    <div className={`text-2xl sm:text-3xl font-bold ${stat.danger ? "text-destructive" : stat.accent ? "text-primary" : ""}`}>
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <motion.div variants={item} className="lg:col-span-2 space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-medium tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Available Exams
              </h2>
              {exams && exams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {exams.map((exam: any) => {
                    const existingSubmissionId = submittedExamMap[exam.id];
                    const alreadyTaken = !!existingSubmissionId;
                    return (
                      <Card key={exam.id} className={`bg-card border-border flex flex-col group relative overflow-hidden transition-colors ${alreadyTaken ? "opacity-80" : "hover:bg-card/80"}`}>
                        <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${alreadyTaken ? "bg-green-500/50" : "bg-primary/40 group-hover:bg-primary"}`} />
                        <CardHeader className="pb-3 pl-5">
                          <div className="flex justify-between items-start mb-2">
                            {alreadyTaken
                              ? <Badge variant="secondary" className="text-xs font-mono text-green-600 bg-green-500/10 border-green-500/20 border">COMPLETED</Badge>
                              : <Badge variant="outline" className="text-xs font-mono bg-background">EXAM</Badge>
                            }
                            <div className="flex items-center text-xs text-muted-foreground font-mono">
                              <Clock className="w-3 h-3 mr-1" />
                              {exam.duration_minutes}m
                            </div>
                          </div>
                          <CardTitle className="text-base sm:text-lg leading-tight">{exam.title}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm line-clamp-2">
                            {exam.description || "No description provided."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-3 mt-auto pl-5">
                          {!alreadyTaken && (
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                              <AlertTriangle className="w-3 h-3 mr-1 text-destructive/70" />
                              Max violations: <span className="text-foreground font-medium ml-1">{exam.max_violations}</span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pl-5">
                          {alreadyTaken ? (
                            <Button className="w-full bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 text-sm" onClick={() => setLocation(`/result/${existingSubmissionId}`)}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              View Result
                            </Button>
                          ) : (
                            <Button className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 text-sm" onClick={() => setLocation(`/exam/${exam.id}`)}>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Start Exam
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-background border-dashed border-border/50">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Shield className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No active exams available.</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            <motion.div variants={item} className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-medium tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> History
              </h2>
              <Card className="bg-card/50 border-border">
                <ScrollArea className="h-[300px] sm:h-[380px]">
                  {submissions && submissions.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {submissions.map((sub: any) => {
                        const pct = sub.total_marks ? Math.round((sub.score / sub.total_marks) * 100) : 0;
                        return (
                          <div key={sub.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <div className="min-w-0">
                                <p className="font-medium text-sm leading-tight mb-0.5 truncate">
                                  {sub.exams?.title ?? "Exam"}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {format(new Date(sub.submitted_at), "MMM d, yyyy HH:mm")}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                {sub.status === "completed" ? (
                                  <span className={`font-bold text-sm ${pct >= 50 ? "text-primary" : "text-destructive"}`}>{pct}%</span>
                                ) : sub.status === "terminated" ? (
                                  <Badge variant="destructive" className="text-[10px]">TERMINATED</Badge>
                                ) : null}
                              </div>
                            </div>
                            <Button variant="link" size="sm" className="px-0 h-auto mt-1 text-xs text-muted-foreground hover:text-primary" onClick={() => setLocation(`/result/${sub.id}`)}>
                              View Report →
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No submissions yet.
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// --- Mobile UI Components (Premium Dark) ---
function MobileDashboard({ user, profile, exams, submissions, stats, submittedExamMap, handleLogout, setLocation }: any) {
  const availableExams = exams?.filter((e: any) => !submittedExamMap[e.id]) ?? [];
  const completedExams = exams?.filter((e: any) => !!submittedExamMap[e.id]) ?? [];

  return (
    <div className="min-h-screen bg-background font-body text-foreground pb-28 relative overflow-x-hidden">
      {/* Ambient glows */}
      <div className="fixed top-0 left-0 -z-10 w-[300px] h-[300px]" style={{ background: "radial-gradient(circle at 20% 20%, rgba(79,126,245,0.12) 0%, transparent 60%)" }} />
      <div className="fixed bottom-24 right-0 -z-10 w-[200px] h-[200px]" style={{ background: "radial-gradient(circle at 80% 80%, rgba(79,126,245,0.08) 0%, transparent 60%)" }} />

      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl" style={{ background: "rgba(8,8,15,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-5 h-16 max-w-xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-bold text-foreground font-headline tracking-tight">SPHN Web Test</span>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}>
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="pt-20 px-5 max-w-xl mx-auto space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="pt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Student Dashboard</p>
          <h1 className="font-headline text-3xl font-extrabold text-foreground tracking-tight">
            Welcome, {user.email?.split("@")[0]}
          </h1>
          {profile && <p className="text-muted-foreground text-sm mt-1">Roll No: {profile.name}</p>}
        </motion.div>

        {/* Stats Row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }} className="grid grid-cols-3 gap-3">
          {[
            { label: "Taken", value: stats?.totalAttempts ?? 0 },
            { label: "Avg", value: stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : "--" },
            { label: "Best", value: stats?.highestScore != null ? `${Math.round(stats.highestScore)}%` : "--", accent: true },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className={`text-xl font-bold ${s.accent ? "text-primary" : "text-foreground"}`}>{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Available Exams */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }} className="space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Available Assessments
          </h3>
          {availableExams.length > 0 ? (
            <div className="space-y-3">
              {availableExams.map((exam: any, i: number) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                  className="rounded-2xl p-5 group transition-all duration-200 active:scale-[0.99]"
                  style={{ background: "linear-gradient(145deg, rgba(19,19,31,0.9) 0%, rgba(13,13,22,0.95) 100%)", border: "1px solid rgba(79,126,245,0.15)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg text-primary" style={{ background: "rgba(79,126,245,0.12)", border: "1px solid rgba(79,126,245,0.2)" }}>CORE PAPER</span>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs font-mono">
                      <Clock className="w-3 h-3" />{exam.duration_minutes}m
                    </div>
                  </div>
                  <h4 className="font-headline text-lg font-bold text-foreground mb-1">{exam.title}</h4>
                  <p className="text-muted-foreground text-sm mb-5 line-clamp-2">{exam.description || "Comprehensive technical assessment."}</p>
                  <button
                    onClick={() => setLocation(`/exam/${exam.id}`)}
                    className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #4f7ef5 0%, #3d6bd4 100%)", boxShadow: "0 4px 20px rgba(79,126,245,0.4), 0 1px 0 rgba(255,255,255,0.1) inset" }}
                  >
                    Secure Start <PlayCircle className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center rounded-2xl space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto opacity-30" />
              <p className="text-muted-foreground text-sm font-medium">No tests available for now.</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Stay tuned for updates!</p>
            </div>
          )}
        </motion.section>

        {/* Completed Exams */}
        {completedExams.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" /> Completed
            </h3>
            <div className="space-y-2">
              {completedExams.map((exam: any) => {
                const subId = submittedExamMap[exam.id];
                return (
                  <button key={exam.id} onClick={() => setLocation(`/result/${subId}`)} className="w-full text-left rounded-2xl p-4 flex items-center justify-between transition-all active:scale-[0.99]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(79,126,245,0.12)" }}>
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm text-foreground truncate max-w-[180px]">{exam.title}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 px-5 pb-6 pt-3" style={{ background: "linear-gradient(to top, rgba(8,8,15,0.98) 60%, rgba(8,8,15,0) 100%)" }}>
        <div className="flex justify-around items-center rounded-2xl px-2 py-3 max-w-xl mx-auto" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
          {[
            { icon: <Layout className="w-5 h-5" />, label: "Home", active: true, onClick: () => {} },
            { icon: <Activity className="w-5 h-5" />, label: "Results", onClick: () => setLocation("/metrics") },
            { icon: <User className="w-5 h-5" />, label: "Profile", onClick: () => setLocation("/profile") },
          ].map((nav) => (
            <button key={nav.label} onClick={nav.onClick} className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all active:scale-95" style={nav.active ? { background: "rgba(79,126,245,0.15)", color: "#4f7ef5" } : { color: "rgba(255,255,255,0.3)" }}>
              {nav.icon}
              <span className="text-[9px] font-bold uppercase tracking-widest">{nav.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// --- Combined Dashboard Component ---
export default function Dashboard() {
  const isMobile = useIsMobile();
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
    await signOut(auth);
    setLocation("/");
  };

  if (authLoading || !user) return null;

  const props = { user, profile, exams, submissions, stats, submittedExamMap, handleLogout, setLocation };

  return isMobile ? <MobileDashboard {...props} /> : <DesktopDashboard {...props} />;
}
