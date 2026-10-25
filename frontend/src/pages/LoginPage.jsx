import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import PasswordInput from "../components/common/PasswordInput";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/apiErrors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!EMAIL_RE.test(form.email.trim()))
      next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setFormError("");
    try {
      await login({ email: form.email.trim(), password: form.password });
      // PublicOnlyRoute redirects once auth state flips
    } catch (err) {
      setFormError(getErrorMessage(err, "Invalid email or password."));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your documents."
      footer={
        <>
          New to DocuMind?{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update("email")}
          error={errors.email}
          autoFocus
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={update("password")}
          error={errors.password}
        />
        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
