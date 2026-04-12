import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCreateStudentProfile } from "@workspace/api-client-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const formSchema = z.object({
  college: z.string().min(2, "College name is required"),
  department: z.string().min(2, "Department is required"),
  rollNumber: z.string().min(2, "Roll number is required"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const createProfile = useCreateStudentProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      college: "",
      department: "",
      rollNumber: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    createProfile.mutate({
      data: {
        firebaseUid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        ...values,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Registration Complete",
          description: "Welcome to ExamPortal.",
        });
        setLocation("/dashboard");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: "Could not create student profile. Please try again.",
        });
      }
    });
  };

  if (authLoading || !user) {
    return null;
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
          <CardHeader className="space-y-2 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight">Identity Verification</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-sm">
              Please complete your academic profile to proceed to the secure portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-md border border-border">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-mono">Authenticated As</p>
                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="college"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Institution / College Name</FormLabel>
                        <FormControl>
                          <Input className="bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50" placeholder="e.g. University of Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Department / Major</FormLabel>
                        <FormControl>
                          <Input className="bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50" placeholder="e.g. Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rollNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Student ID / Roll Number</FormLabel>
                        <FormControl>
                          <Input className="bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50 font-mono" placeholder="e.g. CS-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-6"
                  disabled={createProfile.isPending}
                >
                  {createProfile.isPending ? "Verifying..." : "Complete Registration"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
