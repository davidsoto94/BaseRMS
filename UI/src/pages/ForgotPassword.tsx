import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../components/ToggleComponent";
import LangSelector from "../components/LangSelector";
import { useI18n } from "../i18n/I18nProvider";
import { apiBase } from "../services/auth";
import { fetchWithLanguage } from "../Utilities/fetchWithLanguage";
import type { ErrorResponse } from "../Types/ErrorType";

export default function ForgotPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string[] | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const response = await fetchWithLanguage(`${apiBase}/api/v1/forgotpassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
        throw new Error(errorList.length ? errorList.join("; ") : t("forgot.error_generic"));
      }
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("forgot.error_generic");
      setError([msg]);
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
          {t("forgot.title")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">
          {t("forgot.subtitle")}
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t("forgot.email_label")}
            </span>
            <div className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-3 shadow focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="w-full bg-transparent outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-300"
                placeholder={t("forgot.email_placeholder")}
              />
            </div>
          </label>

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
              {t("forgot.success")}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? t("forgot.submitting") : t("forgot.submit")}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-6 w-full text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
        >
          {t("forgot.back_to_login")}
        </button>
      </div>
    </main>
  );
}
