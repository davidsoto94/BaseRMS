import { useState, useEffect } from 'react'
import { ThemeToggle } from './ToggleComponent'
import auth, { decodeJwt } from '../services/auth'
import { Permissions } from '../Enums/PermitionEnum'
import { NavLink } from 'react-router-dom'
import { useTranslation } from '../i18n/I18nProvider'
import LangSelector from './LangSelector'

function getInitials(text: string) {
  const parts = text.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts[1]?.[0] ?? ''
  return (first + last || text[0] || '?').toUpperCase()
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const token =
    auth.getToken?.() ??
    localStorage.getItem('auth_token') ??
    localStorage.getItem('token')

  const payload = token ? decodeJwt(token) : null
  const { t } = useTranslation()
  const displayName =
    payload?.name || payload?.given_name || payload?.email || t('guest')
  const email = payload?.email
  const avatarUrl = payload?.picture

  const canAddUser = payload?.permissions?.includes(Permissions.AddUser) ?? false
  const canViewUsers = payload?.permissions?.includes(Permissions.ViewUser) ?? false

  const toggleSidebar = () => setIsOpen(!isOpen)
  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <NavLink
            to="/"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            onClick={closeSidebar}
          >
            BaseRMS
          </NavLink>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky md:top-0 left-0 z-30 h-screen border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64`}
      >
        {/* Sidebar Header - Hidden on Mobile (shown in mobile header instead) */}
        <div className={`hidden md:flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${isCollapsed ? 'px-2' : 'px-6'} py-4 border-b border-gray-200 dark:border-gray-700`}>
          <NavLink
            to="/"
            className={`text-lg font-semibold text-gray-900 dark:text-gray-100 transition-opacity ${
              isCollapsed ? 'opacity-0 hidden' : 'opacity-100'
            }`}
          >
            BaseRMS
          </NavLink>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors flex-shrink-0"
            title={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Header Spacer */}
        <div className="md:hidden h-0" />

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {canViewUsers && (
            <NavLink
              to="/users"
              onClick={closeSidebar}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  'text-gray-700 dark:text-gray-200',
                  'hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400',
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : '',
                ].join(' ')
              }
              title={isCollapsed ? t('users.title') : ''}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a4 4 0 01-8 0m8 0H9m6 4a4 4 0 01-8 0m8 0H9"
                />
              </svg>
              <span className={`transition-opacity ${isCollapsed ? 'opacity-0 md:hidden' : 'opacity-100'}`}>
                {t('users.title')}
              </span>
            </NavLink>
          )}
          {canAddUser && (
            <NavLink
              to="/register"
              onClick={closeSidebar}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  'text-gray-700 dark:text-gray-200',
                  'hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400',
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : '',
                ].join(' ')
              }
              title={isCollapsed ? t('register_user') : ''}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className={`transition-opacity ${isCollapsed ? 'opacity-0 md:hidden' : 'opacity-100'}`}>
                {t('register_user')}
              </span>
            </NavLink>
          )}
        </nav>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Sidebar Footer - Controls and User Profile */}
        <div className={`px-4 py-4 space-y-4 transition-opacity ${isCollapsed ? 'md:opacity-0 md:pointer-events-none md:hidden' : ''}`}>
          {/* Theme and Language Toggles */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LangSelector />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover shadow flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold shadow flex-shrink-0">
                {getInitials(displayName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </p>
              {email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {email}
                </p>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={async () => {
              await auth.logout()
              window.location.href = '/login'
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 text-sm font-medium transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {t('home.logout')}
          </button>
        </div>

        {/* Collapsed State Footer - Icons Only */}
        <div className={`hidden md:flex flex-col items-center py-4 space-y-4 transition-opacity ${isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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
          <button
            onClick={async () => {
              await auth.logout()
              window.location.href = '/login'
            }}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title={t('home.logout')}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}
    </>
  )
}
