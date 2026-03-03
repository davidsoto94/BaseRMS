import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import NavigationBar from '../components/NavigationBar'
import { useI18n } from '../i18n/I18nProvider'
import { Permissions } from '../Enums/PermitionEnum'
import auth, { fetchWithAuth, apiBase, decodeJwt } from '../services/auth'
import type { ErrorResponse } from '../Types/ErrorType'

type User = {
  id: string
  name: string
  lastName: string
  email: string
  emailConfirmed: boolean
}

export default function Users() {
	const token =
    auth.getToken?.() ??
    localStorage.getItem("auth_token") ??
    localStorage.getItem("token");
	const navigate = useNavigate()
	const { t } = useI18n()
	const [users, setUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)
	  const [error, setError] = useState<string[] | null>(null)
	const [resendingId, setResendingId] = useState<string | null>(null)
	const [resendStatus, setResendStatus] = useState<{ [key: string]: string }>({})
	const [disablingMfaId, setDisablingMfaId] = useState<string | null>(null)
	const [disableMfaStatus, setDisableMfaStatus] = useState<{ [key: string]: string }>({})
	const hasFetched = useRef(false)
  const payload = token ? decodeJwt(token) : null;

  const canViewUsers = payload?.permissions?.includes(Permissions.ViewUser) ?? false;
  const canAddUser = payload?.permissions?.includes(Permissions.AddUser) ?? false;
  const canEditUser = payload?.permissions?.includes(Permissions.EditUser) ?? false;
  const canDisableMfa = payload?.permissions?.includes(Permissions.DisableMFA) ?? false;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchWithAuth(`${apiBase}/api/v1/users`)

      if (!response.ok) {
        let errorData: ErrorResponse | null = null
        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }
        const errorList: string[] = []
        if (errorData?.detail) {
          errorList.push(errorData.detail)
        }
        if (errorData?.errors) {
          Object.values(errorData.errors).forEach((messages) => {
            if (Array.isArray(messages)) {
              errorList.push(...messages)
            }
          })
        }
        throw new Error(errorList.length ? errorList.join('; ') : t('users.error'))
      }

      const data = await response.json()
      setUsers(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('users.error')
      setError([msg])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!canViewUsers || hasFetched.current) {
      return
    }

    hasFetched.current = true
    fetchUsers()
  }, [canViewUsers, fetchUsers])

  const handleResendEmail = async (userId: string) => {
    try {
      setResendingId(userId)
      setResendStatus((prev) => ({
        ...prev,
        [userId]: 'sending',
      }))

      const response = await fetchWithAuth(`${apiBase}/api/v1/ResendConfirmationEmail?userId=${userId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(t('users.resend_error'))
      }

      setResendStatus((prev) => ({
        ...prev,
        [userId]: 'success',
      }))

      setTimeout(() => {
        setResendStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[userId]
          return newStatus
        })
      }, 3000)
    } catch {
      setResendStatus((prev) => ({
        ...prev,
        [userId]: 'error',
      }))

      setTimeout(() => {
        setResendStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[userId]
          return newStatus
        })
      }, 3000)
    } finally {
      setResendingId(null)
    }
  }

  const handleEditUser = (userId: string) => {
    navigate(`/users/${userId}/edit`)
  }

  const handleDisableMfa = async (userId: string, userEmail: string) => {
    try {
      setDisablingMfaId(userId)
      setDisableMfaStatus((prev) => ({
        ...prev,
        [userId]: 'sending',
      }))

      const response = await fetchWithAuth(`${apiBase}/api/v1/mfa?emailToDisable=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(t('users.disable_mfa_error'))
      }

      setDisableMfaStatus((prev) => ({
        ...prev,
        [userId]: 'success',
      }))

      setTimeout(() => {
        setDisableMfaStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[userId]
          return newStatus
        })
      }, 3000)
    } catch {
      setDisableMfaStatus((prev) => ({
        ...prev,
        [userId]: 'error',
      }))

      setTimeout(() => {
        setDisableMfaStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[userId]
          return newStatus
        })
      }, 3000)
    } finally {
      setDisablingMfaId(null)
    }
  }

  if (!canViewUsers) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationBar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <section className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <p className="text-center text-gray-600 dark:text-gray-300">
              {t('users.no_permission')}
            </p>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <section className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {t('users.title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{t('users.subtitle')}</p>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="mt-8 flex justify-center">
              <p className="text-gray-600 dark:text-gray-300">{t('users.loading')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="mt-8 flex justify-center">
              <p className="text-gray-600 dark:text-gray-300">{t('users.no_users')}</p>
            </div>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm text-gray-600 dark:text-gray-300">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                      {t('users.name')}
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                      {t('users.email')}
                    </th>
                    {(canAddUser || canEditUser || canDisableMfa) && (
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                        {t('users.actions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-3">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {user.name} {user.lastName}
                        </span>
                      </td>
                      <td className="px-6 py-3">{user.email}</td>
                      {(canAddUser || canEditUser || canDisableMfa) && (
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            {canAddUser && !user.emailConfirmed && (
                              <button
                                onClick={() => handleResendEmail(user.id)}
                                disabled={resendingId === user.id}
                                className="inline-flex items-center rounded-md bg-indigo-600 text-white px-3 py-1 text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                              >
                                {resendingId === user.id ? (
                                  <>
                                    <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent mr-1 animate-spin" />
                                    {t('users.resend_email')}
                                  </>
                                ) : resendStatus[user.id] === 'success' ? (
                                  <>
                                    <span className="mr-1">✓</span>
                                    {t('users.resend_success')}
                                  </>
                                ) : resendStatus[user.id] === 'error' ? (
                                  <>
                                    <span className="mr-1">✕</span>
                                    {t('users.resend_error')}
                                  </>
                                ) : (
                                  t('users.resend_email')
                                )}
                              </button>
                            )}
                            {canEditUser && (
                              <button
                                onClick={() => handleEditUser(user.id)}
                                className="inline-flex items-center rounded-md bg-gray-900 text-white px-3 py-1 text-xs font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300 dark:focus:ring-gray-200 dark:focus:ring-offset-gray-900"
                              >
                                {t('users.edit')}
                              </button>
                            )}
                            {canDisableMfa && (
                              <button
                                onClick={() => handleDisableMfa(user.id, user.email)}
                                disabled={disablingMfaId === user.id}
                                className="inline-flex items-center rounded-md bg-red-600 text-white px-3 py-1 text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                              >
                                {disablingMfaId === user.id ? (
                                  <>
                                    <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent mr-1 animate-spin" />
                                    {t('users.disable_mfa')}
                                  </>
                                ) : disableMfaStatus[user.id] === 'success' ? (
                                  <>
                                    <span className="mr-1">✓</span>
                                    {t('users.disable_mfa_success')}
                                  </>
                                ) : disableMfaStatus[user.id] === 'error' ? (
                                  <>
                                    <span className="mr-1">✕</span>
                                    {t('users.disable_mfa_error')}
                                  </>
                                ) : (
                                  t('users.disable_mfa')
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
