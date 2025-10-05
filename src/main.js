import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import Toast, { POSITION } from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import axios from 'axios';
// Removed Auth0 Vue SDK - using Django server-side auth

// Tokens are now in httpOnly cookies - no Authorization header needed
// The backend CookieTokenMiddleware handles authentication automatically
axios.defaults.withCredentials = true;

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Auth0 removed - using Django server-side authentication

import { useAuthStore } from './stores/auth';
import { trackAffiliateCode } from './utils/affiliateTracking';

const authStore = useAuthStore();
// Initialize auth and fetch user from backend using httpOnly cookies
authStore.init().then(() => {
  console.log('✅ Auth initialized, user loaded from backend');
});
authStore.restoreImpersonationState(); // ✅ Restore impersonation state if any

// Check for affiliate tracking code in URL on app initialization
const urlParams = new URLSearchParams(window.location.search);
const affiliateCode = urlParams.get('ref');
if (affiliateCode) {
  trackAffiliateCode(affiliateCode);
}

// Toast configuration (optional customization)
app.use(Toast, {
  position: POSITION.TOP_RIGHT,
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
});

app.mount('#app');