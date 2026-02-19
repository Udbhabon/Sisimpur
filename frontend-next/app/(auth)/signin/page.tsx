"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { sendOtp, verifyOtp, login, signup } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/ToastProvider";

type Mode = "login" | "signup";
type OtpStep = "idle" | "sent" | "verified";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [otpStep, setOtpStep] = useState<OtpStep>("idle");
  const [loading, setLoading] = useState(false);

  // Form fields
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 fade-in">
          <h1 className="text-4xl font-bold gradient-text mb-2">Sisimpur</h1>
          <p className="text-white/40 text-sm">AI-powered quiz & flashcard platform</p>
        </div>

        {/* Card */}
        <div className="glass border border-white/10 rounded-2xl p-8 fade-in">
          {/* Toggle */}
          <div className="flex gap-1 p-1 bg-white/[0.05] rounded-xl mb-8">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium capitalize transition",
                  mode === m
                    ? "bg-purple-600 text-white shadow"
                    : "text-white/50 hover:text-white"
                )}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Login form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field
                icon="ri-mail-line"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={setEmail}
              />
              <Field
                icon="ri-lock-line"
                type="password"
                placeholder="Password"
                value={password}
                onChange={setPassword}
              />
              <SubmitBtn loading={loading}>Sign In</SubmitBtn>
            </form>
          )}

          {/* Signup form */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">

              {/* Email + OTP */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || otpStep === "verified"}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap",
                      otpStep === "verified"
                        ? "bg-green-600/20 text-green-400 border border-green-500/30"
                        : "bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
                    )}
                  >
                    {otpStep === "verified" ? (
                      <><i className="ri-check-line" /> Verified</>
                    ) : loading && otpStep === "idle" ? (
                      "Sending…"
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>

                {otpStep === "sent" && (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <i className="ri-shield-keyhole-line absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        className={inputCls}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className="px-3 py-2 rounded-xl text-sm font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition"
                    >
                      Verify
                    </button>
                  </div>
                )}
              </div>

              <Field
                icon="ri-lock-line"
                type="password"
                placeholder="Password"
                value={password}
                onChange={setPassword}
              />
              <Field
                icon="ri-lock-2-line"
                type="password"
                placeholder="Confirm Password"
                value={passwordConfirm}
                onChange={setPasswordConfirm}
              />
              <SubmitBtn loading={loading} disabled={otpStep !== "verified"}>
                Create Account
              </SubmitBtn>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────

const inputCls =
  "w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 " +
  "text-sm text-white placeholder:text-white/30 outline-none " +
  "focus:border-purple-500/50 focus:bg-white/[0.08] transition";

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <i className={`${icon} absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm`} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}

function SubmitBtn({
  loading,
  disabled,
  children,
}: {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={cn(
        "w-full py-2.5 rounded-xl text-sm font-semibold transition mt-2",
        "bg-gradient-to-r from-purple-600 to-blue-600",
        "hover:from-purple-500 hover:to-blue-500 text-white shadow-lg",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <i className="ri-loader-4-line animate-spin" /> Processing…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
