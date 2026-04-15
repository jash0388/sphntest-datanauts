import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCreateProfile } from "@/hooks/useProfile";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { RefreshCw, ShieldCheck, Landmark, BookOpen, Fingerprint, Shield, Mail, User } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
  college: z.string().min(2, "Institution is required"),
  department: z.string().min(2, "Department is required"),
  rollNumber: z.string().min(2, "Roll number is required"),
});

// --- Desktop Register (Old Style) ---
function DesktopRegister({ form, onSubmit, user, createProfile }: any) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] opacity-[0.04]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm z-10">
        <Card className="border-border bg-card/90 shadow-2xl">
          <CardHeader className="space-y-2 pb-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Identity Verification</CardTitle>
                <CardDescription className="text-xs mt-0.5">Complete your academic profile</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="p-3 bg-muted rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-mono">Authenticated As</p>
                  <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                </div>
                <FormField control={form.control} name="college" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Institution</FormLabel><FormControl><Input className="bg-background" placeholder="e.g. SPHN" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Department</FormLabel><FormControl><Input className="bg-background" placeholder="e.g. Computer Science" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="rollNumber" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Roll Number</FormLabel><FormControl><Input className="bg-background font-mono" placeholder="e.g. 24N81A6..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full mt-2" disabled={createProfile.isPending}>
                  {createProfile.isPending ? <RefreshCw className="animate-spin w-4 h-4" /> : "Complete Registration"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// --- Mobile Register (Academic Atelier Style) ---
function MobileRegister({ form, onSubmit, user, createProfile }: any) {
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "inherit",
    width: "100%",
    borderRadius: "0.875rem",
    padding: "1rem 1.25rem",
    fontSize: "0.875rem",
    outline: "none",
    transition: "all 0.2s",
  };
  const focusInput = (e: any) => {
    e.target.style.borderColor = "rgba(79,126,245,0.6)";
    e.target.style.boxShadow = "0 0 0 3px rgba(79,126,245,0.1)";
  };
  const blurInput = (e: any) => {
    e.target.style.borderColor = "rgba(255,255,255,0.08)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-body">
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 w-[320px] h-[320px] rounded-full" style={{ background: "radial-gradient(circle, rgba(79,126,245,0.13) 0%, transparent 70%)" }} />

      <header className="w-full px-6 pt-14 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-xl font-bold text-foreground font-headline tracking-tight">SPHN Web Test</span>
      </header>

      <main className="flex-grow flex items-end justify-center px-4 pb-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 px-1">
            <h1 className="text-4xl font-extrabold text-foreground font-headline tracking-tighter mb-2">Stage 02</h1>
            <p className="text-muted-foreground text-sm">Identity Enrollment</p>
          </div>

          <div className="rounded-3xl p-6 pb-10 space-y-5" style={{ background: "linear-gradient(180deg, rgba(19,19,31,0.95) 0%, rgba(9,9,15,0.98) 100%)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}>
            {/* Current user chip */}
            <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current User</span>
              <span className="text-xs font-bold text-foreground truncate flex-1 text-right">{user.email}</span>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField control={form.control} name="college" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Institution</FormLabel>
                    <FormControl>
                      <input style={inputStyle} placeholder="e.g. SPHN" onFocus={focusInput} onBlur={blurInput} {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px] ml-1" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Major</FormLabel>
                    <FormControl>
                      <input style={inputStyle} placeholder="e.g. DS" onFocus={focusInput} onBlur={blurInput} {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px] ml-1" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="rollNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Roll ID</FormLabel>
                    <FormControl>
                      <input style={{ ...inputStyle, fontFamily: "monospace" }} placeholder="24N81A6..." onFocus={focusInput} onBlur={blurInput} {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px] ml-1" />
                  </FormItem>
                )} />

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mt-2"
                  style={{ background: "linear-gradient(135deg, #4f7ef5 0%, #3d6bd4 100%)", boxShadow: "0 4px 20px rgba(79,126,245,0.4), 0 1px 0 rgba(255,255,255,0.1) inset" }}
                  disabled={createProfile.isPending}
                >
                  {createProfile.isPending ? <RefreshCw className="animate-spin w-5 h-5" /> : "Secure Profile"}
                </button>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Combined Register Page ---
export default function Register() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const createProfile = useCreateProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { college: "", department: "", rollNumber: "" },
  });

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [user, authLoading, setLocation]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    // Mapping to real columns found in diagnostic:
    // display_name -> full_name
    // roll_number -> name
    // department -> role
    // college -> college
    
    createProfile.mutate({
      id: user.uid,
      email: user.email!,
      full_name: user.displayName || user.email?.split("@")[0] || "Student",
      name: values.rollNumber, // Saving Roll Number into 'name' column
      college: values.college,
      role: values.department, // Saving Department into 'role' column
      firebase_uid: user.uid,
      is_firebase_user: true,
    } as any, {
      onSuccess: () => {
        toast({ title: "Enrollment Complete", description: "Welcome to DataNauts Hub." });
        setLocation("/dashboard");
      },
      onError: async (err: any) => {
        console.error(err);
        toast({ 
          variant: "destructive", 
          title: "Setup Failed", 
          description: err.message || "Please try again later."
        });
      },
    });
  };

  if (authLoading || !user) return null;

  return isMobile ? <MobileRegister form={form} onSubmit={onSubmit} user={user} createProfile={createProfile} /> : <DesktopRegister form={form} onSubmit={onSubmit} user={user} createProfile={createProfile} />;
}
