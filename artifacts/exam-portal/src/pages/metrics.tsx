import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMySubmissions } from "@/hooks/useExamData";
import { motion } from "framer-motion";
import { 
  ChevronLeft, History, Award, Clock, ArrowRight, 
  Calendar, CheckCircle2, ShieldAlert, FileText, User, Layout, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function Metrics() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.uid);
  const { data: submissions, isLoading } = useMySubmissions(user?.uid);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  if (!user) return null;

  return (
    <div className={`min-h-screen ${isMobile ? "bg-surface font-body text-on-surface" : "bg-background text-foreground"} pb-24`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${isMobile ? "bg-white/70 backdrop-blur-xl border-b border-primary/5 shadow-sm" : "bg-background/80 backdrop-blur-md border-b border-border"}`}>
        <div className="container max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="text-muted-foreground hover:text-foreground -ml-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Home</span>
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-full" />
            <span className={`${isMobile ? "font-headline font-bold text-primary" : "font-medium"} text-sm`}>SPHN Web Test</span>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-6 mt-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="mb-2">
            <h1 className={`${isMobile ? "font-headline text-3xl font-extrabold" : "text-2xl font-bold"} tracking-tight`}>Assessment History</h1>
            <p className="text-muted-foreground text-sm mt-1">Review your technical performance and progression.</p>
          </motion.div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center pt-20 gap-4 opacity-50">
               <History className="w-10 h-10 animate-pulse" />
               <p className="text-xs font-mono uppercase tracking-widest">Compiling Records...</p>
            </div>
          ) : submissions && submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((sub) => {
                const pct = sub.total_marks ? Math.round((sub.score / sub.total_marks) * 100) : 0;
                const isTerminated = sub.status === "terminated";
                
                return (
                  <motion.div key={sub.id} variants={item} onClick={() => setLocation(`/result/${sub.id}`)}>
                    <Card className={`${isMobile ? "bg-surface-container-low border-transparent hover:bg-surface-container-lowest hover:premium-shadow-sm" : "bg-card hover:bg-muted/50"} transition-all cursor-pointer overflow-hidden border border-border group`}>
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isTerminated ? "bg-red-50 text-red-600" : pct >= 50 ? "bg-primary/5 text-primary" : "bg-orange-50 text-orange-600"}`}>
                           {isTerminated ? <ShieldAlert className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-0.5">
                            <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{sub.exams?.title ?? "Technical Exam"}</h3>
                            <span className={`font-mono font-bold text-sm ${isTerminated ? "text-red-500" : pct >= 50 ? "text-primary" : "text-orange-600"}`}>
                              {isTerminated ? "N/A" : `${pct}%`}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(sub.submitted_at), "MMM d, yyyy")}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round(sub.time_used_seconds / 60)}m taken</span>
                          </div>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all shrink-0" />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="bg-muted/30 border-dashed border-border p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">No assessment history found.</p>
              <Button variant="link" onClick={() => setLocation("/dashboard")} className="mt-2">Take your first exam</Button>
            </Card>
          )}
        </motion.div>
      </main>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-white/80 backdrop-blur-2xl rounded-t-[2rem] shadow-[0px_-8px_32px_rgba(0,101,145,0.08)] z-50 border-t border-primary/5">
          <button onClick={() => setLocation("/dashboard")} className="flex flex-col items-center justify-center text-on-surface-variant/40 px-8 py-2.5 hover:text-primary transition-all active:scale-95">
            <Layout className="w-6 h-6" /><span className="font-label text-[10px] font-black uppercase tracking-widest mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center bg-primary/5 text-primary rounded-2xl px-8 py-2.5 transition-transform active:scale-95 border border-primary/10">
            <Activity className="w-6 h-6" /><span className="font-label text-[10px] font-black uppercase tracking-widest mt-1">Results</span>
          </button>
          <button onClick={() => setLocation("/profile")} className="flex flex-col items-center justify-center text-on-surface-variant/40 px-8 py-2.5 hover:text-primary transition-all active:scale-95">
            <User className="w-6 h-6" /><span className="font-label text-[10px] font-black uppercase tracking-widest mt-1">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
}
