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
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col relative overflow-hidden font-body">
      <div className="fixed top-0 right-0 -z-10 w-[400px] h-[400px] bg-sky-100/30 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
      
      <header className="w-full px-6 py-8 flex items-center gap-3 bg-white/50 backdrop-blur-xl">
         <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
         <span className="text-2xl font-bold text-primary font-headline tracking-tighter">SPHN Web Test</span>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="bg-surface-container-lowest rounded-2xl premium-shadow p-8 border border-outline-variant/10">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tighter mb-2">Stage 02</h1>
              <p className="text-on-surface-variant text-sm font-medium">Identity Enrollment</p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col gap-1 px-1">
                  <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1">Current User</label>
                  <div className="bg-surface-container-high/50 p-4 rounded-xl text-center border border-outline-variant/10">
                    <p className="text-xs font-bold text-on-surface truncate">{user.email}</p>
                  </div>
                </div>

                <FormField control={form.control} name="college" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-2">Institution</FormLabel>
                    <FormControl><input className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. SPHN" {...field} /></FormControl>
                    <FormMessage className="text-[10px] ml-2" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-2">Major</FormLabel>
                    <FormControl><input className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. DS" {...field} /></FormControl>
                    <FormMessage className="text-[10px] ml-2" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="rollNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-2">Roll ID</FormLabel>
                    <FormControl><input className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20 font-mono" placeholder="24N81A6..." {...field} /></FormControl>
                    <FormMessage className="text-[10px] ml-2" />
                  </FormItem>
                )} />

                <button type="submit" className="w-full bg-primary text-white font-black py-5 rounded-xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2" disabled={createProfile.isPending}>
                  {createProfile.isPending ? <RefreshCw className="animate-spin w-5 h-5" /> : "Secure Profile"}
                </button>
              </form>
            </Form>
          </div>
        </div>
      </main>
      <style>{`.font-variation-fill { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>
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
