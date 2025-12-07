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
    delivery_charge: 0,
    surge_fee: 0,
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
          
          // Set form data from fetched branch - use correct field names
          setFormData({
            branch_name: branchData.branch_name || '',
            branch_code: branchData.branch_code || '',
            branch_email: branchData.branch_email || '',
            branch_phone: branchData.branch_phone || branchData.phone || '',
            address_line1: branchData.address_line_1 || branchData.address_line1 || '',
            address_line2: branchData.address_line_2 || branchData.address_line2 || '',
            city: branchData.city || '',
            state: branchData.state || '',
            country: branchData.country || '',
            pincode: branchData.pincode || '',
            latitude: branchData.latitude ? parseFloat(branchData.latitude.toString()) : 0,
            longitude: branchData.longitude ? parseFloat(branchData.longitude.toString()) : 0,
            delivery_charge: branchData.delivery_charge ? parseFloat(branchData.delivery_charge.toString()) : 0,
            surge_fee: branchData.surge_fee ? parseFloat(branchData.surge_fee.toString()) : 0,
            manager_name: branchData.manager_name || '',
            manager_phone: branchData.manager_phone || '',
            manager_email: branchData.manager_email || '',
            is_active: branchData.is_active !== undefined ? (branchData.is_active === 1 ? 1 : 0) : 1,
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
    } else if (name === 'latitude' || name === 'longitude' || name === 'delivery_charge' || name === 'surge_fee') {
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
            branch_name: formData.branch_name,
            address_line_1: formData.address_line1,
            address_line_2: formData.address_line2,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            pincode: formData.pincode,
            branch_phone: formData.branch_phone,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
            delivery_charge: formData.delivery_charge || 0,
            surge_fee: formData.surge_fee || 0,
            is_active: formData.is_active,
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
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/branches')}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-slate-700 text-slate-300'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            ← Back
          </button>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Edit Branch
          </h1>
        </div>

        {error && (
          <div className={`border rounded-lg p-4 mb-6 ${
            theme === 'dark'
              ? 'bg-red-900/30 border-red-700/50 text-red-300'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            {error}
          </div>
        )}

        {branch ? (
          <form onSubmit={handleSubmit} className={`shadow sm:rounded-md ${
            theme === 'dark'
              ? 'bg-slate-800/50 border border-slate-700/50'
              : 'bg-white'
          }`}>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="branch_name" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    id="branch_name"
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full max-w-lg rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="branch_phone" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    Branch Phone *
                  </label>
                  <input
                    type="text"
                    id="branch_phone"
                    name="branch_phone"
                    value={formData.branch_phone}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="address_line1" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="address_line2" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="city" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="state" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="pincode" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="latitude" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    step="any"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="longitude" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    step="any"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="delivery_charge" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    Delivery Charge (₹) *
                  </label>
                  <input
                    type="number"
                    id="delivery_charge"
                    name="delivery_charge"
                    value={formData.delivery_charge || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="surge_fee" className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    Surge Fee (₹)
                  </label>
                  <input
                    type="number"
                    id="surge_fee"
                    name="surge_fee"
                    value={formData.surge_fee || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500'
                        : 'border-gray-300'
                    }`}
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
                        className={`focus:ring-indigo-500 h-4 w-4 text-indigo-600 rounded ${
                          theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="is_active" className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                        Active
                      </label>
                      <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}>When unchecked, this branch will be deactivated</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`px-4 py-3 sm:px-6 flex justify-end border-t ${
              theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <button
                type="button"
                onClick={() => router.push('/branches')}
                className={`py-2 px-4 border rounded-md text-sm font-medium mr-3 transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors ${
                  theme === 'dark'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
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