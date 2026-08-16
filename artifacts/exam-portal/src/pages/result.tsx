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

  // Snapshots are stored inside student_answers under a reserved key
  const snapshots: any[] | undefined = submission?.student_answers?.__question_snapshots__;

  // Only fetch live questions when no snapshot exists
  const needsLiveQuestions = !!submission && !snapshots?.length;
  const { data: liveQuestions, isLoading: qLoading } = useExamQuestions(
    needsLiveQuestions ? submission?.exam_id : undefined
  );

  const questions = snapshots?.length ? snapshots : liveQuestions;

  if (subLoading || (needsLiveQuestions && qLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-3 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase font-bold">Processing Assessment</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6 font-sans">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <div className="text-center">
          <p className="font-bold text-slate-900 mb-1">Result Unavailable</p>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
            {error ? `Error: ${(error as Error).message}` : "No assessment data found."}
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="rounded-xl font-bold border-slate-300">
          Back to Home
        </Button>
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="text-slate-600 hover:text-slate-900 font-bold -ml-2 px-2.5 rounded-xl">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Home</span>
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1d4ed8]" />
            <span className="font-bold text-[11px] uppercase tracking-widest text-slate-500">Official Verification Report</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

          {/* Score Hero */}
          <motion.div variants={item} className="text-center space-y-4 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="relative inline-flex items-center justify-center">
               <div className={`w-28 h-28 rounded-full bg-white border-4 ${isTerminated ? "border-red-500 text-red-600" : isPass ? "border-[#1d4ed8] text-[#1d4ed8]" : "border-red-500 text-red-600"} flex items-center justify-center shadow-lg`}>
                  <span className="text-3xl font-black">{isTerminated ? "!!" : `${percentage}%`}</span>
               </div>
               {isPass && !isTerminated && (
                 <div className="absolute -top-1 -right-1 bg-[#1d4ed8] text-white p-1.5 rounded-full shadow-md">
                   <Check className="w-4 h-4 stroke-[3]" />
                 </div>
               )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{submission.exams?.title ?? "Technical Assessment"}</h1>
              <p className="text-xs text-slate-500 font-mono mt-1.5 uppercase font-semibold">
                Session ID: {submission.id.slice(0, 8)} · {format(new Date(submission.submitted_at), "MMM d, yyyy · HH:mm")}
              </p>
            </div>

            <div className="flex justify-center flex-wrap gap-3 pt-2">
               <div className="bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-5 text-center min-w-[100px]">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Score</p>
                 <p className="font-black text-slate-900 text-base">{submission.score} / {submission.total_marks}</p>
               </div>
               <div className="bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-5 text-center min-w-[100px]">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Duration</p>
                 <p className="font-black text-slate-900 text-base">{timeTaken}</p>
               </div>
               <div className={`border rounded-2xl py-2.5 px-5 text-center min-w-[100px] ${submission.violations > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
                 <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${submission.violations > 0 ? "text-red-700" : "text-slate-500"}`}>Violations</p>
                 <p className={`font-black text-base ${submission.violations > 0 ? "text-red-600" : "text-slate-900"}`}>{submission.violations}</p>
               </div>
            </div>
          </motion.div>

          {/* Questions & Answers Section */}
          <motion.div variants={item} className="space-y-6">
             <div className="flex items-center gap-2 px-1">
                <HelpCircle className="w-5 h-5 text-[#1d4ed8]" />
                <h2 className="text-xl font-black text-slate-900">Review Questions</h2>
             </div>

             <div className="space-y-5">
                {questions && questions.length > 0 ? (
                   questions.map((q, idx) => {
                      const studentAnswer = submission.student_answers?.[q.id];
                      const normSql = (s: string) =>
                        s.toLowerCase().replace(/\s+/g, "").replace(/;+$/, "");
                      const givenNorm = (studentAnswer ?? "").trim().toLowerCase();
                      const correctNorm = (q.correct_answer ?? "").trim().toLowerCase();
                      const isCorrect = studentAnswer
                        ? q.question_type === "mcq"
                          ? givenNorm === correctNorm
                          : q.question_type === "paragraph"
                          ? givenNorm === correctNorm || givenNorm.includes(correctNorm)
                          : normSql(studentAnswer) === normSql(q.correct_answer ?? "")
                        : false;
                      
                      return (
                        <div key={q.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-4">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#1d4ed8] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <h3 className="font-bold text-slate-900 text-base leading-snug">{q.question}</h3>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                              {q.marks} pts
                            </span>
                          </div>

                          <div className="space-y-3 pt-2">
                             {/* Student's Answer */}
                             <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${studentAnswer ? (isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-red-50 border-red-200 text-red-950") : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                                <User className={`w-4 h-4 mt-0.5 shrink-0 ${studentAnswer ? (isCorrect ? "text-emerald-600" : "text-red-600") : "text-slate-400"}`} />
                                <div className="text-xs font-medium">
                                   <p className={`font-bold uppercase tracking-wider text-[10px] mb-1 ${studentAnswer ? (isCorrect ? "text-emerald-700" : "text-red-700") : "text-slate-500"}`}>Your Answer</p>
                                   <p className="font-bold whitespace-pre-wrap">{studentAnswer || "No answer provided."}</p>
                                </div>
                             </div>

                             {/* Correct Answer */}
                             <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-[#1d4ed8] mt-0.5 shrink-0" />
                                <div className="text-xs font-medium">
                                   <p className="font-bold text-[#1d4ed8] uppercase tracking-wider text-[10px] mb-1">Marking Guide (Correct Answer)</p>
                                   <p className="font-bold text-slate-900 whitespace-pre-wrap">{q.correct_answer}</p>
                                </div>
                             </div>

                             {q.explanation && (
                               <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                                  <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                  <p className="text-xs text-slate-600 italic leading-relaxed">{q.explanation}</p>
                               </div>
                             )}
                          </div>
                        </div>
                      )
                   })
                ) : (
                   <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs font-bold">
                     No question review data available for this session.
                   </div>
                )}
             </div>
          </motion.div>

          <motion.div variants={item} className="flex justify-center pt-4 pb-12">
            <Button
              onClick={async () => {
                const { getStoredRollSession, clearRollSession } = await import("@/hooks/useAuth");
                const session = getStoredRollSession();
                if (session?.isOtcUser) {
                  clearRollSession();
                  window.location.href = "/";
                } else {
                  setLocation("/dashboard");
                }
              }}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-[#1d4ed8] to-[#0284c7] hover:from-[#1e40af] hover:to-[#0369a1] text-white shadow-md shadow-blue-500/20"
            >
              Finish & Exit Session
            </Button>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
