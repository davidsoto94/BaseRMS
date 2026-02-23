import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import NavigationBar from '../components/NavigationBar'
import { useI18n } from '../i18n/I18nProvider'
import { apiBase, isAuthenticated, getTempToken, clearTempToken } from '../services/auth'
import type { ErrorResponse } from '../Types/ErrorType'

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

type MFASetupResponse = {
  qrCode: string // otpauth:// URI
  manualKey: string
  message?: string
  error?: string
}

// Simple QR code generator using canvas
async function generateQRCodeImage(text: string): Promise<string> {
  // Using a public QR code API service
  const encodedText = encodeURIComponent(text)
  const dataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedText}`
  return dataUrl
}

export default function MFASetup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()

  const [status, setStatus] = useState<RequestStatus>('idle')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [manualKey, setManualKey] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if this is from login flow (has tempToken in state)
  const isLoginFlow = !!location.state?.tempToken
  const tempToken = location.state?.tempToken || getTempToken()
  const isLoggedIn = isAuthenticated()

  // Fetch MFA setup on component mount
  useEffect(() => {
    // Redirect if not in login flow and not authenticated
    if (!isLoginFlow && !isLoggedIn) {
      navigate('/login', { replace: true })
      return
    }

    const fetchMFASetup = async () => {
      try {
        setStatus('loading')
        setErrorMessage(null)

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept-Language': localStorage.getItem('lang') || 'en',
        }

        // Add temp token if in login flow
        if (tempToken) {
          headers['Authorization'] = `Bearer ${tempToken}`
        }

        const response = await fetch(`${apiBase}/api/v1/mfa/setup`, {
          method: 'POST',
          headers,
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

        const data: MFASetupResponse = await response.json()
        if (data.qrCode && data.manualKey) {
          // data.qrCode is the otpauth:// URI
          setManualKey(data.manualKey)
          
          // Generate QR code image from the URI
          try {
            const qrDataUrl = await generateQRCodeImage(data.qrCode)
            setQrCodeDataUrl(qrDataUrl)
          } catch (err) {
            console.error('Failed to generate QR code:', err)
            // Still continue even if QR generation fails
          }
          
          setStatus('idle')
        } else {
          throw new Error(t('mfa.error_generic'))
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : t('mfa.error_generic'))
        setStatus('error')
      }
    }

    fetchMFASetup()
  }, [t, isLoginFlow, tempToken, isLoggedIn, navigate])

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!verificationCode || verificationCode.length !== 6) {
      setErrorMessage(t('mfa.error_invalid_code'))
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept-Language': localStorage.getItem('lang') || 'en',
      }

      // Add temp token if in login flow
      if (tempToken) {
        headers['Authorization'] = `Bearer ${tempToken}`
      }

      const response = await fetch(`${apiBase}/api/v1/mfa`, {
        method: 'POST',
        headers,
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
      
      // If this is login flow and we get an accessToken, store it
      if (isLoginFlow && data.accessToken) {
        sessionStorage.setItem('accessToken', data.accessToken)
        clearTempToken()
      }

      setStatus('success')
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('mfa.error_generic'))
      setVerificationCode('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isLoggedIn && <NavigationBar />}
      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <section className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {t('mfa.title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{t('mfa.subtitle')}</p>

          {status === 'loading' ? (
            <div className="mt-8 flex justify-center">
              <p className="text-gray-600 dark:text-gray-300">{t('mfa.loading')}</p>
            </div>
          ) : status === 'success' ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                <p className="text-sm text-green-800 dark:text-green-200">{t('mfa.success')}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('mfa.back_to_home')}...
              </p>
            </div>
          ) : status === 'error' && !qrCodeDataUrl ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{errorMessage || t('mfa.error_generic')}</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2 px-4 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"
              >
                {t('mfa.back_to_home')}
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {/* Step 1: QR Code */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('mfa.step1_title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {t('mfa.step1_description')}
                </p>
                {qrCodeDataUrl && (
                  <div className="flex justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <img src={qrCodeDataUrl} alt="MFA QR Code" className="w-64 h-64" />
                  </div>
                )}
                {manualKey && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Can't scan QR code?
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Enter this key manually in your authenticator app:
                    </p>
                    <code className="block text-center text-lg font-mono text-gray-900 dark:text-gray-100 p-3 bg-white dark:bg-gray-600 rounded">
                      {manualKey}
                    </code>
                  </div>
                )}
              </div>

              {/* Step 2: Verification */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('mfa.step2_title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {t('mfa.step2_description')}
                </p>

                {errorMessage && (
                  <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleVerifyMFA} className="space-y-4">
                  <div>
                    <label
                      htmlFor="code"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 text-center text-2xl tracking-widest border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {verificationCode.length}/6
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || verificationCode.length !== 6}
                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    {isSubmitting ? t('mfa.submitting') : t('mfa.submit')}
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
