'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { useTheme } from '@/contexts/ThemeContext';
import { ApiResponse, Category, Product } from '@/types';
import { Package, ArrowLeft } from 'lucide-react';

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDark = theme === 'dark';
  const cardClass = isDark
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';
  const textClass = isDark ? 'text-gray-300' : 'text-gray-600';

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response: ApiResponse<{ data: Category }> = 
          await makeAuthenticatedRequest(
            `/categories/${params.id}?store_id=${user?.store_id}${user?.branch_id ? `&branch_id=${user?.branch_id}` : ''}`,
            { method: 'GET' },
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (response.success) {
          setCategory(response.data.data || response.data);
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

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.store_id || !params.id) return;
      try {
        setProductsLoading(true);
        const response = await makeAuthenticatedRequest(
          `/products?store_id=${user.store_id}&category_id=${params.id}`,
          { method: 'GET' },
          true,
          user.store_id,
          user?.branch_id || undefined
        );

        if (response?.success) {
          const responseData = response.data || {};
          const productsData = Array.isArray(responseData)
            ? responseData
            : responseData.data || [];
          setProducts(productsData);
        } else {
          throw new Error(response?.message || 'Failed to fetch products');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [params.id, user?.store_id, user?.branch_id]);

  const handleToggleProductActive = async (
    productId: number,
    currentStatus: number
  ) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} this product?`)) return;

    setProducts((prev) =>
      prev.map((product) =>
        product.product_id === productId
          ? { ...product, is_active: newStatus }
          : product
      )
    );

    try {
      const response = await makeAuthenticatedRequest(
        `/products/${productId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            is_active: newStatus,
            store_id: user?.store_id,
          }),
        },
        true,
        user?.store_id,
        user?.branch_id || undefined
      );

      if (!response.success) {
        setProducts((prev) =>
          prev.map((product) =>
            product.product_id === productId
              ? { ...product, is_active: currentStatus }
              : product
          )
        );
        alert(response.message || `Failed to ${action} product`);
      }
    } catch (err: any) {
      setProducts((prev) =>
        prev.map((product) =>
          product.product_id === productId
            ? { ...product, is_active: currentStatus }
            : product
        )
      );
      alert(err.message || `Failed to ${action} product`);
    }
  };

  const handleToggleCategoryActive = async (
    categoryId: number,
    currentStatus: number
  ) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} this category?`)) return;

    setCategory((prev) =>
      prev ? { ...prev, is_active: newStatus } : prev
    );

    try {
      const response = await makeAuthenticatedRequest(
        `/categories/${categoryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            is_active: newStatus,
            store_id: user?.store_id,
            branch_id: category?.branch_id,
          }),
        },
        true,
        user?.store_id,
        category?.branch_id || undefined
      );

      if (!response.success) {
        setCategory((prev) =>
          prev ? { ...prev, is_active: currentStatus } : prev
        );
        alert(response.message || `Failed to ${action} category`);
      }
    } catch (err: any) {
      setCategory((prev) =>
        prev ? { ...prev, is_active: currentStatus } : prev
      );
      alert(err.message || `Failed to ${action} category`);
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/categories')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={['view_categories']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to view categories.
          </div>
        </div>
      }
    >
      <div className="p-6">
        {category ? (
          <>
            <div className={`${cardClass} border rounded-xl shadow-sm p-6`}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => router.push('/business-setup-flow')}
                  className={`inline-flex items-center gap-2 text-sm ${
                    isDark
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ArrowLeft size={16} />
                  Back to Product Categories
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      router.push(`/categories/${category.category_id}/edit`)
                    }
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      isDark
                        ? 'text-indigo-400 hover:bg-indigo-900/40'
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleCategoryActive(
                        category.category_id,
                        category.is_active ?? 0
                      )
                    }
                    role="switch"
                    aria-checked={category.is_active === 1}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      category.is_active === 1
                        ? 'bg-green-500'
                        : isDark
                        ? 'bg-gray-700'
                        : 'bg-gray-300'
                    }`}
                    title={
                      category.is_active === 1
                        ? 'Deactivate category'
                        : 'Activate category'
                    }
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        category.is_active === 1
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {category.category_image ? (
                    <img
                      src={category.category_image}
                      alt={category.category_name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          '/placeholder-image.jpg';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      <Package size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-2xl font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {category.category_name}
                  </h3>
                  <p className={`mt-1 text-sm ${textClass}`}>
                    {category.description || 'No description provided'}
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className={`text-xs ${textClass}`}>Category ID</p>
                      <p
                        className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {category.category_id}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${textClass}`}>Total Products</p>
                      <p
                        className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {category.total_products ?? products.length}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${textClass}`}>Created At</p>
                      <p
                        className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {new Date(category.created_at).toLocaleDateString(
                          'en-IN',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <span className={textClass}>Store:</span>{' '}
                    <span
                      className={`font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {category.store_name || '—'}
                    </span>
                    {category.branch_name && (
                      <>
                        <span className={`mx-2 ${textClass}`}>•</span>
                        <span className={textClass}>Branch:</span>{' '}
                        <span
                          className={`font-medium ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {category.branch_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4
                  className={`text-lg font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Products in this Category
                </h4>
                <button
                  onClick={() =>
                    router.push(`/products/new?category_id=${category.category_id}`)
                  }
                  className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Add Product
                </button>
              </div>

              {productsLoading ? (
                <div className="p-6 text-center">Loading products...</div>
              ) : products.length === 0 ? (
                <div className={`${cardClass} border rounded-xl p-6 text-center`}>
                  <p className={textClass}>No products in this category.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.product_id}
                      className={`border rounded-lg transition ${
                        product.is_active === 1
                          ? isDark
                            ? 'border-gray-700 bg-gray-800/30'
                            : 'border-gray-200 bg-white'
                          : isDark
                          ? 'border-gray-800 bg-gray-900/40 opacity-70'
                          : 'border-gray-200 bg-gray-100 opacity-70'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={product.product_image}
                                alt={product.product_name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    '/placeholder-image.jpg';
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Package
                                  size={18}
                                  className={
                                    isDark ? 'text-green-400' : 'text-green-600'
                                  }
                                />
                                <h3
                                  className={`text-lg font-semibold ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  {product.product_name}
                                </h3>
                                {product.is_bestseller == 1 && (
                                  <span
                                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                      isDark
                                        ? 'bg-yellow-900/40 text-yellow-300'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    ⭐ Bestseller
                                  </span>
                                )}
                                {product.is_vegetarian === 1 && (
                                  <span
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      isDark
                                        ? 'bg-green-900/40 border-green-700'
                                        : 'bg-green-100 border-green-500'
                                    }`}
                                  >
                                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${textClass} mb-1`}>
                                Serves {product.serves_count || 1}
                              </p>
                              <p className={`text-sm ${textClass}`}>
                                {(product.product_description || 'No description')
                                  .toString()
                                  .slice(0, 120)}
                                {(product.product_description || '').length > 120
                                  ? '...'
                                  : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p
                                  className={`text-lg font-semibold ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  ₹
                                  {parseFloat(
                                    product.base_price?.toString() || '0'
                                  ).toFixed(2)}
                                  {product.uom_name ? ` / ${product.uom_name}` : ''}
                                </p>
                                <p className={`text-sm ${textClass}`}>
                                  {product.total_stock ?? 0} in stock •{' '}
                                  {product.total_sold ?? 0} sold
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/products/${product.product_id}`
                                  )
                                }
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                  isDark
                                    ? 'text-blue-400 hover:bg-blue-900/40'
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                              >
                                View
                              </button>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/products/${product.product_id}/edit`
                                  )
                                }
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                  isDark
                                    ? 'text-indigo-400 hover:bg-indigo-900/40'
                                    : 'text-indigo-600 hover:bg-indigo-50'
                                }`}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleProductActive(
                                    product.product_id,
                                    product.is_active ?? 0
                                  )
                                }
                                role="switch"
                                aria-checked={product.is_active === 1}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  product.is_active === 1
                                    ? 'bg-green-500'
                                    : isDark
                                    ? 'bg-gray-700'
                                    : 'bg-gray-300'
                                }`}
                                title={
                                  product.is_active === 1
                                    ? 'Deactivate product'
                                    : 'Activate product'
                                }
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    product.is_active === 1
                                      ? 'translate-x-6'
                                      : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Category not found</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
