import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Zap, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "At least 3 characters"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  password: z.string().min(6, "At least 6 characters"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const reg = useRegister();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", username: "", firstName: "", lastName: "", password: "" },
  });

  function onSubmit(v: z.infer<typeof schema>) {
    reg.mutate({ data: v }, {
      onSuccess: () => {
        toast({ title: "Account created", description: "You can now sign in." });
        setLocation("/login");
      },
      onError: (err: any) => form.setError("root", { message: err?.message || "Registration failed." }),
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-xl shadow-primary/30">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join Nova Panel to manage your servers</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-2xl shadow-black/30">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">First Name</FormLabel>
                    <FormControl><Input placeholder="Jane" {...field} className="bg-background" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Last Name</FormLabel>
                    <FormControl><Input placeholder="Doe" {...field} className="bg-background" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="jane@example.com" autoComplete="email" {...field} className="pl-9 bg-background" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="janedoe" {...field} className="pl-9 bg-background" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} className="pl-9 bg-background" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {form.formState.errors.root && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {form.formState.errors.root.message}
                </div>
              )}

              <Button type="submit" className="w-full h-10 font-semibold" disabled={reg.isPending}>
                {reg.isPending ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creating account...</span>
                ) : "Create Account"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login">
            <span className="text-primary font-semibold hover:underline cursor-pointer">Sign in</span>
          </Link>
        </p>

        <p className="text-center text-[11px] text-muted-foreground/40 mt-6">
          Nova Panel · <span className="text-primary/40">@Lord_nova98</span>
        </p>
      </div>
    </div>
  );
}
