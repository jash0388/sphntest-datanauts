import { useEffect } from "react";
import { useLocation } from "wouter";
import { signInWithPopup, googleProvider, auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useGetStudentProfile, getGetStudentProfileQueryKey } from "@workspace/api-client-react";
import { Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useGetStudentProfile(
    { uid: user?.uid ?? "" },
    { query: { enabled: !!user?.uid } }
  );

  useEffect(() => {
    if (user && !profileLoading) {
      if (profile) {
        setLocation("/dashboard");
      } else if (!profile && !authLoading) {
        setLocation("/register");
      }
    }
  }, [user, profile, profileLoading, authLoading, setLocation]);

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user.email?.endsWith("@gmail.com")) {
        auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Only @gmail.com accounts are permitted to take exams.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Failed to sign in. Please try again.",
      });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Shield className="w-12 h-12 text-primary opacity-50" />
          <p className="text-muted-foreground text-sm font-mono tracking-widest uppercase">INITIALIZING_SECURE_ENVIRONMENT</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[120px] mix-blend-screen opacity-10" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-border bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-4 pb-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-2">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">ExamPortal</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Secure Academic Assessment Environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-muted border border-border flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                By authenticating, you agree to continuous proctoring, including fullscreen enforcement and activity monitoring.
              </p>
            </div>
            
            <Button 
              size="lg" 
              className="w-full h-14 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleSignIn}
            >
              Sign In with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Requires a valid <span className="text-foreground">@gmail.com</span> account
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
