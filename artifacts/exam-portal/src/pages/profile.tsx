import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMyStats, useMySubmissions } from "@/hooks/useExamData";
import { signOut, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { 
  User, Mail, Fingerprint, LogOut, ChevronLeft, 
  Target, TrendingUp, Layout, Activity, Award, ShieldAlert,
  Calendar, Clock, ArrowRight, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/useIsMobile";
import { format } from "date-fns";

export default function Profile() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.uid);
  const { data: stats } = useMyStats(user?.uid);
  const { data: submissions } = useMySubmissions(user?.uid);

  if (!user) return null;

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/");
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className={`min-h-screen ${isMobile ? "bg-surface font-body text-on-surface" : "bg-background text-foreground"} pb-32`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${isMobile ? "bg-white/70 backdrop-blur-xl border-b border-primary/5 shadow-sm" : "bg-background/80 backdrop-blur-md border-b border-border"}`}>
        <div className="container max-w-xl mx-auto px-6 h-16 flex items-center justify-between">
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

      <main className="container max-w-xl mx-auto px-6 mt-10">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
          {/* Hero Profile */}
          <motion.div variants={item} className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary mb-6 premium-shadow">
               <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                 {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                 ) : (
                    <User className="w-10 h-10 text-primary/40" />
                 )}
               </div>
            </div>
            <h1 className={`${isMobile ? "font-headline text-3xl font-extrabold" : "text-2xl font-bold"} tracking-tight`}>
               {profile?.full_name || user.displayName || "Academic Scholar"}
            </h1>
            <p className="text-muted-foreground font-mono text-xs mt-2 uppercase tracking-widest">{profile?.name || "ID: UNASSIGNED"}</p>
          </motion.div>

          {/* Analysis & Journey section */}
          <motion.div variants={item} className="space-y-6">
            <div className="flex items-center gap-2 mb-2 px-1">
               <BarChart3 className="w-5 h-5 text-primary" />
               <h2 className="font-headline text-xl font-bold">Academic Analysis</h2>
            </div>
            
            <section className="bg-surface-container-lowest rounded-3xl p-8 premium-shadow relative overflow-hidden flex flex-col justify-between min-h-[300px] border border-outline-variant/10">
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">My Journey</h2>
                <p className="text-on-surface-variant text-sm font-medium">{profile?.college || "Academic Foundation"}</p>
                <p className="text-on-surface-variant text-xs mt-1 opacity-70">{profile?.role || "Scholar Hub"}</p>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-end justify-between">
                  <span className="text-5xl font-extrabold text-primary">{stats?.totalAttempts || 0}</span>
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-2">Exams Taken</span>
                </div>
                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-secondary to-primary-container rounded-full tonal-transition" style={{ width: `${Math.min(100, (stats?.totalAttempts || 0) * 10)}%` }}></div>
                </div>
              </div>
            </section>
          </motion.div>

          {/* Detailed History section */}
          <motion.div variants={item} className="space-y-6">
             <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                   <Clock className="w-5 h-5 text-primary" />
                   <h2 className="font-headline text-xl font-bold">Session History</h2>
                </div>
                <Button variant="link" size="sm" onClick={() => setLocation("/metrics")} className="text-xs text-primary font-bold">View All</Button>
             </div>
             
             <div className="space-y-3">
                {submissions && submissions.length > 0 ? (
                   submissions.slice(0, 3).map((sub) => {
                      const pct = sub.total_marks ? Math.round((sub.score / sub.total_marks) * 100) : 0;
                      return (
                        <div key={sub.id} onClick={() => setLocation(`/result/${sub.id}`)} className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/5 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pct >= 50 ? "bg-primary/5 text-primary" : "bg-red-50 text-red-600"}`}>
                              <Award className="w-5 h-5" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{sub.exams?.title || "Exam"}</p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                                 <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(sub.submitted_at), "MMM d")}</span>
                                 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(sub.submitted_at), "HH:mm")}</span>
                                 <span className="text-primary">{pct}%</span>
                              </div>
                           </div>
                           <ArrowRight className="w-4 h-4 text-outline/30" />
                        </div>
                      )
                   })
                ) : (
                   <p className="text-center py-10 text-on-surface-variant text-sm border-2 border-dashed border-outline-variant/10 rounded-2xl">No recorded sessions yet.</p>
                )}
             </div>
          </motion.div>

          {/* Details List */}
          <motion.div variants={item} className="space-y-4">
             <div className="bg-surface-container-low rounded-2xl p-5 border border-primary/5 flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-primary shrink-0">
                 <Mail className="w-5 h-5" />
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Digital Mailbox</p>
                 <p className="text-sm font-medium truncate">{user.email}</p>
               </div>
             </div>

             <div className="bg-surface-container-low rounded-2xl p-5 border border-primary/5 flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-orange-600 shrink-0">
                 <ShieldAlert className="w-5 h-5" />
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Integrity Violations</p>
                 <p className="text-sm font-medium truncate">{stats?.totalViolations ?? 0} Detected</p>
               </div>
             </div>
          </motion.div>

          <motion.div variants={item} className="pt-6">
            <Button variant="ghost" className="w-full h-14 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700 font-bold" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-white/80 backdrop-blur-2xl rounded-t-[2rem] shadow-[0px_-8px_32px_rgba(0,101,145,0.08)] z-50 border-t border-primary/5">
          <button onClick={() => setLocation("/dashboard")} className="flex flex-col items-center justify-center text-on-surface-variant/40 px-8 py-2.5 hover:text-primary transition-all active:scale-95">
            <Layout className="w-6 h-6" /><span className="font-label text-[10px] font-black uppercase tracking-widest mt-1">Home</span>
          </button>
          <button onClick={() => setLocation("/metrics")} className="flex flex-col items-center justify-center text-on-surface-variant/40 px-8 py-2.5 hover:text-primary transition-all active:scale-95">
            <Activity className="w-6 h-6" /><span className="font-label text-[10px] font-black uppercase tracking-widest mt-1">Results</span>
          </button>
          <button className="flex flex-col items-center justify-center bg-primary/5 text-primary rounded-2xl px-8 py-2.5 transition-transform active:scale-95 border border-primary/10">
            <User className="w-6 h-6" /><span className="font-label text-[10px] font-black uppercase tracking-widest mt-1">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
}
