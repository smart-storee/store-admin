'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import BranchForm from '@/components/BranchForm';

export default function NewBranchPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSuccess = (branch: any) => {
    // Navigate back to branches list after successful creation
    router.push('/branches');
  };

  return (
    // <RoleGuard
    //   requiredPermissions={['manage_branches']}
    //   fallback={
    //     <div className="p-6 text-center">
    //       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
    //         Access denied. You do not have permission to manage branches.
    //       </div>
    //     </div>
    //   }
    // >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Branch</h1>
        
        <BranchForm
          isEditing={false}
          onSuccess={handleSuccess}
          onCancel={() => router.back()}
        />
      </div>
    // </RoleGuard>
  );
}