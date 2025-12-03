'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Category } from '@/types';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    is_active: 1,
  });

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response: ApiResponse<{ data: Category }> = 
          await makeAuthenticatedRequest(
            `/categories/${params.id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (response.success) {
          const category = response.data.data || response.data;
          setFormData({
            category_name: category.category_name,
            description: category.description || '',
            is_active: category.is_active ? 1 : 0,
          });
        } else {
          throw new Error(response.message || 'Failed to fetch category');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load category');
        console.error('Load category error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCategory();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'is_active' ? (value === '1' ? 1 : 0) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await makeAuthenticatedRequest(
        `/categories/${params.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...formData,
            store_id: user?.store_id,
            branch_id: user?.branch_id || null,
          }),
        },
        true, // auto-refresh token
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        router.push('/categories'); // Redirect to categories list
      } else {
        throw new Error(response.message || 'Failed to update category');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
      console.error('Update category error:', err);
    } finally {
      setLoading(false);
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
      requiredPermissions={['manage_categories']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage categories.
          </div>
        </div>
      }
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Category</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow overflow-hidden sm:rounded-md max-w-3xl">
          <div className="px-4 py-5 bg-white sm:p-6">
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
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
              
              <div className="col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
              
              <div className="col-span-6">
                <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="is_active"
                  name="is_active"
                  value={formData.is_active.toString()}
                  onChange={handleChange}
                  className="mt-1 block w-full max-w-lg pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}