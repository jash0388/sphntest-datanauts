import { useLocation, useParams } from "wouter";
import { useSubmission } from "@/hooks/useExamData";
import { Shield, ChevronLeft, Award, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Result() {
  const { attemptId: submissionId } = useParams<{ attemptId: string }>();
  const [, setLocation] = useLocation();

  const { data: submission, isLoading } = useSubmission(submissionId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        Result not found.
      </div>
    );
  }

  const percentage = submission.total_marks
    ? Math.round((submission.score / submission.total_marks) * 100)
    : 0;
  const isPass = percentage >= 50;
  const isTerminated = submission.status === "terminated";

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="text-muted-foreground hover:text-foreground -ml-2 px-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Dashboard</span>
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary opacity-50" />
            <span className="font-medium text-xs sm:text-sm text-muted-foreground">Result Report</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 mt-6 sm:mt-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">

          {/* Score Hero */}
          <div className="text-center space-y-3 mb-8">
            <motion.div
              variants={item}
              className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-card border-2 border-border shadow-2xl mb-4 relative"
            >
              <div className={`absolute inset-0 rounded-full border-4 ${isTerminated ? "border-destructive" : isPass ? "border-primary" : "border-destructive"} opacity-20`} />
              <span className="text-2xl sm:text-3xl font-bold">{isTerminated ? "--" : `${percentage}%`}</span>
            </motion.div>

            <motion.h1 variants={item} className="text-xl sm:text-3xl font-bold tracking-tight px-4">
              {submission.exams?.title ?? "Exam Result"}
            </motion.h1>

            <motion.div variants={item} className="flex items-center justify-center gap-2">
              {isTerminated ? (
                <span className="inline-flex items-center gap-1.5 text-destructive font-bold text-sm font-mono uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" /> Terminated — Security Breach
                </span>
              ) : isPass ? (
                <span className="inline-flex items-center gap-1.5 text-primary font-bold text-sm font-mono uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Passed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-destructive font-bold text-sm font-mono uppercase tracking-wider">
                  <XCircle className="w-4 h-4" /> Failed
                </span>
              )}
            </motion.div>

            <motion.p variants={item} className="text-xs text-muted-foreground font-mono">
              Submitted {format(new Date(submission.submitted_at), "MMM d, yyyy 'at' HH:mm")}
            </motion.p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: "Score",
                value: `${submission.score} / ${submission.total_marks}`,
                icon: <Award className={`w-5 h-5 ${isPass ? "text-primary" : "text-muted-foreground"}`} />,
              },
              {
                label: "Percentage",
                value: isTerminated ? "N/A" : `${percentage}%`,
                icon: isPass ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <XCircle className="w-5 h-5 text-destructive" />,
                accent: isPass && !isTerminated,
              },
              {
                label: "Violations",
                value: submission.violations,
                icon: submission.violations > 0 ? <ShieldAlert className="w-5 h-5 text-destructive" /> : <Shield className="w-5 h-5 text-primary" />,
                danger: submission.violations > 0,
              },
              {
                label: "Time Taken",
                value: (() => {
                  const m = Math.floor(submission.time_used_seconds / 60);
                  const s = submission.time_used_seconds % 60;
                  return `${m}m ${s}s`;
                })(),
                icon: <Shield className="w-5 h-5 text-muted-foreground" />,
              },
            ].map((stat) => (
              <Card key={stat.label} className={`bg-card ${stat.danger ? "border-destructive/30" : "border-border"}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    {stat.icon}
                  </div>
                  <p className={`text-lg sm:text-xl font-bold ${stat.danger ? "text-destructive" : stat.accent ? "text-primary" : ""}`}>
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Student info */}
          <motion.div variants={item}>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Student Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                    <p className="font-medium">{submission.student_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Roll Number</p>
                    <p className="font-medium font-mono">{submission.roll_number || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item} className="flex justify-center">
            <Button onClick={() => setLocation("/dashboard")} variant="outline" className="border-border hover:border-primary/50">
              Back to Dashboard
            </Button>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
