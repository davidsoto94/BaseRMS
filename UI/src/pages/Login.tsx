import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import auth from '../services/auth'
import { ThemeToggle } from '../components/ToggleComponent'
import { useI18n } from '../i18n/I18nProvider'
import LangSelector from '../components/LangSelector'
import type { ErrorResponse } from '../Types/ErrorType'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string []| null>(null)
  const navigate = useNavigate()
  const { t } = useI18n()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors(null)
    setLoading(true)
    try {
      const response = await auth.login({ email, password })      
      // Check if user needs to set up MFA
      if (response.requireSetupMfa) {
        navigate('/mfa-setup', { 
          replace: true,
          state: { tempToken: response.tempToken }
        })
        return
      } 
      // Check if user needs to verify MFA code
      if (response.mfaRequired) {
        navigate('/mfa-verify', { 
          replace: true,
          state: { tempToken: response.tempToken }
        })
        return
      } 
      // Normal login flow
      navigate('/', { replace: true })
    } catch (err: unknown) {
      console.log('Login error:', err)
      if (err instanceof Error) {
        try {
          const errorData: ErrorResponse = JSON.parse(err.message)          
          const errorList: string[] = []
          if (errorData && errorData.detail) {
            errorList.push(errorData.detail)
          }
          if (errorData?.errors) {
            Object.values(errorData.errors).forEach((messages) => {
              if (Array.isArray(messages)) {
                errorList.push(...messages)
              }
            })
          }
          if (errorList.length) {
            setErrors(errorList)
            return
          }
        } catch {
          setErrors([err.message || t('login.error_generic')])
        }
      } else {
        setErrors([t('login.error_generic')])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <main className="grid min-h-[100svh] w-screen place-items-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6">
        <div className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8 transition-colors">
          <div className="flex justify-end mb-2">            
            <LangSelector />
            <ThemeToggle />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6 sm:mb-8 text-center text-gray-900 dark:text-gray-100">
            {t('login.title')}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t('login.email_label')}
              </label>
              <div className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-3 shadow transition ring-1 ring-gray-300 dark:ring-gray-600 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  className="w-full bg-transparent outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-300"
                  placeholder={t('login.email_placeholder')}
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t('login.password_label')}
              </label>
              <div className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-3 shadow transition ring-1 ring-gray-300 dark:ring-gray-600 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  className="w-full bg-transparent outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-300"
                  placeholder={t('login.password_placeholder')}
                />
              </div>
            </div>

            {errors && (
              <div className="text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md px-3 py-2 mb-5 text-sm">
                {errors.map((errorMessage, index) => (
                  <p key={index}>
                    {errorMessage === 'Login failed' ? t('login.error_generic') : errorMessage}
                  </p>
                ))}
              </div>
            )}
            <div className="mb-5 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              >
                {t('login.forgot_password')}
              </button>
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? t('login.loading') : t('login.submit')}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
