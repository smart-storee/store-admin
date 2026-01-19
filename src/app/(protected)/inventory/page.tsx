"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import {
  InventoryItem,
  ApiResponse,
  Category,
  Product,
  Branch,
  InventoryStatistics,
} from "@/types";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Edit,
  Save,
  X,
  Download,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  BarChart3,
} from "lucide-react";

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk update
  const [editingItems, setEditingItems] = useState<Map<number, number>>(
    new Map()
  );
  const [bulkUpdates, setBulkUpdates] = useState<Map<number, number>>(
    new Map()
  );
  const [updating, setUpdating] = useState(false);

  // Fetch branches
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
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };

    if (user?.store_id) {
      fetchBranches();
    }
  }, [user]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response: ApiResponse<{ data: Category[] }> =
          await makeAuthenticatedRequest(
            `/categories?store_id=${user?.store_id}`
          );
        if (response.success) {
          const categoriesData = Array.isArray(response.data)
            ? response.data
            : response.data?.data || [];
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    if (user?.store_id) {
      fetchCategories();
    }
  }, [user]);

  // Fetch products when category changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedCategory) {
        setProducts([]);
        setSelectedProduct(null);
        return;
      }

      try {
        const params = new URLSearchParams({
          store_id: user?.store_id?.toString() || "",
          category_id: selectedCategory.toString(),
          limit: "100", // Maximum allowed limit
        });

        const response = await makeAuthenticatedRequest(
          `/products?${params.toString()}`
        );

        if (response?.success) {
          const responseData = response.data || {};
          const productsData = Array.isArray(responseData)
            ? responseData
            : responseData.data || [];
          setProducts(productsData);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    if (user?.store_id && selectedCategory) {
      fetchProducts();
    }
  }, [selectedCategory, user]);

  // Fetch inventory
  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, [
    currentPage,
    selectedBranch,
    selectedCategory,
    selectedProduct,
    selectedVariant,
    lowStockOnly,
    outOfStockOnly,
    lowStockThreshold,
    searchTerm,
    user,
  ]);

  // Update filtered inventory when currentPage, searchTerm, or filters change
  useEffect(() => {
    if (inventory.length > 0) {
      // Apply search filtering again when page changes (in case search term changed)
      let filteredData = [...inventory];

      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredData = filteredData.filter(item =>
          item.product_name.toLowerCase().includes(lowerSearchTerm) ||
          item.variant_name.toLowerCase().includes(lowerSearchTerm) ||
          (item.category_name && item.category_name.toLowerCase().includes(lowerSearchTerm)) ||
          (item.branch_name && item.branch_name.toLowerCase().includes(lowerSearchTerm))
        );
      }

      // Apply pagination to the filtered data
      const startIndex = (currentPage - 1) * 50;
      const endIndex = startIndex + 50;
      const paginatedInventory = filteredData.slice(startIndex, endIndex);
      setFilteredInventory(paginatedInventory);

      // Update total counts based on current filtered data
      setTotalCount(filteredData.length);
      setTotalPages(Math.ceil(filteredData.length / 50));
    }
  }, [currentPage, inventory, searchTerm, selectedBranch, selectedCategory, selectedProduct, selectedVariant, lowStockOnly, outOfStockOnly, lowStockThreshold]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all inventory items to allow client-side filtering
      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
        page: "1",  // Fetch all items
        limit: "100", // Maximum allowed limit
        low_stock_threshold: lowStockThreshold.toString(),
      });

      if (selectedBranch) {
        params.append("branch_id", selectedBranch.toString());
      }
      if (selectedCategory) {
        params.append("category_id", selectedCategory.toString());
      }
      if (selectedProduct) {
        params.append("product_id", selectedProduct.toString());
      }
      if (selectedVariant) {
        params.append("variant_id", selectedVariant.toString());
      }
      if (lowStockOnly) {
        params.append("low_stock_only", "true");
      }
      if (outOfStockOnly) {
        params.append("out_of_stock_only", "true");
      }

      const response: any = await makeAuthenticatedRequest(
        `/inventory?${params.toString()}`
      );

      console.log("Inventory API Response:", response);

      if (response.success) {
        // API returns: { success: true, data: [...], pagination: {...} }
        const inventoryData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        console.log("Parsed Inventory Data:", inventoryData);

        // Store all inventory data (before filtering)
        setInventory(inventoryData);

        // Update total counts based on unfiltered data
        setTotalCount(inventoryData.length);
        setTotalPages(Math.ceil(inventoryData.length / 50));

        // The actual filtering and pagination will be handled by the useEffect
      } else {
        throw new Error(response.message || "Failed to fetch inventory");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load inventory");
      console.error("Load inventory error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
      });

      if (selectedBranch) {
        params.append("branch_id", selectedBranch.toString());
      }

      const response: any = await makeAuthenticatedRequest(
        `/inventory/statistics?${params.toString()}`
      );

      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch statistics:", err);
    }
  };

  const handleStockEdit = (inventoryId: number, currentStock: number) => {
    const newEditing = new Map(editingItems);
    newEditing.set(inventoryId, currentStock);
    setEditingItems(newEditing);
  };

  const handleStockChange = (inventoryId: number, value: string) => {
    const stockValue = parseInt(value) || 0;
    const newEditing = new Map(editingItems);
    newEditing.set(inventoryId, stockValue);
    setEditingItems(newEditing);
  };

  const handleStockSave = async (item: InventoryItem) => {
    const newStock = editingItems.get(item.inventory_id);
    if (newStock === undefined || newStock === item.stock) {
      const newEditing = new Map(editingItems);
      newEditing.delete(item.inventory_id);
      setEditingItems(newEditing);
      return;
    }

    if (newStock < 0) {
      alert("Stock cannot be negative");
      return;
    }

    try {
      setUpdating(true);
      // CRITICAL: store_id should be in body, not query param (backend expects it in body)
      const response: any = await makeAuthenticatedRequest(
        `/inventory/${item.inventory_id}/stock`,
        {
          method: "PUT",
          body: JSON.stringify({
            stock: newStock,
            store_id: user?.store_id,
          }),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        await fetchInventory();
        await fetchStatistics();
        const newEditing = new Map(editingItems);
        newEditing.delete(item.inventory_id);
        setEditingItems(newEditing);
      } else {
        throw new Error(response.message || "Failed to update stock");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update stock");
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (bulkUpdates.size === 0) {
      alert("No changes to save");
      return;
    }

    const updates = Array.from(bulkUpdates.entries()).map(([id, stock]) => ({
      inventory_id: id,
      stock: stock,
    }));

    try {
      setUpdating(true);
      const response: any = await makeAuthenticatedRequest(
        `/inventory/bulk-update?store_id=${user?.store_id}`,
        {
          method: "POST",
          body: JSON.stringify({
            updates,
            store_id: user?.store_id,
          }),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        await fetchInventory();
        await fetchStatistics();
        setBulkUpdates(new Map());
        alert(`Successfully updated ${response.data.success_count} item(s)`);
      } else {
        throw new Error(response.message || "Failed to bulk update stock");
      }
    } catch (err: any) {
      alert(err.message || "Failed to bulk update stock");
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkStockChange = (inventoryId: number, value: string) => {
    const stockValue = parseInt(value) || 0;
    const newBulk = new Map(bulkUpdates);
    const item = inventory.find((i) => i.inventory_id === inventoryId);
    if (item && stockValue === item.stock) {
      newBulk.delete(inventoryId);
    } else {
      newBulk.set(inventoryId, stockValue);
    }
    setBulkUpdates(newBulk);
  };

  const clearFilters = () => {
    setSelectedBranch(null);
    setSelectedCategory(null);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setLowStockOnly(false);
    setOutOfStockOnly(false);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "out_of_stock":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "low_stock":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "in_stock":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case "out_of_stock":
        return <XCircle className="h-4 w-4" />;
      case "low_stock":
        return <AlertTriangle className="h-4 w-4" />;
      case "in_stock":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <RoleGuard requiredPermissions={["view_reports"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  Inventory Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage stock levels, track inventory, and set up alerts
                </p>
              </div>
              <button
                onClick={() => {
                  fetchInventory();
                  fetchStatistics();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Items
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.total_items}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Stock
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.total_stock}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      In Stock
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {statistics.in_stock_count}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Low Stock
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {statistics.low_stock_count}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Out of Stock
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {statistics.out_of_stock_count}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Branch Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch
                </label>
                <select
                  value={selectedBranch || ""}
                  onChange={(e) =>
                    setSelectedBranch(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => {
                    setSelectedCategory(
                      e.target.value ? parseInt(e.target.value) : null
                    );
                    setSelectedProduct(null);
                    setSelectedVariant(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product
                </label>
                <select
                  value={selectedProduct || ""}
                  onChange={(e) => {
                    setSelectedProduct(
                      e.target.value ? parseInt(e.target.value) : null
                    );
                    setSelectedVariant(null);
                  }}
                  disabled={!selectedCategory}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">All Products</option>
                  {products.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) =>
                    setLowStockThreshold(parseInt(e.target.value) || 10)
                  }
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Alert Filters */}
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alerts
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lowStockOnly}
                      onChange={(e) => {
                        setLowStockOnly(e.target.checked);
                        if (e.target.checked) setOutOfStockOnly(false);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Low Stock
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={outOfStockOnly}
                      onChange={(e) => {
                        setOutOfStockOnly(e.target.checked);
                        if (e.target.checked) setLowStockOnly(false);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Out of Stock
                    </span>
                  </label>
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Bulk Update Actions */}
          {bulkUpdates.size > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                  {bulkUpdates.size} item(s) ready to update
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBulkUpdates(new Map())}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpdate}
                  disabled={updating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                >
                  {updating ? "Updating..." : "Save All Changes"}
                </button>
              </div>
            </div>
          )}

          {/* Inventory Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Loading inventory...
                </p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  No inventory items found
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  {selectedBranch || selectedCategory || selectedProduct
                    ? "Try adjusting your filters or clear them to see all items"
                    : "Inventory records are created automatically when you create product variants. If you have products but no inventory, check that your variants have been assigned to branches."}
                </p>
                {(selectedBranch ||
                  selectedCategory ||
                  selectedProduct ||
                  lowStockOnly ||
                  outOfStockOnly ||
                  searchTerm) && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Product / Variant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredInventory.map((item) => {
                        const isEditing = editingItems.has(item.inventory_id);
                        const editedStock = editingItems.get(item.inventory_id);
                        const bulkStock = bulkUpdates.get(item.inventory_id);
                        const displayStock =
                          bulkStock !== undefined
                            ? bulkStock
                            : isEditing
                            ? editedStock
                            : item.stock;

                        return (
                          <tr
                            key={item.inventory_id}
                            className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                              item.stock_status === "out_of_stock"
                                ? "bg-red-50/50 dark:bg-red-900/10"
                                : item.stock_status === "low_stock"
                                ? "bg-yellow-50/50 dark:bg-yellow-900/10"
                                : ""
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.product_name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {item.variant_name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {item.category_name || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {item.branch_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(
                                  item.stock_status
                                )}`}
                              >
                                {getStockStatusIcon(item.stock_status)}
                                {item.stock_status
                                  .replace("_", " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editedStock}
                                  onChange={(e) =>
                                    handleStockChange(
                                      item.inventory_id,
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                  className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={displayStock}
                                    onChange={(e) =>
                                      handleBulkStockChange(
                                        item.inventory_id,
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    className={`w-24 px-2 py-1 border rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
                                      bulkStock !== undefined
                                        ? "border-indigo-500 dark:border-indigo-400"
                                        : "border-gray-300 dark:border-gray-600"
                                    }`}
                                  />
                                  {bulkStock !== undefined && (
                                    <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                      (changed)
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleStockSave(item)}
                                    disabled={updating}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newEditing = new Map(editingItems);
                                      newEditing.delete(item.inventory_id);
                                      setEditingItems(newEditing);
                                    }}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleStockEdit(
                                      item.inventory_id,
                                      item.stock
                                    )
                                  }
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 dark:bg-slate-700 px-6 py-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {filteredInventory.length} of {totalCount} items
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
