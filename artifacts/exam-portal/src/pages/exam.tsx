import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  useGetExam, 
  useSaveAnswer, 
  useSubmitAttempt, 
  useLogViolation,
  useListAttempts
} from "@workspace/api-client-react";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ExamTaking() {
  const { examId } = useParams();
  const examIdNum = parseInt(examId || "0", 10);
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [breachOverlay, setBreachOverlay] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [violationCount, setViolationCount] = useState(0);
  
  const saveAnswerMutation = useSaveAnswer();
  const submitAttemptMutation = useSubmitAttempt();
  const logViolationMutation = useLogViolation();

  const { data: exam, isLoading: examLoading } = useGetExam(examIdNum, { query: { enabled: !!examIdNum } });
  const { data: attempts } = useListAttempts({ uid: user?.uid ?? "" }, { query: { enabled: !!user?.uid } });
  
  useEffect(() => {
    if (attempts && examIdNum) {
      const current = attempts.find(a => a.examId === examIdNum && a.status === 'in_progress');
      if (current) {
        setAttemptId(current.id);
        setViolationCount(current.violationCount);
        if (exam) {
          const startedAt = new Date(current.startedAt).getTime();
          const durationMs = exam.durationMinutes * 60 * 1000;
          const endAt = startedAt + durationMs;
          const now = new Date().getTime();
          const remainingSeconds = Math.max(0, Math.floor((endAt - now) / 1000));
          setTimeLeft(remainingSeconds);
        }
      }
    }
  }, [attempts, examIdNum, exam]);

  const handleEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoSubmit = useCallback(() => {
    if (!attemptId || !user) return;
    submitAttemptMutation.mutate({
      id: attemptId,
      data: {
        firebaseUid: user.uid,
        timeTakenSeconds: exam ? exam.durationMinutes * 60 - (timeLeft || 0) : 0
      }
    }, {
      onSuccess: () => {
        toast({ title: "Exam Submitted", description: "Time is up. Exam auto-submitted." });
        if (document.fullscreenElement) document.exitFullscreen().catch(console.error);
        setLocation(`/result/${attemptId}`);
      }
    });
  }, [attemptId, user, exam, timeLeft, setLocation, submitAttemptMutation, toast]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || !attemptId || breachOverlay) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) { clearInterval(timer); handleAutoSubmit(); return 0; }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, attemptId, breachOverlay]);

  useEffect(() => {
    if (!attemptId || !exam) return;

    const handleSecurityBreach = () => {
      if (breachOverlay) return;
      setBreachOverlay(true);
      logViolationMutation.mutate({
        id: attemptId,
        data: { violationType: 'tab_switch' }
      }, {
        onSuccess: (res) => {
          setViolationCount(res.violationCount);
          if (res.shouldTerminate || res.violationCount >= exam.violationLimit) {
            handleAutoSubmit();
          } else {
            setTimeout(() => {
              setBreachOverlay(false);
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(e => console.error(e));
              }
            }, 3000);
          }
        }
      });
    };

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) handleSecurityBreach();
    };
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') handleSecurityBreach(); };
    const onBlur = () => handleSecurityBreach();

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [attemptId, exam, breachOverlay, logViolationMutation, handleAutoSubmit]);

  const timeoutRefs = useRef<Record<number, NodeJS.Timeout>>({});
  
  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (timeoutRefs.current[questionId]) clearTimeout(timeoutRefs.current[questionId]);
    timeoutRefs.current[questionId] = setTimeout(() => {
      if (attemptId) {
        saveAnswerMutation.mutate({ id: attemptId, data: { questionId, answerText: value } });
      }
    }, 1000);
  };

  const handleSubmit = () => {
    if (!attemptId || !user || !exam) return;
    submitAttemptMutation.mutate({
      id: attemptId,
      data: { firebaseUid: user.uid, timeTakenSeconds: exam.durationMinutes * 60 - (timeLeft || 0) }
    }, {
      onSuccess: () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(console.error);
        setLocation(`/result/${attemptId}`);
      }
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (authLoading || examLoading) return <div className="min-h-screen bg-background" />;
  if (!exam) return <div className="min-h-screen bg-background flex items-center justify-center">Exam not found.</div>;

  if (!isFullscreen && !breachOverlay) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-2">Fullscreen Required</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This assessment requires fullscreen mode. Exiting fullscreen or switching tabs will log a security violation.
            </p>
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
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-destructive flex flex-col items-center justify-center text-destructive-foreground p-6 text-center"
          >
            <ShieldAlert className="w-16 h-16 sm:w-24 sm:h-24 mb-6 animate-pulse" />
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-3">INTEGRITY BREACH</h1>
            <p className="text-base sm:text-xl opacity-90 max-w-md font-mono">
              Unauthorized window activity detected. Violation logged.
            </p>
            <div className="mt-8 text-base font-mono opacity-70">
              Violations: {violationCount} / {exam.violationLimit}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exam Header — two rows on mobile */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/50 select-none">
        {/* Row 1: title + violations */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 sm:hidden">
          <span className="font-bold text-sm truncate max-w-[55%]">{exam.title}</span>
          <div className="flex items-center gap-1 text-destructive font-mono text-xs font-bold bg-destructive/10 px-2 py-1 rounded border border-destructive/20">
            <ShieldAlert className="w-3 h-3" />
            {violationCount}/{exam.violationLimit}
          </div>
        </div>
        {/* Row 2 mobile: timer + submit */}
        <div className="flex items-center justify-between px-4 pb-3 sm:hidden">
          <div className="flex items-center gap-1.5 font-mono font-bold text-lg tracking-wider">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={timeLeft && timeLeft < 300 ? "text-destructive animate-pulse" : "text-primary"}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
          </div>
          <Button 
            size="sm"
            className="bg-primary hover:bg-primary/90 font-bold tracking-wide text-xs"
            onClick={handleSubmit}
            disabled={submitAttemptMutation.isPending}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            SUBMIT
          </Button>
        </div>

        {/* Single row on sm+ */}
        <div className="hidden sm:flex items-center justify-between py-3 px-6">
          <div className="flex items-center gap-4 min-w-0">
            <span className="font-bold tracking-tight text-base truncate max-w-xs">{exam.title}</span>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-destructive font-mono text-sm font-bold bg-destructive/10 px-3 py-1 rounded border border-destructive/20 shrink-0">
              <ShieldAlert className="w-4 h-4" />
              VIOLATIONS: {violationCount}/{exam.violationLimit}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 text-xl font-mono font-bold tracking-wider">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className={timeLeft && timeLeft < 300 ? "text-destructive animate-pulse" : "text-primary"}>
                {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
              </span>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide"
              onClick={handleSubmit}
              disabled={submitAttemptMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              SUBMIT EXAM
            </Button>
          </div>
        </div>
      </header>

      {/* Exam Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-10 pb-24">
        {exam.questions.sort((a, b) => a.orderIndex - b.orderIndex).map((q, idx) => (
          <div key={q.id} className="space-y-4">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-xs sm:text-sm font-bold font-mono border border-border mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 space-y-4 min-w-0">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-base sm:text-lg font-medium leading-relaxed">{q.questionText}</h3>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border shrink-0">
                    {q.marks} pts
                  </span>
                </div>

                {q.questionType === 'mcq' && q.options && (
                  <RadioGroup 
                    className="space-y-2 mt-3" 
                    value={answers[q.id]} 
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

                {q.questionType === 'paragraph' && (
                  <Textarea 
                    className="min-h-[160px] sm:min-h-[200px] mt-3 bg-card border-border/50 focus-visible:ring-primary text-sm sm:text-base leading-relaxed font-sans resize-y"
                    placeholder="Enter your answer here..."
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
