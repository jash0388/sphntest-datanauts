import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  useGetExam, 
  useStartAttempt, 
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
  
  // Find current in-progress attempt or wait for one to be created
  useEffect(() => {
    if (attempts && examIdNum) {
      const current = attempts.find(a => a.examId === examIdNum && a.status === 'in_progress');
      if (current) {
        setAttemptId(current.id);
        setViolationCount(current.violationCount);
        
        // Calculate time left based on startedAt and exam duration
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

  // Request fullscreen on mount
  useEffect(() => {
    const requestFS = async () => {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        console.error("Fullscreen request failed", err);
      }
    };
    
    // We can't auto-request without user gesture in some browsers, 
    // so we'll show an enter fullscreen button if not full.
  }, []);

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

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || !attemptId || breachOverlay) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attemptId, breachOverlay]);

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
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.error);
        }
        setLocation(`/result/${attemptId}`);
      }
    });
  }, [attemptId, user, exam, timeLeft, setLocation, submitAttemptMutation, toast]);

  // Security Monitoring
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
            // Auto submit on limit reached
            handleAutoSubmit();
          } else {
            // Clear overlay after 3 seconds if not terminated
            setTimeout(() => {
              setBreachOverlay(false);
              // Force back to fullscreen if they left
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
      if (!document.fullscreenElement) {
        handleSecurityBreach();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSecurityBreach();
      }
    };

    const onBlur = () => {
      handleSecurityBreach();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [attemptId, exam, breachOverlay, logViolationMutation, handleAutoSubmit]);

  // Debounced save answer
  const timeoutRefs = useRef<Record<number, NodeJS.Timeout>>({});
  
  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    if (timeoutRefs.current[questionId]) {
      clearTimeout(timeoutRefs.current[questionId]);
    }
    
    timeoutRefs.current[questionId] = setTimeout(() => {
      if (attemptId) {
        saveAnswerMutation.mutate({
          id: attemptId,
          data: { questionId, answerText: value }
        });
      }
    }, 1000);
  };

  const handleSubmit = () => {
    if (!attemptId || !user || !exam) return;
    
    submitAttemptMutation.mutate({
      id: attemptId,
      data: {
        firebaseUid: user.uid,
        timeTakenSeconds: exam.durationMinutes * 60 - (timeLeft || 0)
      }
    }, {
      onSuccess: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.error);
        }
        setLocation(`/result/${attemptId}`);
      }
    });
  };

  if (authLoading || examLoading) return <div className="min-h-screen bg-background" />;

  if (!exam) return <div className="min-h-screen bg-background flex items-center justify-center">Exam not found.</div>;

  if (!isFullscreen && !breachOverlay) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Fullscreen Required</h1>
          <p className="text-muted-foreground text-sm">
            This secure assessment requires a fullscreen environment. 
            Navigating away from the window or exiting fullscreen will result in a security violation.
          </p>
          <Button size="lg" className="w-full" onClick={handleEnterFullscreen}>
            Acknowledge & Enter Fullscreen
          </Button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col cursor-default select-none">
      <AnimatePresence>
        {breachOverlay && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-destructive flex flex-col items-center justify-center text-destructive-foreground p-4 text-center"
          >
            <ShieldAlert className="w-32 h-32 mb-8 animate-pulse" />
            <h1 className="text-6xl font-black tracking-tighter mb-4">INTEGRITY BREACH</h1>
            <p className="text-2xl opacity-90 max-w-2xl font-mono">
              Unauthorized window activity detected. Violation logged.
            </p>
            <div className="mt-12 text-xl font-mono opacity-70">
              Violations: {violationCount} / {exam.violationLimit}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Exam Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/50 py-3 px-6 flex justify-between items-center select-none">
        <div className="flex items-center gap-4">
          <span className="font-bold tracking-tight text-lg">{exam.title}</span>
          <div className="h-4 w-px bg-border mx-2" />
          <div className="flex items-center gap-2 text-destructive font-mono text-sm font-bold bg-destructive/10 px-3 py-1 rounded-sm border border-destructive/20">
            <ShieldAlert className="w-4 h-4" />
            VIOLATIONS: {violationCount}/{exam.violationLimit}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xl font-mono font-bold tracking-wider">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className={timeLeft && timeLeft < 300 ? "text-destructive animate-pulse" : "text-primary"}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
          </div>
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide"
            onClick={handleSubmit}
            disabled={submitAttemptMutation.isPending}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            SUBMIT EXAM
          </Button>
        </div>
      </header>

      {/* Exam Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-8 space-y-12 pb-32">
        {exam.questions.sort((a, b) => a.orderIndex - b.orderIndex).map((q, idx) => (
          <div key={q.id} className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold font-mono border border-border">
                {idx + 1}
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium leading-relaxed max-w-2xl">{q.questionText}</h3>
                  <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border shrink-0">
                    {q.marks} pts
                  </span>
                </div>

                {q.questionType === 'mcq' && q.options && (
                  <RadioGroup 
                    className="space-y-3 mt-4" 
                    value={answers[q.id]} 
                    onValueChange={(val) => handleAnswerChange(q.id, val)}
                  >
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center space-x-3 bg-card p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleAnswerChange(q.id, opt)}>
                        <RadioGroupItem value={opt} id={`q${q.id}-opt${i}`} />
                        <Label htmlFor={`q${q.id}-opt${i}`} className="flex-1 text-base cursor-pointer font-normal leading-relaxed">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {q.questionType === 'paragraph' && (
                  <Textarea 
                    className="min-h-[200px] mt-4 bg-card border-border/50 focus-visible:ring-primary text-base leading-relaxed font-sans resize-y"
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
