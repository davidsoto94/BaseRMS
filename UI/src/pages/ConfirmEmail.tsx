import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LangSelector from "../components/LangSelector";
import { ThemeToggle } from "../components/ToggleComponent";
import { useI18n } from "../i18n/I18nProvider";
import { apiBase } from "../services/auth";
import { fetchWithLanguage } from "../Utilities/fetchWithLanguage";
import type { ErrorResponse } from "../Types/ErrorType";

type RequestStatus = "idle" | "loading" | "success" | "error";

type ConfirmErrorKey = "error_generic" | "missing_params";

function getConfirmErrorMessages(data: ErrorResponse | null): string[] {
  if (!data) return [];
  const messages: string[] = [];
  if (data.detail && data.detail.trim().length > 0) {
    messages.push(data.detail.trim());
  }
  if (data.errors) {
    Object.values(data.errors).forEach((errMsgs) => {
      if (Array.isArray(errMsgs)) {
        messages.push(...errMsgs.filter((msg) => typeof msg === "string" && msg.trim().length > 0));
      }
    });
  }
  return messages;
}

export default function ConfirmEmail() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const userId = params.get("userId");
  const token = params.get("token");

  const [status, setStatus] = useState<RequestStatus>("idle");
  const [errorMessages, setErrorMessages] = useState<string[] | null>(null);
  const [errorKey, setErrorKey] = useState<ConfirmErrorKey | null>(null);
  const [attempt, setAttempt] = useState(0);

  const missingParams = !userId || !token;

  useEffect(() => {
    if (missingParams) return;

    let isCancelled = false;

    const confirm = async () => {
      setStatus("loading");
      setErrorMessages(null);
      setErrorKey(null);
      console.log("Starting email confirmation with userId:", userId);
      try {
        const response = await fetchWithLanguage(`${apiBase}/api/v1/confirmemail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, token }),
        });

        if (!response.ok) {
          const messages: string[] = [];
          try {
            const data: ErrorResponse = await response.json();
            const parsedMessages = getConfirmErrorMessages(data);
            if (parsedMessages.length) {
              messages.push(...parsedMessages);
            }
          } catch {
            // Ignore JSON parsing issues and use generic fallback below.
          }
          if (isCancelled) return;
          setStatus("error");
          if (messages.length) {
            setErrorMessages(messages);
          } else {
            setErrorKey("error_generic");
          }
          return;
        }

        if (isCancelled) return;
        setStatus("success");
      } catch {
        if (isCancelled) return;
        setStatus("error");
        setErrorKey("error_generic");
      }
    };

    void confirm();

    return () => {
      isCancelled = true;
    };
  }, [token, userId, attempt, missingParams]);

  const effectiveStatus = missingParams ? "error" : status;
  const effectiveErrorMessages = missingParams ? null : errorMessages;
  const effectiveErrorKey = missingParams ? "missing_params" : errorKey;
  const displayedErrorKey = effectiveErrorMessages ? null : effectiveErrorKey;

  return (
    <main className="grid min-h-[100svh] w-screen place-items-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6">
      <div className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8 transition-colors">
        <div className="flex justify-end mb-2 gap-2">
          <LangSelector />
          <ThemeToggle />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3 text-center text-gray-900 dark:text-gray-100">
          {t("confirm.title")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">
          {effectiveStatus === "success" ? t("confirm.subtitle_success") : t("confirm.subtitle_pending")}
        </p>

        {(effectiveStatus === "idle" || effectiveStatus === "loading") && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-500 dark:text-gray-400">
                {t("confirm.loading")}
              </div>
            </div>
          </div>
        )}

        {effectiveStatus === "success" && (
          <div className="space-y-5">
            <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md px-3 py-2 text-center">
              {t("confirm.success")}
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full py-3 px-4 bg-blue-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              {t("confirm.back_to_login")}
            </button>
          </div>
        )}

        {effectiveStatus === "error" && (
          <div className="space-y-5">
            {effectiveErrorMessages ? (
              <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md px-3 py-2">
                <ul className="list-disc list-inside space-y-1">
                  {effectiveErrorMessages.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </div>
            ) : displayedErrorKey ? (
              <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md px-3 py-2 text-center">
                {t(`confirm.${displayedErrorKey}`)}
              </div>
            ) : null}
            {!missingParams && (
              <button
                type="button"
                onClick={() => setAttempt((prev) => prev + 1)}
                className="w-full py-3 px-4 bg-blue-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                {t("confirm.retry")}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              {t("confirm.back_to_login")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
