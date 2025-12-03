'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { Branch, ApiResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';

export default function BranchDetailPage() {
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
          await makeAuthenticatedRequest(`/branches/${params.id}?store_id=${user?.store_id}`, {}, true, user?.store_id, undefined); // Don't pass branch_id for branch detail
        
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

    if (params.id && user?.store_id) {
      fetchBranch();
    }
  }, [params.id, user?.store_id]);

  const handleEdit = () => {
    router.push(`/branches/${branch?.branch_id}/edit`);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        <p>Loading branch details...</p>
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
    // <RoleGuard
    //   requiredPermissions={['view_branches']}
    //   fallback={
    //     <div className="p-6 text-center">
    //       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
    //         Access denied. You do not have permission to view branches.
    //       </div>
    //     </div>
    //   }
    // >
      <div className="p-6">
        {branch && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {branch.branch_name}
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={handleEdit}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => router.push('/branches')}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Back to Branches
                  </button>
                </div>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Branch Information</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Branch ID:</span>
                      <span className="text-sm text-gray-900">{branch.branch_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Address:</span>
                      <span className="text-sm text-gray-900">{branch.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">City:</span>
                      <span className="text-sm text-gray-900">{branch.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pincode:</span>
                      <span className="text-sm text-gray-900">{branch.pincode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm text-gray-900">{branch.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm ${
                        branch.is_active ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Location & Fees</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Coordinates:</span>
                      <span className="text-sm text-gray-900">{branch.latitude}, {branch.longitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Delivery Charge:</span>
                      <span className="text-sm text-gray-900">₹{branch.delivery_charge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Surge Fee:</span>
                      <span className="text-sm text-gray-900">₹{branch.surge_fee || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Orders:</span>
                      <span className="text-sm text-gray-900">{branch.total_orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(branch.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    // </RoleGuard>
  );
}