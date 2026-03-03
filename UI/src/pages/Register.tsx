import { type FormEvent, useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import { fetchWithAuth, apiBase } from "../services/auth";
import { useI18n } from "../i18n/I18nProvider";
import type { ErrorResponse } from "../Types/ErrorType";


export default function Register() {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState(false);
  const hasFetchedRoles = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[] | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (hasFetchedRoles.current) return;
    hasFetchedRoles.current = true;

    const controller = new AbortController();

    async function fetchRoles() {
      setLoadingRoles(true);
      setRolesError(false);
      try {
        const response = await fetchWithAuth(`${apiBase}/api/v1/roles`, {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed");
        const data = (await response.json()) as string[];
        setRoles(Array.isArray(data) ? data : []);
      } catch {
        if (!controller.signal.aborted) setRolesError(true);
      } finally {
        if (!controller.signal.aborted) setLoadingRoles(false);
      }
    }

    fetchRoles();
  }, []);

  function toggleRole(roleId: string) {
    setSelectedRoles((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
    );
  }

  function handleFieldChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitErrors(null);
    setSubmitSuccess(false);
    setSubmitting(true);
    try {
      const response = await fetchWithAuth(`${apiBase}/api/v1/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          roles: selectedRoles,
        }),
      });
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (!response.ok) {
        const errorData = data as ErrorResponse | null;
        const errorList: string[] = [];
        
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
        
        setSubmitErrors(errorList.length ? errorList : [t("register.error_generic")]);
        return;
      }
      setSubmitSuccess(true);
      setForm({ name: "", lastName: "", email: "", password: "" });
      setSelectedRoles([]);
    } catch (error) {
        const fallback = t("register.error_generic");
        if (error instanceof Error) {
            setSubmitErrors([error.message || fallback]);
        } else {
            setSubmitErrors([fallback]);
        }

    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
        <section className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-8 mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {t("register.title")}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {t("register.subtitle")}
            </p>
          </header>

          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t("register.first_name")}
                </span>
                <input
                  value={form.name}
                  onChange={handleFieldChange("name")}
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-3 text-base text-gray-900 dark:text-gray-100 focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
                  placeholder={t("register.first_name_placeholder")}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t("register.last_name")}
                </span>
                <input
                  value={form.lastName}
                  onChange={handleFieldChange("lastName")}
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-3 text-base text-gray-900 dark:text-gray-100 focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
                  placeholder={t("register.last_name_placeholder")}
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("register.email")}
              </span>
              <input
                value={form.email}
                onChange={handleFieldChange("email")}
                type="email"
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-3 text-base text-gray-900 dark:text-gray-100 focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
                placeholder={t("register.email_placeholder")}
              />
            </label>

            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                {t("register.roles_label")}
              </span>
              {loadingRoles && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t("register.roles_loading")}
                </p>
              )}
              {!loadingRoles && rolesError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t("register.roles_error")}
                </p>
              )}
              {!loadingRoles && !rolesError && roles.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t("register.no_roles")}
                </p>
              )}
              {!loadingRoles && !rolesError && roles.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((role) => {
                    const checked = selectedRoles.includes(role);
                    return (
                      <label
                        key={role}
                        className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition ${
                          checked
                            ? "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRole(role)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>
                          <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                            {role}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            {submitSuccess && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300">
                {t("register.success")}
              </div>
            )}
            {submitErrors && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  {submitErrors.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900"
            >
              {submitting ? t("register.submitting") : t("register.submit")}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
