"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface RequirePermissionProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export const RequirePermission = ({
  permission,
  fallback = (
    <div className="p-6 text-center text-red-500">
      You don't have permission to view this content.
    </div>
  ),
  children,
}: RequirePermissionProps) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  // Check if the user has the required permission
  const hasPermission =
    user.permissions.includes(permission) || user.role === "admin";

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

interface RoleBasedRenderProps {
  allowedRoles: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const RoleBasedRender = ({
  allowedRoles,
  fallback = (
    <div className="p-6 text-center text-red-500">
      You don't have permission to view this content.
    </div>
  ),
  children,
}: RoleBasedRenderProps) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  const hasRoleAccess = allowedRoles.includes(user.role);

  return hasRoleAccess ? <>{children}</> : <>{fallback}</>;
};
