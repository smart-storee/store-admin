import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import {
  logApiRequest,
  logApiResponse,
  logApiError,
  logApiCall
} from '@/utils/apiLogger';

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9@.\-_]/g, '');
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Sanitize URL endpoint to prevent path traversal
export const sanitizeEndpoint = (endpoint: string): string => {
  // Remove any potentially dangerous characters or traversal patterns
  return endpoint.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');
};

// API utility function to make authenticated requests
export const makeAuthenticatedRequest = async (
  endpoint: string,
  options: RequestInit = {},
  autoRefresh = true,
  storeId?: number | null,
  branchId?: number | null
): Promise<any> => {
  // Sanitize the endpoint to prevent path traversal attacks
  const sanitizedEndpoint = sanitizeEndpoint(endpoint);

  const token = localStorage.getItem('authToken');

  if (!token) {
    const error = 'No authentication token found';
    logApiError(options.method || 'GET', endpoint, error);
    throw new Error(error);
  }

  // Create headers object with proper typing
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Add store and branch headers if they exist
  if (storeId) {
    headers['X-Store-ID'] = storeId.toString();
  }
  if (branchId) {
    headers['X-Branch-ID'] = branchId.toString();
  }

  // Merge with any existing headers from options
  Object.assign(headers, options.headers);

  // Log the API request
  logApiRequest(
    options.method || 'GET',
    sanitizedEndpoint,
    headers,
    options.body
  );

  const startTime = Date.now();

  try {
    const response = await fetch(`http://localhost:3000/api/v1/admin${sanitizedEndpoint}`, {
      ...options,
      headers,
    });

    const duration = Date.now() - startTime;

    // If we get a 401, try to refresh the token and retry the request
    if (response.status === 401 && autoRefresh) {
      logApiCall({
        level: 'warn',
        method: options.method || 'GET',
        url: sanitizedEndpoint,
        status: 401,
        error: 'Authentication token expired, attempting refresh',
      });

      const refreshSuccess = await refreshAuthToken();
      if (refreshSuccess) {
        const newToken = localStorage.getItem('authToken');
        if (newToken) {
          // Log the retry request
          logApiRequest(
            options.method || 'GET',
            sanitizedEndpoint,
            {
              ...headers,
              'Authorization': `Bearer ${newToken}`,
            },
            options.body
          );

          const retryStartTime = Date.now();
          const retryResponse = await fetch(`http://localhost:3000/api/v1/admin${sanitizedEndpoint}`, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${newToken}`,
            },
          });

          const retryDuration = Date.now() - retryStartTime;

          // Log the retry response
          logApiResponse(
            options.method || 'GET',
            sanitizedEndpoint,
            retryResponse.status,
            Object.fromEntries(retryResponse.headers.entries()),
            null, // We won't log response body here as it will be logged later
            retryDuration
          );

          return retryResponse.json();
        }
      }
      const error = 'Authentication failed';
      logApiError(options.method || 'GET', sanitizedEndpoint, error);
      throw new Error(error);
    }

    // Log the response
    logApiResponse(
      options.method || 'GET',
      sanitizedEndpoint,
      response.status,
      Object.fromEntries(response.headers.entries()),
      null, // We won't log response body here as it will be processed below
      duration
    );

    if (!response.ok) {
      // Handle different error statuses appropriately
      if (response.status >= 500) {
        // Try to get more details from the response
        let errorDetails = 'Server error occurred. Please try again later.';
        try {
          const errorResponse = await response.json();
          if (errorResponse.message) {
            errorDetails = errorResponse.message;
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        logApiCall({
          level: 'error',
          method: options.method || 'GET',
          url: sanitizedEndpoint,
          status: response.status,
          error: errorDetails,
        });
        throw new Error(errorDetails || 'Server error occurred. Please try again later.');
      } else if (response.status === 403) {
        const error = 'Access forbidden. You don\'t have permission to perform this action.';
        logApiCall({
          level: 'error',
          method: options.method || 'GET',
          url: sanitizedEndpoint,
          status: response.status,
          error,
        });
        throw new Error(error);
      } else if (response.status === 404) {
        const error = 'Requested resource not found.';
        logApiCall({
          level: 'error',
          method: options.method || 'GET',
          url: sanitizedEndpoint,
          status: response.status,
          error,
        });
        throw new Error(error);
      } else {
        // Try to get error details from response
        let errorDetails = `API request failed: ${response.status}`;
        try {
          const errorResponse = await response.json();
          if (errorResponse.message) {
            errorDetails = errorResponse.message;
          }
        } catch (e) {
          // If we can't parse error details, use the default message
        }
        logApiCall({
          level: 'error',
          method: options.method || 'GET',
          url: sanitizedEndpoint,
          status: response.status,
          error: errorDetails,
        });
        throw new Error(errorDetails);
      }
    }

    const responseBody = await response.json();

    // Log the response body separately to avoid duplicating it in the response log
    logApiCall({
      level: 'debug',
      method: options.method || 'GET',
      url: sanitizedEndpoint,
      status: response.status,
      responseBody: responseBody,
    });

    return responseBody;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
      // Network error - backend server might be down or unreachable
      const errorMessage = 'Unable to connect to the server. Please ensure:\n1. The backend API server is running\n2. The server is accessible at http://localhost:3000\n3. Your internet/network connection is working properly';
      logApiCall({
        level: 'error',
        method: options.method || 'GET',
        url: sanitizedEndpoint,
        error: 'Network error - unable to connect to server',
        duration,
      });
      throw new Error(errorMessage);
    }

    logApiCall({
      level: 'error',
      method: options.method || 'GET',
      url: sanitizedEndpoint,
      error: error.message || String(error),
      duration,
    });

    throw error;
  }
};

// Separate function for token refresh
export const refreshAuthToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    logApiCall({
      level: 'warn',
      method: 'POST',
      url: '/auth/refresh-token',
      status: 401,
      error: 'No refresh token found',
    });
    return false;
  }

  logApiRequest('POST', '/auth/refresh-token', {}, { refresh_token: refreshToken });

  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/v1/admin/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const duration = Date.now() - startTime;

    logApiResponse(
      'POST',
      '/auth/refresh-token',
      response.status,
      Object.fromEntries(response.headers.entries()),
      null,
      duration
    );

    if (!response.ok) {
      console.error(`Token refresh failed with status: ${response.status}`);
      logApiCall({
        level: 'error',
        method: 'POST',
        url: '/auth/refresh-token',
        status: response.status,
        error: `Token refresh failed with status: ${response.status}`,
        duration,
      });

      // If refresh fails, clear stored tokens
      localStorage.removeItem('adminUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      return false;
    }

    const data = await response.json();

    if (data.success) {
      const { auth_token } = data.data;
      localStorage.setItem('authToken', auth_token);

      logApiCall({
        level: 'info',
        method: 'POST',
        url: '/auth/refresh-token',
        status: response.status,
        responseBody: { success: true },
        duration,
      });

      return true;
    } else {
      logApiCall({
        level: 'error',
        method: 'POST',
        url: '/auth/refresh-token',
        status: response.status,
        error: 'Token refresh response indicated failure',
        duration,
      });

      // If refresh fails, clear stored tokens
      localStorage.removeItem('adminUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      return false;
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error('Token refresh error:', error);

    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
      // Network error - backend server might be down or unreachable
      const errorMessage = 'Unable to connect to the server for token refresh. Please ensure:\n1. The backend API server is running\n2. The server is accessible at http://localhost:3000\n3. Your internet/network connection is working properly';

      logApiCall({
        level: 'error',
        method: 'POST',
        url: '/auth/refresh-token',
        error: 'Network error - unable to connect for token refresh',
        duration,
      });

      // If refresh fails due to network issues, clear stored tokens to force re-login
      localStorage.removeItem('adminUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      return false;
    }

    logApiCall({
      level: 'error',
      method: 'POST',
      url: '/auth/refresh-token',
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    // If refresh fails, clear stored tokens
    localStorage.removeItem('adminUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    return false;
  }
};

// General API utility for login (public endpoint) with validation
export const loginRequest = async (email: string, password: string): Promise<any> => {
  // Validate inputs
  if (!validateEmail(email)) {
    const error = 'Invalid email format';
    logApiError('POST', '/auth/login', error);
    throw new Error(error);
  }

  if (password.length < 1) {
    const error = 'Password is required';
    logApiError('POST', '/auth/login', error);
    throw new Error(error);
  }

  // Sanitize inputs
  const sanitizedEmail = sanitizeInput(email);
  const sanitizedPassword = sanitizeInput(password);

  const requestBody = { email: sanitizedEmail, password: sanitizedPassword };

  logApiRequest('POST', '/auth/login', { 'Content-Type': 'application/json' }, requestBody);

  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/v1/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;

    logApiResponse(
      'POST',
      '/auth/login',
      response.status,
      Object.fromEntries(response.headers.entries()),
      null,
      duration
    );

    if (!response.ok) {
      if (response.status >= 500) {
        // Try to get more details from the response
        let errorDetails = 'Server error occurred. Please try again later.';
        try {
          const errorResponse = await response.json();
          if (errorResponse.message) {
            errorDetails = errorResponse.message;
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        logApiCall({
          level: 'error',
          method: 'POST',
          url: '/auth/login',
          status: response.status,
          error: errorDetails,
          duration,
        });
        throw new Error(errorDetails || 'Server error occurred. Please try again later.');
      } else {
        // Try to get error details from response
        let errorDetails = `Login failed: ${response.status}`;
        try {
          const errorResponse = await response.json();
          if (errorResponse.message) {
            errorDetails = errorResponse.message;
          }
        } catch (e) {
          // If we can't parse error details, use the default message
        }
        logApiCall({
          level: 'error',
          method: 'POST',
          url: '/auth/login',
          status: response.status,
          error: errorDetails,
          duration,
        });
        throw new Error(errorDetails);
      }
    }

    const data = await response.json();

    logApiCall({
      level: 'debug',
      method: 'POST',
      url: '/auth/login',
      status: response.status,
      responseBody: {
        success: data.success,
        // Don't log admin details for security
        message: data.message
      },
      duration,
    });

    if (data.success) {
      const { auth_token, refresh_token, admin } = data.data;

      localStorage.setItem('adminUser', JSON.stringify(admin));
      localStorage.setItem('authToken', auth_token);
      localStorage.setItem('refreshToken', refresh_token);
    }

    return data;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
      // Network error - backend server might be down or unreachable
      const errorMessage = 'Unable to connect to the server. Please ensure:\n1. The backend API server is running\n2. The server is accessible at http://localhost:3000\n3. Your internet/network connection is working properly';
      logApiCall({
        level: 'error',
        method: 'POST',
        url: '/auth/login',
        error: 'Network error - unable to connect to server',
        duration,
      });
      throw new Error(errorMessage);
    }

    logApiCall({
      level: 'error',
      method: 'POST',
      url: '/auth/login',
      error: error.message || String(error),
      duration,
    });

    throw error;
  }
};