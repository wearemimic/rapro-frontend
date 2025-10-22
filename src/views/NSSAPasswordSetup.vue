<template>
  <main id="content" role="main" class="main password-setup-main">
    <div class="container py-5 py-sm-7">
      <div class="mx-auto" style="max-width: 30rem;">
        <!-- Logo -->
        <div class="text-center mb-4">
          <img src="/assets/img/RAD-white-logo.png" style="height:50px;margin-bottom:20px;" alt="Logo">
        </div>

        <!-- Success Message -->
        <div v-if="success" class="alert alert-success d-flex align-items-center mb-5" role="alert">
          <svg class="bi flex-shrink-0 me-2" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
          <div>
            <strong>Password Set Successfully!</strong> Redirecting you to your dashboard...
          </div>
        </div>

        <!-- Card -->
        <div class="card card-lg mb-5">
          <div class="card-body">
            <!-- Header -->
            <div class="text-center">
              <div class="mb-5">
                <h1 class="display-5">Welcome to Retirement Advisor Pro</h1>
                <p class="text-muted">Set up your password to get started</p>
                <span class="badge bg-primary">NSSA Partnership Member</span>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <svg class="bi flex-shrink-0 me-2" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
              <div>{{ error }}</div>
            </div>

            <!-- Password Setup Form -->
            <form v-if="!success" @submit.prevent="setupPassword">
              <!-- Email (read-only) -->
              <div class="mb-4">
                <label class="form-label" for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  class="form-control form-control-lg"
                  v-model="email"
                  readonly
                  disabled
                />
              </div>

              <!-- Password -->
              <div class="mb-4">
                <label class="form-label" for="password">Password</label>
                <div class="input-group input-group-merge">
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    id="password"
                    class="form-control form-control-lg"
                    v-model="password"
                    placeholder="Enter your password"
                    required
                    minlength="8"
                    :class="{ 'is-invalid': password && password.length > 0 && password.length < 8 }"
                  />
                  <a
                    class="input-group-append input-group-text"
                    href="javascript:;"
                    @click="showPassword = !showPassword"
                  >
                    <i v-if="!showPassword" class="bi-eye"></i>
                    <i v-else class="bi-eye-slash"></i>
                  </a>
                </div>
                <small class="form-text text-muted">Must be at least 8 characters</small>
              </div>

              <!-- Confirm Password -->
              <div class="mb-4">
                <label class="form-label" for="confirmPassword">Confirm Password</label>
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  id="confirmPassword"
                  class="form-control form-control-lg"
                  v-model="confirmPassword"
                  placeholder="Re-enter your password"
                  required
                  :class="{ 'is-invalid': confirmPassword && password !== confirmPassword }"
                />
                <div v-if="confirmPassword && password !== confirmPassword" class="invalid-feedback">
                  Passwords do not match
                </div>
              </div>

              <!-- Submit Button -->
              <div class="d-grid mb-3">
                <button
                  type="submit"
                  class="btn btn-primary btn-lg"
                  :disabled="loading || !isFormValid"
                >
                  <span v-if="!loading">Set Password & Continue</span>
                  <span v-else>
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Setting up...
                  </span>
                </button>
              </div>

              <!-- Resend Email Link -->
              <div class="text-center">
                <p class="small text-muted mb-0">
                  Didn't receive the email?
                  <a
                    href="javascript:;"
                    @click="resendEmail"
                    class="link-primary"
                    :class="{ 'disabled': resendLoading }"
                  >
                    {{ resendLoading ? 'Sending...' : 'Resend' }}
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
        <!-- End Card -->

        <!-- Help Text -->
        <div class="text-center">
          <p class="small text-white-70">
            Need help? Contact
            <a class="link-white" href="mailto:support@retirementadvisorpro.com">
              support@retirementadvisorpro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { API_CONFIG } from '@/config';

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
    let metaRobotsTag = null;

    // Form validation
    const isFormValid = computed(() => {
      return (
        email.value &&
        token.value &&
        password.value.length >= 8 &&
        password.value === confirmPassword.value
      );
    });

    // Validate token and fetch email from backend
    onMounted(async () => {
      // Add noindex meta tag to prevent search engine indexing
      metaRobotsTag = document.createElement('meta');
      metaRobotsTag.name = 'robots';
      metaRobotsTag.content = 'noindex, nofollow';
      document.head.appendChild(metaRobotsTag);

      // Get token from URL (no email for security)
      token.value = route.query.token || '';

      if (!token.value) {
        error.value = 'Invalid setup link. Please check your email for the correct link.';
        return;
      }

      // Validate token and fetch email from backend
      loading.value = true;
      try {
        const response = await axios.get(`${API_CONFIG.API_URL}/kajabi/validate-token/?token=${token.value}`);

        if (response.data.valid) {
          email.value = response.data.email;
        } else {
          error.value = response.data.error || 'Invalid or expired token';
        }
      } catch (err) {
        console.error('Token validation error:', err);
        error.value = err.response?.data?.error || 'Invalid or expired token. Please check your email for the correct link.';
      } finally {
        loading.value = false;
      }
    });

    // Remove noindex meta tag when component is destroyed
    onUnmounted(() => {
      if (metaRobotsTag && metaRobotsTag.parentNode) {
        metaRobotsTag.parentNode.removeChild(metaRobotsTag);
      }
    });

    const setupPassword = async () => {
      if (!isFormValid.value) return;

      loading.value = true;
      error.value = '';

      try {
        // Only send token and password (no email for better security)
        const response = await axios.post(`${API_CONFIG.API_URL}/kajabi/setup-password/`, {
          token: token.value,
          password: password.value
        }, {
          withCredentials: true
        });

        if (response.data.success || response.data.message) {
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
        await axios.post(`${API_CONFIG.API_URL}/kajabi/resend-setup-email/`, {
          email: email.value
        }, {
          withCredentials: true
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
.password-setup-main {
  background-color: #377dff;
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.card {
  background-color: white;
  border: none;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.text-white-70 {
  color: rgba(255, 255, 255, 0.7);
}

.link-white {
  color: white;
  text-decoration: underline;
}

.link-white:hover {
  color: rgba(255, 255, 255, 0.9);
}
</style>
