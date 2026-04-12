import { useLocation, useParams } from "wouter";
import { useGetAttempt, useGetExam } from "@workspace/api-client-react";
import { Shield, ChevronLeft, Award, ShieldAlert, CheckCircle2, XCircle, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Result() {
  const { attemptId } = useParams();
  const [, setLocation] = useLocation();
  const idNum = parseInt(attemptId || "0", 10);

  const { data: attempt, isLoading } = useGetAttempt(idNum, {
    query: { enabled: !!idNum, queryKey: ["getAttempt", idNum] }
  });
  const { data: exam } = useGetExam(attempt?.examId ?? 0, {
    query: { enabled: !!attempt?.examId, queryKey: ["getExam", attempt?.examId ?? 0] }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        Attempt not found.
      </div>
    );
  }

  const score = attempt.score ?? 0;
  const totalMarks = exam?.totalMarks ?? 100;
  const percentage = Math.round((score / totalMarks) * 100);
  const isPass = percentage >= 50;

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
        <div className="container max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Button
            variant="ghost" size="sm"
            onClick={() => setLocation('/dashboard')}
            className="text-muted-foreground hover:text-foreground -ml-2 px-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Dashboard</span>
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary opacity-50" />
            <span className="font-medium text-xs sm:text-sm text-muted-foreground">Analysis Report</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 mt-6 sm:mt-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">

          {/* Score Hero */}
          <div className="text-center space-y-2 mb-8 sm:mb-12">
            <motion.div
              variants={item}
              className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-card border border-border shadow-2xl mb-4 relative"
            >
              <div className={`absolute inset-0 rounded-full border-4 ${isPass ? 'border-primary' : 'border-destructive'} opacity-20`} />
              <span className="text-2xl sm:text-3xl font-bold">{percentage}%</span>
            </motion.div>
            <motion.h1 variants={item} className="text-xl sm:text-3xl font-bold tracking-tight px-4">
              {exam?.title ?? `Exam #${attempt.examId}`}
            </motion.h1>
            <motion.p variants={item} className="text-muted-foreground font-mono text-xs sm:text-sm uppercase tracking-wider">
              Status:{" "}
              {attempt.status === 'security_fail'
                ? <span className="text-destructive font-bold">SECURITY BREACH</span>
                : isPass
                ? <span className="text-primary font-bold">PASSED</span>
                : <span className="text-destructive font-bold">FAILED</span>}
            </motion.p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <motion.div variants={item}>
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Final Score</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {score}{" "}
                      <span className="text-sm sm:text-lg text-muted-foreground font-normal">/ {totalMarks} pts</span>
                    </p>
                  </div>
                  <Award className={`w-7 h-7 sm:w-8 sm:h-8 ${isPass ? 'text-primary' : 'text-muted-foreground'}`} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className={`bg-card ${attempt.violationCount > 0 ? 'border-destructive/30' : 'border-border'}`}>
                <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Security Violations</p>
                    <p className={`text-xl sm:text-2xl font-bold ${attempt.violationCount > 0 ? 'text-destructive' : 'text-primary'}`}>
                      {attempt.violationCount}
                    </p>
                  </div>
                  {attempt.violationCount > 0
                    ? <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-destructive opacity-80" />
                    : <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary opacity-80" />}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Answer Breakdown */}
          {attempt.answers.length > 0 && (
            <motion.div variants={item} className="space-y-4 sm:space-y-6">
              <h2 className="text-base sm:text-xl font-medium tracking-tight flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Evaluation Breakdown
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {attempt.answers.map((answer, i) => (
                  <Card key={answer.id} className="bg-card/50 border-border overflow-hidden">
                    <div className="p-4 sm:p-6">
                      {/* Mobile: vertical stack; Desktop: horizontal flex */}
                      <div className="flex gap-3 sm:gap-4">
                        <div className="flex flex-col items-center gap-2 pt-0.5 shrink-0">
                          {answer.isCorrect === true
                            ? <CheckCircle2 className="w-5 h-5 text-primary" />
                            : answer.isCorrect === false
                            ? <XCircle className="w-5 h-5 text-destructive" />
                            : <BrainCircuit className="w-5 h-5 text-muted-foreground" />}
                          <Badge variant="outline" className="font-mono text-[10px] px-1.5 bg-background">
                            Q{i + 1}
                          </Badge>
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground mb-1">Your Response:</p>
                              <p className="text-muted-foreground bg-background/50 p-2 sm:p-3 rounded border border-border/50 text-xs sm:text-sm leading-relaxed break-words">
                                {answer.answerText || <span className="italic opacity-50">No response provided</span>}
                              </p>
                            </div>
                            <span className="font-mono font-bold text-xs bg-muted px-2 py-1 rounded border border-border shrink-0">
                              {answer.marksAwarded ?? 0} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

        </motion.div>
      </main>
    </div>
  );
}
