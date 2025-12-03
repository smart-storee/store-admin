'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Product, ProductVariant } from '@/types';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product details
        const response: ApiResponse<{ data: Product }> = 
          await makeAuthenticatedRequest(
            `/products/${params.id}?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );
        
        if (response.success) {
          setProduct(response.data.data || response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch product');
        }

        // Fetch product variants
        const variantsResponse: ApiResponse<{ data: ProductVariant[] }> = 
          await makeAuthenticatedRequest(
            `/products/${params.id}/variants?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );
        
        if (variantsResponse.success) {
          setVariants(variantsResponse.data.data || variantsResponse.data);
        } else {
          console.error('Failed to fetch variants:', variantsResponse.message);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
        console.error('Product detail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user?.store_id) {
      fetchProduct();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/products')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Back to Products
        </button>
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
      <div className="p-6">
        {product && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {product.product_name}
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push(`/products/${product.product_id}/edit`)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Edit Product
                  </button>
                  <button
                    onClick={() => router.push('/products')}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Back to Products
                  </button>
                </div>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Product Image */}
                <div className="sm:col-span-1">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                    <img 
                      src={product.product_image || '/placeholder-product.jpg'} 
                      alt={product.product_name}
                      className="h-80 w-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>
                </div>
                
                {/* Product Details */}
                <div className="sm:col-span-1">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Product ID</h4>
                    <p className="mt-1 text-sm text-gray-900">{product.product_id}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Category</h4>
                    <p className="mt-1 text-sm text-gray-900">{product.category_name}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1 text-sm text-gray-900">{product.product_description}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Base Price</h4>
                    <p className="mt-1 text-sm text-gray-900">₹{product.base_price}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Stock</h4>
                    <p className="mt-1 text-sm text-gray-900">{product.total_stock} units</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Total Sold</h4>
                    <p className="mt-1 text-sm text-gray-900">{product.total_sold} units</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                      product.is_active === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(product.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Branch</h4>
                    <p className="mt-1 text-sm text-gray-900">{product.branch_name}</p>
                  </div>
                </div>
              </div>
              
              {/* Product Variants */}
              {variants.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Variants</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {variants.map((variant) => (
                      <div key={variant.variant_id} className="border border-gray-200 rounded-md p-4">
                        <h4 className="font-medium text-gray-900">{variant.variant_name}</h4>
                        <p className="text-sm text-gray-500">Price: ₹{variant.variant_price}</p>
                        <p className="text-sm text-gray-500">Stock: {variant.stock} units</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Status: {variant.is_active === 1 ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}