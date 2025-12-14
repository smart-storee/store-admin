import loginImage from "@/assets/images/login-logo.png";
import favicon from "@/assets/images/favicon.png";

/**
 * Fallback constants for login screen and app metadata.
 *
 * These values are used as fallbacks when:
 * - NEXT_PUBLIC_STORE_ID is not set in environment variables
 * - API call to fetch app_config fails
 * - app_config data is not available in database
 *
 * The login page will attempt to fetch dynamic values from app_config table
 * using the store_id from NEXT_PUBLIC_STORE_ID environment variable.
 *
 * Note: These are also used in layout.tsx for static metadata (Next.js requirement).
 */
export const LOGIN_CONSTANTS = {
  STORE_NAME: "Store Admin",
  PORTAL_NAME: "Manage your store efficiently",
  STORE_INITIAL: "SA",
  LOGIN_IMAGE: loginImage,
  FAVICON: favicon,
} as const;
