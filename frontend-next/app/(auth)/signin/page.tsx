"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { sendOtp, verifyOtp, login, signup } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/ToastProvider";

type Mode = "login" | "signup";
type OtpStep = "idle" | "sent" | "verified";

const FEATURES = [
  { icon: "ri-sparkling-2-line", text: "AI generates quizzes from any document" },
  { icon: "ri-brain-line", text: "MCQ, True/False & short-answer modes" },
  { icon: "ri-stack-line", text: "Spaced-repetition flashcard sessions" },
  { icon: "ri-bar-chart-box-line", text: "Track progress & climb the leaderboard" },
];

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [otpStep, setOtpStep] = useState<OtpStep>("idle");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [otp, setOtp] = useState("");

  const { refresh } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  function switchMode(m: Mode) {
    setMode(m);
    setOtpStep("idle");
    setOtp("");
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
  }

  async function handleSendOtp() {
    if (!email) return toast("Enter your email first", "error");
    setLoading(true);
    try {
      await sendOtp(email);
      setOtpStep("sent");
      toast("OTP sent to your email", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send OTP";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp) return toast("Enter the OTP", "error");
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      setOtpStep("verified");
      toast("Email verified!", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid OTP";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      await refresh();
      router.push("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (otpStep !== "verified") return toast("Verify your email first", "error");
    if (password !== passwordConfirm) return toast("Passwords do not match", "error");
    setLoading(true);
    try {
      await signup(email, password, passwordConfirm);
      await refresh();
      router.push("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Signup failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel (lg+) ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative rings */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 500,
            height: 500,
            border: "1px solid rgba(139,92,246,0.14)",
            boxShadow: "0 0 120px 20px rgba(139,92,246,0.07)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ width: 320, height: 320, border: "1px solid rgba(59,130,246,0.10)" }}
        />

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <i className="ri-brain-line text-white text-lg" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">SISIMPUR</span>
        </div>

        {/* Hero + Features */}
        <div className="space-y-8 relative z-10">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
              AI-Powered Learning
            </p>
            <h2 className="text-4xl font-bold leading-tight text-white">
              Study smarter,<br />
              <span className="gradient-text">not harder.</span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Upload any document and let AI generate personalised quizzes,
              flashcards & exams in seconds.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <i className={`${f.icon} text-purple-400 text-sm`} />
                </div>
                <span className="text-white/55 text-sm">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/20 text-xs relative z-10">© 2026 Sisimpur — Built for learners</p>
      </div>

      {/* ── Right form panel ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px] slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-3">
              <i className="ri-brain-line text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">SISIMPUR</h1>
            <p className="text-white/35 text-xs mt-1">AI-powered quiz & flashcard platform</p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: "rgba(12, 12, 22, 0.88)",
              border: "1px solid rgba(255,255,255,0.09)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(139,92,246,0.07), 0 0 60px rgba(139,92,246,0.08)",
            }}
          >
            {/* Heading */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h3>
              <p className="text-white/35 text-sm mt-1">
                {mode === "login"
                  ? "Sign in to continue to your dashboard"
                  : "Join Sisimpur — it&apos;s free to get started"}
              </p>
            </div>

            {/* Tab toggle */}
            <div
              className="flex gap-0.5 p-1 rounded-xl mb-6"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    mode === m
                      ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-900/40"
                      : "text-white/40 hover:text-white/65"
                  )}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* ── LOGIN FORM ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-3">
                <InputField
                  icon="ri-mail-line"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                />
                <InputField
                  icon="ri-lock-line"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                />
                <PrimaryBtn loading={loading} className="mt-1">
                  <i className="ri-arrow-right-line mr-2" />Sign In
                </PrimaryBtn>
              </form>
            )}

            {/* ── SIGNUP FORM ── */}
            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-3">

                {/* Email + Send OTP */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <InputField
                      icon="ri-mail-line"
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={setEmail}
                      autoComplete="email"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || otpStep === "verified"}
                    className={cn(
                      "flex-shrink-0 h-11 px-3.5 rounded-xl text-xs font-semibold transition-all border",
                      otpStep === "verified"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 cursor-default"
                        : "bg-purple-600/18 text-purple-300 border-purple-500/28 hover:bg-purple-600/32 disabled:opacity-40"
                    )}
                  >
                    {otpStep === "verified" ? (
                      <span className="flex items-center gap-1">
                        <i className="ri-check-line" /> Done
                      </span>
                    ) : loading && otpStep === "idle" ? (
                      <i className="ri-loader-4-line animate-spin" />
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>

                {/* OTP verify row */}
                {otpStep === "sent" && (
                  <div className="flex gap-2 slide-up">
                    <div className="flex-1">
                      <InputField
                        icon="ri-shield-keyhole-line"
                        type="text"
                        placeholder="6-digit OTP"
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className="flex-shrink-0 h-11 px-3.5 rounded-xl text-xs font-semibold border bg-blue-600/18 text-blue-300 border-blue-500/28 hover:bg-blue-600/32 transition disabled:opacity-40"
                    >
                      Verify
                    </button>
                  </div>
                )}

                <InputField
                  icon="ri-lock-line"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                />
                <InputField
                  icon="ri-lock-2-line"
                  type="password"
                  placeholder="Confirm password"
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  autoComplete="new-password"
                />

                {otpStep !== "verified" && (
                  <p className="text-xs text-amber-400/65 flex items-center gap-1.5 pt-0.5">
                    <i className="ri-information-line text-sm" />
                    Verify your email before creating account
                  </p>
                )}

                <PrimaryBtn loading={loading} disabled={otpStep !== "verified"} className="mt-1">
                  <i className="ri-user-add-line mr-2" />Create Account
                </PrimaryBtn>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              <span className="text-xs text-white/25">or</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* Google OAuth */}
            <a
              href="/api/auth/google/login/"
              className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white/90 transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                <path d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
                <path d="M6.3 14.7l7 5.1C15.1 17 19.3 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.4 0-13.8 4-17.7 9.7z" fill="#FF3D00"/>
                <path d="M24 45c5.8 0 10.7-1.9 14.6-5.2l-6.8-5.6C29.8 35.9 27 37 24 37c-5.9 0-10.7-3.9-12.4-9.3l-7 5.4C8.3 41 15.6 45 24 45z" fill="#4CAF50"/>
                <path d="M44.5 20H24v8.5h11.8c-.9 2.6-2.6 4.8-4.9 6.4l6.8 5.6C42.4 36.9 45 31 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
              </svg>
              Continue with Google
            </a>
          </div>

          {/* Footer */}
          <p className="text-center text-white/20 text-xs mt-5">
            By continuing you agree to our{" "}
            <span className="text-white/38 hover:text-white/55 cursor-pointer transition">Terms</span>
            {" & "}
            <span className="text-white/38 hover:text-white/55 cursor-pointer transition">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable Input ─────────────────────────────────────────────── */

function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  maxLength,
}: {
  icon: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <div className="relative">
      <i
        className={`${icon} absolute left-3.5 top-1/2 -translate-y-1/2 text-white/28 text-base pointer-events-none`}
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className="w-full h-11 pl-10 pr-4 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.055)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = "rgba(139,92,246,0.10)";
          e.currentTarget.style.border = "1px solid rgba(139,92,246,0.50)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.11)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.055)";
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.10)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

/* ── Primary Button ─────────────────────────────────────────────── */

function PrimaryBtn({
  loading,
  disabled,
  children,
  className,
}: {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={cn(
        "w-full h-11 rounded-xl text-sm font-semibold text-white transition-all",
        "bg-gradient-to-r from-purple-600 to-violet-600",
        "hover:from-purple-500 hover:to-violet-500 hover:scale-[1.01]",
        "active:scale-[0.99]",
        "disabled:opacity-38 disabled:cursor-not-allowed disabled:hover:scale-100",
        className
      )}
      style={{
        boxShadow: (loading || disabled) ? "none" : "0 4px 24px rgba(139,92,246,0.32)",
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <i className="ri-loader-4-line animate-spin" /> Processing…
        </span>
      ) : (
        <span className="flex items-center justify-center">{children}</span>
      )}
    </button>
  );
}
