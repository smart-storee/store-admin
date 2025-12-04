'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Branch } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';


export default function EditBranchPage() {
  const router = useRouter();
    const { theme } = useTheme();
  
  const params = useParams();
  const { user } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    branch_name: '',
    branch_code: '',
    branch_email: '',
    branch_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
    manager_name: '',
    manager_phone: '',
    manager_email: '',
    is_active: 1,
  });

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: ApiResponse<{ data: Branch }> =
          await makeAuthenticatedRequest(
            `/branches/${params.id}?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (response.success) {
          const branchData = response.data.data || response.data;
          setBranch(branchData);
          
          // Set form data from fetched branch
          setFormData({
            branch_name: branchData.branch_name || '',
            branch_code: branchData.branch_code || '',
            branch_email: branchData.branch_email || '',
            branch_phone: branchData.phone || '',
            address_line1: branchData.address || '',
            address_line2: branchData.address_line2 || '',
            city: branchData.city || '',
            state: branchData.state || '',
            country: branchData.country || '',
            pincode: branchData.pincode || '',
            latitude: branchData.latitude || 0,
            longitude: branchData.longitude || 0,
            manager_name: branchData.manager_name || '',
            manager_phone: branchData.manager_phone || '',
            manager_email: branchData.manager_email || '',
            is_active: branchData.is_active !== undefined ? branchData.is_active : 1,
          });
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
  }, [params.id, user?.store_id, user?.branch_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked ? 1 : 0
      }));
    } else if (name === 'latitude' || name === 'longitude') {
      const numericValue = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  const t = theme;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        `/branches/${params.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...formData,
            store_id: user?.store_id,
          }),
        },
        true, // auto-refresh token
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        router.push('/branches'); // Redirect to branches list
      } else {
        throw new Error(response.message || 'Failed to update branch');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update branch');
      console.error('Update branch error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center">
          <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1"></div>
          <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1"></div>
          <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce"></div>
        </div>
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

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {branch ? (
          <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="branch_name" className="block text-sm font-medium text-gray-700">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    id="branch_name"
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="branch_code" className="block text-sm font-medium text-gray-700">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    id="branch_code"
                    name="branch_code"
                    value={formData.branch_code}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="branch_email" className="block text-sm font-medium text-gray-700">
                    Branch Email
                  </label>
                  <input
                    type="email"
                    id="branch_email"
                    name="branch_email"
                    value={formData.branch_email}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="branch_phone" className="block text-sm font-medium text-gray-700">
                    Branch Phone
                  </label>
                  <input
                    type="text"
                    id="branch_phone"
                    name="branch_phone"
                    value={formData.branch_phone}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    step="any"
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    step="any"
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="manager_name" className="block text-sm font-medium text-gray-700">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    id="manager_name"
                    name="manager_name"
                    value={formData.manager_name}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="manager_phone" className="block text-sm font-medium text-gray-700">
                    Manager Phone
                  </label>
                  <input
                    type="text"
                    id="manager_phone"
                    name="manager_phone"
                    value={formData.manager_phone}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="manager_email" className="block text-sm font-medium text-gray-700">
                    Manager Email
                  </label>
                  <input
                    type="email"
                    id="manager_email"
                    name="manager_email"
                    value={formData.manager_email}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_active"
                        name="is_active"
                        type="checkbox"
                        checked={formData.is_active === 1}
                        onChange={handleChange}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="is_active" className={theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-700'}>
                        Active
                      </label>
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>When unchecked, this branch will be deactivated</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 sm:px-6 flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/branches')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Branch'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Branch not found</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}