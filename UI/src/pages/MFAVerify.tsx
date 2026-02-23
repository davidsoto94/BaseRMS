import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ThemeToggle } from '../components/ToggleComponent'
import { useI18n } from '../i18n/I18nProvider'
import LangSelector from '../components/LangSelector'
import { apiBase, getTempToken, clearTempToken } from '../services/auth'
import type { ErrorResponse } from '../Types/ErrorType'

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

export default function MFAVerify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  
  const [verificationCode, setVerificationCode] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [status, setStatus] = useState<RequestStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Get temp token from location state or session storage
  const tempToken = location.state?.tempToken || getTempToken()
  
  if (!tempToken) {
    return (
      <div>
        <main className="grid min-h-[100svh] w-screen place-items-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6">
          <div className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8 transition-colors">
            <div className="flex justify-end mb-2 gap-2">
              <LangSelector />
              <ThemeToggle />
            </div>
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{t('mfa.error_generic')}</p>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
              >
                Back to Login
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!verificationCode || verificationCode.length !== 6) {
      setErrorMessage(t('mfa.error_invalid_code'))
      return
    }

    try {
      setStatus('loading')
      setErrorMessage(null)

      const endpoint = trustDevice ? '/api/v1/mfa/verify/trust-device' : '/api/v1/mfa/verify'
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': localStorage.getItem('lang') || 'en',
          Authorization: `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      if (!response.ok) {
        const errorList: string[] = []
        try {
          const errorData = await response.json() as ErrorResponse
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
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(errorList.length ? errorList.join('; ') : t('mfa.error_generic'))
      }

      const data = await response.json()
      
      // Store the full token returned after MFA verification
      if (data.accessToken) {
        sessionStorage.setItem('accessToken', data.accessToken)
        clearTempToken()
      }

      setStatus('success')
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 1000)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : t('mfa.error_generic'))
      setVerificationCode('')
    }
  }

  return (
    <div>
      <main className="grid min-h-[100svh] w-screen place-items-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6">
        <div className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8 transition-colors">
          <div className="flex justify-end mb-2 gap-2">
            <LangSelector />
            <ThemeToggle />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-center text-gray-900 dark:text-gray-100">
            {t('mfa.title_verify')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">
            {t('mfa.subtitle_verify')}
          </p>

          {status === 'success' ? (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                <p className="text-sm text-green-800 dark:text-green-200 text-center">
                  {t('mfa.success')}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t('mfa.code_label')}
                </label>
                <input
                  type="text"
                  id="code"
                  maxLength={6}
                  placeholder={t('mfa.code_placeholder')}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={status === 'loading'}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  autoFocus
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {verificationCode.length}/6
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="trustDevice"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  disabled={status === 'loading'}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="trustDevice"
                  className="ml-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {t('mfa.trust_device')}
                </label>
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || verificationCode.length !== 6}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                {status === 'loading' ? t('mfa.submitting') : t('mfa.submit')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-2 px-4 text-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
