import { type FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ThemeToggle } from "../components/ToggleComponent";
import LangSelector from "../components/LangSelector";
import { useI18n } from "../i18n/I18nProvider";
import { apiBase } from "../services/auth";
import { fetchWithLanguage } from "../Utilities/fetchWithLanguage";
import type { ErrorResponse } from "../Types/ErrorType";

export default function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string[] | null>(null);

  const missingParams = !token || !email;

  type PasswordRequirementCode =
    | "PasswordTooShort"
    | "PasswordRequiresNonAlphanumeric"
    | "PasswordRequiresDigit"
    | "PasswordRequiresUpper";

  const passwordRequirementMessages: Record<PasswordRequirementCode, string> = {
    PasswordTooShort: t("reset.codes.PasswordTooShort"),
    PasswordRequiresNonAlphanumeric: t("reset.codes.PasswordRequiresNonAlphanumeric"),
    PasswordRequiresDigit: t("reset.codes.PasswordRequiresDigit"),
    PasswordRequiresUpper: t("reset.codes.PasswordRequiresUpper"),
  };


  const passwordRequirementChecks: Array<{ code: PasswordRequirementCode; valid: boolean }> = [
    { code: "PasswordTooShort", valid: password.length >= 6 },
    { code: "PasswordRequiresNonAlphanumeric", valid: /[^A-Za-z0-9]/.test(password) },
    { code: "PasswordRequiresDigit", valid: /\d/.test(password) },
    { code: "PasswordRequiresUpper", valid: /[A-Z]/.test(password) },
  ];

  const unmetRequirementCodes = passwordRequirementChecks.filter(({ valid }) => !valid).map(({ code }) => code);
  const unmetRequirementMessages = unmetRequirementCodes.map((code) => passwordRequirementMessages[code] ?? code);

  const toErrorList = (message: string) =>
    message
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (missingParams) return;
    if (password !== confirm) {
      setError([t("reset.password_mismatch")]);
      return;
    }
    if (unmetRequirementMessages.length) {
      setError(unmetRequirementMessages);
      setSuccess(false);
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const response = await fetchWithLanguage(`${apiBase}/api/v1/resetpassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetCode: token, email, newPassword: password }),
      });

      if (!response.ok) {
        const errorList: string[] = [];
        try {
          const errorData = await response.json() as ErrorResponse;
          if (errorData?.detail) {
            errorList.push(errorData.detail);
          }
          if (errorData?.errors) {
            Object.values(errorData.errors).forEach((messages) => {
              if (Array.isArray(messages)) {
                errorList.push(...messages);
              }
            });
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(errorList.length ? errorList.join("\n") : t("reset.error_generic"));
      }

      setSuccess(true);
      setPassword("");
      setConfirm("");
    } catch (err) {
      const fallback = t("reset.error_generic");
      if (err instanceof Error) {
        setError(toErrorList(err.message || fallback));
      } else {
        setError([fallback]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-[100svh] w-screen place-items-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6">
      <div className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8 transition-colors">
        <div className="flex justify-end mb-2 gap-2">
          <LangSelector />
          <ThemeToggle />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3 text-center text-gray-900 dark:text-gray-100">
          {t("reset.title")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">
          {t("reset.subtitle")}
        </p>

        {missingParams ? (
          <div className="space-y-5">
            <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md px-3 py-2 text-center">
              {t("reset.missing_params")}
            </div>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="w-full py-3 px-4 bg-blue-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              {t("reset.back_to_forgot")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t("reset.new_password_label")}
              </span>
              <div className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-3 shadow focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  className="w-full bg-transparent outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-300"
                  placeholder={t("reset.new_password_placeholder")}
                />
              </div>
              <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                {passwordRequirementChecks.map(({ code, valid }) => (
                  <li
                    key={code}
                    className={valid ? "flex items-center text-green-600 dark:text-green-400" : "flex items-center text-gray-500 dark:text-gray-400"}
                  >
                    <span className="mr-2">{valid ? "✓" : "•"}</span>
                    {passwordRequirementMessages[code]}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t("reset.confirm_password_label")}
              </span>
              <div className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-3 shadow focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600">
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  type="password"
                  required
                  className="w-full bg-transparent outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-300"
                  placeholder={t("reset.confirm_password_placeholder")}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md px-3 py-2">
                <ul className="list-disc list-inside space-y-1">
                  {error.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
            {success && (
              <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md px-3 py-2">
                {t("reset.success")}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || unmetRequirementCodes.length > 0}
              className="w-full py-3 px-4 bg-blue-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? t("reset.submitting") : t("reset.submit")}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              {t("reset.back_to_login")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
