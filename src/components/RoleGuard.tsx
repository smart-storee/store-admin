import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";

interface RoleGuardProps {
  allowedRoles?: (
    | "manager"
    | "owner"
  )[];
  requiredPermissions?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

// Component that guards content based on roles and permissions
export const RoleGuard = ({
  allowedRoles,
  requiredPermissions = [],
  fallback = <div>Access denied</div>,
  children,
}: RoleGuardProps) => {
  const { user, isAuthenticated } = useAuth();
  const { userPermissions, hasPermission, loading } = usePermissions();
  const router = useRouter();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null; // Render nothing while redirecting
  }

  // Check role access if specified
  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return <>{fallback}</>;
  }

  // Check permission access if specified
  if (requiredPermissions.length > 0) {
    // Wait for permissions to load if still loading
    if (loading) {
      return null; // Render nothing while loading
    }

    // Use hasPermission from PermissionsContext (which handles the logic properly)
    // Fallback to manual check if needed
    let hasAllPermissions = false;

    if (hasPermission && typeof hasPermission === "function") {
      // Use the hasPermission function from PermissionsContext
      hasAllPermissions = requiredPermissions.every((permission) =>
        hasPermission(permission)
      );
    } else {
      // Fallback: manual check
      let permissionsToCheck: string[] = [];

      if (
        userPermissions &&
        Array.isArray(userPermissions) &&
        userPermissions.length > 0
      ) {
        permissionsToCheck = userPermissions;
      } else if (
        user.permissions &&
        Array.isArray(user.permissions) &&
        user.permissions.length > 0
      ) {
        permissionsToCheck = user.permissions;
      } else if (userPermissions && typeof userPermissions === "object") {
        // Handle case where it might be an object (convert to array)
        permissionsToCheck = Object.values(userPermissions).filter(
          (p): p is string => typeof p === "string"
        );
      }

      hasAllPermissions = requiredPermissions.every((permission) =>
        permissionsToCheck.includes(permission)
      );
    }

    if (!hasAllPermissions) {
      console.log("RoleGuard: Access denied", {
        requiredPermissions,
        userPermissions,
        userPermissionsType: typeof userPermissions,
        userPermissionsIsArray: Array.isArray(userPermissions),
        userPermissionsFromAuth: user.permissions,
        loading,
        hasPermissionFunction: typeof hasPermission,
        hasAllPermissions,
      });
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// Hook for checking permissions in components
export const usePermission = (permission: string) => {
  const { user } = useAuth();
  const { userPermissions } = usePermissions();

  if (!user) {
    return false;
  }

  // Ensure we always work with an array
  let permissionsToCheck: string[] = [];

  if (
    userPermissions &&
    Array.isArray(userPermissions) &&
    userPermissions.length > 0
  ) {
    permissionsToCheck = userPermissions;
  } else if (
    user.permissions &&
    Array.isArray(user.permissions) &&
    user.permissions.length > 0
  ) {
    permissionsToCheck = user.permissions;
  } else if (userPermissions && typeof userPermissions === "object") {
    permissionsToCheck = Object.values(userPermissions).filter(
      (p): p is string => typeof p === "string"
    );
  }

  return permissionsToCheck.includes(permission);
};

// Hook for checking multiple permissions (user has ANY of the permissions)
export const useAnyPermission = (permissions: string[]) => {
  const { user } = useAuth();
  const { userPermissions } = usePermissions();

  if (!user) {
    return false;
  }

  // Ensure we always work with an array
  let permissionsToCheck: string[] = [];

  if (
    userPermissions &&
    Array.isArray(userPermissions) &&
    userPermissions.length > 0
  ) {
    permissionsToCheck = userPermissions;
  } else if (
    user.permissions &&
    Array.isArray(user.permissions) &&
    user.permissions.length > 0
  ) {
    permissionsToCheck = user.permissions;
  } else if (userPermissions && typeof userPermissions === "object") {
    permissionsToCheck = Object.values(userPermissions).filter(
      (p): p is string => typeof p === "string"
    );
  }

  return permissions.some((permission) =>
    permissionsToCheck.includes(permission)
  );
};

// Hook for checking multiple permissions (user has ALL of the permissions)
export const useAllPermissions = (permissions: string[]) => {
  const { user } = useAuth();
  const { userPermissions } = usePermissions();

  if (!user) {
    return false;
  }

  // Ensure we always work with an array
  let permissionsToCheck: string[] = [];

  if (
    userPermissions &&
    Array.isArray(userPermissions) &&
    userPermissions.length > 0
  ) {
    permissionsToCheck = userPermissions;
  } else if (
    user.permissions &&
    Array.isArray(user.permissions) &&
    user.permissions.length > 0
  ) {
    permissionsToCheck = user.permissions;
  } else if (userPermissions && typeof userPermissions === "object") {
    permissionsToCheck = Object.values(userPermissions).filter(
      (p): p is string => typeof p === "string"
    );
  }

  return permissions.every((permission) =>
    permissionsToCheck.includes(permission)
  );
};
