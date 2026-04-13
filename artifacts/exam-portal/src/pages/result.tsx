import { useLocation, useParams } from "wouter";
import { useSubmission } from "@/hooks/useExamData";
import { Shield, ChevronLeft, Award, ShieldAlert, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Result() {
  const { attemptId: submissionId } = useParams<{ attemptId: string }>();
  const [, setLocation] = useLocation();

  const { data: submission, isLoading, error } = useSubmission(submissionId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase">Loading Result</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="w-10 h-10 text-destructive/60" />
        <div className="text-center">
          <p className="font-medium mb-1">Result unavailable</p>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            {error ? `Error: ${(error as Error).message}` : "Could not load the submission. It may have been removed or access is restricted."}
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
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

  const timeTaken = (() => {
    const m = Math.floor(submission.time_used_seconds / 60);
    const s = submission.time_used_seconds % 60;
    return `${m}m ${s}s`;
  })();

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
          <motion.div variants={item} className="text-center space-y-3 mb-2">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-card border-2 border-border shadow-2xl mb-4 relative">
              <div className={`absolute inset-0 rounded-full border-4 ${isTerminated ? "border-destructive" : isPass ? "border-primary" : "border-destructive"} opacity-30`} />
              <span className="text-2xl sm:text-3xl font-bold">{isTerminated ? "--" : `${percentage}%`}</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-bold tracking-tight px-4">
              {submission.exams?.title ?? "Exam Result"}
            </h1>

            <div className="flex items-center justify-center gap-2">
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
            </div>

            <p className="text-xs text-muted-foreground font-mono">
              Submitted {format(new Date(submission.submitted_at), "MMM d, yyyy 'at' HH:mm")}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: "Score",
                value: `${submission.score} / ${submission.total_marks}`,
                icon: <Award className={`w-5 h-5 ${isPass && !isTerminated ? "text-primary" : "text-muted-foreground"}`} />,
                accent: isPass && !isTerminated,
              },
              {
                label: "Percentage",
                value: isTerminated ? "N/A" : `${percentage}%`,
                icon: isPass && !isTerminated
                  ? <CheckCircle2 className="w-5 h-5 text-primary" />
                  : <XCircle className="w-5 h-5 text-destructive" />,
                accent: isPass && !isTerminated,
              },
              {
                label: "Violations",
                value: submission.violations,
                icon: submission.violations > 0
                  ? <ShieldAlert className="w-5 h-5 text-destructive" />
                  : <Shield className="w-5 h-5 text-primary" />,
                danger: submission.violations > 0,
              },
              {
                label: "Time Taken",
                value: timeTaken,
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
                    {String(stat.value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

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

          {/* Pass/Fail Banner */}
          {!isTerminated && (
            <motion.div variants={item}>
              <div className={`rounded-xl border p-4 sm:p-6 text-center ${isPass ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}`}>
                <p className={`text-lg font-bold ${isPass ? "text-primary" : "text-destructive"}`}>
                  {isPass ? "Congratulations! You passed this exam." : "You did not meet the passing threshold (50%)."}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isPass ? "Your result has been recorded." : "Review the material and try again if retakes are permitted."}
                </p>
              </div>
            </motion.div>
          )}

          <motion.div variants={item} className="flex justify-center pb-4">
            <Button onClick={() => setLocation("/dashboard")} variant="outline" className="border-border hover:border-primary/50">
              Back to Dashboard
            </Button>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
