import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useExam, useExamQuestions, useSubmitExam, useMySubmissions } from "@/hooks/useExamData";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type ExamPhase = "pre-form" | "instructions" | "in-progress";

export default function ExamTaking() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile(user?.uid);
  const { toast } = useToast();

  const [phase, setPhase] = useState<ExamPhase>("pre-form");
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [nameError, setNameError] = useState("");
  const [rollError, setRollError] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [breachOverlay, setBreachOverlay] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [violationCount, setViolationCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(() => Date.now());
  const submitExam = useSubmitExam();

  const violationRef = useRef(0);
  const breachOverlayRef = useRef(false);
  const submittedRef = useRef(false);

  const { data: exam, isLoading: examLoading } = useExam(examId);
  const { data: questions, isLoading: questionsLoading } = useExamQuestions(examId);
  const { data: mySubmissions, isLoading: submissionsLoading } = useMySubmissions(user?.uid);

  // Redirect if already submitted this exam
  useEffect(() => {
    if (!mySubmissions || !examId) return;
    const existing = mySubmissions.find((s) => s.exam_id === examId);
    if (existing) setLocation(`/result/${existing.id}`);
  }, [mySubmissions, examId, setLocation]);

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setStudentName(profile.full_name);
      else if (user?.displayName) setStudentName(user.displayName);
      else if (user?.email) setStudentName(user.email.split("@")[0]);
      if (profile.name) setRollNumber(profile.name);
    }
  }, [profile, user]);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [user, authLoading, setLocation]);

  // Start timer once exam loads and we enter in-progress
  useEffect(() => {
    if (exam && phase === "in-progress" && timeLeft === null) {
      setTimeLeft(exam.duration_minutes * 60);
    }
  }, [exam, phase, timeLeft]);

  const answersRef = useRef<Record<string, string>>({});
  answersRef.current = answers;

  const handleSubmitExam = useCallback(
    (forced = false) => {
      if (!user || !exam || !questions) return;
      if (submittedRef.current) return;
      submittedRef.current = true;

      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      let score = 0;
      const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
      const currentAnswers = answersRef.current;

      for (const q of questions) {
        if (q.question_type === "mcq" && q.correct_answer) {
          const given = currentAnswers[q.id];
          if (given && given.trim() === q.correct_answer.trim()) {
            score += q.marks;
          }
        }
      }

      // Snapshot all question data so results survive future question deletions
      const questionSnapshots = questions.map((q) => ({
        id: q.id,
        question: q.question,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks,
        sort_order: q.sort_order,
        explanation: q.explanation ?? null,
      }));

      submitExam.mutate({
        user_id: user.uid,
        exam_id: exam.id,
        score,
        total_marks: totalMarks,
        violations: violationRef.current,
        time_used_seconds: timeTaken,
        status: forced ? "terminated" : "completed",
        student_name: studentName || user.email || "Unknown",
        roll_number: rollNumber,
        student_answers: currentAnswers,
        question_snapshots: questionSnapshots,
      }, {
        onSuccess: (sub) => {
          if (document.fullscreenElement) document.exitFullscreen().catch(console.error);
          setLocation(`/result/${sub.id}`);
        },
        onError: (err) => {
          console.error("Submit error:", err);
          submittedRef.current = false;
          toast({ variant: "destructive", title: "Submit Failed", description: "Could not submit. Please try again." });
        },
      });
    },
    [user, exam, questions, startTime, submitExam, setLocation, toast, studentName, rollNumber]
  );

  // Timer countdown
  useEffect(() => {
    if (phase !== "in-progress" || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmitExam(false); return; }
    const t = setTimeout(() => setTimeLeft((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, handleSubmitExam]);

  // Keep refs in sync with state
  useEffect(() => { violationRef.current = violationCount; }, [violationCount]);
  useEffect(() => { breachOverlayRef.current = breachOverlay; }, [breachOverlay]);

  const handleSubmitExamRef = useRef(handleSubmitExam);
  useEffect(() => { handleSubmitExamRef.current = handleSubmitExam; }, [handleSubmitExam]);

  const examMaxViolationsRef = useRef(exam?.max_violations ?? 3);
  useEffect(() => { if (exam) examMaxViolationsRef.current = exam.max_violations; }, [exam]);

  // Security monitoring (only during in-progress) — uses refs to avoid stale closures
  useEffect(() => {
    if (phase !== "in-progress" || !exam) return;

    const handleBreach = () => {
      if (breachOverlayRef.current) return;
      const newCount = violationRef.current + 1;
      violationRef.current = newCount;
      setViolationCount(newCount);
      breachOverlayRef.current = true;
      setBreachOverlay(true);

      if (newCount >= examMaxViolationsRef.current) {
        handleSubmitExamRef.current(true);
        return;
      }

      setTimeout(() => {
        breachOverlayRef.current = false;
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
  }, [phase, exam]);

  const handleEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setPhase("in-progress");
    } catch (err) {
      console.error(err);
      // Still proceed even if fullscreen fails (mobile)
      setPhase("in-progress");
    }
  };

  const handlePreFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!studentName.trim()) { setNameError("Full name is required"); valid = false; }
    else setNameError("");
    if (!rollNumber.trim()) { setRollError("Roll number is required"); valid = false; }
    else setRollError("");
    if (valid) setPhase("instructions");
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (authLoading || examLoading || questionsLoading || submissionsLoading) return <div className="min-h-screen bg-background" />;
  if (!exam || !questions) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Exam not found.</div>;

  // ─── Phase 1: Name + Roll Number form ────────────────────────────────────────
  if (phase === "pre-form") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-sm w-full space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <User className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{exam.title}</h1>
            <p className="text-muted-foreground text-sm">Confirm your identity before starting</p>
          </div>

          <form onSubmit={handlePreFormSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 bg-card"
                  placeholder="Enter your full name"
                  value={studentName}
                  onChange={(e) => { setStudentName(e.target.value); setNameError(""); }}
                />
              </div>
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Roll Number / Student ID</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 bg-card font-mono"
                  placeholder="e.g. CS-2024-001"
                  value={rollNumber}
                  onChange={(e) => { setRollNumber(e.target.value); setRollError(""); }}
                />
              </div>
              {rollError && <p className="text-xs text-destructive">{rollError}</p>}
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
              <p><span className="text-foreground font-medium">Duration:</span> {exam.duration_minutes} minutes</p>
              <p><span className="text-foreground font-medium">Questions:</span> {questions.length}</p>
              <p><span className="text-foreground font-medium">Max violations:</span> {exam.max_violations} (auto-terminates)</p>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Confirm & Continue
            </Button>
            <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setLocation("/dashboard")}>
              Cancel
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ─── Phase 2: Instructions + fullscreen prompt ────────────────────────────────
  if (phase === "instructions") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-sm w-full text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Ready to Begin?</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This exam requires fullscreen mode. Exiting fullscreen or switching tabs is logged as a security violation.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Student", value: studentName },
              { label: "Roll No.", value: rollNumber },
              { label: "Duration", value: `${exam.duration_minutes} min` },
              { label: "Violations", value: `0 / ${exam.max_violations}` },
            ].map((item) => (
              <div key={item.label} className="bg-muted/50 rounded-lg p-3 border border-border text-left">
                <p className="text-muted-foreground text-xs mb-0.5">{item.label}</p>
                <p className="font-medium text-sm truncate">{item.value}</p>
              </div>
            ))}
          </div>
          <Button size="lg" className="w-full" onClick={handleEnterFullscreen}>
            Enter Fullscreen & Begin
          </Button>
          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setPhase("pre-form")}>
            Edit details
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Phase 3: Exam in progress ────────────────────────────────────────────────
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

      {/* Mobile header */}
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
                  <RadioGroup
                    className="space-y-2 mt-3"
                    value={answers[q.id] || ""}
                    onValueChange={(val) => handleAnswerChange(q.id, val)}
                  >
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
                    className="min-h-[140px] sm:min-h-[180px] mt-3 bg-card border-border/50 focus-visible:ring-primary text-sm sm:text-base leading-relaxed resize-y"
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
