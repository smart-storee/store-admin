import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Define available roles
type Role = "owner" | "manager";

interface WithRoleAccessProps {
  allowedRoles: Role[];
  fallback?: ReactNode;
  children: ReactNode;
}

// Higher-order component for role-based access
export const WithRoleAccess = ({
  allowedRoles,
  fallback = null,
  children,
}: WithRoleAccessProps) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const hasAccess = allowedRoles.includes(user.role as Role);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Custom hook for checking role access
export const useRoleAccess = (allowedRoles: Role[]) => {
  const { user } = useAuth();

  if (!user) {
    return { hasAccess: false, user: null };
  }

  const hasAccess = allowedRoles.includes(user.role as Role);

  return { hasAccess, user };
};

// Specific hook for admin access
export const useAdminAccess = () => {
  return useRoleAccess(["owner"]);
};

// Specific hook for staff access (includes admin)
export const useStaffAccess = () => {
  return useRoleAccess(["owner", "manager"]);
};
