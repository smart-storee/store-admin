"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { makeAuthenticatedRequest } from "@/utils/api";

interface Permission {
  permission_id: number;
  permission_code: string;
  permission_name: string;
  permission_description: string;
  feature_group: string;
  store_enabled: number;
}

interface StoreFeatures {
  billing_status: "active" | "pending" | "suspended" | "expired";
  billing_paid_until: string | null;
  branches_enabled: boolean;
  categories_enabled: boolean;
  products_enabled: boolean;
  orders_enabled: boolean;
  notifications_enabled: boolean;
  communication_logs_enabled: boolean;
  billings_enabled: boolean;
  customers_enabled: boolean;
  employees_enabled: boolean;
  reports_enabled: boolean;
  home_config_enabled: boolean;
  coupon_codes_enabled: boolean;
  app_settings_enabled: boolean;
  [key: string]: any;
}

interface UserPermissions {
  permissions: string[];
  admin_id: number;
  role_id: number;
  store_id: number;
}

interface PermissionsContextType {
  availablePermissions: Permission[];
  userPermissions: string[];
  storeFeatures: StoreFeatures | null;
  loading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  refreshFeatures: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  isFeatureEnabled: (featureName: string) => boolean;
  checkBillingAccess: () => { hasAccess: boolean; reason?: string };
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [storeFeatures, setStoreFeatures] = useState<StoreFeatures | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailablePermissions = async () => {
    if (!user?.store_id) return;

    try {
      const response = await makeAuthenticatedRequest(
        "/permissions",
        {},
        true,
        user.store_id,
        user.branch_id || undefined
      );

      if (response.success && response.data) {
        setAvailablePermissions(
          Array.isArray(response.data) ? response.data : []
        );
      }
    } catch (err: any) {
      // Don't log billing errors as errors - they're expected when billing is expired
      // The billing status will be checked separately via store features
      if (err.message && err.message.includes("Billing")) {
        console.warn("Billing check during permissions fetch:", err.message);
      } else {
        console.error("Error fetching available permissions:", err);
      }
      // Set empty permissions array so the app can still function
      setAvailablePermissions([]);
    }
  };

  const fetchUserPermissions = async () => {
    const userId = user?.user_id;
    if (!userId || !user?.store_id) {
      console.log("Cannot fetch permissions - missing user ID or store ID", {
        userId,
        store_id: user?.store_id,
        user: user,
      });
      return;
    }

    try {
      console.log("Fetching user permissions for:", {
        userId,
        store_id: user.store_id,
        role: user.role,
      });
      const response = await makeAuthenticatedRequest(
        "/permissions/me",
        {},
        true,
        user.store_id,
        user.branch_id || undefined
      );

      console.log("Permissions API response:", response);

      if (response.success && response.data) {
        const permissions = response.data.permissions || [];
        console.log("Setting user permissions:", permissions);
        setUserPermissions(permissions);
      } else {
        console.warn(
          "Permissions API returned unsuccessful response:",
          response
        );
      }
    } catch (err: any) {
      console.error("Error fetching user permissions:", err);
    }
  };

  const fetchStoreFeatures = async () => {
    if (!user?.store_id) return;

    try {
      // Fetch store features from store endpoint
      // This should NOT be blocked by billing status - we need features to determine billing status
      const response = await makeAuthenticatedRequest(
        `/stores/${user.store_id}`,
        {},
        true,
        user.store_id,
        user.branch_id || undefined
      );

      console.log("Store features API response:", response);

      if (response.success && response.data) {
        const features = response.data;
        console.log("Processing store features:", features);
        setStoreFeatures({
          billing_status: features.billing_status || "pending",
          billing_paid_until: features.billing_paid_until || null,
          branches_enabled:
            features.branches_enabled === 1 ||
            features.branches_enabled === true,
          categories_enabled:
            features.categories_enabled === 1 ||
            features.categories_enabled === true,
          products_enabled:
            features.products_enabled === 1 ||
            features.products_enabled === true,
          orders_enabled:
            features.orders_enabled === 1 || features.orders_enabled === true,
          notifications_enabled:
            features.notifications_enabled === 1 ||
            features.notifications_enabled === true,
          communication_logs_enabled:
            features.communication_logs_enabled === 1 ||
            features.communication_logs_enabled === true,
          billings_enabled:
            features.billings_enabled === 1 ||
            features.billings_enabled === true,
          customers_enabled:
            features.customers_enabled === 1 ||
            features.customers_enabled === true,
          employees_enabled:
            features.employees_enabled === 1 ||
            features.employees_enabled === true,
          reports_enabled:
            features.reports_enabled === 1 || features.reports_enabled === true,
          home_config_enabled:
            features.home_config_enabled === 1 ||
            features.home_config_enabled === true,
          coupon_codes_enabled:
            features.coupon_codes_enabled === 1 ||
            features.coupon_codes_enabled === true,
          app_settings_enabled:
            features.app_settings_enabled === 1 ||
            features.app_settings_enabled === true,
        });
        console.log("Store features set successfully");
      } else {
        console.warn("Store features response missing data:", response);
      }
    } catch (err: any) {
      // Handle billing errors gracefully - don't prevent app from loading
      if (err.message && err.message.includes("Billing")) {
        console.warn("Billing check during features fetch:", err.message);
        // Set default features so app can still load and show billing message
        setStoreFeatures({
          billing_status: "expired",
          billing_paid_until: null,
          branches_enabled: false,
          categories_enabled: false,
          products_enabled: false,
          orders_enabled: false,
          notifications_enabled: false,
          communication_logs_enabled: false,
          billings_enabled: false,
          customers_enabled: false,
          employees_enabled: false,
          reports_enabled: false,
          home_config_enabled: false,
          coupon_codes_enabled: false,
          app_settings_enabled: false,
        });
      } else {
        console.error("Error fetching store features:", err);
      }
    }
  };

  const refreshPermissions = async () => {
    await Promise.all([fetchAvailablePermissions(), fetchUserPermissions()]);
  };

  const refreshFeatures = async () => {
    await fetchStoreFeatures();
  };

  useEffect(() => {
    if (user?.store_id) {
      setLoading(true);
      Promise.all([
        fetchAvailablePermissions(),
        fetchUserPermissions(),
        fetchStoreFeatures(),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [user?.store_id, user?.user_id]);

  const hasPermission = (permissionCode: string): boolean => {
    return userPermissions.includes(permissionCode);
  };

  const isFeatureEnabled = (featureName: string): boolean => {
    if (!storeFeatures) {
      console.log("isFeatureEnabled: storeFeatures is null/undefined");
      return false;
    }
    const value = storeFeatures[featureName];

    // Handle multiple formats: boolean true, number 1, string "true", string "1"
    // Be explicit about what we accept to avoid false positives
    const isEnabled =
      value === true || value === 1 || value === "true" || value === "1";

    // Always log for debugging
    console.log(`isFeatureEnabled(${featureName}):`, {
      value,
      type: typeof value,
      isEnabled,
      strictTrue: value === true,
      strictOne: value === 1,
      strictStringTrue: value === "true",
      strictStringOne: value === "1",
      featureValue: storeFeatures[featureName],
      allFeaturesKeys: Object.keys(storeFeatures || {}),
    });

    if (!isEnabled) {
      console.warn(`isFeatureEnabled(${featureName}): Feature is disabled`, {
        value,
        type: typeof value,
        isEnabled,
        allFeatures: storeFeatures,
      });
    }
    return isEnabled;
  };

  const checkBillingAccess = (): { hasAccess: boolean; reason?: string } => {
    if (!storeFeatures) {
      return { hasAccess: false, reason: "Store features not loaded" };
    }

    // Check billing status
    if (storeFeatures.billing_status) {
      if (storeFeatures.billing_status === "active") {
        // Check if billing date has expired even if status is active
        if (storeFeatures.billing_paid_until) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const paidUntil = new Date(storeFeatures.billing_paid_until);
          paidUntil.setHours(0, 0, 0, 0);

          console.log("Billing date check:", {
            today: today.toISOString(),
            paidUntil: paidUntil.toISOString(),
            isExpired: paidUntil < today,
            billing_status: storeFeatures.billing_status,
          });

          // Block access if the paid_until date has passed
          if (paidUntil < today) {
            return {
              hasAccess: false,
              reason: "Billing period has expired. Please renew your subscription.",
            };
          }
        }
        return { hasAccess: true };
      } else {
        return {
          hasAccess: false,
          reason: `Billing status is ${storeFeatures.billing_status}. Please complete payment to access features.`,
        };
      }
    }

    // Additional check: if billing_paid_until is set and in the past, block access
    if (storeFeatures.billing_paid_until) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const paidUntil = new Date(storeFeatures.billing_paid_until);
      paidUntil.setHours(0, 0, 0, 0);

      console.log("Billing date check:", {
        today: today.toISOString(),
        paidUntil: paidUntil.toISOString(),
        isExpired: paidUntil < today,
        billing_status: storeFeatures.billing_status,
      });

      // Block access if the paid_until date has passed
      if (paidUntil < today) {
        return {
          hasAccess: false,
          reason: "Billing has expired. Please renew your subscription.",
        };
      }
    }

    return { hasAccess: true };
  };

  return (
    <PermissionsContext.Provider
      value={{
        availablePermissions,
        userPermissions,
        storeFeatures,
        loading,
        error,
        refreshPermissions,
        refreshFeatures,
        hasPermission,
        isFeatureEnabled,
        checkBillingAccess,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};
