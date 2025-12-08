import AdminLayout from "@/components/AdminLayout";
import ProtectedRouteWrapper from "@/components/ProtectedRouteWrapper";
import { StoreProvider } from "@/contexts/StoreContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRouteWrapper>
      <StoreProvider>
        <PermissionsProvider>
          <AdminLayout>{children}</AdminLayout>
        </PermissionsProvider>
      </StoreProvider>
    </ProtectedRouteWrapper>
  );
}
