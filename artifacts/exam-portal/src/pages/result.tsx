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

  const { data: attempt, isLoading } = useGetAttempt(idNum, { query: { enabled: !!idNum, queryKey: ["getAttempt", idNum] } });
  const { data: exam } = useGetExam(attempt?.examId ?? 0, { query: { enabled: !!attempt?.examId, queryKey: ["getExam", attempt?.examId ?? 0] } });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
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
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')} className="text-muted-foreground hover:text-foreground -ml-4">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary opacity-50" />
            <span className="font-semibold tracking-tight text-sm text-muted-foreground">Analysis Report</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 mt-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

          <div className="text-center space-y-2 mb-12">
            <motion.div variants={item} className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-card border border-border shadow-2xl mb-4 relative">
              <div className={`absolute inset-0 rounded-full border-4 ${isPass ? 'border-primary' : 'border-destructive'} opacity-20`} />
              <span className="text-3xl font-bold">{percentage}%</span>
            </motion.div>
            <motion.h1 variants={item} className="text-3xl font-bold tracking-tight">
              {exam?.title ?? `Exam #${attempt.examId}`}
            </motion.h1>
            <motion.p variants={item} className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
              Status:{" "}
              {attempt.status === 'security_fail'
                ? <span className="text-destructive font-bold">SECURITY BREACH</span>
                : isPass
                ? <span className="text-primary font-bold">PASSED</span>
                : <span className="text-destructive font-bold">FAILED</span>}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={item}>
              <Card className="bg-card border-border h-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Final Score</p>
                    <p className="text-2xl font-bold">
                      {score} <span className="text-lg text-muted-foreground font-normal">/ {totalMarks} pts</span>
                    </p>
                  </div>
                  <Award className={`w-8 h-8 ${isPass ? 'text-primary' : 'text-muted-foreground'}`} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className={`bg-card h-full ${attempt.violationCount > 0 ? 'border-destructive/30' : 'border-border'}`}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Security Violations</p>
                    <p className={`text-2xl font-bold ${attempt.violationCount > 0 ? 'text-destructive' : 'text-primary'}`}>
                      {attempt.violationCount}
                    </p>
                  </div>
                  {attempt.violationCount > 0
                    ? <ShieldAlert className="w-8 h-8 text-destructive opacity-80" />
                    : <Shield className="w-8 h-8 text-primary opacity-80" />}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {attempt.answers.length > 0 && (
            <motion.div variants={item} className="mt-12 space-y-6">
              <h2 className="text-xl font-medium tracking-tight flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" /> Evaluation Breakdown
              </h2>

              <div className="space-y-4">
                {attempt.answers.map((answer, i) => (
                  <Card key={answer.id} className="bg-card/50 border-border overflow-hidden">
                    <div className="p-4 sm:p-6 flex gap-4">
                      <div className="flex flex-col items-center gap-2 pt-1">
                        {answer.isCorrect === true
                          ? <CheckCircle2 className="w-6 h-6 text-primary" />
                          : answer.isCorrect === false
                          ? <XCircle className="w-6 h-6 text-destructive" />
                          : <BrainCircuit className="w-6 h-6 text-muted-foreground" />}
                        <Badge variant="outline" className="font-mono text-[10px] px-1 bg-background">
                          Q{i + 1}
                        </Badge>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground mb-1">Your Response:</p>
                            <p className="text-muted-foreground bg-background/50 p-3 rounded border border-border/50 text-sm">
                              {answer.answerText || <span className="italic opacity-50">No response provided</span>}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-sm bg-muted px-2 py-1 rounded border border-border">
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
