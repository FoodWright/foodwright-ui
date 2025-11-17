import { useAuthStore } from 'stores/auth';
// --- MODIFICATION: Import the specific auth instance ---
import { getIdToken } from 'firebase/auth';
import { firebaseAuth } from 'src/boot/firebase';
// --- END MODIFICATION ---

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_SERVER + '/api' || 'http://localhost:8080/api';

/**
 * A helper function to delay execution, used for retries.
 * @param {number} ms - Milliseconds to wait
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A smart, authenticated fetch wrapper that handles auth tokens,
 * stale token retries (401), and server cold-start retries (5xx).
 *
 * @param {string} endpoint - The API endpoint (e.g., "/profile")
 * @param {object} options - Standard fetch options (method, body, etc.)
 * @param {boolean} [isRetry=false] - Internal flag to prevent infinite retry loops
 */
export const fetchWithAuth = async (endpoint, options = {}, isRetry = false) => {
  const authStore = useAuthStore();
  const token = authStore.token;

  // Set up headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make the initial fetch request
  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch (err) {
    // Network errors (e.g., offline)
    console.error('Fetch network error:', err);
    throw new Error('Network error. Please check your connection.');
  }

  // Check if the request was successful
  if (response.ok) {
    if (response.status === 204) return null; // Handle "No Content"
    return response.json(); // All good
  }

  // --- Error Handling & Retries ---

  // Don't retry if this was already a retry attempt
  if (isRetry) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Server responded with ${response.status}`);
  }

  // Case 1: Unauthorized (401)
  // This is likely a stale token. Let's force-refresh and retry once.
  if (response.status === 401) {
    console.warn('API returned 401. Forcing token refresh and retrying...');

    // --- MODIFICATION: Use the imported firebaseAuth instance ---
    const auth = firebaseAuth;
    // --- END MODIFICATION ---

    if (!auth.currentUser) {
      // This can happen on a hard refresh race condition
      console.error('Auth refresh failed: auth.currentUser is null.');
      throw new Error('User not authenticated.');
    }

    try {
      // Force a refresh and update the store
      const newToken = await getIdToken(auth.currentUser, true);
      authStore.setToken(newToken); // Update the store with the new token

      // Retry the request
      return fetchWithAuth(endpoint, options, true); // Pass true to prevent retry loop
    } catch (refreshError) {
      console.error('Failed to refresh token:', refreshError);
      throw new Error('Session expired. Please log in again.');
    }
  }

  // Case 2: Server Cold Start (502, 503, 504)
  // The API (Cloud Run) is likely spinning up. Wait 2s and retry once.
  if ([502, 503, 504].includes(response.status)) {
    console.warn(`API returned ${response.status}. Retrying after 2s for cold start...`);
    await delay(2000);
    return fetchWithAuth(endpoint, options, true); // Pass true to prevent retry loop
  }

  // Other errors (e.g., 404, 400) - just fail immediately
  const errData = await response.json().catch(() => ({}));
  throw new Error(errData.message || `Server responded with ${response.status}`);
};

/**
 * A public fetch wrapper (no auth)
 * @param {string} endpoint - The API endpoint (e.g., "/recipes")
 */
export const fetchPublic = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Server responded with ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
};
