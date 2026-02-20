import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { sendOtp, verifyOtp, login, signup } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/ToastProvider";

type Mode = "login" | "signup";
type OtpStep = "idle" | "sent" | "verified";

/* ─── Page-level styles injected once ─────────────────────────── */
const PAGE_STYLE = `
  .sisimpur-bg {
    background-color: #0B0C15;
    font-family: 'Inter', sans-serif;
  }
  .bg-grid {
    background-size: 40px 40px;
    background-image:
      linear-gradient(to right,  rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
    mask-image: radial-gradient(circle at center, black, transparent 80%);
    -webkit-mask-image: radial-gradient(circle at center, black, transparent 80%);
  }
  .glass-card {
    background: rgba(22, 24, 34, 0.75);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.09);
    box-shadow: 0 8px 32px 0 rgba(0,0,0,0.45);
  }
  .text-glow { text-shadow: 0 0 20px rgba(124,58,237,0.5); }
  .logo-glow { filter: drop-shadow(0 0 10px rgba(6,182,212,0.4)); }
  .particle-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    z-index: 0;
  }
  .top-bar-gradient {
    background: linear-gradient(to right, transparent, #7C3AED, transparent);
  }
`;

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
  const navigate = useNavigate();

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
      navigate("/dashboard");
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
      navigate("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Signup failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Inject page-scoped styles */}
      <style>{PAGE_STYLE}</style>

      <div className="sisimpur-bg min-h-screen flex items-center justify-center relative overflow-hidden text-gray-200">
        {/* Grid overlay */}
        <div className="absolute inset-0 z-0 bg-grid opacity-100 pointer-events-none" />

        {/* Particle blobs */}
        <div
          className="particle-blob opacity-40"
          style={{ width: 384, height: 384, background: "#7C3AED", top: -100, left: -100 }}
        />
        <div
          className="particle-blob opacity-20"
          style={{ width: 256, height: 256, background: "#06B6D4", bottom: -50, right: -50 }}
        />
        <div
          className="particle-blob opacity-20"
          style={{ width: 320, height: 320, background: "#581C87", top: "20%", right: "30%" }}
        />

        {/* Main container */}
        <div className="container mx-auto px-4 py-8 relative z-10 w-full max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">

            {/* ── Left Branding Panel ──────────────────────────────── */}
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
              {/* Logo + Title */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg logo-glow"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                    boxShadow: "0 10px 30px rgba(124,58,237,0.3)",
                  }}
                >
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h1 className="text-5xl font-bold tracking-tight text-white">
                  <span style={{ color: "#06B6D4" }}>SIS</span>IMPUR
                </h1>
              </div>

              {/* Tagline + Quote */}
              <div className="space-y-6 max-w-lg">
                <h2 className="text-3xl lg:text-4xl font-semibold leading-tight text-gray-100">
                  Transform your study material into{" "}
                  <span style={{ color: "#7C3AED" }} className="text-glow">
                    mastery.
                  </span>
                </h2>

                <blockquote
                  className="relative pl-6 italic text-lg text-gray-400"
                  style={{ borderLeft: "4px solid rgba(124,58,237,0.5)" }}
                >
                  "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence."
                  <footer className="mt-2 text-sm font-semibold not-italic" style={{ color: "#06B6D4" }}>
                    — Abigail Adams
                  </footer>
                </blockquote>

                {/* Animated dots */}
                <div className="flex gap-2 pt-4 justify-center lg:justify-start">
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#06B6D4", animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#7C3AED", animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#C084FC", animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>

            {/* ── Right Glass Card ─────────────────────────────────── */}
            <div className="w-full lg:w-[480px]">
              <div className="glass-card rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 w-full h-0.5 top-bar-gradient opacity-50" />

                {/* Card header */}
                <div className="mb-7 text-center">
                  <h3 className="text-2xl font-bold text-white mb-1.5">
                    {mode === "login" ? "Welcome Back" : "Create Account"}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {mode === "login"
                      ? "Please enter your details to sign in."
                      : "Join Sisimpur — it's free to get started."}
                  </p>
                </div>

                {/* ── LOGIN FORM ── */}
                {mode === "login" && (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <FaInputField
                      icon="fa-envelope"
                      type="email"
                      id="email"
                      label="Email Address"
                      placeholder="you@example.com"
                      value={email}
                      onChange={setEmail}
                      autoComplete="email"
                    />
                    <FaInputField
                      icon="fa-lock"
                      type="password"
                      id="password"
                      label="Password"
                      placeholder="••••••••"
                      value={password}
                      onChange={setPassword}
                      autoComplete="current-password"
                      labelRight={
                        <button
                          type="button"
                          className="text-sm font-medium transition-colors"
                          style={{ color: "#06B6D4" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#67E8F9")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#06B6D4")}
                        >
                          Forgot Password?
                        </button>
                      }
                    />
                    <PrimaryBtn loading={loading}>Sign In</PrimaryBtn>
                  </form>
                )}

                {/* ── SIGNUP FORM ── */}
                {mode === "signup" && (
                  <form onSubmit={handleSignup} className="space-y-4">
                    {/* Email row + Send OTP */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">
                        Email Address
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fas fa-envelope text-gray-500 text-sm" />
                          </div>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            className="block w-full pl-10 pr-3 py-3 rounded-xl text-sm text-gray-100 placeholder-gray-500 outline-none transition-all"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.border = "1px solid rgba(124,58,237,0.6)";
                              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading || otpStep === "verified"}
                          className={cn(
                            "flex-shrink-0 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all border",
                            otpStep === "verified"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 cursor-default"
                              : "bg-violet-600/20 text-violet-300 border-violet-500/30 hover:bg-violet-600/35 disabled:opacity-40"
                          )}
                        >
                          {otpStep === "verified" ? (
                            <span className="flex items-center gap-1">
                              <i className="fas fa-check" /> Done
                            </span>
                          ) : loading && otpStep === "idle" ? (
                            <i className="fas fa-spinner fa-spin" />
                          ) : (
                            "Send OTP"
                          )}
                        </button>
                      </div>
                    </div>

                    {/* OTP verify row */}
                    {otpStep === "sent" && (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fas fa-shield-halved text-gray-500 text-sm" />
                          </div>
                          <input
                            type="text"
                            placeholder="6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            className="block w-full pl-10 pr-3 py-3 rounded-xl text-sm text-gray-100 placeholder-gray-500 outline-none transition-all"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.border = "1px solid rgba(59,130,246,0.6)";
                              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={loading}
                          className="flex-shrink-0 px-3.5 py-3 rounded-xl text-xs font-semibold border bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/35 transition disabled:opacity-40"
                        >
                          Verify
                        </button>
                      </div>
                    )}

                    <FaInputField
                      icon="fa-lock"
                      type="password"
                      id="password"
                      label="Password"
                      placeholder="••••••••"
                      value={password}
                      onChange={setPassword}
                      autoComplete="new-password"
                    />
                    <FaInputField
                      icon="fa-lock"
                      type="password"
                      id="password_confirm"
                      label="Confirm Password"
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={setPasswordConfirm}
                      autoComplete="new-password"
                    />

                    {otpStep !== "verified" && (
                      <p className="text-xs text-amber-400/70 flex items-center gap-1.5">
                        <i className="fas fa-circle-info" />
                        Verify your email before creating account
                      </p>
                    )}

                    <PrimaryBtn loading={loading} disabled={otpStep !== "verified"}>
                      Create Account
                    </PrimaryBtn>
                  </form>
                )}

                {/* OR divider */}
                <div className="relative py-4 mt-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span
                      className="px-2 text-gray-500"
                      style={{ background: "rgba(22,24,34,0.9)" }}
                    >
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google OAuth */}
                <a
                  href="/api/auth/google/login/"
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-medium text-gray-200 transition-colors duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)")
                  }
                >
                  <svg aria-hidden="true" className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </a>

                {/* Switch mode link */}
                <div className="mt-7 text-center">
                  <p className="text-sm text-gray-500">
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                      className="font-medium transition-colors"
                      style={{ color: "#7C3AED" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = "#A78BFA")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = "#7C3AED")
                      }
                    >
                      {mode === "login" ? "Create an account" : "Sign in"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
          <p className="text-xs text-gray-600">&copy; 2025 SISIMPUR. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}

/* ── Font-Awesome-based labeled input field ──────────────────────── */

function FaInputField({
  icon,
  type,
  id,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
  labelRight,
}: {
  icon: string;
  type: string;
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  labelRight?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 ml-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className={`fas ${icon} text-gray-500 text-sm`} />
        </div>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="block w-full pl-10 pr-3 py-3 rounded-xl text-sm text-gray-100 placeholder-gray-500 outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "1px solid rgba(124,58,237,0.6)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>
    </div>
  );
}

/* ── Primary Submit Button ──────────────────────────────────────── */

function PrimaryBtn({
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
        "w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200",
        "hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 focus:ring-offset-gray-900",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      )}
      style={{
        background: loading || disabled ? "#7C3AED" : "linear-gradient(to right, #7C3AED, #6D28D9)",
        boxShadow: loading || disabled ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
      }}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <i className="fas fa-spinner fa-spin" /> Processing…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

  const [mode, setMode] = useState<Mode>("login");
  const [otpStep, setOtpStep] = useState<OtpStep>("idle");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [otp, setOtp] = useState("");

  const { refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      navigate("/dashboard");
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
      navigate("/dashboard");
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

        <p className="text-white/20 text-xs relative z-10">&copy; 2026 Sisimpur — Built for learners</p>
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
                  : "Join Sisimpur — it's free to get started"}
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
