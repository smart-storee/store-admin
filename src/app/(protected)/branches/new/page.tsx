'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse } from '@/types';

export default function NewBranchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        '/branches',
        {
          method: 'POST',
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
        throw new Error(response.message || 'Failed to create branch');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create branch');
      console.error('Create branch error:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Branch</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  id="address_line1"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  required
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
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                  PIN Code *
                </label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
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
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>When checked, this branch will be operational</p>
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
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}