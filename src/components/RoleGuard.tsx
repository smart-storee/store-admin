import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  allowedRoles?: ('admin' | 'staff' | 'delivery')[];
  requiredPermissions?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

// Component that guards content based on roles and permissions
export const RoleGuard = ({ 
  allowedRoles, 
  requiredPermissions = [], 
  fallback = <div>Access denied</div>, 
  children 
}: RoleGuardProps) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
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
    const hasAllPermissions = requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// Hook for checking permissions in components
export const usePermission = (permission: string) => {
  const { user } = useAuth();
  
  if (!user) {
    return false;
  }
  
  return user.permissions.includes(permission);
};

// Hook for checking multiple permissions (user has ANY of the permissions)
export const useAnyPermission = (permissions: string[]) => {
  const { user } = useAuth();
  
  if (!user) {
    return false;
  }
  
  return permissions.some(permission => user.permissions.includes(permission));
};

// Hook for checking multiple permissions (user has ALL of the permissions)
export const useAllPermissions = (permissions: string[]) => {
  const { user } = useAuth();
  
  if (!user) {
    return false;
  }
  
  return permissions.every(permission => user.permissions.includes(permission));
};