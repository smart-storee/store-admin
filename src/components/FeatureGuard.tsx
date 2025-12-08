"use client";

import React, { ReactNode } from "react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { AlertCircle, CreditCard } from "lucide-react";

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showAlert?: boolean;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback,
  showAlert = true,
}) => {
  const { isFeatureEnabled, checkBillingAccess, storeFeatures, loading } =
    usePermissions();

  // Debug logging
  React.useEffect(() => {
    console.log("FeatureGuard render:", {
      feature,
      loading,
      storeFeatures,
      isEnabled: isFeatureEnabled(feature),
    });
  }, [feature, loading, storeFeatures]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check billing first
  const billingCheck = checkBillingAccess();
  console.log("FeatureGuard billing check:", {
    feature,
    hasAccess: billingCheck.hasAccess,
    reason: billingCheck.reason,
    billing_status: storeFeatures?.billing_status,
    billing_paid_until: storeFeatures?.billing_paid_until,
  });

  if (!billingCheck.hasAccess) {
    console.warn("FeatureGuard: Billing access denied", {
      feature,
      reason: billingCheck.reason,
    });
    return (
      fallback ||
      (showAlert && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CreditCard className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Billing Access Denied:</strong> {billingCheck.reason}
              </p>
              <p className="mt-2 text-sm text-yellow-600">
                Please contact support to resolve billing issues.
              </p>
            </div>
          </div>
        </div>
      ))
    );
  }

  // Check feature
  const featureEnabled = isFeatureEnabled(feature);
  console.log("FeatureGuard feature check:", {
    feature,
    featureEnabled,
    featureValue: storeFeatures?.[feature],
    featureType: typeof storeFeatures?.[feature],
  });

  if (!featureEnabled) {
    const featureName = feature
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    console.warn("FeatureGuard: Feature disabled", {
      feature,
      featureName,
      storeFeatures,
      featureValue: storeFeatures?.[feature],
      featureType: typeof storeFeatures?.[feature],
      isTrue: storeFeatures?.[feature] === true,
      isOne: storeFeatures?.[feature] === 1,
    });
    return (
      fallback ||
      (showAlert && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Feature Disabled:</strong> {featureName} is not enabled
                for your store.
              </p>
              <p className="mt-2 text-sm text-red-600">
                Please contact support to enable this feature.
              </p>
            </div>
          </div>
        </div>
      ))
    );
  }

  return <>{children}</>;
};

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  showAlert?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback,
  showAlert = true,
}) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    const permissionName = permission
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return (
      fallback ||
      (showAlert && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Permission Denied:</strong> You don't have permission to{" "}
                {permissionName}.
              </p>
              <p className="mt-2 text-sm text-red-600">
                Contact your administrator to request access.
              </p>
            </div>
          </div>
        </div>
      ))
    );
  }

  return <>{children}</>;
};
