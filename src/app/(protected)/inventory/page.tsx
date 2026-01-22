"use client";

import { useState, useEffect, useMemo } from "react";
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
  AlertTriangle,
  XCircle,
  CheckCircle,
  Edit,
  Save,
  X,
  RefreshCw,
  ChevronDown,
  Eye,
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
  const [sortBy, setSortBy] = useState<"name" | "stock_low" | "stock_high">(
    "name"
  );
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockCategoryKey, setSelectedStockCategoryKey] = useState<
    string | null
  >(null);
  const [modalCategoryOnly, setModalCategoryOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk update
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

      if (sortBy === "stock_low") {
        filteredData.sort((a, b) => a.stock - b.stock);
      } else if (sortBy === "stock_high") {
        filteredData.sort((a, b) => b.stock - a.stock);
      } else {
        filteredData.sort((a, b) =>
          a.product_name.localeCompare(b.product_name)
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
  }, [
    currentPage,
    inventory,
    searchTerm,
    selectedBranch,
    selectedCategory,
    selectedProduct,
    selectedVariant,
    lowStockOnly,
    outOfStockOnly,
    lowStockThreshold,
    sortBy,
  ]);

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

  const handleBulkUpdate = async (): Promise<boolean> => {
    if (bulkUpdates.size === 0) {
      alert("No changes to save");
      return false;
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
        return true;
      } else {
        throw new Error(response.message || "Failed to bulk update stock");
      }
    } catch (err: any) {
      alert(err.message || "Failed to bulk update stock");
      return false;
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

  const toggleCategoryExpanded = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleProductExpanded = (productId: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleToggleCategoryActive = async (
    categoryId: number,
    currentStatus: number
  ) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this category?`)) return;

    setCategories((prev) =>
      prev.map((category) =>
        category.category_id === categoryId
          ? { ...category, is_active: newStatus }
          : category
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
          }),
        },
        true,
        user?.store_id
      );

      if (!response.success) {
        setCategories((prev) =>
          prev.map((category) =>
            category.category_id === categoryId
              ? { ...category, is_active: currentStatus }
              : category
          )
        );
        alert(response.message || `Failed to ${action} category`);
      }
    } catch (err: any) {
      setCategories((prev) =>
        prev.map((category) =>
          category.category_id === categoryId
            ? { ...category, is_active: currentStatus }
            : category
        )
      );
      alert(err.message || `Failed to ${action} category`);
    }
  };

  const handleToggleProductActive = async (
    productId: number,
    currentStatus: number
  ) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this product?`)) return;

    setInventory((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, product_active: newStatus === 1 }
          : item
      )
    );
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
        setInventory((prev) =>
          prev.map((item) =>
            item.product_id === productId
              ? { ...item, product_active: currentStatus === 1 }
              : item
          )
        );
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
      setInventory((prev) =>
        prev.map((item) =>
          item.product_id === productId
            ? { ...item, product_active: currentStatus === 1 }
            : item
        )
      );
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

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

  const categoryGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        categoryId: number | null;
        categoryName: string;
        isActive: number;
        products: Map<
          number,
          {
            productId: number;
            productName: string;
            isActive: number;
            productImage?: string;
            variants: InventoryItem[];
          }
        >;
      }
    >();

    categories.forEach((category) => {
      const categoryKey = `id:${category.category_id}`;
      if (!groups.has(categoryKey)) {
        groups.set(categoryKey, {
          key: categoryKey,
          categoryId: category.category_id,
          categoryName: category.category_name,
          isActive: category.is_active ?? 1,
          products: new Map(),
        });
      }
    });

    filteredInventory.forEach((item) => {
      const categoryName = item.category_name || "Uncategorized";
      const categoryMeta = categories.find(
        (category) => category.category_name === categoryName
      );
      const categoryId = item.category_id || categoryMeta?.category_id || null;
      const categoryKey = categoryId
        ? `id:${categoryId}`
        : `name:${categoryName}`;

      if (!groups.has(categoryKey)) {
        groups.set(categoryKey, {
          key: categoryKey,
          categoryId,
          categoryName,
          isActive: categoryMeta?.is_active ?? 1,
          products: new Map(),
        });
      }

      const group = groups.get(categoryKey);
      if (!group) return;

      if (!group.products.has(item.product_id)) {
        group.products.set(item.product_id, {
          productId: item.product_id,
          productName: item.product_name,
          isActive: item.product_active ? 1 : 0,
          productImage: item.product_image,
          variants: [],
        });
      }

      const productGroup = group.products.get(item.product_id);
      if (productGroup) {
        productGroup.variants.push(item);
      }
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        products: Array.from(group.products.values()).sort((a, b) =>
          a.productName.localeCompare(b.productName)
        ),
      }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [filteredInventory, categories]);

  useEffect(() => {
    if (!showStockModal) return;
    if (categoryGroups.length === 0) return;
    if (!selectedStockCategoryKey) {
      setSelectedStockCategoryKey(categoryGroups[0].key);
    }
  }, [showStockModal, categoryGroups, selectedStockCategoryKey]);

  useEffect(() => {
    if (showStockModal) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
    return undefined;
  }, [showStockModal]);

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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-3 sm:p-4">
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch
                </label>
                <div className="relative">
                  <select
                    value={selectedBranch || ""}
                    onChange={(e) =>
                      setSelectedBranch(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </option>
                    ))}
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
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory || ""}
                    onChange={(e) => {
                      setSelectedCategory(
                        e.target.value ? parseInt(e.target.value) : null
                      );
                      setSelectedProduct(null);
                      setSelectedVariant(null);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none"
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
                  <svg
                    className="absolute right-3 top-3.5 pointer-events-none text-gray-400"
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={
                      lowStockOnly
                        ? "low_stock"
                        : outOfStockOnly
                        ? "out_of_stock"
                        : "all"
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setLowStockOnly(value === "low_stock");
                      setOutOfStockOnly(value === "out_of_stock");
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
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
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as "name" | "stock_low" | "stock_high"
                      )
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="stock_low">Stock (Low to High)</option>
                    <option value="stock_high">Stock (High to Low)</option>
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
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="lg:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setModalCategoryOnly(false);
                    setShowStockModal(true);
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    "border-blue-200/60 dark:border-blue-400/40 text-blue-700 dark:text-blue-200 bg-blue-50/70 dark:bg-blue-500/10 hover:bg-blue-100/70 dark:hover:bg-blue-500/20"
                  }`}
                >
                  Add Stocks
                </button>
              </div>

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
          <div className="rounded-lg overflow-hidden">
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
                <div className="space-y-4">
                  {categoryGroups.map((category) => {
                    const isExpanded = expandedCategories.has(category.key);
                    const categoryActive = category.isActive === 1;
                    const categoryToggleDisabled = !category.categoryId;
                    return (
                      <div
                        key={category.key}
                        className={`border rounded-lg transition ${
                          categoryActive
                            ? "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            : "border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-200">
                              {(() => {
                                const imageUrl = categories.find(
                                  (cat) =>
                                      cat.category_id === category.categoryId ||
                                      cat.category_name === category.categoryName
                                  )?.category_image;
                                  return imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={category.categoryName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    getInitials(category.categoryName || "C")
                                );
                              })()}
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Category
                              </p>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {category.categoryName}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {category.products.length} product
                                {category.products.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStockCategoryKey(category.key);
                                setModalCategoryOnly(true);
                                setShowStockModal(true);
                              }}
                              className="px-4 py-2 text-sm rounded-[24px] border border-emerald-200/60 dark:border-emerald-400/40 text-emerald-700 dark:text-emerald-200 bg-emerald-50/70 dark:bg-emerald-500/10 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/20 transition-colors"
                            >
                              Add Stocks
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpanded(category.key)}
                              className={`px-4 py-2 text-sm rounded-[24px] border transition-colors ${
                                isExpanded
                                  ? "border-rose-200/60 dark:border-rose-400/40 text-rose-700 dark:text-rose-200 bg-rose-50/70 dark:bg-rose-500/10 hover:bg-rose-100/70 dark:hover:bg-rose-500/20"
                                  : "border-blue-200/60 dark:border-blue-400/40 text-blue-700 dark:text-blue-200 bg-blue-50/70 dark:bg-blue-500/10 hover:bg-blue-100/70 dark:hover:bg-blue-500/20"
                              }`}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? "Close" : "View"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                category.categoryId &&
                                handleToggleCategoryActive(
                                  category.categoryId,
                                  category.isActive
                                )
                              }
                              role="switch"
                              aria-checked={categoryActive}
                              disabled={categoryToggleDisabled}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                categoryActive
                                  ? "bg-green-500"
                                  : "bg-gray-300 dark:bg-gray-700"
                              } ${
                                categoryToggleDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              title={
                                categoryActive
                                  ? "Deactivate category"
                                  : "Activate category"
                              }
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  categoryActive
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        <div
                          className={`overflow-hidden transition-all duration-500 ease-out transform ${
                            isExpanded
                              ? "max-h-[2000px] opacity-100 translate-y-0"
                              : "max-h-0 opacity-0 -translate-y-2"
                          }`}
                        >
                          <div className="border-t border-gray-200 dark:border-slate-700 p-4 space-y-3">
                            {category.products.map((product) => {
                              const productExpanded = expandedProducts.has(
                                product.productId
                              );
                              const productActive = product.isActive === 1;
                              return (
                                <div
                                  key={product.productId}
                                  className={`border rounded-lg transition ${
                                    productActive
                                      ? "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60"
                                      : "border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 opacity-70"
                                  }`}
                                >
                                  <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="h-9 w-9 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-200">
                                        {product.productImage ? (
                                          <img
                                            src={product.productImage}
                                            alt={product.productName}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          getInitials(product.productName || "P")
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                          Product
                                        </p>
                                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                          {product.productName}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                          {product.variants.length} variant
                                          {product.variants.length !== 1
                                            ? "s"
                                            : ""}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleProductExpanded(
                                            product.productId
                                          )
                                        }
                                        className={`px-4 py-2 text-sm rounded-[24px] border transition-colors ${
                                          productExpanded
                                            ? "border-rose-200/60 dark:border-rose-400/40 text-rose-700 dark:text-rose-200 bg-rose-50/70 dark:bg-rose-500/10 hover:bg-rose-100/70 dark:hover:bg-rose-500/20"
                                            : "border-blue-200/60 dark:border-blue-400/40 text-blue-700 dark:text-blue-200 bg-blue-50/70 dark:bg-blue-500/10 hover:bg-blue-100/70 dark:hover:bg-blue-500/20"
                                        }`}
                                        aria-expanded={productExpanded}
                                      >
                                        {productExpanded ? "Close" : "View"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleProductActive(
                                            product.productId,
                                            product.isActive
                                          )
                                        }
                                        role="switch"
                                        aria-checked={productActive}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                          productActive
                                            ? "bg-green-500"
                                            : "bg-gray-300 dark:bg-gray-700"
                                        }`}
                                        title={
                                          productActive
                                            ? "Deactivate product"
                                            : "Activate product"
                                        }
                                      >
                                        <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            productActive
                                              ? "translate-x-6"
                                              : "translate-x-1"
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  </div>

                                  <div
                                    className={`overflow-hidden transition-all duration-500 ease-out transform ${
                                      productExpanded
                                        ? "max-h-[1600px] opacity-100 translate-y-0"
                                        : "max-h-0 opacity-0 -translate-y-2"
                                    }`}
                                  >
                                    <div className="border-t border-gray-200 dark:border-slate-700">
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                          <colgroup>
                                            <col className="w-[40%]" />
                                            <col className="w-[20%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-full" />
                                          </colgroup>
                                          <thead className="bg-gray-50 dark:bg-slate-700">
                                            <tr>
                                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Variant
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
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {product.variants.map((item) => {
                                              const bulkStock = bulkUpdates.get(
                                                item.inventory_id
                                              );
                                              const displayStock =
                                                bulkStock !== undefined
                                                  ? bulkStock
                                                  : item.stock;

                                              return (
                                                <tr
                                                  key={item.inventory_id}
                                                  className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                                                    item.stock_status ===
                                                    "out_of_stock"
                                                      ? "bg-red-50/50 dark:bg-red-900/10"
                                                      : item.stock_status ===
                                                        "low_stock"
                                                      ? "bg-yellow-50/50 dark:bg-yellow-900/10"
                                                      : ""
                                                  }`}
                                                >
                                                  <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {item.variant_name}
                                                      </div>
                                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        ₹{item.variant_price}
                                                      </div>
                                                    </div>
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {item.branch_name}
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(
                                                        item.stock_status
                                                      )}`}
                                                    >
                                                      {getStockStatusIcon(
                                                        item.stock_status
                                                      )}
                                                      {item.stock_status
                                                        .replace("_", " ")
                                                        .replace(/\b\w/g, (l) =>
                                                          l.toUpperCase()
                                                        )}
                                                    </span>
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {displayStock}
                                                      </span>
                                                      {bulkStock !== undefined && (
                                                        <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                                          (changed)
                                                        </span>
                                                      )}
                                                    </div>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

        {showStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowStockModal(false)}
            />
            <div className="relative w-full max-w-7xl h-[86vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Add Stocks
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Update variant stock values by category
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="h-9 w-9 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4 mx-auto" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0">
                <div className="md:col-span-4 border-r border-gray-200 dark:border-slate-700 min-h-0">
                  <div className="p-4 h-full flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Categories
                    </h3>
                    <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                      {categoryGroups.map((category) => {
                        const categoryImage = categories.find(
                          (cat) =>
                            cat.category_id === category.categoryId ||
                            cat.category_name === category.categoryName
                        )?.category_image;
                        if (
                          modalCategoryOnly &&
                          category.key !== selectedStockCategoryKey
                        ) {
                          return null;
                        }
                        return (
                          <button
                            key={category.key}
                            type="button"
                            onClick={() => {
                              if (modalCategoryOnly) return;
                              setSelectedStockCategoryKey(category.key);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-colors ${
                              selectedStockCategoryKey === category.key
                                ? "border-blue-200/70 dark:border-blue-400/40 bg-blue-50/70 dark:bg-blue-500/10 text-blue-700 dark:text-blue-200"
                                : "border-transparent hover:border-gray-200 dark:hover:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/40"
                            }`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="h-10 w-10 rounded-md overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-200">
                                {categoryImage ? (
                                  <img
                                    src={categoryImage}
                                    alt={category.categoryName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  getInitials(category.categoryName || "C")
                                )}
                              </span>
                              <span className="truncate">{category.categoryName}</span>
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {category.products.length}
                            </span>
                          </button>
                        );
                      })}
                      {categoryGroups.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No categories available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-8 min-h-0">
                  <div className="p-6 h-full overflow-y-auto">
                    {(() => {
                      const selectedGroup = categoryGroups.find(
                        (group) => group.key === selectedStockCategoryKey
                      );
                      if (!selectedGroup) {
                        return (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Select a category to edit stock values.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedGroup.categoryName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedGroup.products.length} products
                            </p>
                          </div>

                          {selectedGroup.products.map((product) => (
                            <div
                              key={product.productId}
                              className="border border-gray-200 dark:border-slate-700 rounded-lg"
                            >
                              <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                  <div className="h-11 w-11 rounded-md overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-200">
                                    {product.productImage ? (
                                      <img
                                        src={product.productImage}
                                        alt={product.productName}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      getInitials(product.productName || "P")
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {product.productName}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {product.variants.length} variants
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                                {product.variants.map((item) => {
                                  const bulkStock = bulkUpdates.get(
                                    item.inventory_id
                                  );
                                  const displayStock =
                                    bulkStock !== undefined
                                      ? bulkStock
                                      : item.stock;

                                  return (
                                    <div
                                      key={item.inventory_id}
                                      className="px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                          {item.variant_name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {item.branch_name}
                                        </p>
                                      </div>
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
                                          className={`w-28 px-2 py-1 border rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-center ${
                                            bulkStock !== undefined
                                              ? "border-indigo-500 dark:border-indigo-400"
                                              : "border-gray-300 dark:border-gray-600"
                                          } appearance-none`}
                                          style={{
                                            WebkitAppearance: "none",
                                            MozAppearance: "textfield",
                                          }}
                                        />
                                        {bulkStock !== undefined && (
                                          <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                            (changed)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const success = await handleBulkUpdate();
                    if (success) {
                      setShowStockModal(false);
                    }
                  }}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
