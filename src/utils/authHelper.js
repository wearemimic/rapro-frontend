// Auth Helper Utilities

/**
 * Clear all authentication-related data from browser storage
 * Use this when users encounter authentication issues
 */
export function clearAuthData() {
  console.log('🧹 Clearing all authentication data...');
  
  // Clear sessionStorage
  const sessionKeys = ['auth0_state', 'auth0_nonce'];
  sessionKeys.forEach(key => {
    try {
      if (sessionStorage.getItem(key)) {
        console.log(`  - Removing sessionStorage: ${key}`);
        sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('sessionStorage blocked:', e);
    }
  });
  
  // Note: localStorage no longer used for auth (migrated to httpOnly cookies)
  
  // Clear any Auth0-specific cookies (if accessible)
  document.cookie.split(";").forEach(c => {
    if (c.includes('auth0') || c.includes('Auth0')) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      console.log(`  - Clearing cookie: ${c.split('=')[0]}`);
    }
  });
  
  console.log('✅ Authentication data cleared');
}

/**
 * Initialize auth state for a new login attempt
 */
export function initAuthState() {
  // Clear any existing state first
  clearAuthData();
  
  // Generate new state and nonce
  const state = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  
  sessionStorage.setItem('auth0_state', state);
  sessionStorage.setItem('auth0_nonce', nonce);
  
  console.log('🔐 New auth state initialized');
  
  return { state, nonce };
}

/**
 * Check if authentication data is stale
 */
export function isAuthDataStale() {
  let state = null;
  let stateTimestamp = null;
  try {
    state = sessionStorage.getItem('auth0_state');
    stateTimestamp = sessionStorage.getItem('auth0_state_timestamp');
  } catch (e) {
    console.warn('sessionStorage blocked:', e);
    return true; // Consider stale if can't access
  }

  if (!state || !stateTimestamp) {
    return true;
  }
  
  // Consider state stale after 10 minutes
  const TEN_MINUTES = 10 * 60 * 1000;
  const now = Date.now();
  const timestamp = parseInt(stateTimestamp, 10);
  
  return (now - timestamp) > TEN_MINUTES;
}

/**
 * Store auth state with timestamp
 */
export function storeAuthState(state, nonce) {
  sessionStorage.setItem('auth0_state', state);
  sessionStorage.setItem('auth0_nonce', nonce);
  sessionStorage.setItem('auth0_state_timestamp', Date.now().toString());
}