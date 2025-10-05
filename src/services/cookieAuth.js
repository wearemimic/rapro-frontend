/**
 * Secure Cookie-based Authentication Service
 * Replaces localStorage with httpOnly cookies for JWT security
 */

import axios from 'axios'
import { API_CONFIG } from '@/config'
import { safeSessionStorage } from '@/utils/safeStorage'

class CookieAuthService {
  constructor() {
    this.baseURL = API_CONFIG.API_URL
    this.setupAxiosDefaults()
  }

  setupAxiosDefaults() {
    // Always send cookies with requests
    axios.defaults.withCredentials = true

    // Note: Request/response interceptors are set up in auth.js store
    // This includes CSRF token handling, rate limiting, and token refresh logic
  }

  /**
   * Get CSRF token from cookie
   */
  getCSRFToken() {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'csrftoken') {
        return value
      }
    }
    return null
  }

  /**
   * Fetch CSRF token from server if not available
   */
  async ensureCSRFToken() {
    if (!this.getCSRFToken()) {
      try {
        await axios.get(`${this.baseURL}/auth/cookie/csrf/`)
      } catch (error) {
        console.warn('Failed to get CSRF token:', error)
      }
    }
  }

  /**
   * Login with email and password using cookies
   */
  async login(email, password) {
    await this.ensureCSRFToken()

    const response = await axios.post(`${this.baseURL}/auth/cookie/login/`, {
      email,
      password
    })

    return response.data
  }

  /**
   * Exchange Auth0 code for cookie-based authentication
   */
  async auth0Exchange(code, flowType = 'login', affiliateCode = null) {
    await this.ensureCSRFToken()

    const response = await axios.post(`${this.baseURL}/auth/cookie/auth0/`, {
      code,
      flow_type: flowType,
      affiliate_code: affiliateCode
    })

    return response.data
  }

  /**
   * Logout and clear all cookies
   */
  async logout() {
    try {
      await axios.post(`${this.baseURL}/auth/cookie/logout/`)
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      // Clear any remaining auth state
      this.handleLogout()
    }
  }

  /**
   * Handle logout cleanup (client-side)
   */
  handleLogout() {
    // Clear any cached user data
    safeSessionStorage.clear()

    // Remove auth-related cookies (browser will handle httpOnly ones)
    document.cookie = 'csrftoken=; Max-Age=0; path=/;'

    // Redirect to login
    window.location.href = '/login'
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    const response = await axios.post(`${this.baseURL}/auth/cookie/refresh/`)
    return response.data
  }

  /**
   * Verify authentication status
   */
  async verifyAuth() {
    try {
      const response = await axios.get(`${this.baseURL}/auth/cookie/verify/`)
      return response.data
    } catch (error) {
      throw new Error('Not authenticated')
    }
  }

  /**
   * Check if user is authenticated (client-side check)
   * This is a quick check - not as secure as server verification
   */
  isAuthenticated() {
    // Check if access token cookie exists
    const cookies = document.cookie.split(';')
    return cookies.some(cookie => cookie.trim().startsWith('access_token='))
  }

  /**
   * Migrate existing localStorage tokens to cookies
   * DISABLED: Migration no longer supported - all auth is now cookie-based
   */
  async migrateTocookies() {
    console.warn('Token migration is no longer supported - please log in again')
    // All auth now uses httpOnly cookies only
    throw new Error('Migration no longer supported - please log in again')
  }

  /**
   * Get current user info (cached in sessionStorage for performance)
   */
  async getCurrentUser() {
    try {
      // Try cache first
      const cachedUser = safeSessionStorage.getItem('user')
      if (cachedUser) {
        return JSON.parse(cachedUser)
      }

      // Fetch from server
      const authData = await this.verifyAuth()
      const user = authData.user

      // Cache in sessionStorage (not localStorage for security)
      safeSessionStorage.setItem('user', JSON.stringify(user))

      return user
    } catch (error) {
      // Clear any stale cache
      safeSessionStorage.removeItem('user')
      throw error
    }
  }

  /**
   * Clear cached user data
   */
  clearUserCache() {
    sessionStorage.removeItem('user')
  }
}

// Create singleton instance
const cookieAuthService = new CookieAuthService()

export default cookieAuthService

// Named exports for convenience
export const {
  login,
  auth0Exchange,
  logout,
  refreshToken,
  verifyAuth,
  isAuthenticated,
  migrateTocookies,
  getCurrentUser,
  clearUserCache
} = cookieAuthService