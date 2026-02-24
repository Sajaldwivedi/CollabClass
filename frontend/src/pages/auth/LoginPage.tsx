import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { Sparkles, ArrowRight, Mail, Lock, Chrome } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid academic email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values);
      navigate("/");
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as any).response
      ) {
        const axiosErr = err as any;
        const message =
          axiosErr.response?.data?.message ?? "Unable to sign in.";
        setServerError(message);
      } else {
        setServerError("Unable to sign in.");
      }
    }
  };

  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-4 py-6">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 rounded-3xl bg-slate-900/70 p-1 shadow-soft-xl backdrop-blur-2xl md:grid-cols-[1.1fr_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 p-6 md:p-8"
        >
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950/20">
                  <Sparkles className="h-5 w-5 text-emerald-100" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-50/80">
                    CollabClass
                  </p>
                  <p className="text-sm font-semibold text-white">
                    Academic Intelligence Cloud
                  </p>
                </div>
              </div>
              <h2 className="mt-7 text-3xl font-semibold text-white md:text-4xl">
                See your classroom
                <br />
                like a living graph.
              </h2>
              <p className="mt-4 max-w-md text-sm text-emerald-50/90">
                CollabClass turns grades, doubts, and peer sessions into a
                real-time story of who&apos;s thriving, who&apos;s at risk, and
                where mentoring will have the most impact.
              </p>
            </div>
            <div className="mt-8 space-y-3 text-xs text-emerald-50/90">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold">
                  1
                </span>
                Live risk detection across every section
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold">
                  2
                </span>
                Peer mentorship graph that evolves with your class
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold">
                  3
                </span>
                Intervention engine that suggests the next best action
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 -left-16 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center rounded-3xl bg-slate-950/80 px-5 py-6 md:px-8 md:py-10"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-50">
                Welcome back
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Sign in to continue your teaching or learning journey.
              </p>
            </div>
            <Link
              to="/register"
              className="text-[11px] text-sky-300 hover:text-sky-200"
            >
              New here? Create account
            </Link>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 space-y-4 text-sm"
          >
            {serverError && (
              <p className="rounded-2xl border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100">
                {serverError}
              </p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Academic email
              </label>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs focus-within:border-sky-500/70 focus-within:ring-1 focus-within:ring-sky-500/70",
                  errors.email && "border-rose-500/70"
                )}
              >
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@university.edu"
                  className="flex-1 bg-transparent text-xs text-slate-50 outline-none placeholder:text-slate-500"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-300">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs focus-within:border-sky-500/70 focus-within:ring-1 focus-within:ring-sky-500/70",
                  errors.password && "border-rose-500/70"
                )}
              >
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Enter your password"
                  className="flex-1 bg-transparent text-xs text-slate-50 outline-none placeholder:text-slate-500"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-300">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full justify-between text-xs"
              disabled={isSubmitting}
            >
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="relative py-2 text-center text-[10px] text-slate-500">
              <span className="relative bg-slate-950/80 px-2">
                or continue with
              </span>
              <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full justify-center gap-2 text-xs"
              onClick={() => {
                void loginWithGoogle();
              }}
            >
              <Chrome className="h-4 w-4" />
              Sign in with Google
            </Button>
          </form>

          <p className="mt-5 text-[10px] leading-relaxed text-slate-500">
            By continuing, you agree that CollabClass can process your data to
            surface at-risk learners, peer mentors, and intervention signals in
            line with your institution&apos;s policies.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

