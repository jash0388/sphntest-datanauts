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
    <div className={`min-h-screen ${isMobile ? "bg-background font-body text-foreground" : "bg-background text-foreground"} pb-32`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${isMobile ? "backdrop-blur-xl border-b" : "bg-background/80 backdrop-blur-md border-b border-border"}`} style={isMobile ? { background: "rgba(8,8,15,0.9)", borderColor: "rgba(255,255,255,0.06)" } : {}}>
        <div className="container max-w-xl mx-auto px-6 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="text-muted-foreground hover:text-foreground -ml-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Home</span>
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-full" />
            <span className={`${isMobile ? "font-headline font-bold text-foreground" : "font-medium"} text-sm`}>SPHN Web Test</span>
          </div>
        </div>
      </header>

      <main className="container max-w-xl mx-auto px-6 mt-10">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
          {/* Hero Profile */}
          <motion.div variants={item} className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full p-0.5 mb-6" style={{ background: "linear-gradient(135deg, #4f7ef5, #7c5bf5)", boxShadow: "0 0 30px rgba(79,126,245,0.3)" }}>
               <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden" style={{ background: "#13131f" }}>
                 {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                 ) : (
                    <User className="w-10 h-10 text-primary" style={{ opacity: 0.6 }} />
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
            
            <section className="rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[280px]" style={{ background: "linear-gradient(145deg, #13131f, #0f0f1a)", border: "1px solid rgba(79,126,245,0.15)", boxShadow: "0 4px 32px rgba(0,0,0,0.4), 0 0 40px rgba(79,126,245,0.05)" }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(79,126,245,0.08) 0%, transparent 70%)" }} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary mb-4" style={{ background: "rgba(79,126,245,0.12)" }}>
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="font-headline text-2xl font-bold mb-2">My Journey</h2>
                <p className="text-muted-foreground text-sm font-medium">{profile?.college || "Academic Foundation"}</p>
                <p className="text-muted-foreground text-xs mt-1 opacity-70">{profile?.role || "Scholar Hub"}</p>
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-end justify-between">
                  <span className="text-5xl font-extrabold text-primary">{stats?.totalAttempts || 0}</span>
                  <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest mb-2">Exams Taken</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (stats?.totalAttempts || 0) * 10)}%`, background: "linear-gradient(90deg, #4f7ef5, #7c5bf5)" }}></div>
                </div>
              </div>
            </section>
          </motion.div>

          {/* Detailed History section */}
          <motion.div variants={item} className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                   <Clock className="w-5 h-5 text-primary" />
                   <h2 className="font-headline text-xl font-bold">Session History</h2>
                </div>
                <Button variant="link" size="sm" onClick={() => setLocation("/metrics")} className="text-xs text-primary font-bold">View All</Button>
             </div>
             
             <div className="space-y-2">
                {submissions && submissions.length > 0 ? (
                   submissions.slice(0, 3).map((sub) => {
                      const pct = sub.total_marks ? Math.round((sub.score / sub.total_marks) * 100) : 0;
                      return (
                        <div key={sub.id} onClick={() => setLocation(`/result/${sub.id}`)} className="rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                           <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: pct >= 50 ? "rgba(79,126,245,0.12)" : "rgba(239,68,68,0.1)", color: pct >= 50 ? "#4f7ef5" : "#f87171" }}>
                              <Award className="w-5 h-5" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{sub.exams?.title || "Exam"}</p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                 <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(sub.submitted_at), "MMM d")}</span>
                                 <span className="text-primary font-bold">{pct}%</span>
                              </div>
                           </div>
                           <ArrowRight className="w-4 h-4 text-muted-foreground opacity-50" />
                        </div>
                      )
                   })
                ) : (
                   <p className="text-center py-10 text-muted-foreground text-sm rounded-2xl" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>No recorded sessions yet.</p>
                )}
             </div>
          </motion.div>

          {/* Details List */}
          <motion.div variants={item} className="space-y-2">
             <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
               <div className="w-10 h-10 rounded-lg flex items-center justify-center text-primary shrink-0" style={{ background: "rgba(79,126,245,0.12)" }}>
                 <Mail className="w-5 h-5" />
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Digital Mailbox</p>
                 <p className="text-sm font-medium truncate">{user.email}</p>
               </div>
             </div>

             <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
               <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                 <ShieldAlert className="w-5 h-5" />
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Integrity Violations</p>
                 <p className="text-sm font-medium truncate">{stats?.totalViolations ?? 0} Detected</p>
               </div>
             </div>
          </motion.div>

          <motion.div variants={item} className="pt-4">
            <button className="w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }} onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </motion.div>
        </motion.div>
      </main>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 w-full z-50 px-5 pb-6 pt-3" style={{ background: "linear-gradient(to top, rgba(8,8,15,0.98) 60%, rgba(8,8,15,0) 100%)" }}>
          <div className="flex justify-around items-center rounded-2xl px-2 py-3 max-w-xl mx-auto" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
            {[
              { icon: <Layout className="w-5 h-5" />, label: "Home", onClick: () => setLocation("/dashboard") },
              { icon: <Activity className="w-5 h-5" />, label: "Results", onClick: () => setLocation("/metrics") },
              { icon: <User className="w-5 h-5" />, label: "Profile", active: true, onClick: () => {} },
            ].map((nav) => (
              <button key={nav.label} onClick={nav.onClick} className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all active:scale-95" style={nav.active ? { background: "rgba(79,126,245,0.15)", color: "#4f7ef5" } : { color: "rgba(255,255,255,0.3)" }}>
                {nav.icon}
                <span className="text-[9px] font-bold uppercase tracking-widest">{nav.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
