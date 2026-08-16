import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { fetchAllAccessCodes, generateNewAccessCode, type AccessCode } from "@/lib/accessCodes";
import { supabase } from "@/lib/supabase";
import { useAvailableExams } from "@/hooks/useExamData";
import { 
  Shield, Key, Plus, RefreshCw, CheckCircle2, AlertTriangle, 
  Lock, ArrowLeft, Search, Users, FileText, Clock, Trash2, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passError, setPassError] = useState("");

  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const { data: exams } = useAvailableExams();

  // Handle Admin Passcode Login
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "datanauts2026" || passcode === "admin123" || passcode === "sphn2026") {
      setIsAuthenticated(true);
      setPassError("");
      toast({ title: "Admin Authenticated 🔓", description: "Welcome to DataNauts Admin Hub." });
    } else {
      setPassError("Incorrect admin passcode. (Try 'datanauts2026' or 'admin123')");
    }
  };

  const loadData = async () => {
    setLoadingCodes(true);
    setLoadingSubmissions(true);
    try {
      const codeList = await fetchAllAccessCodes();
      setCodes(codeList);

      const { data: subData } = await supabase
        .from("exam_submissions")
        .select("*, exams(title)")
        .order("submitted_at", { ascending: false });
      if (subData) setSubmissions(subData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCodes(false);
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleGenerateCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    try {
      const newCode = await generateNewAccessCode(customCodeInput || undefined);
      toast({ title: "Access Code Created 🎉", description: `Code: ${newCode.code}` });
      setCustomCodeInput("");
      loadData();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not create code." });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredCodes = codes.filter((c) =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.used_by_roll && c.used_by_roll.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.used_by_name && c.used_by_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // If not authenticated, render Admin Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Card className="bg-[#11111a] border-white/10 shadow-2xl text-white">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Admin Authentication</CardTitle>
                <CardDescription className="text-xs text-white/50">DataNauts Exam Control Center</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Passcode</label>
                  <Input
                    type="password"
                    placeholder="Enter admin passcode"
                    value={passcode}
                    onChange={(e) => { setPasscode(e.target.value); setPassError(""); }}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  {passError && <p className="text-xs text-red-400 mt-1">{passError}</p>}
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold">
                  Unlock Control Center
                </Button>
                <Button type="button" variant="ghost" className="w-full text-xs text-white/40 hover:text-white" onClick={() => setLocation("/")}>
                  Back to Portal
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f] text-white pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#08080f]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-white/60 hover:text-white -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-bold text-base tracking-tight">DataNauts Admin Control</span>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={loadData} className="border-white/10 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingCodes ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Stat Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#11111a] border-white/10 text-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Active Exams</p>
                <p className="text-3xl font-extrabold mt-1">{exams?.length ?? 0}</p>
              </div>
              <FileText className="w-8 h-8 text-primary/60" />
            </CardContent>
          </Card>
          <Card className="bg-[#11111a] border-white/10 text-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">One-Time Codes</p>
                <p className="text-3xl font-extrabold mt-1">{codes.length}</p>
                <p className="text-[10px] text-green-400 font-mono mt-0.5">{codes.filter(c => !c.is_used).length} Available</p>
              </div>
              <Key className="w-8 h-8 text-yellow-500/60" />
            </CardContent>
          </Card>
          <Card className="bg-[#11111a] border-white/10 text-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Total Submissions</p>
                <p className="text-3xl font-extrabold mt-1">{submissions.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500/60" />
            </CardContent>
          </Card>
        </div>

        {/* Generate One-Time Access Code Section */}
        <Card className="bg-[#11111a] border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-yellow-500" /> One-Time Access Code Generator
            </CardTitle>
            <CardDescription className="text-white/50 text-xs">
              Generate one-time codes for student exam access. Students enter this code on the login page, then fill in their Name, Roll Number, & Branch to take the test.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateCode} className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Custom code (e.g. SPHN2026 or leave blank for auto-generated)"
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                className="bg-white/5 border-white/10 text-white font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal flex-1"
              />
              <Button type="submit" disabled={isGenerating} className="bg-primary hover:bg-primary/90 font-bold shrink-0">
                {isGenerating ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Generate Code
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Access Codes Table */}
        <Card className="bg-[#11111a] border-white/10 text-white">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Access Code Manager</CardTitle>
              <CardDescription className="text-xs text-white/50">Manage active access codes and see who used them.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search codes or roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-xs text-white"
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest font-mono">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Used By Student</th>
                  <th className="py-3 px-4">Used At</th>
                  <th className="py-3 px-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredCodes.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 font-bold text-sm text-yellow-400">{c.code}</td>
                    <td className="py-3.5 px-4">
                      {c.is_used ? (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">USED</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px]">AVAILABLE</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-white/80">
                      {c.used_by_roll ? (
                        <div>
                          <p className="font-bold text-white">{c.used_by_roll}</p>
                          {c.used_by_name && <p className="text-[10px] text-white/40 font-sans">{c.used_by_name}</p>}
                        </div>
                      ) : (
                        <span className="text-white/30 italic">Not used yet</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-white/50">
                      {c.used_at ? format(new Date(c.used_at), "MMM d, HH:mm") : "--"}
                    </td>
                    <td className="py-3.5 px-4 text-white/40">
                      {c.created_at ? format(new Date(c.created_at), "MMM d, HH:mm") : "--"}
                    </td>
                  </tr>
                ))}
                {filteredCodes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/40 italic">No access codes found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Student Submissions Log */}
        <Card className="bg-[#11111a] border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Recent Student Submissions</CardTitle>
            <CardDescription className="text-xs text-white/50">Live records of exam attempts, scores, and integrity violations.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest font-mono">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Exam Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Violations</th>
                  <th className="py-3 px-4">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((s) => {
                  const pct = s.total_marks ? Math.round((s.score / s.total_marks) * 100) : 0;
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-semibold text-white">{s.student_name || "Student"}</td>
                      <td className="py-3.5 px-4 font-mono text-primary font-bold">{s.roll_number || s.user_id}</td>
                      <td className="py-3.5 px-4 text-white/70">{s.exams?.title || "Assessment"}</td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={pct >= 50 ? "text-green-400" : "text-red-400"}>{s.score} / {s.total_marks} ({pct}%)</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {s.violations > 0 ? (
                          <span className="text-red-400 font-bold">{s.violations} breach(es)</span>
                        ) : (
                          <span className="text-green-400">0 Clean</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-white/40 font-mono">
                        {format(new Date(s.submitted_at), "MMM d, HH:mm")}
                      </td>
                    </tr>
                  );
                })}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-white/40 italic">No submissions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
