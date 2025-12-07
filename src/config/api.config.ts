/**
 * API Configuration
 * Reads from environment variables
 * 
 * Supports both NEXT_PUBLIC_API_URL (base URL) and NEXT_PUBLIC_API_BASE_URL (full path)
 * NEXT_PUBLIC_API_URL is preferred (e.g., http://localhost:3000)
 * NEXT_PUBLIC_API_BASE_URL is legacy support (e.g., http://localhost:3000/api/v1/admin)
 */

// Get API base URL from environment variable, fallback to localhost for development
// Supports both NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_BASE_URL for backward compatibility
const envApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
const defaultBaseUrl = 'http://localhost:3000';

// If NEXT_PUBLIC_API_BASE_URL is set and contains /api/v1, extract base URL
let API_BASE_URL = defaultBaseUrl;
if (envApiUrl) {
  if (envApiUrl.includes('/api/v1')) {
    // Extract base URL from full path (backward compatibility)
    API_BASE_URL = envApiUrl.split('/api/v1')[0];
  } else {
    // Use as base URL
    API_BASE_URL = envApiUrl;
  }
}

// API version prefix
export const API_VERSION = '/api/v1';

// Admin API prefix
export const ADMIN_API_PREFIX = '/admin';

// Full API base URL with version and admin prefix
export const API_URL = `${API_BASE_URL}${API_VERSION}${ADMIN_API_PREFIX}`;

// Full API base URL with version only (for non-admin endpoints)
export const API_BASE_URL_WITH_VERSION = `${API_BASE_URL}${API_VERSION}`;

// Helper function to get full API endpoint URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_URL}/${cleanEndpoint}`;
};

// Export for use in error messages and other places
export { API_BASE_URL as API_SERVER_URL };
export { API_BASE_URL };
