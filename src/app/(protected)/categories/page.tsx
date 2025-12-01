'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from '@/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      if (!user?.store_id) {
        setError('No store selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch categories for the user's store and branch
        const response = await makeAuthenticatedRequest(
          `/categories?store_id=${user.store_id}${user.branch_id ? `&branch_id=${user.branch_id}` : ''}`,
          { method: 'GET' },
          true, // auto-refresh token
          user.store_id,
          user.branch_id || undefined
        );

        if (response.success) {
          setCategories(response.data || []);
        } else {
          throw new Error(response.message || 'Failed to fetch categories');
        }
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user?.store_id, user?.branch_id]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories Management</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
        <button
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => {/* Add new category logic */}}
        >
          Add New Category
        </button>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new category.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((category) => (
              <li key={category.category_id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {category.category_name}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="mr-6 flex items-center text-sm text-gray-500">
                        {category.description || 'No description'}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      {category.total_products} product{category.total_products !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Add layout to the page
CategoriesPage.getLayout = function getLayout(page: ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};