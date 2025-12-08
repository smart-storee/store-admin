'use client';

import { useState, useEffect } from 'react';
import { ApiResponse } from '@/types';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { Branch } from '@/types';

interface BranchFormProps {
  branch?: Branch;
  isEditing?: boolean;
  onSuccess?: (branch: Branch) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const BranchForm = ({ branch, isEditing = false, onSuccess, onError, onCancel }: BranchFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    branch_name: isEditing && branch ? branch.branch_name : '',
    address: isEditing && branch ? branch.address : '',
    city: isEditing && branch ? branch.city : '',
    pincode: isEditing && branch ? branch.pincode : '',
    phone: isEditing && branch ? branch.phone : '',
    latitude: isEditing && branch ? branch.latitude : 0,
    longitude: isEditing && branch ? branch.longitude : 0,
    delivery_charge: isEditing && branch ? branch.delivery_charge : 0,
    surge_fee: isEditing && branch ? branch.surge_fee || 0 : 0,
    is_active: isEditing && branch ? (branch.is_active ? 1 : 0) : 1,
  });


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('charge') || name.includes('fee') || name.includes('latitude') || name.includes('longitude') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let response: ApiResponse<any>;

      if (isEditing && branch?.branch_id) {
        // Update branch
        response = await makeAuthenticatedRequest(`/branches/${branch.branch_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...formData,
            store_id: user?.store_id,
          }),
        });
      } else {
        // Create branch
        response = await makeAuthenticatedRequest('/branches', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            store_id: user?.store_id,
          }),
        });
      }

      if (response.success) {
        onSuccess?.(response.data);
      } else {
        throw new Error(response.message || `Failed to ${isEditing ? 'update' : 'create'} branch`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} branch`);
      console.error(`${isEditing ? 'Update' : 'Create'} branch error:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="p-6">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Branch' : 'Add New Branch'}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow overflow-hidden sm:rounded-md p-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <label htmlFor="branch_name" className="block text-sm font-medium text-gray-700">
              Branch Name *
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="branch_name"
                name="branch_name"
                value={formData.branch_name}
                onChange={handleChange}
                required
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address *
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
              Pincode *
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone *
            </label>
            <div className="mt-1">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
              Latitude
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="any"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
              Longitude
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="any"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="delivery_charge" className="block text-sm font-medium text-gray-700">
              Delivery Charge
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="delivery_charge"
                name="delivery_charge"
                value={formData.delivery_charge}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* <div className="sm:col-span-3">
            <label htmlFor="surge_fee" className="block text-sm font-medium text-gray-700">
              Surge Fee
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="surge_fee"
                name="surge_fee"
                value={formData.surge_fee}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div> */}

          <div className="sm:col-span-6">
            <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <div className="mt-1">
              <select
                id="is_active"
                name="is_active"
                value={formData.is_active}
                onChange={handleChange}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Branch' : 'Create Branch')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BranchForm;