import { defineStore } from 'pinia';
import { API_CONFIG } from '@/config';
import axios from 'axios';
import router from '@/router';
import { isTokenValid, isTokenExpiringSoon, getTokenExpirationInMinutes } from '@/utils/tokenUtils';
import { safeSessionStorage } from '@/utils/safeStorage';

// DEPRECATED: Tokens now in httpOnly cookies - not accessible to JavaScript
// These functions kept for backward compatibility but always return null
function getTokenFromCookie() {
  return null; // httpOnly cookies cannot be read by JavaScript
}

function getToken() {
  return null; // Tokens in httpOnly cookies - not accessible to JavaScript
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // Will be fetched from backend using httpOnly cookies
    token: null, // No longer used - tokens in httpOnly cookies
    loading: false,
    error: null,
    isAuth0: false,
    authInitialized: false, // Track if auth has been initialized
    refreshAttempts: 0,
    maxRefreshAttempts: 3,
    isRefreshing: false,
    failedRequestsQueue: [],
    // Impersonation state
    isImpersonating: false,
    originalUser: null,
    impersonationSession: null,
  }),
  persist: true,
  getters: {
    accessToken: (state) => null, // Tokens in httpOnly cookies - not accessible to JS
    isAuthenticated: (state) => !!state.user, // Check user instead of token
    isTokenValidAndFresh: (state) => {
      // Cookies handle token validity - just check if user is logged in
      return !!state.user;
    },
    tokenExpirationMinutes: () => {
      // Tokens in httpOnly cookies - expiration handled by backend
      return -1;
    },
    
    // Admin-related getters
    isAdminUser: (state) => {
      return state.user?.is_admin_user || false;
    },
    
    adminRole: (state) => {
      return state.user?.admin_role || '';
    },
    
    adminRoleDisplay: (state) => {
      return state.user?.admin_role_display || 'No Admin Role';
    },
    
    adminPermissions: (state) => {
      return state.user?.admin_permissions || {};
    },
    
    isSuperAdmin: (state) => {
      return state.user?.admin_role === 'super_admin';
    },

    // Impersonation getters
    impersonatedUser: (state) => {
      return state.isImpersonating ? state.user : null;
    },

    realAdminUser: (state) => {
      return state.isImpersonating ? state.originalUser : state.user;
    },

    impersonationSessionInfo: (state) => state.impersonationSession,
  },
  actions: {
    async init() {
      // Enable credentials (httpOnly cookies) for all axios requests
      axios.defaults.withCredentials = true;

      // Always set up the interceptor for token refresh handling
      this.setupAxiosInterceptor();

      // Fetch user from backend using httpOnly cookies
      try {
        await this.fetchProfile();
      } catch (e) {
        console.log('No active session');
      }

      this.authInitialized = true;
    },
    setupAxiosInterceptor() {
      // Request interceptor to ensure credentials are sent
      axios.interceptors.request.use(
        config => {
          // Ensure credentials are included (httpOnly cookies)
          config.withCredentials = true;
          // No need to add Authorization header - cookies handle auth
          return config;
        },
        error => Promise.reject(error)
      );

      // Response interceptor for token refresh and error handling
      axios.interceptors.response.use(
        response => response,
        async error => {
          const originalRequest = error.config;

          // Check for rate limiting (429 status)
          if (error.response && error.response.status === 429) {
            console.warn('Rate limited - retrying after delay');
            
            // Implement exponential backoff for rate limiting
            const retryDelay = Math.min(1000 * Math.pow(2, (originalRequest._retryCount || 0)), 5000);
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
            
            // Only retry up to 3 times
            if (originalRequest._retryCount <= 3) {
              console.log(`Retrying rate limited request in ${retryDelay}ms (attempt ${originalRequest._retryCount})`);
              
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve(axios(originalRequest));
                }, retryDelay);
              });
            } else {
              console.error('Rate limited - max retries exceeded, continuing without logout');
              return Promise.reject(new Error('Rate limited. Please wait and try again.'));
            }
          }

          // Skip refresh for certain endpoints
          const skipRefreshEndpoints = ['/api/token/refresh/', '/api/auth0/'];
          const shouldSkipRefresh = skipRefreshEndpoints.some(endpoint => 
            originalRequest.url.includes(endpoint)
          );

          if (shouldSkipRefresh && error.response?.status === 401) {
            // Refresh token is invalid, clear auth and redirect
            this.clearAuthData();
            router.push('/login');
            return Promise.reject(error);
          }

          // Handle 401 errors with token refresh
          if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            this.user && // Check if user is logged in (tokens in httpOnly cookies)
            this.refreshAttempts < this.maxRefreshAttempts
          ) {
            console.log(`401 error on ${originalRequest.url}, attempting token refresh (attempt ${this.refreshAttempts + 1}/${this.maxRefreshAttempts})`);
            originalRequest._retry = true;

            // If already refreshing, queue the request
            if (this.isRefreshing) {
              return new Promise((resolve, reject) => {
                this.failedRequestsQueue.push({ resolve, reject, originalRequest });
              });
            }

            this.isRefreshing = true;
            this.refreshAttempts++;

            try {
              // Add exponential backoff delay
              const delay = Math.min(1000 * Math.pow(2, this.refreshAttempts - 1), 10000);
              await new Promise(resolve => setTimeout(resolve, delay));

              // Refresh token using httpOnly cookie (no body needed)
              await axios.post(`${API_CONFIG.API_URL}/token/refresh/`, {}, {
                withCredentials: true  // Send refresh_token cookie
              });

              // Backend sets new access_token cookie automatically
              // No need to store tokens in localStorage

              // Reset refresh attempts on success
              this.refreshAttempts = 0;
              this.isRefreshing = false;

              // Process queued requests
              this.processQueue(null, null);

              // Retry original request (cookies will be sent automatically)
              return axios(originalRequest);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              this.isRefreshing = false;
              
              // Process queue with error
              this.processQueue(refreshError, null);
              
              // Clear auth and redirect to login
              this.clearAuthData();
              router.push('/login');
              
              return Promise.reject(refreshError);
            }
          }

          // For other errors or max attempts reached
          if (error.response?.status === 401 && this.refreshAttempts >= this.maxRefreshAttempts) {
            console.error('Max refresh attempts reached');
            this.clearAuthData();
            router.push('/login');
          }

          return Promise.reject(error);
        }
      );
    },

    processQueue(error, token = null) {
      this.failedRequestsQueue.forEach(promise => {
        if (error) {
          promise.reject(error);
        } else {
          // No need to set Authorization header - cookies handle auth
          promise.resolve(axios(promise.originalRequest));
        }
      });
      this.failedRequestsQueue = [];
    },

    async refreshTokenPreemptively() {
      if (this.isRefreshing) {
        console.log('Refresh already in progress, skipping preemptive refresh');
        return;
      }

      if (!this.user) {
        console.warn('No user logged in for preemptive refresh');
        throw new Error('No user logged in');
      }

      this.isRefreshing = true;
      console.log('Starting preemptive token refresh (cookie-based)');

      try {
        // Refresh using httpOnly cookie
        await axios.post(`${API_CONFIG.API_URL}/token/refresh/`, {}, {
          withCredentials: true
        });

        // Backend sets new access_token cookie automatically
        this.refreshAttempts = 0;
        console.log('Preemptive token refresh successful');

        return true;
      } catch (error) {
        console.error('Preemptive token refresh failed:', error);
        throw error;
      } finally {
        this.isRefreshing = false;
      }
    },

    async ensureValidToken() {
      // With httpOnly cookies, we just check if user is logged in
      // Token expiration is handled by backend and axios interceptor
      if (!this.user) {
        throw new Error('No user logged in');
      }

      // Tokens in httpOnly cookies - no client-side validation needed
      return true;
    },

    async clearAuthData() {
      this.token = null;
      this.user = null;
      this.isAuth0 = false;
      this.refreshAttempts = 0;
      this.isRefreshing = false;
      this.failedRequestsQueue = [];
      this.authInitialized = false; // Reset auth state

      // Clear impersonation state
      this.isImpersonating = false;
      this.originalUser = null;
      this.impersonationSession = null;

      // Call backend to clear httpOnly cookies
      try {
        await axios.post(`${API_CONFIG.API_URL}/auth/cookie/logout/`, {}, {
          withCredentials: true
        });
      } catch (error) {
        console.error('Logout cookie clear failed:', error);
      }

      delete axios.defaults.headers.common['Authorization'];
    },
    async login(credentials) {
      // Deprecated: Use Auth0 login instead
      console.warn('Traditional login is deprecated. Use Auth0 authentication.');
      return this.loginWithAuth0(credentials.auth0Token);
    },
    
    async loginWithAuth0(auth0Token) {
      this.loading = true;
      this.error = null;
      try {
        console.log('Making request to backend with Auth0 token...');
        const response = await axios.post(`${API_CONFIG.API_URL}/auth0/login/`, {
          auth0Token: auth0Token
        }, {
          withCredentials: true  // Send cookies
        });

        console.log('Backend response received:', response.status);

        // Tokens in httpOnly cookies - user in state only
        this.user = response.data.user;
        this.isAuth0 = true;

        console.log('Auth0 login successful, user:', this.user.email);
        return true;
      } catch (err) {
        console.error('Auth0 login error:', err);
        this.error = err.response?.data?.message || err.message || 'Auth0 login failed';
        
        // Log more details for debugging
        if (err.response) {
          console.error('Response status:', err.response.status);
          console.error('Response data:', err.response.data);
        }
        
        return false;
      } finally {
        this.loading = false;
      }
    },

    async register(credentials) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(`${API_CONFIG.API_URL}/auth0/signup/`, credentials, {
          withCredentials: true  // Send cookies
        });
        // Tokens in httpOnly cookies - user in state only
        this.user = response.data.user;
        this.isAuth0 = true;

        return true;
      } catch (error) {
        this.error = error.response?.data?.message || 'Registration failed';
        return false;
      } finally {
        this.loading = false;
      }
    },

    // User Management Functions
    async getUsers(params = {}) {
      try {
        const response = await axios.get(`${API_CONFIG.API_URL}/users/`, { params });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch users');
      }
    },

    async getUserById(userId) {
      try {
        const response = await axios.get(`${API_CONFIG.API_URL}/users/${userId}/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch user');
      }
    },

    async updateUser(userId, userData) {
      try {
        const response = await axios.put(`${API_CONFIG.API_URL}/users/${userId}/`, userData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update user');
      }
    },

    async deleteUser(userId) {
      try {
        await axios.delete(`${API_CONFIG.API_URL}/users/${userId}/`);
        return true;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete user');
      }
    },

    async resetUserPassword(userId) {
      try {
        const response = await axios.post(`${API_CONFIG.API_URL}/users/${userId}/reset-password/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to reset password');
      }
    },

    setUser(user) {
      this.user = user;
    },
    
    setTokens(tokens) {
      // Tokens are now in httpOnly cookies - no need to store in localStorage
      // This function kept for backward compatibility but does nothing with tokens

      // Ensure interceptor is set up
      if (!axios.interceptors.request.handlers.length) {
        this.setupAxiosInterceptor();
      }
    },

    async fetchProfile() {
      try {
        const response = await axios.get(`${API_CONFIG.API_URL}/profile/`, {
          withCredentials: true
        });
        this.setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        throw error; // Re-throw so init() knows fetch failed
      }
    },

    logout(auth0) {
      // Use the centralized clearAuthData method
      this.clearAuthData();
      
      // If Auth0 instance is provided, logout from Auth0 as well
      if (auth0) {
        auth0.logout({
          logoutParams: {
            returnTo: window.location.origin + '/login'
          }
        });
      } else {
        // If no Auth0 instance, just redirect to login
        router.push('/login');
      }
    },
    
    // Admin helper methods
    hasAdminPermission(permissionKey) {
      if (!this.isAdminUser) return false;
      if (this.isSuperAdmin) return true;
      return this.adminPermissions[permissionKey] || false;
    },
    
    canAccessAdminSection(section) {
      if (!this.isAdminUser) return false;
      if (this.isSuperAdmin) return true;
      
      const sectionPermissions = {
        'user_management': ['admin', 'support'],
        'billing': ['admin', 'billing'],
        'analytics': ['admin', 'analyst'],
        'system_monitoring': ['admin'],
        'support_tools': ['admin', 'support'],
      };
      
      const allowedRoles = sectionPermissions[section] || [];
      return allowedRoles.includes(this.adminRole);
    },
    
    getAccessibleAdminSections() {
      if (!this.isAdminUser) return [];
      
      const sections = ['user_management', 'billing', 'analytics', 'system_monitoring', 'support_tools'];
      return sections.filter(section => this.canAccessAdminSection(section));
    },
    
    async updateUserAdminRole(userId, adminRole, adminPermissions = {}) {
      if (!this.canAccessAdminSection('user_management')) {
        throw new Error('Insufficient permissions to update user admin roles');
      }
      
      try {
        const response = await axios.put(`${API_CONFIG.API_URL}/admin/users/${userId}/admin-role/`, {
          admin_role: adminRole,
          admin_permissions: adminPermissions,
          is_platform_admin: !!adminRole
        });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update admin role');
      }
    },
    
    async fetchAdminStats() {
      if (!this.isAdminUser) {
        throw new Error('Admin access required');
      }
      
      try {
        const response = await axios.get(`${API_CONFIG.API_URL}/admin/stats/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch admin stats');
      }
    },
    
    // Impersonation actions
    async startImpersonation(targetUser, sessionData) {
      try {
        // Store original admin user (no tokens - they're in httpOnly cookies)
        this.originalUser = { ...this.user };

        // Switch to impersonated user context
        this.user = {
          ...targetUser,
          // Keep some admin properties for backend compatibility
          is_admin_user: false, // Impersonated user shouldn't have admin access
          admin_role: null,
          admin_permissions: {}
        };

        // User stored in state only

        // Set impersonation state
        this.isImpersonating = true;
        this.impersonationSession = sessionData;

        // Store metadata in sessionStorage (not tokens - they're in httpOnly cookies)
        try {
          safeSessionStorage.setItem('impersonation_session', JSON.stringify({
            isImpersonating: true,
            originalUser: this.originalUser,
            impersonatedUser: this.user,
            session_id: sessionData.session_id
          }));
        } catch (e) {
          console.warn('sessionStorage blocked during impersonation:', e);
        }

        return true;
      } catch (error) {
        console.error('❌ Failed to start impersonation:', error);
        throw error;
      }
    },
    
    async endImpersonation() {
      try {
        // Call backend to end session (backend will restore admin cookies)
        if (this.impersonationSession) {
          await axios.post(`${API_CONFIG.API_URL}/admin/impersonation/${this.impersonationSession.session_id}/end/`, {
            actions_performed: [], // Could track actions if needed
            pages_accessed: [] // Could track pages if needed
          }, {
            withCredentials: true  // Send current impersonation cookies
          });
        }

        // Restore original admin user
        if (this.originalUser) {
          this.user = { ...this.originalUser };
        }

        // User restored in state

        // Clear impersonation state
        this.isImpersonating = false;
        this.originalUser = null;
        this.impersonationSession = null;

        // Clear sessionStorage
        try {
          safeSessionStorage.removeItem('impersonation_session');
        } catch (e) {
          console.warn('sessionStorage blocked during impersonation end:', e);
        }

        return true;
      } catch (error) {
        console.error('❌ Failed to end impersonation:', error);

        // Even if backend fails, restore local state from sessionStorage
        try {
          const impersonationData = safeSessionStorage.getItem('impersonation_session');
          if (impersonationData) {
            const data = JSON.parse(impersonationData);
            if (data.originalUser) {
              this.user = data.originalUser;
              // Restore user in state
            }
          }
        } catch (e) {
          console.warn('sessionStorage blocked during impersonation error recovery:', e);
        }

        this.isImpersonating = false;
        this.originalUser = null;
        this.impersonationSession = null;
        try {
          safeSessionStorage.removeItem('impersonation_session');
        } catch (e) {
          console.warn('sessionStorage blocked:', e);
        }

        throw error;
      }
    },
    
    // Restore impersonation state on app reload
    restoreImpersonationState() {
      try {
        const impersonationData = sessionStorage.getItem('impersonation_session');
        if (impersonationData) {
          const data = JSON.parse(impersonationData);
          if (data.isImpersonating) {
            this.isImpersonating = true;
            this.originalUser = data.originalUser;
            this.user = data.impersonatedUser;
            this.impersonationSession = {
              session_id: data.session_id
            };

            console.log('🔄 Restored impersonation state for:', this.user.email);
            console.log('🔄 Using impersonated user httpOnly cookies');
          }
        }
      } catch (error) {
        console.error('❌ Failed to restore impersonation state:', error);
        // Clear corrupted data
        try {
          safeSessionStorage.removeItem('impersonation_session');
        } catch (e) {
          console.warn('sessionStorage blocked during cleanup:', e);
        }
      }
    }
  }
});
