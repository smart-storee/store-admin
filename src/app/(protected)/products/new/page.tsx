'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Category, Branch } from '@/types';
import { Plus } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    product_name: '',
    product_description: '',
    base_price: 0,
    category_id: 0,
    branch_ids: [] as number[],
    is_active: 1,
    product_image: '',
    serves_count: 1,
    is_vegetarian: 0,
    is_bestseller: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);

        // Fetch categories
        const categoriesResponse: ApiResponse<{ data: Category[] }> = 
          await makeAuthenticatedRequest(
            `/categories?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data.data || categoriesResponse.data);
        } else {
          throw new Error(categoriesResponse.message || 'Failed to fetch categories');
        }

        // Fetch branches
        const branchesResponse: ApiResponse<{ data: Branch[] }> = 
          await makeAuthenticatedRequest(
            `/branches?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (branchesResponse.success) {
          setBranches(branchesResponse.data.data || branchesResponse.data);
        } else {
          throw new Error(branchesResponse.message || 'Failed to fetch branches');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
        console.error('New product fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.store_id) {
      fetchData();
    }
  }, [user?.store_id, user?.branch_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked ? 1 : 0
      }));
    } else if (name === 'base_price') {
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
    setSaving(true);

    try {
      const response: ApiResponse<null> = 
        await makeAuthenticatedRequest(
          '/products',
          {
            method: 'POST',
            body: JSON.stringify({
              product_name: formData.product_name,
              product_description: formData.product_description,
              base_price: formData.base_price,
              category_id: formData.category_id,
              product_image: formData.product_image,
              branch_ids: formData.branch_ids.length > 0 ? formData.branch_ids : undefined,
              is_active: formData.is_active,
              serves_count: formData.serves_count,
              is_vegetarian: formData.is_vegetarian,
              is_bestseller: formData.is_bestseller,
              store_id: user?.store_id,
            }),
          },
          true, // auto-refresh token
          user?.store_id,
          user?.branch_id || undefined
        );

      if (response.success) {
        router.push('/setup-flow'); // Redirect to products list
      } else {
        throw new Error(response.message || 'Failed to create product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
      console.error('Create product error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={['manage_products']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage products.
          </div>
        </div>
      }
    >
      <div className="min-h-screen pb-20">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header with action buttons */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
              <p className="text-sm text-gray-500 mt-1">Create a new product and assign it to branches</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/setup-flow')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Setup
              </button>
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View All Products
              </button>
              <button
                type="button"
                onClick={() => router.push('/products/new')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add Another
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6">
                <label htmlFor="product_name" className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="product_name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              
              <div className="col-span-6">
                <label htmlFor="product_description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="product_description"
                  name="product_description"
                  value={formData.product_description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="base_price" className="block text-sm font-medium text-gray-700">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  id="base_price"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label htmlFor="serves_count" className="block text-sm font-medium text-gray-700">
                  Serves Count
                </label>
                <input
                  type="number"
                  id="serves_count"
                  name="serves_count"
                  value={formData.serves_count}
                  onChange={handleChange}
                  min="1"
                  className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_vegetarian === 1}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_vegetarian: e.target.checked ? 1 : 0 }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Vegetarian</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_bestseller === 1}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_bestseller: e.target.checked ? 1 : 0 }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Bestseller</span>
                  </label>
                </div>
              </div>
              
              <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Branches *
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Select one or more branches where this product will be available. Leave all unchecked to assign to all branches.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {branches.map((branch) => (
                    <label key={branch.branch_id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.branch_ids.includes(branch.branch_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              branch_ids: [...prev.branch_ids, branch.branch_id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              branch_ids: prev.branch_ids.filter(id => id !== branch.branch_id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{branch.branch_name}</span>
                    </label>
                  ))}
                </div>
                {formData.branch_ids.length === 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    No branches selected - product will be assigned to all active branches
                  </p>
                )}
              </div>
              
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="product_image" className="block text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <input
                  type="text"
                  id="product_image"
                  name="product_image"
                  value={formData.product_image}
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
                    <label htmlFor="is_active" className="font-medium text-gray-700">
                      Active
                    </label>
                    <p className="text-gray-500">When checked, this product will be available for purchase</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={() => router.push('/setup-flow')}
              className="bg-white py-2.5 px-6 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </RoleGuard>
  );
}