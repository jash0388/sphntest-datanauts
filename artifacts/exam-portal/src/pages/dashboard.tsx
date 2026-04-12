import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  useGetStudentStats, 
  useGetAvailableExams, 
  useListAttempts,
  useStartAttempt
} from "@workspace/api-client-react";
import { signOut, auth } from "@/lib/firebase";
import { LogOut, Activity, Target, ShieldAlert, Award, FileText, Clock, PlayCircle, Shield, History, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [startingExam, setStartingExam] = useState<number | null>(null);

  const startAttemptMutation = useStartAttempt();
  const uid = user?.uid ?? "";

  const { data: stats } = useGetStudentStats({ uid }, { query: { enabled: !!uid } });
  const { data: availableExams } = useGetAvailableExams({ uid }, { query: { enabled: !!uid } });
  const { data: attempts } = useListAttempts({ uid }, { query: { enabled: !!uid } });

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [user, authLoading, setLocation]);

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/");
  };

  const handleStartExam = (examId: number) => {
    if (!user) return;
    setStartingExam(examId);
    startAttemptMutation.mutate({
      data: { firebaseUid: user.uid, examId }
    }, {
      onSuccess: (attempt) => setLocation(`/exam/${attempt.examId}`),
      onSettled: () => setStartingExam(null)
    });
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold tracking-tight text-sm sm:text-base">ExamPortal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <span className="text-xs text-muted-foreground hidden sm:inline-block truncate max-w-[200px]">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground shrink-0 px-2 sm:px-3">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Disconnect</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 mt-6 sm:mt-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 sm:space-y-10">
          
          {/* Stats Row */}
          <motion.div variants={item}>
            <h2 className="text-base sm:text-xl font-medium tracking-tight mb-3 sm:mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Telemetry
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="bg-card/50 border-border">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between text-muted-foreground mb-3">
                    <span className="text-xs sm:text-sm font-medium">Exams Taken</span>
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold">{stats?.totalAttempts ?? 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between text-muted-foreground mb-3">
                    <span className="text-xs sm:text-sm font-medium">Avg. Score</span>
                    <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold">
                    {stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : '--'}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between text-muted-foreground mb-3">
                    <span className="text-xs sm:text-sm font-medium">High Score</span>
                    <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    {stats?.highestScore != null ? `${Math.round(stats.highestScore)}%` : '--'}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-destructive/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-destructive/10 rounded-bl-full pointer-events-none" />
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between text-destructive/80 mb-3">
                    <span className="text-xs sm:text-sm font-medium">Violations</span>
                    <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-destructive">{stats?.totalViolations ?? 0}</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Available Exams */}
            <motion.div variants={item} className="lg:col-span-2 space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-xl font-medium tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Active Deployments
              </h2>
              {availableExams && availableExams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {availableExams.map(exam => (
                    <Card key={exam.id} className="bg-card hover:bg-card/80 transition-colors border-border flex flex-col group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
                      <CardHeader className="pb-3 pl-5">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-xs uppercase tracking-wider font-mono bg-background">
                            {exam.subject}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground font-mono">
                            <Clock className="w-3 h-3 mr-1" />
                            {exam.durationMinutes}m
                          </div>
                        </div>
                        <CardTitle className="text-base sm:text-lg leading-tight">{exam.title}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm line-clamp-2">
                          {exam.description || 'No description provided.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3 mt-auto pl-5">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            Marks: <span className="text-foreground font-medium">{exam.totalMarks}</span>
                          </span>
                          <span className="text-muted-foreground flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1 text-destructive/70" />
                            {exam.violationLimit} violations
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="pl-5">
                        <Button 
                          className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 text-sm"
                          onClick={() => handleStartExam(exam.id)}
                          disabled={startingExam === exam.id}
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          {startingExam === exam.id ? 'Initializing...' : 'Initialize Exam'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-background border-dashed border-border/50">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Shield className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No active deployments available.</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Attempt Log */}
            <motion.div variants={item} className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-xl font-medium tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Attempt Log
              </h2>
              <Card className="bg-card/50 border-border">
                <ScrollArea className="h-[320px] sm:h-[400px]">
                  {attempts && attempts.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {attempts.map(attempt => (
                        <div key={attempt.id} className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <div className="min-w-0">
                              <p className="font-medium text-sm leading-tight mb-1 truncate">{attempt.examTitle}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {format(new Date(attempt.startedAt), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {attempt.status === 'submitted' && attempt.score != null ? (
                                <span className="font-bold text-primary text-sm">
                                  {Math.round((attempt.score / (attempt.totalMarks || 1)) * 100)}%
                                </span>
                              ) : attempt.status === 'in_progress' ? (
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-[10px]">LIVE</Badge>
                              ) : attempt.status === 'security_fail' ? (
                                <Badge variant="destructive" className="text-[10px]">BREACHED</Badge>
                              ) : null}
                            </div>
                          </div>
                          {attempt.violationCount > 0 && (
                            <div className="flex items-center text-[10px] text-destructive uppercase font-mono tracking-wider mt-1">
                              <ShieldAlert className="w-3 h-3 mr-1" />
                              {attempt.violationCount} violations
                            </div>
                          )}
                          {attempt.status === 'submitted' && (
                            <Button 
                              variant="link" size="sm"
                              className="px-0 h-auto mt-1 text-xs text-muted-foreground hover:text-primary"
                              onClick={() => setLocation(`/result/${attempt.id}`)}
                            >
                              View Report →
                            </Button>
                          )}
                          {attempt.status === 'in_progress' && (
                            <Button 
                              variant="link" size="sm"
                              className="px-0 h-auto mt-1 text-xs text-blue-500 hover:text-blue-400"
                              onClick={() => setLocation(`/exam/${attempt.examId}`)}
                            >
                              Resume →
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No logs found.
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
