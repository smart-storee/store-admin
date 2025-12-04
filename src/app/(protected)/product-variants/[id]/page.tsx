'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, ProductVariant } from '@/types';

export default function ProductVariantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: ApiResponse<{ data: ProductVariant }> =
          await makeAuthenticatedRequest(
            `/product-variants/${params.id}?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (response.success) {
          setVariant(response.data.data || response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch product variant');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product variant');
        console.error('Product variant detail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user?.store_id) {
      fetchVariant();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  const handleDeleteVariant = async () => {
    if (!confirm('Are you sure you want to delete this variant? This action cannot be undone.')) {
      return;
    }

    try {
      const response: ApiResponse<null> =
        await makeAuthenticatedRequest(
          `/product-variants/${params.id}`,
          {
            method: 'DELETE',
          },
          true, // auto-refresh token
          user?.store_id,
          user?.branch_id || undefined
        );

      if (response.success) {
        // Redirect back to the product that this variant belongs to
        router.push(`/products/${variant?.product_id}`);
      } else {
        throw new Error(response.message || 'Failed to delete product variant');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete product variant');
      console.error('Delete variant error:', err);
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
      requiredPermissions={['view_products']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to view product variants.
          </div>
        </div>
      }
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Variant Details</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/products/${variant?.product_id}`)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Product
            </button>
            <button
              onClick={() => router.push(`/product-variants/${params.id}/edit`)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Edit Variant
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {variant ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {variant.variant_name}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Product Variant #{variant.variant_id}
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Product Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {variant.product_name}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Variant Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {variant.variant_name}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{variant.variant_price.toFixed(2)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Stock Quantity</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {variant.stock} units
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">SKU</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {variant.sku || 'N/A'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Barcode</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {variant.barcode || 'N/A'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      variant.is_active === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {variant.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {variant.variant_description || 'No description provided'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Attributes</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {variant.attribute_values ? JSON.stringify(variant.attribute_values) : 'No attributes defined'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(variant.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(variant.updated_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
              </dl>
            </div>
            
            {/* Actions */}
            <div className="px-4 py-4 bg-gray-50 sm:px-6 flex justify-end space-x-3">
              <button
                onClick={handleDeleteVariant}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete Variant
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Product variant not found</p>
            <button
              onClick={() => router.push('/products')}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Back to Products
            </button>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}