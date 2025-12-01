import AdminLayout from '@/components/AdminLayout';
import ProtectedRouteWrapper from '@/components/ProtectedRouteWrapper';
import { StoreProvider } from '@/contexts/StoreContext';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRouteWrapper>
      <StoreProvider>
        <AdminLayout>{children}</AdminLayout>
      </StoreProvider>
    </ProtectedRouteWrapper>
  );
}