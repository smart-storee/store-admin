'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Branch, Category } from '@/types';

export default function NewCategoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category_name: '',
    category_description: '',
    is_active: 1,
    branch_id: null as number | null,
    category_image : null,
  });

  // Fetch branches when component loads
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response: ApiResponse<{ data: Branch[] }> =
          await makeAuthenticatedRequest(`/branches?store_id=${user?.store_id}`);
        if (response.success) {
          setBranches(response.data.data || response.data);
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
        setError('Failed to load branches');
      } finally {
        setLoading(false);
      }
    };

    if (user?.store_id) {
      fetchBranches();
    }
  }, [user?.store_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked ? 1 : 0
      }));
    } else if (name === 'branch_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? Number(value) : null
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
    setSaving(true);

    try {
      const response: ApiResponse<{ data: Category }> =
        await makeAuthenticatedRequest(
          '/categories',
          {
            method: 'POST',
            body: JSON.stringify({
              ...formData,
              store_id: user?.store_id,
            }),
          },
          true, // auto-refresh token
          user?.store_id,
          formData.branch_id || undefined
        );

      if (response.success) {
        router.push('/business-setup-flow');
      } else {
        throw new Error(response.message || 'Failed to create category');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
      console.error('Create category error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-indigo-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={['manage_categories']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage categories.
          </div>
        </div>
      }
    >
      <div className="min-h-screen pb-20">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Category</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6">
                <label htmlFor="category_name" className="block text-sm font-medium text-gray-700">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="category_name"
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>

              <div className="col-span-6">
                <label htmlFor="category_description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="category_description"
                  name="category_description"
                  value={formData.category_description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                ></textarea>
              </div>

              <div className="col-span-6">
                <label htmlFor="category_image" className="block text-sm font-medium text-gray-700">
                  Category Image URL
                </label>
                <input
                  type="url"
                  id="category_image"
                  name="category_image"
                  value={formData.category_image || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional: Enter a URL for the category image
                </p>
              </div>

              {branches.length > 0 ? (
                <div className="col-span-6">
                  <label htmlFor="branch_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Master Category (Store-Level)
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    This category will be available across all branches. Branch selection is optional - if not selected, the first active branch will be used as default.
                  </p>
                  <select
                    id="branch_id"
                    name="branch_id"
                    value={formData.branch_id || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    <option value="">Auto-select first branch (Master Category)</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="col-span-6">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          No branches found. Please <a href="/branches/new" className="font-medium text-yellow-700 underline hover:text-yellow-600">create a branch</a> before adding categories.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    <label htmlFor="is_active" className="font-medium text-gray-700">
                      Active
                    </label>
                    <p className="text-gray-500">When checked, this category will be available for products</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={() => router.push('/business-setup-flow')}
              className="bg-white py-2.5 px-6 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || branches.length === 0}
              className={`inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                branches.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              title={branches.length === 0 ? 'Please create a branch first' : ''}
            >
              {saving ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </RoleGuard>
  );
}