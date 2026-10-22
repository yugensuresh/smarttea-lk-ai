import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthBrandPanel from "../../components/auth/AuthBrandPanel";
import PasswordField from "../../components/auth/PasswordField";
import TextField from "../../components/auth/TextField";
import { login, register } from "../../api/authApi";
import { ApiError } from "../../api/apiClient";
import {
  passwordStrength,
  validateLogin,
  validateSignUp,
} from "../../utils/authValidation";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function StrengthMeter({ password }) {
  const { score, label, tone } = passwordStrength(password);
  const widths = ["w-1/4", "w-2/4", "w-3/4", "w-full"];
  const colors = {
    muted: "bg-[#eef1ef]",
    weak: "bg-[#f87171]",
    fair: "bg-[#fbbf24]",
    good: "bg-[#7bc89a]",
    strong: "bg-[#178a45]",
  };

  if (!password) return null;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="h-1 overflow-hidden rounded-full bg-[#eef1ef]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${widths[score - 1] ?? "w-0"} ${colors[tone]}`}
        />
      </div>
      <p className="mt-1 text-xs text-[#7e8c84]">
        Strength: <span className="font-medium text-[#3e4f46]">{label}</span>
      </p>
    </div>
  );
}

function FeedbackBanner({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex gap-2 rounded-lg px-3 py-2.5 text-sm ${
        isError ? "bg-[#fde8e8] text-[#991b1b]" : "bg-[#e7f7ec] text-[#14532d]"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="leading-relaxed">{message}</p>
    </div>
  );
}

export default function AuthPage({ initialMode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const postAuthPath =
    typeof location.state?.from === "string" && location.state.from.startsWith("/") ? location.state.from : "/";
  const [mode, setMode] = useState(initialMode);
  const [visible, setVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [touched, setTouched] = useState({});
  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: false });
  const [signUpForm, setSignUpForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    document.title = mode === "login" ? "Sign In · SmartTea-LK" : "Create Account · SmartTea-LK";
  }, [mode]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  function switchMode(next) {
    if (next === mode) return;
    setFeedback({ type: null, message: "" });
    setTouched({});
    setVisible(false);
    window.setTimeout(() => {
      setMode(next);
      navigate(next === "login" ? "/login" : "/signup", { replace: true });
      setVisible(true);
    }, 160);
  }

  const loginErrors = validateLogin(loginForm);
  const signUpErrors = validateSignUp(signUpForm);

  function showFieldError(formErrors, field) {
    return touched[field] ? formErrors[field] : undefined;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    const errors = validateLogin(loginForm);
    if (Object.keys(errors).length) {
      setFeedback({ type: "error", message: "Please fix the highlighted fields and try again." });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setFeedback({ type: null, message: "" });
    try {
      await login({
        email: loginForm.email,
        password: loginForm.password,
        rememberMe: loginForm.remember,
      });
      navigate(postAuthPath, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err.message ?? "Sign-in failed. Check your connection and try again.";
      setFeedback({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUpSubmit(event) {
    event.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    const errors = validateSignUp(signUpForm);
    if (Object.keys(errors).length) {
      setFeedback({ type: "error", message: "Please fix the highlighted fields and try again." });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setFeedback({ type: null, message: "" });
    try {
      await register({
        fullName: signUpForm.fullName,
        email: signUpForm.email,
        password: signUpForm.password,
      });
      setFeedback({ type: "success", message: "Account created. Redirecting to your dashboard…" });
      window.setTimeout(() => navigate(postAuthPath, { replace: true }), 400);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err.message ?? "Registration failed. Check your connection and try again.";
      setFeedback({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0c1814] p-4 sm:p-6 md:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage: "url(/auth-tea-plantation.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(12px) brightness(0.35)",
        }}
      />

      <div className="relative w-full max-w-[1080px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col lg:min-h-[640px] lg:flex-row">
          <div className="p-3 sm:p-4 lg:w-[44%] lg:p-4 lg:pr-2">
            <AuthBrandPanel className="min-h-[240px] rounded-[20px] lg:min-h-[608px]" />
          </div>

          <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-14">
            <div
              className={`mx-auto w-full max-w-[400px] transition-all duration-200 ease-out ${
                visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
              }`}
            >
              <header className="mb-8 text-center">
                <h1 className="text-[22px] font-bold tracking-[0.06em] text-[#10241c] sm:text-2xl">
                  {mode === "login" ? "WELCOME BACK!" : "CREATE YOUR ACCOUNT"}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[#7e8c84]">
                  {mode === "login"
                    ? "Sign in to access your plantation intelligence dashboard."
                    : "Join SmartTea-LK to make smarter, data-driven tea plantation decisions."}
                </p>
              </header>

              <FeedbackBanner type={feedback.type} message={feedback.message} />

              {mode === "login" ? (
                <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4" noValidate>
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    error={showFieldError(loginErrors, "email")}
                  />
                  <PasswordField
                    label="Password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    error={showFieldError(loginErrors, "password")}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#3e4f46]">
                      <input
                        type="checkbox"
                        checked={loginForm.remember}
                        onChange={(e) => setLoginForm((f) => ({ ...f, remember: e.target.checked }))}
                        className="h-4 w-4 rounded border-[#c5cec8]"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      className="text-sm font-semibold text-[#10241c] hover:underline"
                      onClick={() =>
                        setFeedback({
                          type: "error",
                          message:
                            "Password recovery requires a backend auth service. This control is UI-only for now.",
                        })
                      }
                    >
                      Forgot password?
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#10241c] text-sm font-semibold text-white transition-colors hover:bg-[#153d2e] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#eef2ef]" />
                    </div>
                    <p className="relative mx-auto w-fit bg-white px-3 text-xs font-medium tracking-wide text-[#a3ada7]">
                      OR
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#e6ece8] bg-white text-sm font-medium text-[#3e4f46] transition-colors hover:bg-[#f9fafb]"
                    onClick={() =>
                      setFeedback({
                        type: "error",
                        message: "Google sign-in is UI-only until OAuth is configured on the backend.",
                      })
                    }
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>
                  <p className="pt-3 text-center text-sm text-[#7e8c84]">
                    New to SmartTea-LK?{" "}
                    <button
                      type="button"
                      className="font-bold text-[#10241c] hover:underline"
                      onClick={() => switchMode("signup")}
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignUpSubmit} className="mt-6 space-y-4" noValidate>
                  <TextField
                    label="Full Name"
                    name="fullName"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={signUpForm.fullName}
                    onChange={(e) => setSignUpForm((f) => ({ ...f, fullName: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                    error={showFieldError(signUpErrors, "fullName")}
                  />
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm((f) => ({ ...f, email: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    error={showFieldError(signUpErrors, "email")}
                  />
                  <div>
                    <PasswordField
                      label="Password"
                      name="password"
                      autoComplete="new-password"
                      placeholder="Enter your password"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm((f) => ({ ...f, password: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      error={showFieldError(signUpErrors, "password")}
                    />
                    <StrengthMeter password={signUpForm.password} />
                  </div>
                  <PasswordField
                    label="Confirm Password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={signUpForm.confirmPassword}
                    onChange={(e) => setSignUpForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                    error={showFieldError(signUpErrors, "confirmPassword")}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#10241c] text-sm font-semibold text-white transition-colors hover:bg-[#153d2e] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating account…
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                  <p className="pt-3 text-center text-sm text-[#7e8c84]">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="font-bold text-[#10241c] hover:underline"
                      onClick={() => switchMode("login")}
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
