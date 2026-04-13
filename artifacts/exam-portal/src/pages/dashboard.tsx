import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAvailableExams, useMySubmissions, useMyStats } from "@/hooks/useExamData";
import { signOut, auth } from "@/lib/firebase";
import { LogOut, Activity, Target, ShieldAlert, Award, FileText, Clock, PlayCircle, Shield, History, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const { data: profile } = useProfile(user?.uid);
  const { data: exams } = useAvailableExams();
  const { data: submissions } = useMySubmissions(user?.uid);
  const { data: stats } = useMyStats(user?.uid);

  // Build a map: examId → submissionId for quick lookup
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

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold tracking-tight text-sm sm:text-base">ExamPortal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="hidden sm:block text-right min-w-0">
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</p>
              {profile && <p className="text-xs text-foreground font-medium truncate max-w-[180px]">{profile.college}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground shrink-0 px-2 sm:px-3">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 mt-6 sm:mt-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 sm:space-y-10">

          {/* Welcome */}
          <motion.div variants={item}>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile ? `${profile.college} · ${profile.department} · ${profile.roll_number}` : user.email}
            </p>
          </motion.div>

          {/* Stats */}
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
                  {stat.danger && <div className="absolute top-0 right-0 w-12 h-12 bg-destructive/10 rounded-bl-full pointer-events-none" />}
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

            {/* Available Exams */}
            <motion.div variants={item} className="lg:col-span-2 space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-medium tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Available Exams
              </h2>
              {exams && exams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {exams.map((exam) => {
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
                            <Button
                              className="w-full bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 text-sm"
                              onClick={() => setLocation(`/result/${existingSubmissionId}`)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              View Result
                            </Button>
                          ) : (
                            <Button
                              className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 text-sm"
                              onClick={() => setLocation(`/exam/${exam.id}`)}
                            >
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

            {/* Submission History */}
            <motion.div variants={item} className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-medium tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> History
              </h2>
              <Card className="bg-card/50 border-border">
                <ScrollArea className="h-[300px] sm:h-[380px]">
                  {submissions && submissions.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {submissions.map((sub) => {
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
                            {sub.violations > 0 && (
                              <div className="flex items-center text-[10px] text-destructive font-mono mt-1">
                                <ShieldAlert className="w-3 h-3 mr-1" />
                                {sub.violations} violations
                              </div>
                            )}
                            <Button
                              variant="link" size="sm"
                              className="px-0 h-auto mt-1 text-xs text-muted-foreground hover:text-primary"
                              onClick={() => setLocation(`/result/${sub.id}`)}
                            >
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
