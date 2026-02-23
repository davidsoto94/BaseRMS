const TOKEN_KEY = 'accessToken'
const TEMP_TOKEN_KEY = 'tempToken'

let refreshPromise: Promise<boolean> | null = null

type LoginRequest = {
  email: string
  password: string
}

type LoginResponse = {
  accessToken?: string
  tempToken?: string
  requireSetupMfa?: boolean
  mfaRequired?: boolean
}

type RefreshTokenResponse = {
  accessToken: string
}

type JwtPayload = {
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
  permissions?: string;
};

export const apiBase = import.meta.env.VITE_API_BASE_URL || ''

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${apiBase}/api/v1/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json',
      'Accept-Language' : localStorage.getItem('lang') || 'en'
     },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(errText || 'Login failed')
  }

  const data: LoginResponse = await res.json()
  
  // Handle MFA setup required case - store temp token for MFA setup
  if (data.requireSetupMfa) {
    if (data.tempToken) {
      sessionStorage.setItem(TEMP_TOKEN_KEY, data.tempToken)
    }
    return data
  }
  
  // Handle MFA verification required case - store temp token for MFA verification
  if (data.mfaRequired) {
    if (data.tempToken) {
      sessionStorage.setItem(TEMP_TOKEN_KEY, data.tempToken)
    }
    return data
  }
  
  // Normal login flow - store full access token
  if (!data || !data.accessToken) throw new Error('Invalid login response')
  sessionStorage.setItem(TOKEN_KEY, data.accessToken)
  
  return data
}

export async function logout(): Promise<void> {
  try {
    await fetchWithAuth(`${apiBase}/api/v1/logout`, {
      method: 'POST'
    })
  } finally {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TEMP_TOKEN_KEY)
  }
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getTempToken(): string | null {
  return sessionStorage.getItem(TEMP_TOKEN_KEY)
}

export function clearTempToken(): void {
  sessionStorage.removeItem(TEMP_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

/**
 * Refresh the access token using the refresh token from HTTP-only cookie
 * Prevents multiple concurrent refresh attempts
 */
export async function refreshAccessToken(): Promise<boolean> {
  // If a refresh is already in progress, wait for it instead of starting a new one
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/RefreshToken`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': localStorage.getItem('lang') || 'en',
        },
      })

      if (!res.ok) {
        return false
      }

      const data: RefreshTokenResponse = await res.json()
      if (!data.accessToken) {
        return false
      }

      sessionStorage.setItem(TOKEN_KEY, data.accessToken)

      return true
    } catch  {
      sessionStorage.removeItem(TOKEN_KEY)
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(init.headers ?? undefined)
  headers.set("Accept-Language", localStorage.getItem('lang') || 'en')
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  
  let response = await fetch(input, { ...init, headers, credentials: 'include' })

  // If we get a 401, try to refresh the token and retry the request
  if (response.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const newToken = getToken()
      const newHeaders = new Headers(init.headers ?? undefined)
      newHeaders.set("Accept-Language", localStorage.getItem('lang') || 'en')
      if (newToken && !newHeaders.has("Authorization")) {
        newHeaders.set("Authorization", `Bearer ${newToken}`)
      }
      response = await fetch(input, { ...init, headers: newHeaders, credentials: 'include' })
    }
  }

  return response
}

export function isTokenValid(token: string) {
  try {
    const [, payload] = token.split(".")

    if (!payload) return false
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
    if (!decoded?.exp) return true
    const now = Math.floor(Date.now() / 1000)
    return decoded.exp > now
  } catch {
    return false
  }
}

/**
 * Decode a JWT token and return its payload
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Get the current user's JWT payload
 */
export function getCurrentUserPayload(): JwtPayload | null {
  const token = getToken()
  if (!token) return null
  return decodeJwt(token)
}

const auth = {
  login,
  logout,
  getToken,
  isAuthenticated,
  fetchWithAuth,
}

export default auth
