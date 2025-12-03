'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { Branch, ApiResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import BranchForm from '@/components/BranchForm';

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true);
        const response: ApiResponse<{ data: Branch }> = 
          await makeAuthenticatedRequest(`/branches/${params.id}`);
        
        if (response.success) {
          setBranch(response.data.data || response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch branch');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load branch');
        console.error('Load branch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBranch();
    }
  }, [params.id]);

  const handleSuccess = (updatedBranch: Branch) => {
    // Navigate back to the branches list
    router.push('/branches');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/branches')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Back to Branches
        </button>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={['manage_branches']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage branches.
          </div>
        </div>
      }
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Branch</h1>
        
        {branch && (
          <BranchForm
            branch={branch}
            isEditing={true}
            onSuccess={handleSuccess}
            onError={handleError}
            onCancel={() => router.push('/branches')}
          />
        )}
      </div>
    </RoleGuard>
  );
}