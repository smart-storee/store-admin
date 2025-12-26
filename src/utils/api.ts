import {
  logApiRequest,
  logApiResponse,
  logApiError,
  logApiCall,
} from "@/utils/apiLogger";
import { API_URL, API_SERVER_URL, isNgrokUrl } from "@/config/api.config";

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters while preserving safe ones
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>"'&]/g, (match) => { // Escape HTML special characters
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match] || match;
    })
    .substring(0, 1000); // Limit length to prevent overflow
};

// Validate email format with more comprehensive regex
export const validateEmail = (email: string): boolean => {
  if (typeof email !== 'string' || email.length > 254) {
    return false;
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

// Validate password strength with configurable requirements
export const validatePassword = (password: string): boolean => {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return false;
  }

  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Sanitize URL endpoint to prevent path traversal and other attacks
export const sanitizeEndpoint = (endpoint: string): string => {
  if (typeof endpoint !== 'string') {
    return '/';
  }

  // Remove any potentially dangerous patterns
  return endpoint
    .replace(/\.\.\//g, '') // Path traversal
    .replace(/\.\.\\/g, '') // Windows path traversal
    .replace(/[\x00-\x1F\x7F]/g, '') // Control characters
    .replace(/[<>"'&]/g, '') // HTML special characters
    .substring(0, 500); // Limit length
};

// Global variable to track ongoing token refresh
let tokenRefreshPromise: Promise<boolean> | null = null;

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

  const token = localStorage.getItem("authToken");

  if (!token) {
    const error = "No authentication token found";
    logApiError(options.method || "GET", endpoint, error);
    throw new Error(error);
  }

  // Create headers object with proper typing
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Add ngrok bypass header if using ngrok (to skip warning page)
  if (isNgrokUrl()) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  // Add store and branch headers if they exist
  if (storeId) {
    headers["X-Store-ID"] = storeId.toString();
  }
  if (branchId) {
    headers["X-Branch-ID"] = branchId.toString();
  }

  // Merge with any existing headers from options
  Object.assign(headers, options.headers);

  // Log the API request
  logApiRequest(
    options.method || "GET",
    sanitizedEndpoint,
    headers,
    options.body
  );

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}${sanitizedEndpoint}`, {
      ...options,
      headers,
    });

    const duration = Date.now() - startTime;

    // If we get a 401, try to refresh the token and retry the request
    if (response.status === 401 && autoRefresh) {
      logApiCall({
        level: "warn",
        method: options.method || "GET",
        url: sanitizedEndpoint,
        status: 401,
        error: "Authentication token expired, attempting refresh",
      });

      // Prevent multiple simultaneous token refreshes
      if (!tokenRefreshPromise) {
        tokenRefreshPromise = refreshAuthToken();
      }

      const refreshSuccess = await tokenRefreshPromise;

      // Reset the refresh promise after completion
      tokenRefreshPromise = null;

      if (refreshSuccess) {
        const newToken = localStorage.getItem("authToken");
        if (newToken) {
          // Log the retry request
          logApiRequest(
            options.method || "GET",
            sanitizedEndpoint,
            {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
            options.body
          );

          const retryStartTime = Date.now();
          const retryResponse = await fetch(`${API_URL}${sanitizedEndpoint}`, {
            ...options,
            headers: {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
          });

          const retryDuration = Date.now() - retryStartTime;

          // Log the retry response
          logApiResponse(
            options.method || "GET",
            sanitizedEndpoint,
            retryResponse.status,
            Object.fromEntries(retryResponse.headers.entries()),
            null, // We won't log response body here as it will be logged later
            retryDuration
          );

          return retryResponse.json();
        }
      }
      const error = "Authentication failed";
      logApiError(options.method || "GET", sanitizedEndpoint, error);
      throw new Error(error);
    }

    // Log the response
    logApiResponse(
      options.method || "GET",
      sanitizedEndpoint,
      response.status,
      Object.fromEntries(response.headers.entries()),
      null, // We won't log response body here as it will be processed below
      duration
    );

    if (!response.ok) {
      // Handle different error statuses appropriately
      let errorDetails = `API request failed with status ${response.status}`;
      let errorResponseData = null;

      // Try to get error details from response
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          // Clone the response to allow multiple reads
          const responseClone = response.clone();
          errorResponseData = await responseClone.json();
          if (errorResponseData.message) {
            errorDetails = errorResponseData.message;
          } else if (errorResponseData.error) {
            errorDetails = errorResponseData.error;
          }
        } else {
          // If not JSON, try to get text
          const responseClone = response.clone();
          const text = await responseClone.text();
          if (text) {
            errorDetails = text;
          }
        }
      } catch (parseError: any) {
        console.warn("Failed to parse error response:", parseError);
        // If we can't parse the error response, use status-based default messages
        if (response.status >= 500) {
          errorDetails = "Server error occurred. Please try again later.";
        } else if (response.status === 403) {
          errorDetails =
            "Access forbidden. You don't have permission to perform this action.";
        } else if (response.status === 401) {
          errorDetails = "Authentication required. Please log in again.";
        } else if (response.status === 404) {
          errorDetails = "Requested resource not found.";
        } else if (response.status === 429) {
          errorDetails = "Too many requests. Please try again later.";
        } else {
          errorDetails = `API request failed: ${response.status}`;
        }
      }

      // Provide user-friendly messages based on status
      if (response.status >= 500) {
        errorDetails =
          errorDetails || "Server error occurred. Please try again later.";
      } else if (response.status === 403) {
        errorDetails =
          errorDetails ||
          "Access forbidden. You don't have permission to perform this action.";
      } else if (response.status === 401) {
        errorDetails =
          errorDetails ||
          "Authentication required. Please log in again.";
      } else if (response.status === 404) {
        errorDetails = errorDetails || "Requested resource not found.";
      } else if (response.status === 429) {
        errorDetails =
          errorDetails ||
          "Too many requests. Please try again later.";
      }

      logApiCall({
        level: "error",
        method: options.method || "GET",
        url: sanitizedEndpoint,
        status: response.status,
        error: errorDetails,
        duration,
      });
      throw new Error(errorDetails);
    }

    // Parse response body as JSON
    let responseBody;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseBody = await response.json();
      } else {
        // If not JSON, try to get text
        const text = await response.text();
        responseBody = text ? { message: text } : {};
      }
    } catch (parseError: any) {
      // If JSON parsing fails, log detailed error
      const errorMessage = `Failed to parse response as JSON: ${parseError.message}`;
      logApiCall({
        level: "error",
        method: options.method || "GET",
        url: sanitizedEndpoint,
        status: response.status,
        error: errorMessage,
        duration: Date.now() - startTime,
      });
      throw new Error(errorMessage);
    }

    // Log the response body separately to avoid duplicating it in the response log
    logApiCall({
      level: "debug",
      method: options.method || "GET",
      url: sanitizedEndpoint,
      status: response.status,
      responseBody: responseBody,
    });

    return responseBody;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (
      error instanceof TypeError &&
      (error.message.includes("fetch") || error.message.includes("network"))
    ) {
      // Network error - backend server might be down or unreachable
      const errorMessage = `Unable to connect to the server.`;
      logApiCall({
        level: "error",
        method: options.method || "GET",
        url: sanitizedEndpoint,
        error: "Network error - unable to connect to server",
        duration,
      });
      throw new Error(errorMessage);
    }

    // Extract error message with more context
    let errorMessage = error.message || String(error);
    if (error.stack) {
      // Include stack trace in development for debugging
      if (process.env.NODE_ENV === "development") {
        console.error("Full error stack:", error.stack);
      }
    }

    logApiCall({
      level: "error",
      method: options.method || "GET",
      url: sanitizedEndpoint,
      error: errorMessage,
      duration,
    });

    throw error;
  }
};

// Separate function for token refresh
export const refreshAuthToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    logApiCall({
      level: "warn",
      method: "POST",
      url: "/auth/refresh-token",
      status: 401,
      error: "No refresh token found",
    });
    return false;
  }

  logApiRequest(
    "POST",
    "/auth/refresh-token",
    {},
    { refresh_token: refreshToken }
  );

  const startTime = Date.now();

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add ngrok bypass header if using ngrok
    if (isNgrokUrl()) {
      headers["ngrok-skip-browser-warning"] = "true";
    }

    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const duration = Date.now() - startTime;

    logApiResponse(
      "POST",
      "/auth/refresh-token",
      response.status,
      Object.fromEntries(response.headers.entries()),
      null,
      duration
    );

    if (!response.ok) {
      logApiCall({
        level: "error",
        method: "POST",
        url: "/auth/refresh-token",
        status: response.status,
        error: `Token refresh failed with status: ${response.status}`,
        duration,
      });

      // If refresh fails, clear stored tokens
      localStorage.removeItem("adminUser");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      return false;
    }

    const data = await response.json();

    if (data.success) {
      const { auth_token } = data.data;
      localStorage.setItem("authToken", auth_token);

      logApiCall({
        level: "info",
        method: "POST",
        url: "/auth/refresh-token",
        status: response.status,
        responseBody: { success: true },
        duration,
      });

      return true;
    } else {
      logApiCall({
        level: "error",
        method: "POST",
        url: "/auth/refresh-token",
        status: response.status,
        error: "Token refresh response indicated failure",
        duration,
      });

      // If refresh fails, clear stored tokens
      localStorage.removeItem("adminUser");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      return false;
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error("Token refresh error:", error);

    if (
      error instanceof TypeError &&
      (error.message.includes("fetch") || error.message.includes("network"))
    ) {
      // Network error - backend server might be down or unreachable
      const errorMessage = `Unable to connect to the server for token refresh. Please ensure:\n1. The backend API server is running\n2. The server is accessible at ${API_SERVER_URL}\n3. Your internet/network connection is working properly`;

      logApiCall({
        level: "error",
        method: "POST",
        url: "/auth/refresh-token",
        error: "Network error - unable to connect for token refresh",
        duration,
      });

      // If refresh fails due to network issues, clear stored tokens to force re-login
      localStorage.removeItem("adminUser");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      return false;
    }

    logApiCall({
      level: "error",
      method: "POST",
      url: "/auth/refresh-token",
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    // If refresh fails, clear stored tokens
    localStorage.removeItem("adminUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    return false;
  }
};

// Rate limiting variables for login attempts
let loginAttempts: { [key: string]: { count: number; timestamp: number } } = {};

// General API utility for login (public endpoint) with validation
export const loginRequest = async (
  email: string,
  password: string
): Promise<any> => {
  // Validate inputs
  if (!validateEmail(email)) {
    const error = "Invalid email format";
    logApiError("POST", "/auth/login", error);
    throw new Error(error);
  }

  if (password.length < 1) {
    const error = "Password is required";
    logApiError("POST", "/auth/login", error);
    throw new Error(error);
  }

  // Implement rate limiting - max 5 attempts per minute per email
  const emailKey = `login_${email}`;
  const now = Date.now();
  const attemptWindow = 60000; // 1 minute window
  const maxAttempts = 5;

  if (loginAttempts[emailKey]) {
    const { count, timestamp } = loginAttempts[emailKey];
    if (now - timestamp < attemptWindow) {
      if (count >= maxAttempts) {
        const error = "Too many login attempts. Please try again later.";
        logApiCall({
          level: "error",
          method: "POST",
          url: "/auth/login",
          error: "Rate limit exceeded",
          duration: 0,
        });
        throw new Error(error);
      } else {
        // Increment attempt count
        loginAttempts[emailKey] = { count: count + 1, timestamp };
      }
    } else {
      // Reset counter after window expires
      loginAttempts[emailKey] = { count: 1, timestamp: now };
    }
  } else {
    // First attempt
    loginAttempts[emailKey] = { count: 1, timestamp: now };
  }

  // Sanitize inputs
  const sanitizedEmail = sanitizeInput(email);
  const sanitizedPassword = sanitizeInput(password);

  const requestBody = { email: sanitizedEmail, password: sanitizedPassword };

  logApiRequest(
    "POST",
    "/auth/login",
    { "Content-Type": "application/json" },
    requestBody
  );

  const startTime = Date.now();

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add ngrok bypass header if using ngrok
    if (isNgrokUrl()) {
      headers["ngrok-skip-browser-warning"] = "true";
    }

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;

    logApiResponse(
      "POST",
      "/auth/login",
      response.status,
      Object.fromEntries(response.headers.entries()),
      null,
      duration
    );

    if (!response.ok) {
      // If login fails, increment the attempt counter
      if (response.status === 401 || response.status === 403) {
        // Update attempt count for failed login
        if (loginAttempts[emailKey]) {
          const { count, timestamp } = loginAttempts[emailKey];
          loginAttempts[emailKey] = { count: count + 1, timestamp };
        } else {
          loginAttempts[emailKey] = { count: 1, timestamp: now };
        }
      }

      if (response.status >= 500) {
        // Try to get more details from the response
        let errorDetails = "Server error occurred. Please try again later.";
        try {
          const errorResponse = await response.json();
          if (errorResponse.message) {
            errorDetails = errorResponse.message;
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        logApiCall({
          level: "error",
          method: "POST",
          url: "/auth/login",
          status: response.status,
          error: errorDetails,
          duration,
        });
        throw new Error(
          errorDetails || "Server error occurred. Please try again later."
        );
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
          level: "error",
          method: "POST",
          url: "/auth/login",
          status: response.status,
          error: errorDetails,
          duration,
        });
        throw new Error(errorDetails);
      }
    } else {
      // If login succeeds, reset the attempt counter
      delete loginAttempts[emailKey];
    }

    const data = await response.json();

    logApiCall({
      level: "debug",
      method: "POST",
      url: "/auth/login",
      status: response.status,
      responseBody: {
        success: data.success,
        // Don't log admin details for security
        message: data.message,
      },
      duration,
    });

    if (data.success) {
      const { auth_token, refresh_token, admin } = data.data;

      localStorage.setItem("adminUser", JSON.stringify(admin));
      localStorage.setItem("authToken", auth_token);
      localStorage.setItem("refreshToken", refresh_token);
    }

    return data;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (
      error instanceof TypeError &&
      (error.message.includes("fetch") || error.message.includes("network"))
    ) {
      // Network error - backend server might be down or unreachable
      const errorMessage = `Unable to connect to the server. Please ensure:\n1. The backend API server is running\n2. The server is accessible at ${API_SERVER_URL}\n3. Your internet/network connection is working properly`;
      logApiCall({
        level: "error",
        method: "POST",
        url: "/auth/login",
        error: "Network error - unable to connect to server",
        duration,
      });
      throw new Error(errorMessage);
    }

    logApiCall({
      level: "error",
      method: "POST",
      url: "/auth/login",
      error: error.message || String(error),
      duration,
    });

    throw error;
  }
};
