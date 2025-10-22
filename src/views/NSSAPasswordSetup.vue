<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
    <div class="max-w-md w-full">
      <!-- Logo or Branding -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome to Retirement Advisor Pro</h1>
        <p class="text-gray-600">Set up your password to get started</p>
        <p class="text-sm text-indigo-600 mt-1">NSSA Partnership Member</p>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div class="flex items-start">
          <svg class="h-6 w-6 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <h3 class="text-green-900 font-semibold mb-1">Password Set Successfully!</h3>
            <p class="text-green-700 text-sm mb-3">Redirecting you to your dashboard...</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <svg class="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-red-800 text-sm">{{ error }}</p>
        </div>
      </div>

      <!-- Password Setup Form -->
      <div v-if="!success" class="bg-white rounded-xl shadow-xl p-8">
        <form @submit.prevent="setupPassword">
          <!-- Email (read-only) -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              v-model="email"
              readonly
              class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
            />
          </div>

          <!-- Password -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="Enter your password (min. 8 characters)"
                required
                minlength="8"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                :class="{ 'border-red-300': password && password.length > 0 && password.length < 8 }"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
              >
                <svg v-if="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
          </div>

          <!-- Confirm Password -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="confirmPassword"
              placeholder="Re-enter your password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="{ 'border-red-300': confirmPassword && password !== confirmPassword }"
            />
            <p v-if="confirmPassword && password !== confirmPassword" class="text-xs text-red-600 mt-1">
              Passwords do not match
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!loading">Set Password & Continue</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting up...
            </span>
          </button>
        </form>

        <!-- Resend Email Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Didn't receive the email?
            <button
              @click="resendEmail"
              :disabled="resendLoading"
              class="text-indigo-600 hover:text-indigo-700 font-medium ml-1"
            >
              {{ resendLoading ? 'Sending...' : 'Resend' }}
            </button>
          </p>
        </div>
      </div>

      <!-- Help Text -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Need help? Contact
          <a href="mailto:support@retirementadvisorpro.com" class="text-indigo-600 hover:text-indigo-700">
            support@retirementadvisorpro.com
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/services/api';

export default {
  name: 'NSSAPasswordSetup',
  setup() {
    const router = useRouter();
    const route = useRoute();

    const email = ref('');
    const token = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const showPassword = ref(false);
    const showConfirmPassword = ref(false);
    const loading = ref(false);
    const resendLoading = ref(false);
    const error = ref('');
    const success = ref(false);

    // Form validation
    const isFormValid = computed(() => {
      return (
        email.value &&
        token.value &&
        password.value.length >= 8 &&
        password.value === confirmPassword.value
      );
    });

    // Get token and email from URL params
    onMounted(() => {
      token.value = route.query.token || '';
      email.value = route.query.email || '';

      if (!token.value || !email.value) {
        error.value = 'Invalid setup link. Please check your email for the correct link.';
      }
    });

    const setupPassword = async () => {
      if (!isFormValid.value) return;

      loading.value = true;
      error.value = '';

      try {
        const response = await api.post('/api/kajabi/setup-password/', {
          email: email.value,
          token: token.value,
          password: password.value
        });

        if (response.data.success) {
          success.value = true;

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch (err) {
        console.error('Password setup error:', err);
        error.value = err.response?.data?.error || 'Failed to set password. Please try again.';

        // If token expired, show resend option
        if (error.value.includes('expired')) {
          error.value += ' Please request a new setup link below.';
        }
      } finally {
        loading.value = false;
      }
    };

    const resendEmail = async () => {
      if (!email.value) {
        error.value = 'Email address is required to resend the setup link.';
        return;
      }

      resendLoading.value = true;
      error.value = '';

      try {
        await api.post('/api/kajabi/resend-setup-email/', {
          email: email.value
        });

        alert('A new setup link has been sent to your email address. Please check your inbox.');
      } catch (err) {
        console.error('Resend email error:', err);
        error.value = 'Failed to resend email. Please contact support.';
      } finally {
        resendLoading.value = false;
      }
    };

    return {
      email,
      password,
      confirmPassword,
      showPassword,
      showConfirmPassword,
      loading,
      resendLoading,
      error,
      success,
      isFormValid,
      setupPassword,
      resendEmail
    };
  }
};
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
