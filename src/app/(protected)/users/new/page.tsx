'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Branch } from '@/types';

interface Permission {
  name: string;
  description: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    status: 'active',
    branch_id: null as number | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingPermissions(true);
        setLoadingBranches(true);

        // Fetch permissions
        const permissionsResponse: ApiResponse<Permission[]> = await makeAuthenticatedRequest(
          '/users/permissions',
          {},
          true,
          currentUser?.store_id,
          currentUser?.branch_id || undefined
        );

        if (permissionsResponse.success && permissionsResponse.data) {
          setAvailablePermissions(Array.isArray(permissionsResponse.data) ? permissionsResponse.data : []);
        }

        // Fetch branches
        if (currentUser?.store_id) {
          const branchesResponse: ApiResponse<{ data: Branch[] }> = await makeAuthenticatedRequest(
            `/branches?store_id=${currentUser?.store_id}`,
            {},
            true,
            currentUser?.store_id,
            currentUser?.branch_id || undefined
          );

          if (branchesResponse.success) {
            const branchesData = Array.isArray(branchesResponse.data.data) 
              ? branchesResponse.data.data 
              : branchesResponse.data.data || branchesResponse.data || [];
            setBranches(branchesData);
          }
        }
      } catch (err: any) {
        console.error('Failed to load data:', err);
      } finally {
        setLoadingPermissions(false);
        setLoadingBranches(false);
      }
    };

    if (currentUser?.store_id) {
      fetchData();
    }
  }, [currentUser?.store_id, currentUser?.branch_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (permissionName: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response: ApiResponse<{ data: any }> = 
        await makeAuthenticatedRequest(
          '/users',
          {
            method: 'POST',
            body: JSON.stringify({
              ...formData,
              store_id: currentUser?.store_id,
              branch_id: formData.branch_id,
              permissions: selectedPermissions,
            }),
          },
          true, // auto-refresh token
          currentUser?.store_id,
          currentUser?.branch_id || undefined
        );

      if (response.success) {
        router.push('/users'); // Redirect to users list
      } else {
        throw new Error(response.message || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      console.error('Create user error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard
      requiredPermissions={['manage_users']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage users.
          </div>
        </div>
      }
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New User</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow overflow-hidden sm:rounded-md max-w-3xl">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6">
                <label htmlFor="user_name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="user_name"
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleChange}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full max-w-lg pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border p-2"
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
              
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full max-w-lg pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border p-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="branch_id" className="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <select
                  id="branch_id"
                  name="branch_id"
                  value={formData.branch_id || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      branch_id: value ? parseInt(value) : null
                    }));
                  }}
                  className="mt-1 block w-full max-w-lg pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border p-2"
                >
                  <option value="">No branch assigned</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Permissions
                </label>
                {loadingPermissions ? (
                  <div className="text-sm text-gray-500">Loading permissions...</div>
                ) : (
                  <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
                    {availablePermissions.length === 0 ? (
                      <div className="text-sm text-gray-500">No permissions available</div>
                    ) : (
                      <div className="space-y-2">
                        {availablePermissions.map((permission) => (
                          <label
                            key={permission.name}
                            className="flex items-start space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.name)}
                              onChange={() => handlePermissionToggle(permission.name)}
                              className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              {permission.description && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {selectedPermissions.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={() => router.push('/users')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}