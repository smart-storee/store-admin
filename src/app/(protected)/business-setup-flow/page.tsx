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
  Plus,
  RefreshCw,
  Search,
  Folder,
  Package,
  Layers,
  Building2,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);

  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-gray-900" : "bg-gray-50";
  const cardClass = isDark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const textClass = isDark ? "text-gray-300" : "text-gray-600";
  const headingClass = isDark ? "text-white" : "text-gray-900";

  const filteredCategories = categories
    .filter((category) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        category.category_name?.toLowerCase().includes(term) ||
        category.description?.toLowerCase().includes(term)
      );
    })
    .filter((category) => {
      if (statusFilter === "all") return true;
      return statusFilter === "active"
        ? category.is_active === 1
        : category.is_active === 0;
    })
    .filter((category) => {
      if (!selectedBranch) return true;
      if (category.branch_id === selectedBranch) return true;
      const branchIds = Array.isArray(category.branch_ids)
        ? category.branch_ids
        : [];
      if (branchIds.length === 0) {
        return true;
      }
      return branchIds.includes(selectedBranch);
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.category_name.localeCompare(b.category_name);
      }
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return sortBy === "oldest" ? aDate - bDate : bDate - aDate;
    });

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
              let branchIds: number[] = [];
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
                branchIds = allCats
                  .filter(
                    (c: Category) => c.category_name === category.category_name
                  )
                  .map((c: Category) => c.branch_id)
                  .filter((id: number | undefined | null) =>
                    Number.isInteger(id)
                  ) as number[];
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
                branch_ids: branchIds.length
                  ? branchIds
                  : category.branch_id
                  ? [category.branch_id]
                  : branches.map((b) => b.branch_id),
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

  const handleToggleCategoryActive = async (
    categoryId: number,
    currentStatus: number,
    branchId?: number | null
  ) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this category?`)) return;

    setCategories((prev) =>
      prev.map((cat) =>
        cat.category_id === categoryId ? { ...cat, is_active: newStatus } : cat
      )
    );

    try {
      const response = await makeAuthenticatedRequest(
        `/categories/${categoryId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_active: newStatus,
            store_id: user?.store_id,
            branch_id: branchId ?? undefined,
          }),
        },
        true,
        user?.store_id,
        branchId ?? undefined
      );

      if (!response.success) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.category_id === categoryId
              ? { ...cat, is_active: currentStatus }
              : cat
          )
        );
        alert(response.message || `Failed to ${action} category`);
      }
    } catch (err: any) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.category_id === categoryId
            ? { ...cat, is_active: currentStatus }
            : cat
        )
      );
      alert(err.message || `Failed to ${action} category`);
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
                Product Categories
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
            </div>
          </div>

          {/* Search / Filter / Sort */}
          <div
            className={`rounded-xl border p-6 mb-6 shadow-sm ${
              isDark
                ? "bg-gray-800/50 border-gray-700/50"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-4">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Search
                </label>
                <div className="relative">
                  <Search
                    size={18}
                    className={`absolute left-3 top-3 ${
                      isDark ? "text-gray-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Search by category name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                      isDark
                        ? "bg-gray-800/80 border-gray-700/50 text-white placeholder-gray-500"
                        : "bg-gray-50 border-gray-200 text-gray-900"
                    }`}
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Branch
                </label>
                <div className="relative">
                  <select
                    value={selectedBranch || ""}
                    onChange={(e) =>
                      setSelectedBranch(
                        e.target.value ? parseInt(e.target.value, 10) : null
                      )
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-200 ${
                      isDark
                        ? "bg-gray-800/80 border-gray-700/50 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-900"
                    }`}
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                  <svg
                    className={`absolute right-3 top-3.5 pointer-events-none ${
                      isDark ? "text-gray-400" : "text-gray-400"
                    }`}
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Status
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as "all" | "active" | "inactive"
                      )
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-200 ${
                      isDark
                        ? "bg-gray-800/80 border-gray-700/50 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-900"
                    }`}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <svg
                    className="absolute right-3 top-3.5 pointer-events-none text-gray-400"
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as "newest" | "oldest" | "name"
                      )
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-200 ${
                      isDark
                        ? "bg-gray-800/80 border-gray-700/50 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-900"
                    }`}
                  >
                    <option value="newest">Date (Newest First)</option>
                    <option value="oldest">Date (Oldest First)</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                  <svg
                    className={`absolute right-3 top-3.5 pointer-events-none ${
                      isDark ? "text-gray-400" : "text-gray-400"
                    }`}
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <div className="lg:col-span-2 flex items-end">
                <button
                  onClick={() => router.push("/categories/new")}
                  className="w-full px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
                >
                  <Plus size={20} />
                  Add Category
                </button>
              </div>
            </div>

            <div
              className={`text-sm mt-4 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Showing {filteredCategories.length} of {categories.length}{" "}
              categories
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
          ) : filteredCategories.length === 0 ? (
            <div
              className={`rounded-lg border p-6 text-center ${
                isDark
                  ? "bg-gray-900/40 border-gray-700 text-gray-300"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              No categories match your search or filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category) => (
                <CategorySection
                  key={category.category_id}
                  category={category}
                  onEditCategory={() =>
                    router.push(`/categories/${category.category_id}/edit`)
                  }
                  onViewCategory={() =>
                    router.push(`/categories/${category.category_id}`)
                  }
                  onToggleCategoryActive={() =>
                    handleToggleCategoryActive(
                      category.category_id,
                      category.is_active ?? 0,
                      category.branch_id
                    )
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
  onEditCategory,
  onViewCategory,
  onToggleCategoryActive,
  theme,
}: {
  category: CategoryWithProducts;
  onEditCategory: () => void;
  onViewCategory: () => void;
  onToggleCategoryActive: () => void;
  theme: boolean;
}) {
  const isDark = theme;
  const products = category.products || [];

  return (
    <div
      className={`border rounded-lg transition ${
        category.is_active
          ? isDark
            ? "border-gray-700 bg-gray-800/30"
            : "border-gray-200 bg-white"
          : isDark
          ? "border-gray-800 bg-gray-900/40 opacity-70"
          : "border-gray-200 bg-gray-100 opacity-70"
      }`}
    >
      <div className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 text-left">
            <Folder
              size={22}
              className={isDark ? "text-blue-400" : "text-blue-600"}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3
                  className={`text-lg font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {category.category_name}
                </h3>
              </div>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {category.description || "No description"} • {products.length}{" "}
                product{products.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onViewCategory}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isDark
                  ? "text-blue-400 hover:bg-blue-900/40"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
              title="View Category"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={onEditCategory}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isDark
                  ? "text-indigo-400 hover:bg-indigo-900/40"
                  : "text-indigo-600 hover:bg-indigo-50"
              }`}
              title="Edit Category"
            >
              <Edit2 size={18} />
            </button>
            <button
              type="button"
              onClick={onToggleCategoryActive}
              role="switch"
              aria-checked={category.is_active === 1}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                category.is_active === 1
                  ? "bg-green-500"
                  : isDark
                  ? "bg-gray-700"
                  : "bg-gray-300"
              }`}
              title={
                category.is_active === 1
                  ? "Deactivate category"
                  : "Activate category"
              }
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    category.is_active === 1 ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
          </div>
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
