"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { makeAuthenticatedRequest } from "@/utils/api";
import {
  Category,
  Product,
  ProductVariant,
  Branch,
  ApiResponse,
} from "@/types";
import { RoleGuard } from "@/components/RoleGuard";
import {
  ChevronRight,
  Plus,
  RefreshCw,
  Folder,
  Package,
  Layers,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Eye,
} from "lucide-react";

import { FeatureGuard } from "@/components/FeatureGuard";

interface CategoryWithProducts extends Category {
  products?: ProductWithVariants[];
}

interface ProductWithVariants extends Product {
  variants?: ProductVariant[];
  branchAssignments?: {
    branch_id: number;
    branch_name: string;
    is_available: number;
  }[];
}

export default function SetupFlowPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-gray-900" : "bg-gray-50";
  const cardClass = isDark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const textClass = isDark ? "text-gray-300" : "text-gray-600";
  const headingClass = isDark ? "text-white" : "text-gray-900";

  useEffect(() => {
    fetchAllData();
  }, [user?.store_id]);

  const fetchAllData = async () => {
    if (!user?.store_id) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch branches
      const branchesResponse: ApiResponse<{ data: Branch[] }> =
        await makeAuthenticatedRequest(
          `/branches?store_id=${user.store_id}`,
          {},
          true,
          user.store_id,
          user?.branch_id
        );
      if (branchesResponse.success) {
        setBranches(branchesResponse.data.data || branchesResponse.data || []);
      }

      // Fetch categories (now returns unique master categories)
      const categoriesResponse: ApiResponse<{ data: Category[] }> =
        await makeAuthenticatedRequest(
          `/categories?store_id=${user.store_id}`,
          {},
          true,
          user.store_id,
          user?.branch_id
        );

      if (categoriesResponse.success) {
        const categoriesData =
          categoriesResponse.data.data || categoriesResponse.data || [];

        // Remove duplicates by category_name (in case API still returns some)
        const uniqueCategories = Array.from(
          new Map(
            categoriesData.map((cat: Category) => [cat.category_name, cat])
          ).values()
        );

        // Fetch products for each unique category
        const categoriesWithProducts = await Promise.all(
          uniqueCategories.map(async (category: Category) => {
            try {
              // Fetch products by category name (since we have unique categories by name)
              // We need to get all category IDs with this name first, then fetch products
              const allCategoriesResponse: ApiResponse<{ data: Category[] }> =
                await makeAuthenticatedRequest(
                  `/categories?store_id=${user.store_id}`,
                  {},
                  true,
                  user.store_id,
                  user?.branch_id
                );

              // Get all category IDs with the same name
              let categoryIds: number[] = [];
              if (allCategoriesResponse.success) {
                const allCats =
                  allCategoriesResponse.data.data ||
                  allCategoriesResponse.data ||
                  [];
                categoryIds = allCats
                  .filter(
                    (c: Category) => c.category_name === category.category_name
                  )
                  .map((c: Category) => c.category_id);
              }

              // If no matching categories found, use the current category_id
              if (categoryIds.length === 0) {
                categoryIds = [category.category_id];
              }

              // Fetch products for all matching category IDs
              const productsPromises = categoryIds.map(
                async (catId: number) => {
                  const productsResponse: ApiResponse<{ data: Product[] }> =
                    await makeAuthenticatedRequest(
                      `/products?store_id=${user.store_id}&category_id=${catId}`,
                      {},
                      true,
                      user.store_id,
                      user?.branch_id
                    );
                  return productsResponse.success
                    ? productsResponse.data.data || productsResponse.data || []
                    : [];
                }
              );

              const productsArrays = await Promise.all(productsPromises);
              const allProductsData = productsArrays.flat();

              // Remove duplicate products by product_id
              const uniqueProductsMap = new Map();
              allProductsData.forEach((prod: Product) => {
                if (!uniqueProductsMap.has(prod.product_id)) {
                  uniqueProductsMap.set(prod.product_id, prod);
                }
              });
              const productsData = Array.from(uniqueProductsMap.values());

              let products: ProductWithVariants[] = [];
              if (productsData.length > 0) {
                // Fetch branch assignments and variants for each product
                products = await Promise.all(
                  productsData.map(async (product: Product) => {
                    try {
                      // Get branch assignments
                      const branchAssignments =
                        await getProductBranchAssignments(product.product_id);

                      // Get variants
                      const variantsResponse: ApiResponse<{
                        data: ProductVariant[];
                      }> = await makeAuthenticatedRequest(
                        `/products/${product.product_id}/variants`,
                        {},
                        true,
                        user.store_id,
                        user?.branch_id
                      );

                      const variants = variantsResponse.success
                        ? variantsResponse.data.data ||
                          variantsResponse.data ||
                          []
                        : [];

                      return {
                        ...product,
                        branchAssignments,
                        variants,
                      };
                    } catch (err) {
                      console.error(
                        `Error loading product ${product.product_id}:`,
                        err
                      );
                      return {
                        ...product,
                        branchAssignments: [],
                        variants: [],
                      };
                    }
                  })
                );
              }

              return {
                ...category,
                products,
              };
            } catch (err) {
              console.error(
                `Error loading products for category ${category.category_id}:`,
                err
              );
              return { ...category, products: [] };
            }
          })
        );

        setCategories(categoriesWithProducts);

        // Auto-expand first category
        if (categoriesWithProducts.length > 0) {
          setExpandedCategories(
            new Set([categoriesWithProducts[0].category_id])
          );
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
      console.error("Setup flow fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getProductBranchAssignments = async (productId: number) => {
    try {
      const response: ApiResponse<{
        data: {
          branch_id: number;
          branch_name: string;
          is_available: number;
        }[];
      }> = await makeAuthenticatedRequest(
        `/products/${productId}/branches?store_id=${user?.store_id}`,
        {},
        true,
        user?.store_id,
        user?.branch_id
      );

      if (response.success) {
        return response.data.data || response.data || [];
      }
      return branches.map((b) => ({
        branch_id: b.branch_id,
        branch_name: b.branch_name,
        is_available: 0,
      }));
    } catch {
      return branches.map((b) => ({
        branch_id: b.branch_id,
        branch_name: b.branch_name,
        is_available: 0,
      }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleToggleProductBranch = async (
    productId: number,
    branchId: number,
    currentStatus: number
  ) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const response: ApiResponse<any> = await makeAuthenticatedRequest(
        `/products/${productId}/branches/${branchId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_available: newStatus,
            store_id: user?.store_id,
          }),
        },
        true,
        user?.store_id,
        user?.branch_id
      );

      if (response.success) {
        // Update local state immediately for better UX
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            products: cat.products?.map((prod) =>
              prod.product_id === productId
                ? {
                    ...prod,
                    branchAssignments: prod.branchAssignments?.map((ba) =>
                      ba.branch_id === branchId
                        ? { ...ba, is_available: newStatus }
                        : ba
                    ),
                  }
                : prod
            ),
          }))
        );
      } else {
        throw new Error(
          response.message || "Failed to update branch assignment"
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to update branch assignment");
      console.error("Toggle product branch error:", err);
      // Refresh data on error to ensure consistency
      await fetchAllData();
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bgClass}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className={`mt-4 font-medium ${textClass}`}>
            Loading your products...
          </p>
        </div>
      </div>
    );
  }

  return (
    // <FeatureGuard
    // feature="categories_enabled"
    //   fallback={
    //     <div className="p-6 text-center">
    //       <div
    //         className={`border rounded-lg p-4 ${
    //           isDark
    //             ? "bg-yellow-900/30 border-yellow-700/50 text-yellow-300"
    //             : "bg-yellow-100 border-yellow-400 text-yellow-700"
    //         }`}
    //       >
    //         Categories feature is disabled for this store. Please contact
    //         support to enable it.
    //       </div>
    //     </div>
    //   }
    // >
    <RoleGuard
      requiredPermissions={["manage_categories", "manage_products"]}
      fallback={<AccessDenied theme={isDark} />}
    >
      <div className={`min-h-screen ${bgClass} py-1`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-3xl font-bold ${headingClass} mb-2`}>
                My Products
              </h1>
              <p className={textClass}>
                Manage your products, categories, and variants with branch-wise
                assignment
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  refreshing
                    ? "opacity-50 cursor-not-allowed"
                    : isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                <RefreshCw
                  size={18}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
              <button
                onClick={() => router.push("/categories/new")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Add Category
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              icon={<Folder size={24} />}
              label="Master Categories"
              value={categories.length}
              color="blue"
              theme={isDark}
            />
            <SummaryCard
              icon={<Package size={24} />}
              label="Total Products"
              value={categories.reduce(
                (sum, cat) => sum + (cat.products?.length || 0),
                0
              )}
              color="green"
              theme={isDark}
            />
            <SummaryCard
              icon={<Layers size={24} />}
              label="Total Variants"
              value={categories.reduce(
                (sum, cat) =>
                  sum +
                  (cat.products?.reduce(
                    (pSum, prod) => pSum + (prod.variants?.length || 0),
                    0
                  ) || 0),
                0
              )}
              color="purple"
              theme={isDark}
            />
            <SummaryCard
              icon={<Building2 size={24} />}
              label="Branches"
              value={branches.length}
              color="orange"
              theme={isDark}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              isDark
                ? "bg-red-900/20 border-red-700/50 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        {/* Main Content - Hierarchical View */}
        <div className={`${cardClass} border rounded-xl shadow-sm p-6`}>
          {categories.length === 0 ? (
            <EmptyState
              theme={isDark}
              onAdd={() => router.push("/categories/new")}
            />
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <CategorySection
                  key={category.category_id}
                  category={category}
                  branches={branches}
                  isExpanded={expandedCategories.has(category.category_id)}
                  onToggle={() => toggleCategory(category.category_id)}
                  onEditCategory={() =>
                    router.push(`/categories/${category.category_id}/edit`)
                  }
                  onToggleProductBranch={handleToggleProductBranch}
                  onAddProduct={() =>
                    router.push(
                      `/products/new?category_id=${category.category_id}`
                    )
                  }
                  onViewProduct={(productId) =>
                    router.push(`/products/${productId}`)
                  }
                  onEditProduct={(productId) =>
                    router.push(`/products/${productId}/edit`)
                  }
                  onAddVariant={(productId) =>
                    router.push(`/product-variants/new?product_id=${productId}`)
                  }
                  theme={isDark}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
    // </FeatureGuard>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  theme,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  color: "blue" | "green" | "purple" | "orange";
  theme: boolean;
}) {
  const isDark = theme;
  const colorClasses = {
    blue: isDark
      ? "bg-blue-900/30 border-blue-700/50"
      : "bg-blue-50 border-blue-200",
    green: isDark
      ? "bg-green-900/30 border-green-700/50"
      : "bg-green-50 border-green-200",
    purple: isDark
      ? "bg-purple-900/30 border-purple-700/50"
      : "bg-purple-50 border-purple-200",
    orange: isDark
      ? "bg-orange-900/30 border-orange-700/50"
      : "bg-orange-50 border-orange-200",
  };

  const iconColors = {
    blue: isDark ? "text-blue-400" : "text-blue-600",
    green: isDark ? "text-green-400" : "text-green-600",
    purple: isDark ? "text-purple-400" : "text-purple-600",
    orange: isDark ? "text-orange-400" : "text-orange-600",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {label}
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {value}
          </p>
        </div>
        <div className={iconColors[color]}>{icon}</div>
      </div>
    </div>
  );
}

function CategorySection({
  category,
  branches,
  isExpanded,
  onToggle,
  onEditCategory,
  onToggleProductBranch,
  onAddProduct,
  onViewProduct,
  onEditProduct,
  onAddVariant,
  theme,
}: {
  category: CategoryWithProducts;
  branches: Branch[];
  isExpanded: boolean;
  onToggle: () => void;
  onEditCategory: () => void;
  onToggleProductBranch: (
    productId: number,
    branchId: number,
    currentStatus: number
  ) => Promise<void>;
  onAddProduct: () => void;
  onViewProduct: (productId: number) => void;
  onEditProduct: (productId: number) => void;
  onAddVariant: (productId: number) => void;
  theme: boolean;
}) {
  const isDark = theme;
  const products = category.products || [];

  return (
    <div
      className={`border rounded-lg ${
        isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
      }`}
    >
      {/* Category Header */}
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className={`flex-1 px-6 py-4 flex items-center justify-between hover:bg-opacity-50 transition-colors ${
            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center gap-4 flex-1">
            <Folder
              size={24}
              className={isDark ? "text-blue-400" : "text-blue-600"}
            />
            <div className="text-left flex-1">
              <h3
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {category.category_name}
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {category.description || "No description"} • {products.length}{" "}
                product{products.length !== 1 ? "s" : ""}
              </p>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                category.is_active
                  ? isDark
                    ? "bg-green-900/40 text-green-300"
                    : "bg-green-100 text-green-800"
                  : isDark
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {category.is_active ? "● Active" : "● Inactive"}
            </span>
          </div>
          <ChevronRight
            size={20}
            className={`${
              isDark ? "text-gray-400" : "text-gray-600"
            } transition-transform ${isExpanded ? "rotate-90" : ""}`}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditCategory();
          }}
          className={`px-4 py-4 flex items-center transition-colors ${
            isDark
              ? "hover:bg-indigo-900/40 text-indigo-400"
              : "hover:bg-indigo-100 text-indigo-600"
          }`}
          title="Edit Category"
        >
          <Edit2 size={18} />
        </button>
      </div>

      {/* Products List */}
      {isExpanded && (
        <div
          className={`border-t ${
            isDark ? "border-gray-700" : "border-gray-200"
          } p-4`}
        >
          {products.length === 0 ? (
            <div className="text-center py-8">
              <p
                className={`${isDark ? "text-gray-400" : "text-gray-600"} mb-4`}
              >
                No products in this category
              </p>
              <button
                onClick={onAddProduct}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Add Product
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <ProductSection
                  key={product.product_id}
                  product={product}
                  branches={branches}
                  onToggleBranch={onToggleProductBranch}
                  onView={onViewProduct}
                  onEdit={onEditProduct}
                  onAddVariant={onAddVariant}
                  theme={isDark}
                />
              ))}
              <button
                onClick={onAddProduct}
                className={`w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  isDark
                    ? "border-gray-700 hover:border-indigo-600 hover:bg-indigo-900/20 text-gray-400 hover:text-indigo-400"
                    : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600"
                }`}
              >
                <Plus size={18} />
                Add Product to {category.category_name}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductSection({
  product,
  branches,
  onToggleBranch,
  onView,
  onEdit,
  onAddVariant,
  theme,
}: {
  product: ProductWithVariants;
  branches: Branch[];
  onToggleBranch: (
    productId: number,
    branchId: number,
    currentStatus: number
  ) => Promise<void>;
  onView: (productId: number) => void;
  onEdit: (productId: number) => void;
  onAddVariant: (productId: number) => void;
  theme: boolean;
}) {
  const isDark = theme;
  const variants = product.variants || [];
  const branchAssignments =
    product.branchAssignments ||
    branches.map((b) => ({
      branch_id: b.branch_id,
      branch_name: b.branch_name,
      is_available: 0,
    }));

  return (
    <div
      className={`border rounded-lg ${
        isDark ? "border-gray-700 bg-gray-800/30" : "border-gray-200 bg-white"
      }`}
    >
      <div className="p-4">
        {/* Product Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Package
                size={20}
                className={isDark ? "text-green-400" : "text-green-600"}
              />
              <h4
                className={`font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {product.product_name}
              </h4>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  product.is_active == 1
                    ? isDark
                      ? "bg-green-900/40 text-green-300"
                      : "bg-green-100 text-green-800"
                    : isDark
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {product.is_active == 1 ? "Active" : "Inactive"}
              </span>
            </div>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              } mb-2`}
            >
              {product.product_description || "No description"}
            </p>
            <p
              className={`text-sm font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Base Price: ₹
              {parseFloat(product.base_price?.toString() || "0").toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(product.product_id)}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-blue-900/40 text-blue-400"
                  : "hover:bg-blue-100 text-blue-600"
              }`}
              title="View"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => onEdit(product.product_id)}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-indigo-900/40 text-indigo-400"
                  : "hover:bg-indigo-100 text-indigo-600"
              }`}
              title="Edit"
            >
              <Edit2 size={18} />
            </button>
          </div>
        </div>

        {/* Branch Assignments */}
        <div className="mb-4">
          <p
            className={`text-xs font-medium mb-2 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Branch Availability:
          </p>
          <div className="flex flex-wrap gap-2">
            {branchAssignments.map((assignment) => {
              const isAvailable = assignment.is_available === 1;
              return (
                <button
                  key={assignment.branch_id}
                  onClick={() =>
                    onToggleBranch(
                      product.product_id,
                      assignment.branch_id,
                      assignment.is_available
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    isAvailable
                      ? isDark
                        ? "bg-green-900/40 text-green-300 hover:bg-green-900/60"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                      : isDark
                      ? "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {isAvailable ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  {assignment.branch_name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Variants */}
        <div
          className={`border-t ${
            isDark ? "border-gray-700" : "border-gray-200"
          } pt-4`}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              className={`text-xs font-medium ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Variants ({variants.length}):
            </p>
            <button
              onClick={() => onAddVariant(product.product_id)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                isDark
                  ? "text-indigo-400 hover:bg-indigo-900/40"
                  : "text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <Plus size={14} className="inline mr-1" />
              Add Variant
            </button>
          </div>
          {variants.length === 0 ? (
            <p
              className={`text-xs ${
                isDark ? "text-gray-500" : "text-gray-500"
              } italic`}
            >
              No variants yet
            </p>
          ) : (
            <div className="space-y-2">
              {variants.map((variant) => (
                <div
                  key={variant.variant_id}
                  className={`flex items-center justify-between p-2 rounded ${
                    isDark ? "bg-gray-700/30" : "bg-gray-50"
                  }`}
                >
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {variant.variant_name}
                    </p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      ₹
                      {parseFloat(
                        variant.variant_price?.toString() || "0"
                      ).toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      variant.is_active == 1
                        ? isDark
                          ? "bg-green-900/40 text-green-300"
                          : "bg-green-100 text-green-800"
                        : isDark
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {variant.is_active == 1 ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ theme, onAdd }: { theme: boolean; onAdd: () => void }) {
  const isDark = theme;
  return (
    <div
      className={`text-center py-12 rounded-lg ${
        isDark ? "bg-gray-700/30" : "bg-gray-50"
      }`}
    >
      <Folder
        size={48}
        className={`mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`}
      />
      <h3
        className={`text-lg font-medium ${
          isDark ? "text-gray-300" : "text-gray-900"
        } mb-1`}
      >
        No categories yet
      </h3>
      <p
        className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}
      >
        Start by creating your first master category
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
      >
        <Plus size={18} />
        Create Master Category
      </button>
    </div>
  );
}

function AccessDenied({ theme }: { theme: boolean }) {
  const isDark = theme;
  return (
    <div className={`p-6 ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <div
        className={`p-4 rounded-lg border ${
          isDark
            ? "bg-red-900/20 border-red-700/50 text-red-300"
            : "bg-red-50 border-red-200 text-red-700"
        }`}
      >
        Access denied. You do not have permission to access the setup flow.
      </div>
    </div>
  );
}
