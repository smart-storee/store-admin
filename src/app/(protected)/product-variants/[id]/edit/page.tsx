'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Product, Branch, ProductVariant } from '@/types';

export default function EditProductVariantPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    product_id: 0,
    variant_name: '',
    variant_price: 0,
    variant_description: '',
    sku: '',
    barcode: '',
    stock: 0,
    is_active: 1,
    variant_image: '',
    attribute_values: '{}', // JSON string for attributes like size, color, etc.
  });

  // Fetch initial data (products and branches) and the variant to edit
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError(null);

        // Fetch products
        const productsResponse: ApiResponse<{ data: Product[] }> =
          await makeAuthenticatedRequest(
            `/products?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (productsResponse.success) {
          setProducts(productsResponse.data.data || productsResponse.data);
        } else {
          throw new Error(productsResponse.message || 'Failed to fetch products');
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

        // Fetch the specific variant to edit
        const variantResponse: ApiResponse<{ data: ProductVariant }> =
          await makeAuthenticatedRequest(
            `/product-variants/${params.id}?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (variantResponse.success) {
          const v = variantResponse.data.data || variantResponse.data;
          setVariant(v);
          setFormData({
            product_id: v.product_id,
            variant_name: v.variant_name,
            variant_price: v.variant_price,
            variant_description: v.variant_description || '',
            sku: v.sku || '',
            barcode: v.barcode || '',
            stock: v.stock,
            is_active: v.is_active,
            variant_image: v.variant_image || '',
            attribute_values: JSON.stringify(v.attribute_values || {}),
          });
        } else {
          throw new Error(variantResponse.message || 'Failed to fetch variant');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load initial data');
        console.error('Load product variant error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user?.store_id) {
      fetchInitialData();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: name.includes('enabled') || name.includes('active') ? (checked ? 1 : 0) : checked
      }));
    } else if (name === 'variant_price' || name === 'stock') {
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
      // Parse the attribute_values JSON to make sure it's valid
      let parsedAttributes = {};
      try {
        parsedAttributes = JSON.parse(formData.attribute_values);
      } catch (parseErr) {
        throw new Error('Attribute values must be valid JSON');
      }

      const response: ApiResponse<{ data: ProductVariant }> =
        await makeAuthenticatedRequest(
          `/product-variants/${params.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              ...formData,
              attribute_values: parsedAttributes,
              store_id: user?.store_id,
            }),
          },
          true, // auto-refresh token
          user?.store_id,
          user?.branch_id || undefined
        );

      if (response.success) {
        // Redirect back to the product page showing the updated variant
        router.push(`/products/${formData.product_id}`);
      } else {
        throw new Error(response.message || 'Failed to update product variant');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update product variant');
      console.error('Update product variant error:', err);
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
      requiredPermissions={['manage_products']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage product variants.
          </div>
        </div>
      }
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product Variant</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {variant ? (
          <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
                    Product *
                  </label>
                  <select
                    id="product_id"
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.product_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="variant_name" className="block text-sm font-medium text-gray-700">
                    Variant Name *
                  </label>
                  <input
                    type="text"
                    id="variant_name"
                    name="variant_name"
                    value={formData.variant_name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="variant_price" className="block text-sm font-medium text-gray-700">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    id="variant_price"
                    name="variant_price"
                    value={formData.variant_price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>


                <div className="col-span-6">
                  <label htmlFor="variant_description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="variant_description"
                    name="variant_description"
                    value={formData.variant_description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  ></textarea>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="variant_image" className="block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="text"
                    id="variant_image"
                    name="variant_image"
                    value={formData.variant_image}
                    onChange={handleChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="attribute_values" className="block text-sm font-medium text-gray-700">
                    Attributes (JSON)
                  </label>
                  <textarea
                    id="attribute_values"
                    name="attribute_values"
                    value={formData.attribute_values}
                    onChange={handleChange}
                    rows={2}
                    placeholder='{"size": "large", "color": "red", "weight": "500g"}'
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  ></textarea>
                  <p className="mt-1 text-xs text-gray-500">
                    JSON format for size, color, weight, or other distinguishing attributes
                  </p>
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
                      <p className="text-gray-500">When checked, this variant will be available for purchase</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 sm:px-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push(`/products/${variant.product_id}`)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Variant'}
              </button>
            </div>
          </form>
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