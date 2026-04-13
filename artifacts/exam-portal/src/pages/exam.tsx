import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useExam, useExamQuestions, useSubmitExam } from "@/hooks/useExamData";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ExamTaking() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile(user?.uid);
  const { toast } = useToast();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [breachOverlay, setBreachOverlay] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [violationCount, setViolationCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(() => Date.now());
  const submitExam = useSubmitExam();

  const { data: exam, isLoading: examLoading } = useExam(examId);
  const { data: questions, isLoading: questionsLoading } = useExamQuestions(examId);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [user, authLoading, setLocation]);

  // Start timer once exam loads
  useEffect(() => {
    if (exam && timeLeft === null) {
      setTimeLeft(exam.duration_minutes * 60);
    }
  }, [exam, timeLeft]);

  const handleSubmitExam = useCallback(
    (forced = false) => {
      if (!user || !exam || !questions) return;

      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      let score = 0;
      const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

      // Auto-grade MCQ questions
      for (const q of questions) {
        if (q.question_type === "mcq" && q.correct_answer) {
          const given = answers[q.id];
          if (given && given.trim() === q.correct_answer.trim()) {
            score += q.marks;
          }
        }
        // Paragraph questions get 0 (no AI grading client-side)
      }

      const studentName = profile
        ? `${profile.display_name || user.email} (${user.email})`
        : user.email ?? "Unknown";

      submitExam.mutate({
        user_id: user.uid,
        exam_id: exam.id,
        score,
        total_marks: totalMarks,
        violations: violationCount,
        time_used_seconds: timeTaken,
        status: forced ? "terminated" : "completed",
        student_name: studentName,
        roll_number: profile?.roll_number ?? "",
      }, {
        onSuccess: (sub) => {
          if (document.fullscreenElement) document.exitFullscreen().catch(console.error);
          setLocation(`/result/${sub.id}`);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Submit Failed", description: "Could not submit. Please try again." });
        },
      });
    },
    [user, exam, questions, answers, profile, violationCount, startTime, submitExam, setLocation, toast]
  );

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || breachOverlay) return;
    if (timeLeft === 0) { handleSubmitExam(false); return; }
    const t = setTimeout(() => setTimeLeft((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, breachOverlay]);

  // Security monitoring
  useEffect(() => {
    if (!exam) return;

    const handleBreach = () => {
      if (breachOverlay) return;
      const newCount = violationCount + 1;
      setViolationCount(newCount);
      setBreachOverlay(true);

      if (newCount >= exam.max_violations) {
        handleSubmitExam(true);
        return;
      }

      setTimeout(() => {
        setBreachOverlay(false);
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(console.error);
        }
      }, 3000);
    };

    const onFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) handleBreach();
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") handleBreach(); };
    const onBlur = () => handleBreach();

    document.addEventListener("fullscreenchange", onFSChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("fullscreenchange", onFSChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [exam, breachOverlay, violationCount, handleSubmitExam]);

  const handleEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) { console.error(err); }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (authLoading || examLoading || questionsLoading) return <div className="min-h-screen bg-background" />;
  if (!exam || !questions) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Exam not found.</div>;

  if (!isFullscreen && !breachOverlay) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-2">{exam.title}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This assessment requires fullscreen mode. Exiting fullscreen or switching tabs will log a security violation.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <p className="text-muted-foreground text-xs mb-1">Duration</p>
              <p className="font-bold">{exam.duration_minutes} min</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <p className="text-muted-foreground text-xs mb-1">Questions</p>
              <p className="font-bold">{questions.length}</p>
            </div>
          </div>
          <Button size="lg" className="w-full" onClick={handleEnterFullscreen}>
            Enter Fullscreen & Begin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col cursor-default select-none">
      <AnimatePresence>
        {breachOverlay && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-destructive flex flex-col items-center justify-center text-destructive-foreground p-6 text-center"
          >
            <ShieldAlert className="w-16 h-16 sm:w-20 sm:h-20 mb-6 animate-pulse" />
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-3">INTEGRITY BREACH</h1>
            <p className="text-base sm:text-xl opacity-90 max-w-md font-mono">
              Unauthorized window activity detected. Violation logged.
            </p>
            <div className="mt-8 text-base font-mono opacity-70">
              Violations: {violationCount} / {exam.max_violations}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile header — two rows */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/50 select-none">
        <div className="flex sm:hidden items-center justify-between px-4 pt-3 pb-2">
          <span className="font-bold text-sm truncate max-w-[55%]">{exam.title}</span>
          <div className="flex items-center gap-1 text-destructive font-mono text-xs font-bold bg-destructive/10 px-2 py-1 rounded border border-destructive/20">
            <ShieldAlert className="w-3 h-3" />
            {violationCount}/{exam.max_violations}
          </div>
        </div>
        <div className="flex sm:hidden items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-1.5 font-mono font-bold text-lg">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={timeLeft !== null && timeLeft < 300 ? "text-destructive animate-pulse" : "text-primary"}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold text-xs" onClick={() => handleSubmitExam(false)} disabled={submitExam.isPending}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {submitExam.isPending ? "Submitting..." : "SUBMIT"}
          </Button>
        </div>

        {/* Desktop header */}
        <div className="hidden sm:flex items-center justify-between py-3 px-6">
          <div className="flex items-center gap-4 min-w-0">
            <span className="font-bold tracking-tight truncate max-w-xs">{exam.title}</span>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-destructive font-mono text-sm font-bold bg-destructive/10 px-3 py-1 rounded border border-destructive/20 shrink-0">
              <ShieldAlert className="w-4 h-4" />
              VIOLATIONS: {violationCount}/{exam.max_violations}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 text-xl font-mono font-bold tracking-wider">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className={timeLeft !== null && timeLeft < 300 ? "text-destructive animate-pulse" : "text-primary"}>
                {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
              </span>
            </div>
            <Button className="bg-primary hover:bg-primary/90 font-bold tracking-wide" onClick={() => handleSubmitExam(false)} disabled={submitExam.isPending}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {submitExam.isPending ? "Submitting..." : "SUBMIT EXAM"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-10 pb-24">
        {questions.map((q, idx) => (
          <div key={q.id} className="space-y-4">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-xs sm:text-sm font-bold font-mono border border-border mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-base sm:text-lg font-medium leading-relaxed">{q.question}</h3>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border shrink-0">
                    {q.marks} pts
                  </span>
                </div>

                {q.question_type === "mcq" && q.options && (
                  <RadioGroup className="space-y-2 mt-3" value={answers[q.id]} onValueChange={(val) => handleAnswerChange(q.id, val)}>
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-3 bg-card p-3 sm:p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer active:bg-muted/40"
                        onClick={() => handleAnswerChange(q.id, opt)}
                      >
                        <RadioGroupItem value={opt} id={`q${q.id}-opt${i}`} />
                        <Label htmlFor={`q${q.id}-opt${i}`} className="flex-1 text-sm sm:text-base cursor-pointer font-normal leading-relaxed">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {(q.question_type === "paragraph" || q.question_type === "code") && (
                  <Textarea
                    className="min-h-[140px] sm:min-h-[180px] mt-3 bg-card border-border/50 focus-visible:ring-primary text-sm sm:text-base leading-relaxed font-sans resize-y"
                    placeholder={q.question_type === "code" ? "Write your code here..." : "Enter your answer here..."}
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
