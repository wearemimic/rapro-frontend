<template>
  <div class="d-flex justify-content-center align-items-center" style="height: 100vh;">
    <div class="text-center">
      <div v-if="!error" class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div v-if="error" class="alert alert-danger mb-3" role="alert">
        <h4 class="alert-heading">Authentication Error</h4>
        <p>{{ error }}</p>
        <hr>
        <router-link to="/login" class="btn btn-secondary">Back to Login</router-link>
      </div>
      <h3 v-if="!error">Processing your authentication...</h3>
      <p v-if="!error">Please wait while we log you in.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
// Removed Auth0 Vue SDK - using Django server-side auth
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
// Removed Auth0 Vue SDK usage - Django handles auth completely
const authStore = useAuthStore();

const error = ref(null);

onMounted(async () => {
  try {
    console.log('Processing Auth0 callback with authorization code...');
    
    // Check for error in URL params first
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
      throw new Error(`Auth0 Error: ${urlParams.get('error')} - ${urlParams.get('error_description')}`);
    }
    
    // Get authorization code from URL
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (!code) {
      throw new Error('No authorization code received from Auth0');
    }
    
    console.log('Got authorization code, sending to Django backend for token exchange...');

    // Send authorization code to Django for token exchange (cookies will be set by backend)
    // Backend detects flow type from Auth0 state parameter (no localStorage)
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth0/exchange-code/`, {
      method: 'POST',
      credentials: 'include',  // Important: Include cookies in request
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        state: state
      })
    });

    const data = await response.json();
    
    // Handle payment required (402) status for registration
    if (response.status === 402) {
      console.log('🔄 User needs to complete registration');

      // Store the Auth0 user info temporarily for registration completion
      sessionStorage.setItem('auth0_user_info', JSON.stringify({
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        auth0_sub: data.auth0_sub
      }));

      // Redirect to registration step 2
      router.push('/register?step=2');
      return;
    }
    
    if (response.ok) {
      // Tokens are in httpOnly cookies (set by backend) - no need to store them

      // Store user data in localStorage (but not tokens)
      if (data.user) {
        authStore.setUser(data.user);
      }

      // Ensure axios is configured for cookie-based auth
      authStore.init();

      console.log('✅ Django authentication successful (httpOnly cookies set)');

      // Backend determines flow based on user state
      if (data.already_registered) {
        console.log('⚠️ Existing user with active subscription');
        alert('You already have an account. You have been logged in.');
        router.push('/dashboard');
      } else if (data.registration_complete === false || data.is_new_user) {
        console.log('🔄 User needs to complete registration');
        router.push('/register?step=2');
      } else {
        console.log('✅ Redirecting to dashboard');
        router.push('/dashboard');
      }
    } else {
      throw new Error(data.message || 'Django token exchange failed');
    }
    
  } catch (err) {
    console.error('Auth0 callback error:', err);
    error.value = err.message || 'Authentication failed';

    // Redirect to login on error
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  }
});
</script>