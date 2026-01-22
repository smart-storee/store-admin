"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { Product, ApiResponse, Branch } from "@/types";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Package, Plus, RefreshCw, Search } from "lucide-react";

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-gray-900" : "bg-gray-50";
  const cardClass = isDark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const textClass = isDark ? "text-gray-300" : "text-gray-600";

  const filteredProducts = products
    .filter((product) => {
      if (statusFilter === "all") return true;
      return statusFilter === "active"
        ? product.is_active === 1
        : product.is_active === 0;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.product_name.localeCompare(b.product_name);
      }
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return sortBy === "oldest" ? aDate - bDate : bDate - aDate;
    });

  // Fetch branches for the user's assigned store
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response: ApiResponse<{ data: Branch[] }> =
          await makeAuthenticatedRequest(
            `/branches?store_id=${user?.store_id}`
          );
        if (response.success) {
          const branchesData = Array.isArray(response.data)
            ? response.data
            : response.data?.data || [];
          setBranches(branchesData);
          setSelectedBranch(null); // Reset branch selection when store changes
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };

    if (user?.store_id) {
      fetchBranches();
    }
  }, [user]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, selectedBranch, user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
      });

      // Add store_id and branch_id based on user context
      if (user?.store_id) {
        // For all users, use their store_id from user context
        params.append("store_id", user.store_id.toString());
      }

      // Add branch_id if selected
      if (selectedBranch) {
        params.append("branch_id", selectedBranch.toString());
      }

      console.log("Fetching products with params:", params.toString());

      const response = await makeAuthenticatedRequest(
        `/products?${params.toString()}`
      );
      console.log("API Response:", response); // Debug log

      if (response?.success) {
        // Handle both array and object response formats
        const responseData = response.data || {};
        const productsData = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];

        const pagination = responseData.pagination ||
          response.pagination || {
            total: productsData.length,
            total_pages: 1,
            current_page: currentPage,
            limit: 10,
          };

        setProducts(productsData);
        // setPagination(pagination);
      } else {
        throw new Error(response?.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error in fetchProducts:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching products"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranch(e.target.value ? Number(e.target.value) : null);
    setCurrentPage(1);
  };

  const handleToggleActive = async (
    productId: number,
    currentStatus: number
  ) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this product?`)) return;

    try {
      setProducts((prev) =>
        prev.map((product) =>
          product.product_id === productId
            ? { ...product, is_active: newStatus }
            : product
        )
      );
      const response = await makeAuthenticatedRequest(
        `/products/${productId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_active: newStatus,
            store_id: user?.store_id,
          }),
        },
        true,
        user?.store_id
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
      console.error(`Toggle product active error:`, err);
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


  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <FeatureGuard feature="products_enabled">
      <RoleGuard
        requiredPermissions={["manage_products"]}
        fallback={
          <div className="p-6 text-center">
            <div
              className={`border rounded-lg px-4 py-3 mb-4 ${
                theme === "dark"
                  ? "bg-red-900/30 border-red-700/50 text-red-300"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              Access denied. You do not have permission to manage products.
            </div>
          </div>
        }
      >
        <div className={`min-h-screen ${bgClass} py-1`}>
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1
                  className={`text-3xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  } mb-2`}
                >
                  Products
                </h1>
                <p className={textClass}>
                  Manage product details, pricing, availability, and status.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    setRefreshing(true);
                    await fetchProducts();
                    setRefreshing(false);
                  }}
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

            <div className={`${cardClass} border rounded-xl shadow-sm p-6 mt-6`}>
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
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
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
                      onChange={handleBranchChange}
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
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <div className="lg:col-span-2 flex items-end">
                  <button
                    onClick={() => (window.location.href = "/products/new")}
                    className="w-full px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
                  >
                    <Plus size={20} />
                    Add Product
                  </button>
                </div>
              </div>
              <div
                className={`text-sm mt-4 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>
          </div>

          {error && (
            <div
              className={`border px-4 py-3 rounded mb-4 ${
                theme === "dark"
                  ? "bg-red-900/30 border-red-700/50 text-red-300"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          <div className={`${cardClass} border rounded-xl shadow-sm p-6`}>
            {loading ? (
              <div className="p-6 text-center">Loading products...</div>
            ) : (
              <>
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.product_id}
                      product={product}
                      onView={() =>
                        (window.location.href = `/products/${product.product_id}?returnTo=${encodeURIComponent("/products")}`)
                      }
                      onEdit={() =>
                        (window.location.href = `/products/${product.product_id}/edit`)
                      }
                      onToggleActive={() =>
                        handleToggleActive(
                          product.product_id,
                          product.is_active
                        )
                      }
                      theme={isDark}
                    />
                  ))}
                </div>

                {products.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <p
                      className={
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }
                    >
                      No products found
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className={`px-4 py-3 flex items-center justify-between border-t ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    } sm:px-6`}
                  >
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                          currentPage === 1
                            ? isDark
                              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : isDark
                            ? "bg-gray-700 text-white hover:bg-gray-600"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                          currentPage === totalPages
                            ? isDark
                              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : isDark
                            ? "bg-gray-700 text-white hover:bg-gray-600"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p
                          className={`text-sm ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Showing page{" "}
                          <span className="font-medium">{currentPage}</span> of{" "}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                              currentPage === 1
                                ? isDark
                                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : isDark
                                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                                : "bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            &larr;
                          </button>

                          {/* Page numbers */}
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? isDark
                                    ? "z-10 bg-indigo-600 border-indigo-600 text-white"
                                    : "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                  : isDark
                                  ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                              currentPage === totalPages
                                ? isDark
                                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : isDark
                                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                                : "bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            &rarr;
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
};

function ProductCard({
  product,
  onView,
  onEdit,
  onToggleActive,
  theme,
}: {
  product: Product;
  onView: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  theme: boolean;
}) {
  const isDark = theme;
  const description = product.product_description || "No description";
  const descriptionPreview =
    description.length > 120 ? `${description.slice(0, 120)}...` : description;

  return (
    <div
      className={`border rounded-lg transition ${
        product.is_active === 1
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
          <div className="flex items-start gap-4 flex-1 py-1">
            <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={product.product_image}
                alt={product.product_name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/placeholder-image.jpg";
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Package
                  size={18}
                  className={isDark ? "text-green-400" : "text-green-600"}
                />
                <h3
                  className={`text-lg font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {product.product_name}
                </h3>
                {product.is_bestseller == 1 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isDark
                        ? "bg-yellow-900/40 text-yellow-300"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    ⭐ Bestseller
                  </span>
                )}
                {product.is_vegetarian === 1 && (
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isDark
                        ? "bg-green-900/40 border-green-700"
                        : "bg-green-100 border-green-500"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                  </span>
                )}
              </div>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                } mb-1`}
              >
                {product.category_name || "Uncategorized"} • Serves{" "}
                {product.serves_count || 1}
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {descriptionPreview}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p
                  className={`text-lg font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  ₹{parseFloat(product.base_price?.toString() || "0").toFixed(2)}
                </p>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {product.total_stock ?? 0} in stock • {product.total_sold ?? 0}{" "}
                  sold
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onView}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  isDark
                    ? "text-blue-400 hover:bg-blue-900/40"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                View
              </button>
              <button
                onClick={onEdit}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  isDark
                    ? "text-indigo-400 hover:bg-indigo-900/40"
                    : "text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onToggleActive}
                role="switch"
                aria-checked={product.is_active === 1}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  product.is_active === 1
                    ? "bg-green-500"
                    : isDark
                    ? "bg-gray-700"
                    : "bg-gray-300"
                }`}
                title={
                  product.is_active === 1
                    ? "Deactivate product"
                    : "Activate product"
                }
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    product.is_active === 1 ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
