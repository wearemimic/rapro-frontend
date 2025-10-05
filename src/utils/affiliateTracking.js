// Affiliate tracking utility functions
// Using sessionStorage instead of localStorage for Safari iPad compatibility

const AFFILIATE_CODE_KEY = 'affiliate_code';
const AFFILIATE_TIMESTAMP_KEY = 'affiliate_code_timestamp';
const AFFILIATE_EXPIRY_DAYS = 30;

/**
 * Check if affiliate code is still valid (within 30-day window)
 */
export function isAffiliateCodeValid() {
  const timestamp = sessionStorage.getItem(AFFILIATE_TIMESTAMP_KEY);
  if (!timestamp) return false;

  const daysSinceTracked = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60 * 24);
  return daysSinceTracked <= AFFILIATE_EXPIRY_DAYS;
}

/**
 * Get valid affiliate code or null if expired
 */
export function getValidAffiliateCode() {
  if (!isAffiliateCodeValid()) {
    // Clean up expired data
    sessionStorage.removeItem(AFFILIATE_CODE_KEY);
    sessionStorage.removeItem(AFFILIATE_TIMESTAMP_KEY);
    return null;
  }

  return sessionStorage.getItem(AFFILIATE_CODE_KEY);
}

/**
 * Track affiliate code from URL or other source
 */
export function trackAffiliateCode(affiliateCode) {
  if (!affiliateCode) return;

  sessionStorage.setItem(AFFILIATE_CODE_KEY, affiliateCode);
  sessionStorage.setItem(AFFILIATE_TIMESTAMP_KEY, Date.now().toString());
  console.log('📊 Affiliate code tracked:', affiliateCode);

  // Track the click via API (non-blocking)
  fetch('/api/affiliates/track-click/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      affiliate_code: affiliateCode,
      page_url: window.location.href,
      referrer: document.referrer
    })
  }).catch(err => console.error('Failed to track affiliate click:', err));
}

/**
 * Clear affiliate tracking data
 */
export function clearAffiliateTracking() {
  sessionStorage.removeItem(AFFILIATE_CODE_KEY);
  sessionStorage.removeItem(AFFILIATE_TIMESTAMP_KEY);
}