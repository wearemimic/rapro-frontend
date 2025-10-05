/**
 * Safari-safe localStorage and sessionStorage wrappers
 * Safari on iPad blocks storage access in Private mode or after certain conditions
 * These wrappers prevent page freezes by catching storage exceptions
 */

export const safeLocalStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage.getItem blocked for key: ${key}`, e);
      return null;
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`localStorage.setItem blocked for key: ${key}`, e);
      return false;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`localStorage.removeItem blocked for key: ${key}`, e);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('localStorage.clear blocked', e);
      return false;
    }
  }
};

export const safeSessionStorage = {
  getItem(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn(`sessionStorage.getItem blocked for key: ${key}`, e);
      return null;
    }
  },

  setItem(key, value) {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`sessionStorage.setItem blocked for key: ${key}`, e);
      return false;
    }
  },

  removeItem(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`sessionStorage.removeItem blocked for key: ${key}`, e);
      return false;
    }
  },

  clear() {
    try {
      sessionStorage.clear();
      return true;
    } catch (e) {
      console.warn('sessionStorage.clear blocked', e);
      return false;
    }
  }
};
