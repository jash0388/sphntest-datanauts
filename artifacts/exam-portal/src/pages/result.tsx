import { useLocation, useParams } from "wouter";
import { useSubmission, useExamQuestions } from "@/hooks/useExamData";
import { 
  Shield, ChevronLeft, Award, ShieldAlert, CheckCircle2, 
  XCircle, AlertCircle, HelpCircle, Check, Info, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Result() {
  const { attemptId: submissionId } = useParams<{ attemptId: string }>();
  const [, setLocation] = useLocation();

  const { data: submission, isLoading: subLoading, error } = useSubmission(submissionId);
  // Only fetch live questions if the submission has no snapshot (backwards compatibility for old results)
  const needsLiveQuestions = !!submission && !submission.question_snapshots?.length;
  const { data: liveQuestions, isLoading: qLoading } = useExamQuestions(
    needsLiveQuestions ? submission?.exam_id : undefined
  );

  // Use snapshots if available; otherwise fall back to live questions
  const questions = submission?.question_snapshots?.length
    ? submission.question_snapshots
    : liveQuestions;

  if (subLoading || (needsLiveQuestions && qLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase">Processing Assessment</p>
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
            {error ? `Error: ${(error as Error).message}` : "No data found."}
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>Back to Home</Button>
      </div>
    );
  }

  const percentage = submission.total_marks ? Math.round((submission.score / submission.total_marks) * 100) : 0;
  const isPass = percentage >= 50;
  const isTerminated = submission.status === "terminated";

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  const timeTaken = (() => {
    const m = Math.floor(submission.time_used_seconds / 60);
    const s = submission.time_used_seconds % 60;
    return `${m}m ${s}s`;
  })();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="text-muted-foreground hover:text-foreground -ml-2 px-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Home</span>
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary opacity-50" />
            <span className="font-medium text-[10px] uppercase tracking-widest text-muted-foreground">Verification Report</span>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-6 mt-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

          {/* Score Hero */}
          <motion.div variants={item} className="text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
               <div className={`w-28 h-28 rounded-full bg-card border-4 ${isTerminated ? "border-red-500" : isPass ? "border-primary" : "border-red-400"} flex items-center justify-center shadow-xl`}>
                  <span className="text-3xl font-black">{isTerminated ? "!!" : `${percentage}%`}</span>
               </div>
               {isPass && !isTerminated && <div className="absolute -top-2 -right-2 bg-primary text-white p-1.5 rounded-full shadow-lg"><Check className="w-4 h-4" /></div>}
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{submission.exams?.title ?? "Technical Assessment"}</h1>
              <p className="text-xs text-muted-foreground font-mono mt-2 uppercase tracking-tighter">
                Session ID: {submission.id.slice(0, 8)} | {format(new Date(submission.submitted_at), "MMM d, HH:mm")}
              </p>
            </div>

            <div className="flex justify-center flex-wrap gap-3 mt-6">
               <Card className="bg-muted/10 border-border/50 py-2 px-4"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Score</p><p className="font-bold">{submission.score} / {submission.total_marks}</p></Card>
               <Card className="bg-muted/10 border-border/50 py-2 px-4"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Duration</p><p className="font-bold">{timeTaken}</p></Card>
               <Card className={`border-border/50 py-2 px-4 ${submission.violations > 0 ? "bg-red-50 border-red-100" : "bg-muted/10"}`}><p className={`text-[10px] font-bold uppercase mb-0.5 ${submission.violations > 0 ? "text-red-600" : "text-muted-foreground"}`}>Violations</p><p className="font-bold">{submission.violations}</p></Card>
            </div>
          </motion.div>

          <hr className="border-border/50" />

          {/* Questions & Answers Section */}
          <motion.div variants={item} className="space-y-6">
             <div className="flex items-center gap-2 px-1">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Review Questions</h2>
             </div>

             <div className="space-y-6">
                {questions && questions.length > 0 ? (
                   questions.map((q, idx) => {
                      const studentAnswer = submission.student_answers?.[q.id];
                      const isCorrect = studentAnswer === q.correct_answer;
                      
                      return (
                        <Card key={q.id} className="bg-card/50 border-border/60 overflow-hidden shadow-sm">
                          <CardHeader className="p-5 pb-3">
                             <div className="flex gap-3">
                                <span className="font-mono text-xs text-primary font-bold mt-1">{String(idx + 1).padStart(2, '0')}</span>
                                <CardTitle className="text-sm border sm:text-base font-semibold leading-relaxed grow">{q.question}</CardTitle>
                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 h-fit rounded border border-border shrink-0">{q.marks} pts</span>
                             </div>
                          </CardHeader>
                          <CardContent className="p-5 pt-0 space-y-3">
                             
                             {/* Student's Answer */}
                             <div className={`p-3 rounded-lg border flex items-start gap-2 ${studentAnswer ? (isCorrect ? "bg-green-50/30 border-green-100/50" : "bg-red-50/30 border-red-100/50") : "bg-muted/20 border-border/40"}`}>
                                <User className={`w-4 h-4 mt-0.5 shrink-0 ${studentAnswer ? (isCorrect ? "text-green-600" : "text-red-600") : "text-muted-foreground"}`} />
                                <div className="text-xs">
                                   <p className={`font-bold uppercase tracking-widest text-[9px] mb-1 ${studentAnswer ? (isCorrect ? "text-green-700" : "text-red-700") : "text-muted-foreground"}`}>Your Answer</p>
                                   <p className="font-medium whitespace-pre-wrap">{studentAnswer || "No answer provided."}</p>
                                </div>
                             </div>

                             {/* Correct Answer (if different or if showing review) */}
                             <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                <div className="text-xs">
                                   <p className="font-bold text-primary uppercase tracking-widest text-[9px] mb-1">Marking Guide (Correct)</p>
                                   <p className="font-medium whitespace-pre-wrap">{q.correct_answer}</p>
                                </div>
                             </div>

                             {q.explanation && (
                               <div className="p-3 rounded-lg bg-muted/20 border border-border/40 flex items-start gap-2">
                                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                  <p className="text-[11px] text-muted-foreground italic leading-relaxed">{q.explanation}</p>
                               </div>
                             )}
                          </CardContent>
                        </Card>
                      )
                   })
                ) : (
                   <p className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/10 rounded-2xl">No question data available for this session.</p>
                )}
             </div>
          </motion.div>

          <motion.div variants={item} className="flex justify-center pt-8 pb-10">
            <Button onClick={() => setLocation("/dashboard")} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/10">
              Return to Home
            </Button>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
