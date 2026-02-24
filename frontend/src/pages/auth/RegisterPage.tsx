import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import {
  Chrome,
  GraduationCap,
  User,
  Mail,
  Lock,
  ArrowRight
} from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name is too short"),
    email: z.string().email("Use a valid academic email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["student", "teacher"], {
      required_error: "Select a role"
    }),
    section: z.string().optional()
  })
  .refine(
    (data) =>
      data.role === "student" ? Boolean(data.section && data.section.trim()) : true,
    {
      message: "Section is required for students",
      path: ["section"]
    }
  );

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: undefined,
      section: ""
    }
  });

  const role = watch("role");

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser({
        ...values,
        section: values.section?.trim() || undefined
      });
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
          axiosErr.response?.data?.message ?? "Unable to create account.";
        setServerError(message);
      } else {
        setServerError("Unable to create account.");
      }
    }
  };

  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-4 py-6">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 rounded-3xl bg-slate-900/70 p-1 shadow-soft-xl backdrop-blur-2xl md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center rounded-3xl bg-slate-950/90 px-5 py-6 md:px-8 md:py-10"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-50">
                Create your space
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Tell CollabClass if you teach or learn, and we&apos;ll tune the
                intelligence engine for you.
              </p>
            </div>
            <Link
              to="/login"
              className="text-[11px] text-sky-300 hover:text-sky-200"
            >
              Already have an account?
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
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Full name
                </label>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs focus-within:border-emerald-500/70 focus-within:ring-1 focus-within:ring-emerald-500/70",
                    errors.name && "border-rose-500/70"
                  )}
                >
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <input
                    {...register("name")}
                    placeholder="How should we call you?"
                    className="flex-1 bg-transparent text-xs text-slate-50 outline-none placeholder:text-slate-500"
                  />
                </div>
                {errors.name && (
                  <p className="text-[11px] text-rose-300">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Academic email
                </label>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs focus-within:border-emerald-500/70 focus-within:ring-1 focus-within:ring-emerald-500/70",
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
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs focus-within:border-emerald-500/70 focus-within:ring-1 focus-within:ring-emerald-500/70",
                  errors.password && "border-rose-500/70"
                )}
              >
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="At least 6 characters"
                  className="flex-1 bg-transparent text-xs text-slate-50 outline-none placeholder:text-slate-500"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-300">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-[1.1fr_minmax(0,1fr)]">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  How do you use CollabClass?
                </label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => field.onChange("student")}
                        className={cn(
                          "flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all",
                          field.value === "student"
                            ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-100 shadow-soft-xl"
                            : "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700"
                        )}
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span className="text-left leading-tight">
                          I&apos;m a student
                          <span className="block text-[10px] text-slate-400">
                            Track my own risk & peers
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("teacher")}
                        className={cn(
                          "flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all",
                          field.value === "teacher"
                            ? "border-sky-400/70 bg-sky-500/10 text-sky-100 shadow-soft-xl"
                            : "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700"
                        )}
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span className="text-left leading-tight">
                          I&apos;m a teacher
                          <span className="block text-[10px] text-slate-400">
                            Monitor sections & interventions
                          </span>
                        </span>
                      </button>
                    </div>
                  )}
                />
                {errors.role && (
                  <p className="text-[11px] text-rose-300">
                    {errors.role.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Section (required for students)
                </label>
                <input
                  {...register("section")}
                  placeholder={
                    role === "teacher"
                      ? "E.g. CSE First Year"
                      : "E.g. CS-A, CS-B"
                  }
                  className={cn(
                    "w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs text-slate-50 outline-none placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/70",
                    errors.section && "border-rose-500/70"
                  )}
                />
                {errors.section && (
                  <p className="text-[11px] text-rose-300">
                    {errors.section.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-1 w-full justify-between text-xs"
              disabled={isSubmitting}
            >
              <span>Create account</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="relative py-2 text-center text-[10px] text-slate-500">
              <span className="relative bg-slate-950/90 px-2">
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
              Sign up with Google
            </Button>
          </form>

          <p className="mt-5 text-[10px] leading-relaxed text-slate-500">
            We store your JWT securely in the browser and stream only the
            signals CollabClass needs to compute risk, engagement, and
            mentorship graphs. You can request deletion via your institution at
            any time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 md:p-8"
        >
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Live classroom telemetry
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-50 md:text-3xl">
                Risk, engagement, and doubts in one pane.
              </h2>
              <p className="mt-3 max-w-md text-xs text-slate-400">
                CollabClass fuses submissions, discussions, and sessions into
                an adaptive model of how your classroom actually feels, not just
                how it scores.
              </p>
            </div>

            <div className="mt-8 grid gap-3 text-[11px] text-slate-200 md:grid-cols-2">
              <div className="glass-surface rounded-2xl p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  For teachers
                </p>
                <p className="mt-1 text-sm font-medium">
                  Section risk radar in real time.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Spot silent drop-offs, messy doubt queues, and mentorship
                  black holes before they show up in grades.
                </p>
              </div>
              <div className="glass-surface rounded-2xl p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  For students
                </p>
                <p className="mt-1 text-sm font-medium">
                  Your learning fingerprint, visualized.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Understand how your efforts, doubts, and peer support change
                  your trajectory every week.
                </p>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-10 bottom-4 h-24 rounded-3xl bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-indigo-500/10 blur-2xl" />
        </motion.div>
      </div>
    </div>
  );
};

