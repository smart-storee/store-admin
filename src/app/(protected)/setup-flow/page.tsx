'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useStore } from '@/contexts/StoreContext';
import { makeAuthenticatedRequest } from '@/utils/api';
import { Category, Product, ProductVariant, Branch } from '@/types';
import { RoleGuard } from '@/components/RoleGuard';
import { ChevronRight, Plus, RefreshCw } from 'lucide-react';

interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface CardProps {
  theme: string;
}

const STEPS: StepConfig[] = [
  {
    id: 1,
    title: 'Categories',
    description: 'Organize your products',
    icon: '📁'
  },
  {
    id: 2,
    title: 'Products',
    description: 'Add your items',
    icon: '📦'
  },
  {
    id: 3,
    title: 'Variants',
    description: 'Set sizes & options',
    icon: '🎨'
  }
];

export default function SetupFlowPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = isDark ? 'text-gray-300' : 'text-gray-600';
  const headingClass = isDark ? 'text-white' : 'text-gray-900';

  useEffect(() => {
    fetchAllData();
  }, [user?.store_id, selectedBranchFilter]);

  const fetchAllData = async () => {
    if (!user?.store_id) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch branches
      const branchesResponse = await makeAuthenticatedRequest(
        `/branches?store_id=${user.store_id}`,
        {},
        true,
        user.store_id,
        user?.branch_id
      );
      if (branchesResponse.success) {
        setBranches(branchesResponse.data.data || branchesResponse.data);
      }

      // Fetch all data in parallel
      await Promise.all([fetchCategories(), fetchProducts()]);
      await fetchVariants();
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Setup flow fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getParams = () => {
    const params = new URLSearchParams({
      store_id: user?.store_id.toString() || '1',
    });
    if (selectedBranchFilter) {
      params.append('branch_id', selectedBranchFilter.toString());
    }
    return params;
  };

  const fetchCategories = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `/categories?${getParams().toString()}`,
        {},
        true,
        user?.store_id,
        selectedBranchFilter || user?.branch_id
      );
      if (response.success) {
        setCategories(response.data.data || response.data);
      }
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `/products?${getParams().toString()}`,
        {},
        true,
        user?.store_id,
        selectedBranchFilter || user?.branch_id
      );
      if (response.success) {
        setProducts(response.data.data || response.data);
      }
    } catch (err) {
      console.error('Products fetch error:', err);
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `/products?${getParams().toString()}`,
        {},
        true,
        user?.store_id,
        selectedBranchFilter || user?.branch_id
      );

      if (response.success) {
        const productsData = response.data.data || response.data;
        let allVariants: ProductVariant[] = [];

        for (const product of productsData) {
          try {
            const variantResponse = await makeAuthenticatedRequest(
              `/products/${product.product_id}/variants`,
              {},
              true,
              user?.store_id,
              selectedBranchFilter || user?.branch_id
            );

            if (variantResponse.success) {
              const variantData = Array.isArray(variantResponse.data.data)
                ? variantResponse.data.data
                : (variantResponse.data.data || variantResponse.data || []);

              const variantsWithProductName = variantData.map((variant: any) => ({
                ...variant,
                product_name: product.product_name,
                product_id: product.product_id
              }));

              allVariants = [...allVariants, ...variantsWithProductName];
            }
          } catch (err) {
            console.error(`Failed to load variants for product ${product.product_id}:`, err);
          }
        }
        setVariants(allVariants);
      }
    } catch (err) {
      console.error('Variants fetch error:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className={`mt-4 font-medium ${textClass}`}>Loading setup...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard requiredPermissions={['manage_categories', 'manage_products']} fallback={
      <AccessDenied theme={isDark} />
    }>
      <div className={`min-h-screen ${bgClass} py-8 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${headingClass} mb-2`}>
              Business Setup
            </h1>
            <p className={textClass}>
              Complete your setup in three simple steps to get started.
            </p>
          </div>

          {/* Branch Filter */}
          {branches.length > 0 && (
            <div className="mb-6 flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <label className={`block text-sm font-medium ${headingClass} mb-2`}>
                  Filter by Branch
                </label>
                <select
                  value={selectedBranchFilter || ''}
                  onChange={(e) => setSelectedBranchFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  refreshing
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-lg border ${
              isDark
                ? 'bg-red-900/20 border-red-700/50 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* Progress Steps */}
          <ProgressSteps
            steps={STEPS}
            currentStep={currentStep}
            counts={{ categories: categories.length, products: products.length, variants: variants.length }}
            onStepClick={setCurrentStep}
            theme={isDark ? 'dark' : 'light'}
          />

          {/* Main Content */}
          <div className={`${cardClass} border rounded-xl shadow-sm mt-8 p-6 sm:p-8`}>
            {currentStep === 1 && (
              <StepContent
                title="Categories"
                description="Organize your products into categories for better management"
                items={categories}
                isEmpty={categories.length === 0}
                onAdd={() => router.push('/categories/new')}
                onView={(item: Category) => router.push(`/categories/${item.category_id}`)}
                renderItem={(category: Category) => (
                  <CategoryCard category={category} theme={isDark} onView={() => router.push(`/categories/${category.category_id}`)} />
                )}
                theme={isDark ? 'dark' : 'light'}
              />
            )}

            {currentStep === 2 && (
              <StepContent
                title="Products"
                description="Add products and set their prices and stock levels"
                items={products}
                isEmpty={products.length === 0}
                onAdd={() => router.push('/products/new')}
                renderItem={(product: Product) => (
                  <ProductCard
                    product={product}
                    theme={isDark}
                    onView={() => router.push(`/products/${product.product_id}`)}
                    onEdit={() => router.push(`/products/${product.product_id}/edit`)}
                  />
                )}
                theme={isDark ? 'dark' : 'light'}
              />
            )}

            {currentStep === 3 && (
              <StepContent
                title="Product Variants"
                description="Create variants like size, color, or other product options"
                items={variants}
                isEmpty={variants.length === 0}
                onAdd={() => products.length > 0 ? router.push('/product-variants/new') : null}
                renderItem={(variant: ProductVariant) => (
                  <VariantRow variant={variant} theme={isDark ? 'dark' : 'light'} onView={() => router.push(`/products/${variant.product_id}`)} />
                )}
                isTable={true}
                theme={isDark ? 'dark' : 'light'}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between gap-4">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                Refresh Data
              </button>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

// Sub-components

interface ProgressCounts {
  categories: number;
  products: number;
  variants: number;
}

function ProgressSteps({ steps, currentStep, counts, onStepClick, theme }: {
  steps: StepConfig[];
  currentStep: number;
  counts: ProgressCounts;
  onStepClick: (stepId: number) => void;
  theme: string
}) {
  const isDark = theme === 'dark';
  return (
    <div className={`grid grid-cols-3 gap-4`}>
      {steps.map((step: StepConfig) => (
        <button
          key={step.id}
          onClick={() => onStepClick(step.id)}
          className={`p-4 rounded-xl border-2 transition-all text-center ${
            currentStep === step.id
              ? isDark
                ? 'border-indigo-500 bg-indigo-900/30'
                : 'border-indigo-500 bg-indigo-50'
              : currentStep > step.id
              ? isDark
                ? 'border-green-500/50 bg-green-900/20'
                : 'border-green-200 bg-green-50'
              : isDark
              ? 'border-gray-700 bg-gray-800'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="text-2xl mb-2">{step.icon}</div>
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {step.title}
          </h3>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {step.description}
          </p>
          <div className={`mt-3 text-sm font-bold ${
            currentStep === step.id
              ? 'text-indigo-600'
              : isDark
              ? 'text-gray-400'
              : 'text-gray-500'
          }`}>
            {step.id === 1 ? counts.categories :
             step.id === 2 ? counts.products :
             step.id === 3 ? counts.variants : 0}
          </div>
        </button>
      ))}
    </div>
  );
}

function StepContent<T extends Category | Product | ProductVariant, K = T>({ title, description, items, isEmpty, onAdd, onView, renderItem, isTable, theme }: {
  title: string;
  description: string;
  items: T[];
  isEmpty: boolean;
  onAdd: () => void;
  onView?: (item: K) => void;
  renderItem: (item: T) => ReactNode;
  isTable?: boolean;
  theme: string;
}) {
  const isDark = theme === 'dark';
  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
            {title}
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {description}
          </p>
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {isEmpty ? (
        <EmptyState theme={isDark} onAdd={onAdd} />
      ) : isTable ? (
        <VariantsTable items={items as ProductVariant[]} theme={isDark ? 'dark' : 'light'} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: T) => {
            // Use type assertion to access the appropriate ID property
            const key = (item as any).category_id || (item as any).product_id || (item as any).variant_id || 0;
            return (
              <div key={key}>
                {renderItem(item)}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function CategoryCard({ category, theme, onView }: any) {
  const isDark = theme;
  return (
    <div className={`border rounded-lg p-4 ${isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {category.category_name}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          category.is_active
            ? isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'
            : isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800'
        }`}>
          {category.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
        {category.description || 'No description'}
      </p>
      <div className="flex justify-between items-center pt-3 border-t" style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
        <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {category.total_products || 0} products
        </span>
        <button onClick={onView} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          View →
        </button>
      </div>
    </div>
  );
}

function ProductCard({ product, theme, onView, onEdit }: any) {
  const isDark = theme;
  return (
    <div className={`border rounded-lg overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className={`h-40 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center overflow-hidden`}>
        {product.product_image ? (
          <img
            src={product.product_image}
            alt={product.product_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No Image</span>
        )}
      </div>
      <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-start mb-1">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {product.product_name}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            product.is_active === 1
              ? isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'
              : isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800'
          }`}>
            {product.is_active === 1 ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
          {product.category_name}
        </p>
        <div className="flex justify-between items-center mb-3 pt-3" style={{borderTop: isDark ? '1px solid #374151' : '1px solid #e5e7eb'}}>
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ₹{product.base_price}
          </span>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {product.total_stock} in stock
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={onView} className="flex-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            View
          </button>
          <button onClick={onEdit} className="flex-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function VariantsTable({ items, theme }: {
  items: ProductVariant[];
  theme: string;
}) {
  const isDark = theme === 'dark';
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm`}>
        <thead>
          <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
            <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              Variant
            </th>
            <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              Product
            </th>
            <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              Price
            </th>
            <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              Stock
            </th>
            <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((variant: ProductVariant) => (
            <VariantRow key={variant.variant_id} variant={variant} theme={isDark ? 'dark' : 'light'} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VariantRow({ variant, theme, onView }: {
  variant: ProductVariant;
  theme: string;
  onView?: () => void;
}) {
  const isDark = theme === 'dark';
  return (
    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {variant.variant_name}
      </td>
      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {variant.product_name}
      </td>
      <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        ₹{variant.variant_price}
      </td>
      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {variant.stock}
      </td>
      <td className={`px-4 py-3`}>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          variant.is_active === 1
            ? isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'
            : isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800'
        }`}>
          {variant.is_active === 1 ? 'Active' : 'Inactive'}
        </span>
      </td>
    </tr>
  );
}

function EmptyState({ theme, onAdd }: any) {
  const isDark = theme;
  return (
    <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
      <div className="text-4xl mb-3">📭</div>
      <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'} mb-1`}>
        Nothing here yet
      </h3>
      <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Get started by adding your first item
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
      >
        <Plus size={18} />
        Add Now
      </button>
    </div>
  );
}

function AccessDenied({ theme }: any) {
  const isDark = theme;
  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <div className={`p-4 rounded-lg border ${
        isDark
          ? 'bg-red-900/20 border-red-700/50 text-red-300'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        Access denied. You do not have permission to access the setup flow.
      </div>
    </div>
  );
}