import { ThemeToggle } from "./ToggleComponent";
import auth, { decodeJwt } from "../services/auth";
import { Permissions } from "../Enums/PermitionEnum";
import { NavLink } from "react-router-dom";
import { useTranslation } from "../i18n/I18nProvider";
import LangSelector from "./LangSelector";

function getInitials(text: string) {
  const parts = text.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[1]?.[0] ?? "";
  return (first + last || text[0] || "?").toUpperCase();
}


export default function NavigationBar() {
  const token =
    auth.getToken?.() ??
    localStorage.getItem("auth_token") ??
    localStorage.getItem("token");

  const payload = token ? decodeJwt(token) : null;
  const { t } = useTranslation();
  const displayName =
    payload?.name || payload?.given_name || payload?.email || t("guest");
  const email = payload?.email;
  const avatarUrl = payload?.picture;

  // Adjust the keys below to match your permission naming
  const canAddUser = payload?.permissions?.includes(Permissions.AddUser) ?? false;
  const canViewUsers = payload?.permissions?.includes(Permissions.ViewUser) ?? false;

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NavLink to="/" className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
               BaseRMS
            </NavLink>
          </div>
          <div className="flex items-center gap-3">
            {canViewUsers && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  [
                    "px-2 py-2 text-sm font-medium",
                    "text-gray-700 dark:text-gray-200",
                    "hover:text-indigo-600 dark:hover:text-indigo-400",
                    isActive ? "border-b-2 border-indigo-600" : "border-b-2 border-transparent",
                  ].join(" ")
                }
              >
                {t("users.title")}
              </NavLink>
            )}
            {canAddUser && (
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  [
                    "px-2 py-2 text-sm font-medium",
                    "text-gray-700 dark:text-gray-200",
                    "hover:text-indigo-600 dark:hover:text-indigo-400",
                    isActive ? "border-b-2 border-indigo-600" : "border-b-2 border-transparent",
                  ].join(" ")
                }
              >
                {t("register_user")}
              </NavLink>
            )}
            <ThemeToggle />
            {/* Language selector (from global i18n) */}
            <LangSelector />
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover shadow"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold shadow">
                  {getInitials(displayName)}
                </div>
              )}
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {displayName}
                </span>
                {email && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
