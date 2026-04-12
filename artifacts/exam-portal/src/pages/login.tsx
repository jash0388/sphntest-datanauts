import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  signInWithPopup,
  googleProvider,
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useGetStudentProfile } from "@workspace/api-client-react";
import { Shield, AlertCircle, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "signin" | "signup";

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase. Add it to Firebase Console → Authentication → Settings → Authorized domains.";
    case "auth/user-not-found":
      return "No account found with this email. Try signing up instead.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    case "auth/popup-blocked":
      return "Popup was blocked by the browser. Please allow popups and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    default:
      return "Authentication failed. Please try again.";
  }
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: profile, isLoading: profileLoading } = useGetStudentProfile(
    { uid: user?.uid ?? "" },
    { query: { enabled: !!user?.uid, queryKey: ["studentProfile", user?.uid ?? ""] } }
  );

  useEffect(() => {
    if (user && !profileLoading) {
      if (profile) {
        setLocation("/dashboard");
      } else {
        setLocation("/register");
      }
    }
  }, [user, profile, profileLoading, setLocation]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user.email?.endsWith("@gmail.com")) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Only @gmail.com accounts are permitted.",
        });
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: getFirebaseErrorMessage(code),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (!email.endsWith("@gmail.com")) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only @gmail.com accounts are permitted to take exams.",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user);
        toast({
          title: "Account Created",
          description: "Verification email sent. You can continue setting up your profile.",
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      toast({
        variant: "destructive",
        title: mode === "signup" ? "Sign Up Failed" : "Sign In Failed",
        description: getFirebaseErrorMessage(code),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-xs font-mono tracking-widest uppercase">Initializing secure environment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary rounded-full blur-[140px] opacity-[0.04]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-sm z-10"
      >
        <Card className="border-border bg-card/90 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-3 pb-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">ExamPortal</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Secure Academic Assessment Environment
              </CardDescription>
            </div>

            <div className="flex rounded-lg border border-border overflow-hidden bg-muted/30 p-1 gap-1">
              <button
                onClick={() => setMode("signin")}
                className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${
                  mode === "signin"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${
                  mode === "signup"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-background border-border focus:border-primary"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 bg-background border-border focus:border-primary"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-11 font-medium"
                disabled={isLoading}
                data-testid="button-email-auth"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    {mode === "signin" ? "Sign In" : "Create Account"}
                  </>
                )}
              </Button>
            </form>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-11 border-border hover:border-primary/50 font-medium"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              data-testid="button-google-signin"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Only <span className="text-foreground font-medium">@gmail.com</span> accounts allowed. By signing in, you agree to continuous proctoring during exams.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
