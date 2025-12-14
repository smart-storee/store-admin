"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { API_URL } from "@/config/api.config";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import {
  BulkProductUpdate,
  BulkCategoryAssignment,
  BulkOrderStatusUpdate,
  BulkOperationResult,
  Product,
  Category,
  Order,
  Branch,
  ApiResponse,
  InventoryItem,
} from "@/types";
import {
  Package,
  FolderTree,
  ShoppingCart,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Save,
  X,
  Search,
} from "lucide-react";

type BulkOperationTab =
  | "products"
  | "categories"
  | "orders"
  | "import-export"
  | "manage-categories"
  | "manage-products"
  | "manage-variants"
  | "manage-inventory";

export default function BulkOperationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<BulkOperationTab>("products");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkOperationResult | null>(null);

  // Product bulk update state
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Map<number, number>>(
    new Map()
  );
  const [productUpdates, setProductUpdates] = useState({
    base_price: "",
    is_active: undefined as boolean | undefined,
    variant_price: "",
    variant_active: undefined as boolean | undefined,
    stock: "",
    branch_id: null as number | null,
  });

  // Category assignment state
  const [productsForCategory, setProductsForCategory] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Order status update state
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [orderStatus, setOrderStatus] = useState("");

  // CSV Import/Export state
  const [csvData, setCsvData] = useState("");
  const [importBranch, setImportBranch] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Product selection state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Order selection state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState("");

  // Bulk Category Management state
  const [categoryOperations, setCategoryOperations] = useState<
    Array<{
      action: "create" | "update" | "delete";
      category_id?: number;
      category_name?: string;
      is_active?: boolean;
      sort_order?: number;
    }>
  >([]);

  // Bulk Product Management state
  const [productOperations, setProductOperations] = useState<
    Array<{
      action: "create" | "update" | "delete";
      product_id?: number;
      product_name?: string;
      category_id?: number;
      base_price?: number;
      product_description?: string;
      is_active?: boolean;
      branch_ids?: number[];
    }>
  >([]);

  // Bulk Variant Management state
  const [variantOperations, setVariantOperations] = useState<
    Array<{
      action: "create" | "update" | "delete";
      variant_id?: number;
      product_id?: number;
      variant_name?: string;
      variant_price?: number;
      is_active?: boolean;
      stock?: number;
      branch_ids?: number[];
    }>
  >([]);

  // Bulk Inventory Management state
  const [inventoryUpdates, setInventoryUpdates] = useState<
    Array<{
      variant_id: number;
      branch_id: number;
      stock: number;
      operation: "set" | "add" | "subtract";
    }>
  >([]);
  const [showInventorySelector, setShowInventorySelector] = useState(false);

  // Variant selection state
  const [variants, setVariants] = useState<
    Array<{
      variant_id: number;
      variant_name: string;
      product_id: number;
      product_name: string;
      variant_price: number;
    }>
  >([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [variantSearchTerm, setVariantSearchTerm] = useState("");

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

  // Fetch variants for selection
  const fetchVariants = async (search = "") => {
    try {
      setVariantsLoading(true);
      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
        limit: "1000",
        ...(search && { search }),
      });

      const response: ApiResponse<{ data: InventoryItem[] }> =
        await makeAuthenticatedRequest(
          `/inventory?${params.toString()}`,
          {},
          true,
          user?.store_id
        );

      if (response.success) {
        const inventoryData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        // Transform inventory items to variant list with product info
        const variantsList = inventoryData.map((item) => ({
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          product_id: item.product_id,
          product_name: item.product_name,
          variant_price: item.variant_price || 0,
        }));

        // Remove duplicates based on variant_id
        const uniqueVariants = Array.from(
          new Map(variantsList.map((v) => [v.variant_id, v])).values()
        );

        setVariants(uniqueVariants);
      }
    } catch (err) {
      console.error("Failed to fetch variants:", err);
    } finally {
      setVariantsLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async (search?: string) => {
    try {
      setProductsLoading(true);
      const searchTerm = search ?? productSearchTerm;
      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
        limit: "100",
        ...(searchTerm && { search: searchTerm }),
      });

      const response: any = await makeAuthenticatedRequest(
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
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
        limit: "100",
        ...(orderSearchTerm && { search: orderSearchTerm }),
      });

      const response: any = await makeAuthenticatedRequest(
        `/orders?${params.toString()}`
      );

      if (response?.success) {
        const responseData = response.data || {};
        const ordersData = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];
        setOrders(ordersData);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (showProductSelector && user?.store_id) {
      fetchProducts();
    }
  }, [showProductSelector, productSearchTerm, user]);

  useEffect(() => {
    if (showOrderSelector && user?.store_id) {
      fetchOrders();
    }
  }, [showOrderSelector, orderSearchTerm, user]);

  useEffect(() => {
    if (showVariantSelector && user?.store_id) {
      fetchVariants();
    }
  }, [showVariantSelector, variantSearchTerm, user]);

  // Fetch products when variant create tab is active
  useEffect(() => {
    if (
      activeTab === "manage-variants" &&
      user?.store_id &&
      products.length === 0
    ) {
      fetchProducts();
    }
  }, [activeTab, user]);

  const handleBulkUpdateProducts = async () => {
    if (selectedProducts.length === 0) {
      alert("Please select at least one product");
      return;
    }

    const updates: BulkProductUpdate[] = selectedProducts.map((productId) => {
      const variantId = selectedVariants.get(productId);
      const updates: any = {};

      if (productUpdates.base_price) {
        updates.base_price = parseFloat(productUpdates.base_price);
      }
      if (productUpdates.is_active !== undefined) {
        updates.is_active = productUpdates.is_active;
      }
      if (variantId) {
        if (productUpdates.variant_price) {
          updates.variant_price = parseFloat(productUpdates.variant_price);
        }
        if (productUpdates.variant_active !== undefined) {
          updates.variant_active = productUpdates.variant_active;
        }
        if (productUpdates.stock && productUpdates.branch_id) {
          updates.stock = parseInt(productUpdates.stock);
          updates.branch_id = productUpdates.branch_id;
        }
      }

      return {
        product_id: productId,
        variant_id: variantId,
        updates,
      };
    });

    try {
      setLoading(true);
      const response: any = await makeAuthenticatedRequest(
        `/bulk-operations/products?store_id=${user?.store_id}`,
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
        setResult(response.data);
        alert(`Successfully updated ${response.data.success_count} product(s)`);
        // Reset form
        setSelectedProducts([]);
        setSelectedVariants(new Map());
        setProductUpdates({
          base_price: "",
          is_active: undefined,
          variant_price: "",
          variant_active: undefined,
          stock: "",
          branch_id: null,
        });
      } else {
        throw new Error(response.message || "Failed to update products");
      }
    } catch (err: any) {
      alert(err.message || "Failed to bulk update products");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssignCategories = async () => {
    if (productsForCategory.length === 0) {
      alert("Please select at least one product");
      return;
    }

    if (!selectedCategory) {
      alert("Please select a category");
      return;
    }

    try {
      setLoading(true);
      const response: any = await makeAuthenticatedRequest(
        `/bulk-operations/categories?store_id=${user?.store_id}`,
        {
          method: "POST",
          body: JSON.stringify({
            product_ids: productsForCategory,
            category_id: selectedCategory,
            store_id: user?.store_id,
          }),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        setResult(response.data);
        alert(
          `Successfully assigned category to ${response.data.success_count} product(s)`
        );
        setProductsForCategory([]);
        setSelectedCategory(null);
      } else {
        throw new Error(response.message || "Failed to assign categories");
      }
    } catch (err: any) {
      alert(err.message || "Failed to bulk assign categories");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdateOrderStatus = async () => {
    if (selectedOrders.length === 0) {
      alert("Please select at least one order");
      return;
    }

    if (!orderStatus) {
      alert("Please select an order status");
      return;
    }

    try {
      setLoading(true);
      const response: any = await makeAuthenticatedRequest(
        `/bulk-operations/orders?store_id=${user?.store_id}`,
        {
          method: "POST",
          body: JSON.stringify({
            order_ids: selectedOrders,
            order_status: orderStatus,
            store_id: user?.store_id,
          }),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        setResult(response.data);
        alert(
          `Successfully updated ${response.data.success_count} order(s) to ${orderStatus}`
        );
        setSelectedOrders([]);
        setOrderStatus("");
      } else {
        throw new Error(response.message || "Failed to update orders");
      }
    } catch (err: any) {
      alert(err.message || "Failed to bulk update orders");
    } finally {
      setLoading(false);
    }
  };

  const handleExportProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
      });

      // Use fetch directly for blob response
      const token = localStorage.getItem("authToken");
      const fullUrl = `${API_URL}/bulk-operations/export/products?${params.toString()}`;

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Store-ID": user?.store_id?.toString() || "",
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products_export_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert("Products exported successfully!");
      } else {
        throw new Error("Failed to export products");
      }
    } catch (err: any) {
      alert(err.message || "Failed to export products");
    } finally {
      setLoading(false);
    }
  };

  const handleImportProducts = async () => {
    if (!csvData.trim()) {
      alert("Please paste CSV data");
      return;
    }

    try {
      setLoading(true);
      const response: any = await makeAuthenticatedRequest(
        `/bulk-operations/import/products?store_id=${user?.store_id}`,
        {
          method: "POST",
          body: JSON.stringify({
            csv_data: csvData,
            store_id: user?.store_id,
            branch_id: importBranch,
          }),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        setResult(response.data);
        alert(
          `Successfully imported ${response.data.success_count} product(s)`
        );
        setCsvData("");
        setImportBranch(null);
      } else {
        throw new Error(response.message || "Failed to import products");
      }
    } catch (err: any) {
      alert(err.message || "Failed to import products");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
      };
      reader.readAsText(file);
    }
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `Product Name,Category,Base Price,Product Active,Variant Name,Variant Price,Variant Active,Stock
"Margherita Pizza","Pizza",299.00,Yes,"Regular",299.00,Yes,50
"Margherita Pizza","Pizza",299.00,Yes,"Large",399.00,Yes,30
"Pepperoni Pizza","Pizza",349.00,Yes,"Regular",349.00,Yes,40
"Pepperoni Pizza","Pizza",349.00,Yes,"Large",449.00,Yes,25
"Chicken Burger","Burgers",199.00,Yes,"Single",199.00,Yes,60
"Chicken Burger","Burgers",199.00,Yes,"Double",299.00,Yes,35
"French Fries","Sides",99.00,Yes,"Regular",99.00,Yes,100
"French Fries","Sides",99.00,Yes,"Large",149.00,Yes,80
"Coca Cola","Beverages",50.00,Yes,"250ml",50.00,Yes,200
"Coca Cola","Beverages",50.00,Yes,"500ml",80.00,Yes,150`;

    const blob = new Blob([sampleCSV], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_import_template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <RoleGuard requiredPermissions={["manage_products"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Bulk Operations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Efficiently manage multiple products, categories, and orders at
              once
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px overflow-x-auto">
                {[
                  {
                    id: "products",
                    label: "Bulk Product Update",
                    icon: Package,
                  },
                  {
                    id: "categories",
                    label: "Bulk Category Assignment",
                    icon: FolderTree,
                  },
                  {
                    id: "orders",
                    label: "Bulk Order Status",
                    icon: ShoppingCart,
                  },
                  {
                    id: "manage-categories",
                    label: "Manage Categories",
                    icon: FolderTree,
                  },
                  {
                    id: "manage-products",
                    label: "Manage Products",
                    icon: Package,
                  },
                  {
                    id: "manage-variants",
                    label: "Manage Variants",
                    icon: Package,
                  },
                  {
                    id: "manage-inventory",
                    label: "Manage Inventory",
                    icon: Package,
                  },
                  {
                    id: "import-export",
                    label: "CSV Import/Export",
                    icon: FileText,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as BulkOperationTab)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Bulk Product Update */}
              {activeTab === "products" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Bulk Product Update
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Select products and update their prices, status, or stock
                      levels in bulk.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Products
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setShowProductSelector(!showProductSelector)
                          }
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                          <Package className="h-4 w-4" />
                          {showProductSelector
                            ? "Hide Product List"
                            : "Select Products"}
                        </button>
                        {selectedProducts.length > 0 && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                              {selectedProducts.length} product(s) selected
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProducts([]);
                                setSelectedVariants(new Map());
                              }}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {showProductSelector && (
                        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                          <div className="mb-4">
                            <input
                              type="text"
                              placeholder="Search products..."
                              value={productSearchTerm}
                              onChange={(e) =>
                                setProductSearchTerm(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {productsLoading ? (
                              <div className="text-center py-8 text-gray-500">
                                Loading products...
                              </div>
                            ) : products.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                No products found
                              </div>
                            ) : (
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-slate-800">
                                  <tr>
                                    <th className="px-4 py-2 text-left">
                                      <input
                                        type="checkbox"
                                        checked={
                                          products.length > 0 &&
                                          selectedProducts.length ===
                                            products.length
                                        }
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedProducts(
                                              products.map((p) => p.product_id)
                                            );
                                          } else {
                                            setSelectedProducts([]);
                                            setSelectedVariants(new Map());
                                          }
                                        }}
                                        className="rounded"
                                      />
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                                      Product Name
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                                      Category
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                                      Price
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {products.map((product) => (
                                    <tr
                                      key={product.product_id}
                                      className="hover:bg-gray-50 dark:hover:bg-slate-700"
                                    >
                                      <td className="px-4 py-2">
                                        <input
                                          type="checkbox"
                                          checked={selectedProducts.includes(
                                            product.product_id
                                          )}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedProducts([
                                                ...selectedProducts,
                                                product.product_id,
                                              ]);
                                            } else {
                                              setSelectedProducts(
                                                selectedProducts.filter(
                                                  (id) =>
                                                    id !== product.product_id
                                                )
                                              );
                                              const newVariants = new Map(
                                                selectedVariants
                                              );
                                              newVariants.delete(
                                                product.product_id
                                              );
                                              setSelectedVariants(newVariants);
                                            }
                                          }}
                                          className="rounded"
                                        />
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                        {product.product_name}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {product.category_name || "N/A"}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                        ₹{product.base_price}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Base Price (optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={productUpdates.base_price}
                        onChange={(e) =>
                          setProductUpdates({
                            ...productUpdates,
                            base_price: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Product Status
                      </label>
                      <select
                        value={
                          productUpdates.is_active === undefined
                            ? ""
                            : productUpdates.is_active
                            ? "1"
                            : "0"
                        }
                        onChange={(e) =>
                          setProductUpdates({
                            ...productUpdates,
                            is_active:
                              e.target.value === ""
                                ? undefined
                                : e.target.value === "1",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      >
                        <option value="">No change</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Variant Price (optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={productUpdates.variant_price}
                        onChange={(e) =>
                          setProductUpdates({
                            ...productUpdates,
                            variant_price: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Stock (optional)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={productUpdates.stock}
                        onChange={(e) =>
                          setProductUpdates({
                            ...productUpdates,
                            stock: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Branch (for stock update)
                      </label>
                      <select
                        value={productUpdates.branch_id || ""}
                        onChange={(e) =>
                          setProductUpdates({
                            ...productUpdates,
                            branch_id: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select branch</option>
                        {branches.map((branch) => (
                          <option
                            key={branch.branch_id}
                            value={branch.branch_id}
                          >
                            {branch.branch_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleBulkUpdateProducts}
                    disabled={loading || selectedProducts.length === 0}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base font-medium"
                  >
                    <Save className="h-5 w-5" />
                    {loading ? "Updating..." : "Update Products"}
                  </button>
                </div>
              )}

              {/* Bulk Category Assignment */}
              {activeTab === "categories" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Bulk Category Assignment
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Assign multiple products to a category at once.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Products
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setShowProductSelector(!showProductSelector)
                          }
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                          <Package className="h-4 w-4" />
                          {showProductSelector
                            ? "Hide Product List"
                            : "Select Products"}
                        </button>
                        {productsForCategory.length > 0 && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                              {productsForCategory.length} product(s) selected
                            </span>
                            <button
                              type="button"
                              onClick={() => setProductsForCategory([])}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {showProductSelector && (
                        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                          <div className="mb-4">
                            <input
                              type="text"
                              placeholder="Search products..."
                              value={productSearchTerm}
                              onChange={(e) =>
                                setProductSearchTerm(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {productsLoading ? (
                              <div className="text-center py-8 text-gray-500">
                                Loading products...
                              </div>
                            ) : products.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                No products found
                              </div>
                            ) : (
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-slate-800">
                                  <tr>
                                    <th className="px-4 py-2 text-left">
                                      <input
                                        type="checkbox"
                                        checked={
                                          products.length > 0 &&
                                          productsForCategory.length ===
                                            products.length
                                        }
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setProductsForCategory(
                                              products.map((p) => p.product_id)
                                            );
                                          } else {
                                            setProductsForCategory([]);
                                          }
                                        }}
                                        className="rounded"
                                      />
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                                      Product Name
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                                      Category
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                                      Price
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {products.map((product) => (
                                    <tr
                                      key={product.product_id}
                                      className="hover:bg-gray-50 dark:hover:bg-slate-700"
                                    >
                                      <td className="px-4 py-2">
                                        <input
                                          type="checkbox"
                                          checked={productsForCategory.includes(
                                            product.product_id
                                          )}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setProductsForCategory([
                                                ...productsForCategory,
                                                product.product_id,
                                              ]);
                                            } else {
                                              setProductsForCategory(
                                                productsForCategory.filter(
                                                  (id) =>
                                                    id !== product.product_id
                                                )
                                              );
                                            }
                                          }}
                                          className="rounded"
                                        />
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                        {product.product_name}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {product.category_name || "N/A"}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                        ₹{product.base_price}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        value={selectedCategory || ""}
                        onChange={(e) =>
                          setSelectedCategory(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select category</option>
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
                  </div>

                  <button
                    onClick={handleBulkAssignCategories}
                    disabled={
                      loading ||
                      productsForCategory.length === 0 ||
                      !selectedCategory
                    }
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base font-medium"
                  >
                    <Save className="h-5 w-5" />
                    {loading ? "Assigning..." : "Assign Category"}
                  </button>
                </div>
              )}

              {/* Bulk Order Status Update */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Bulk Order Status Update
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Update the status of multiple orders at once.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Orders
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setShowOrderSelector(!showOrderSelector)
                          }
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {showOrderSelector
                            ? "Hide Order List"
                            : "Select Orders"}
                        </button>
                        {selectedOrders.length > 0 && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                              {selectedOrders.length} order(s) selected
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedOrders([])}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {showOrderSelector && (
                        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                          <div className="mb-4">
                            <input
                              type="text"
                              placeholder="Search orders by order number..."
                              value={orderSearchTerm}
                              onChange={(e) =>
                                setOrderSearchTerm(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {ordersLoading ? (
                              <div className="text-center py-8 text-gray-500">
                                Loading orders...
                              </div>
                            ) : orders.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                No orders found
                              </div>
                            ) : (
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-slate-800">
                                  <tr>
                                    <th className="px-4 py-2 text-left">
                                      <input
                                        type="checkbox"
                                        checked={
                                          orders.length > 0 &&
                                          selectedOrders.length ===
                                            orders.length
                                        }
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedOrders(
                                              orders.map((o) => o.order_id)
                                            );
                                          } else {
                                            setSelectedOrders([]);
                                          }
                                        }}
                                        className="rounded"
                                      />
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                                      Order Number
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                                      Customer
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                                      Status
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                                      Amount
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {orders.map((order) => (
                                    <tr
                                      key={order.order_id}
                                      className="hover:bg-gray-50 dark:hover:bg-slate-700"
                                    >
                                      <td className="px-4 py-2">
                                        <input
                                          type="checkbox"
                                          checked={selectedOrders.includes(
                                            order.order_id
                                          )}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedOrders([
                                                ...selectedOrders,
                                                order.order_id,
                                              ]);
                                            } else {
                                              setSelectedOrders(
                                                selectedOrders.filter(
                                                  (id) => id !== order.order_id
                                                )
                                              );
                                            }
                                          }}
                                          className="rounded"
                                        />
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                        {order.order_number}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {order.customer_name}
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            order.order_status === "delivered"
                                              ? "bg-green-100 text-green-800"
                                              : order.order_status ===
                                                "cancelled"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-yellow-100 text-yellow-800"
                                          }`}
                                        >
                                          {order.order_status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                        ₹{order.total_amount}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Status
                      </label>
                      <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="out_for_delivery">
                          Out for Delivery
                        </option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleBulkUpdateOrderStatus}
                    disabled={
                      loading || selectedOrders.length === 0 || !orderStatus
                    }
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base font-medium"
                  >
                    <Save className="h-5 w-5" />
                    {loading ? "Updating..." : "Update Orders"}
                  </button>
                </div>
              )}

              {/* Bulk Category Management */}
              {activeTab === "manage-categories" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      Bulk Category Management
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
                      Create, update, or delete multiple categories at once.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                      Instructions:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                      <li>
                        <strong>Create:</strong> Provide category_name
                        (required), is_active, sort_order
                      </li>
                      <li>
                        <strong>Update:</strong> Select category (required),
                        then update category_name, is_active, or sort_order
                      </li>
                      <li>
                        <strong>Delete:</strong> Select category (required).
                        Categories with products cannot be deleted.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-6">
                    {categoryOperations.map((op, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-slate-700/50"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <select
                            value={op.action}
                            onChange={(e) => {
                              const newOps = [...categoryOperations];
                              newOps[index].action = e.target.value as any;
                              setCategoryOperations(newOps);
                            }}
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-medium"
                          >
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryOperations(
                                categoryOperations.filter((_, i) => i !== index)
                              );
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {op.action !== "create" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Category *
                              </label>
                              <select
                                value={op.category_id || ""}
                                onChange={(e) => {
                                  const newOps = [...categoryOperations];
                                  newOps[index].category_id = e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined;
                                  setCategoryOperations(newOps);
                                }}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                  <option
                                    key={cat.category_id}
                                    value={cat.category_id}
                                  >
                                    {cat.category_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {op.action !== "delete" && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Category Name {op.action === "create" && "*"}
                                </label>
                                <input
                                  type="text"
                                  value={op.category_name || ""}
                                  onChange={(e) => {
                                    const newOps = [...categoryOperations];
                                    newOps[index].category_name =
                                      e.target.value;
                                    setCategoryOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Active
                                </label>
                                <select
                                  value={
                                    op.is_active === undefined
                                      ? ""
                                      : op.is_active
                                      ? "1"
                                      : "0"
                                  }
                                  onChange={(e) => {
                                    const newOps = [...categoryOperations];
                                    newOps[index].is_active =
                                      e.target.value === ""
                                        ? undefined
                                        : e.target.value === "1";
                                    setCategoryOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                >
                                  <option value="">No change</option>
                                  <option value="1">Active</option>
                                  <option value="0">Inactive</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Sort Order
                                </label>
                                <input
                                  type="number"
                                  value={op.sort_order || ""}
                                  onChange={(e) => {
                                    const newOps = [...categoryOperations];
                                    newOps[index].sort_order = e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined;
                                    setCategoryOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setCategoryOperations([
                          ...categoryOperations,
                          { action: "create" },
                        ]);
                      }}
                      className="px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 w-full"
                    >
                      + Add Category Operation
                    </button>
                  </div>

                  <button
                    onClick={async () => {
                      if (categoryOperations.length === 0) {
                        alert("Please add at least one category operation");
                        return;
                      }

                      try {
                        setLoading(true);
                        const response: any = await makeAuthenticatedRequest(
                          `/bulk-operations/manage/categories?store_id=${user?.store_id}`,
                          {
                            method: "POST",
                            body: JSON.stringify({
                              operations: categoryOperations,
                              store_id: user?.store_id,
                            }),
                          },
                          true,
                          user?.store_id
                        );

                        if (response.success) {
                          setResult(response.data);
                          alert(
                            `Successfully processed ${response.data.success_count} category operation(s)`
                          );
                          setCategoryOperations([]);
                        } else {
                          throw new Error(
                            response.message || "Failed to process categories"
                          );
                        }
                      } catch (err: any) {
                        alert(err.message || "Failed to process categories");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || categoryOperations.length === 0}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base font-medium"
                  >
                    <Save className="h-5 w-5" />
                    {loading ? "Processing..." : "Process Categories"}
                  </button>
                </div>
              )}

              {/* Bulk Product Management */}
              {activeTab === "manage-products" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      Bulk Product Management
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
                      Create, update, or delete multiple products at once.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                      Instructions:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                      <li>
                        <strong>Create:</strong> Provide product_name, select
                        category, and base_price (all required)
                      </li>
                      <li>
                        <strong>Update:</strong> Provide product_id (required),
                        then any fields to update
                      </li>
                      <li>
                        <strong>Delete:</strong> Provide product_id (required).
                        This will also delete variants and inventory.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-6">
                    {productOperations.map((op, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-slate-700/50"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <select
                            value={op.action}
                            onChange={(e) => {
                              const newOps = [...productOperations];
                              newOps[index].action = e.target.value as any;
                              setProductOperations(newOps);
                            }}
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-medium"
                          >
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setProductOperations(
                                productOperations.filter((_, i) => i !== index)
                              );
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {op.action !== "create" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Select Product *
                              </label>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!showProductSelector) {
                                      fetchProducts();
                                    }
                                    setShowProductSelector(
                                      !showProductSelector
                                    );
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-left flex items-center justify-between"
                                >
                                  <span>
                                    {op.product_id
                                      ? products.find(
                                          (p) => p.product_id === op.product_id
                                        )?.product_name ||
                                        `Product #${op.product_id}`
                                      : "Select Product"}
                                  </span>
                                  <Search className="h-4 w-4" />
                                </button>
                                {showProductSelector && (
                                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    <div className="p-2 sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
                                      <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={productSearchTerm}
                                        onChange={(e) => {
                                          setProductSearchTerm(e.target.value);
                                          fetchProducts(e.target.value);
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                      />
                                    </div>
                                    {productsLoading ? (
                                      <div className="p-4 text-center text-gray-500">
                                        Loading...
                                      </div>
                                    ) : (
                                      <div className="max-h-48 overflow-auto">
                                        {products
                                          .filter((p) =>
                                            p.product_name
                                              .toLowerCase()
                                              .includes(
                                                productSearchTerm.toLowerCase()
                                              )
                                          )
                                          .map((product) => (
                                            <button
                                              key={product.product_id}
                                              type="button"
                                              onClick={() => {
                                                const newOps = [
                                                  ...productOperations,
                                                ];
                                                newOps[index].product_id =
                                                  product.product_id;
                                                setProductOperations(newOps);
                                                setShowProductSelector(false);
                                                setProductSearchTerm("");
                                              }}
                                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white"
                                            >
                                              {product.product_name}
                                            </button>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {op.action !== "delete" && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Product Name {op.action === "create" && "*"}
                                </label>
                                <input
                                  type="text"
                                  value={op.product_name || ""}
                                  onChange={(e) => {
                                    const newOps = [...productOperations];
                                    newOps[index].product_name = e.target.value;
                                    setProductOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Category {op.action === "create" && "*"}
                                </label>
                                <select
                                  value={op.category_id || ""}
                                  onChange={(e) => {
                                    const newOps = [...productOperations];
                                    newOps[index].category_id = e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined;
                                    setProductOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                >
                                  <option value="">Select category</option>
                                  {categories.map((cat) => (
                                    <option
                                      key={cat.category_id}
                                      value={cat.category_id}
                                    >
                                      {cat.category_name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Base Price {op.action === "create" && "*"}
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={op.base_price || ""}
                                  onChange={(e) => {
                                    const newOps = [...productOperations];
                                    newOps[index].base_price = e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined;
                                    setProductOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={op.product_description || ""}
                                  onChange={(e) => {
                                    const newOps = [...productOperations];
                                    newOps[index].product_description =
                                      e.target.value;
                                    setProductOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Active
                                </label>
                                <select
                                  value={
                                    op.is_active === undefined
                                      ? ""
                                      : op.is_active
                                      ? "1"
                                      : "0"
                                  }
                                  onChange={(e) => {
                                    const newOps = [...productOperations];
                                    newOps[index].is_active =
                                      e.target.value === ""
                                        ? undefined
                                        : e.target.value === "1";
                                    setProductOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                >
                                  <option value="">No change</option>
                                  <option value="1">Active</option>
                                  <option value="0">Inactive</option>
                                </select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setProductOperations([
                          ...productOperations,
                          { action: "create" },
                        ]);
                      }}
                      className="px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 w-full"
                    >
                      + Add Product Operation
                    </button>
                  </div>

                  <button
                    onClick={async () => {
                      if (productOperations.length === 0) {
                        alert("Please add at least one product operation");
                        return;
                      }

                      try {
                        setLoading(true);
                        const response: any = await makeAuthenticatedRequest(
                          `/bulk-operations/manage/products?store_id=${user?.store_id}`,
                          {
                            method: "POST",
                            body: JSON.stringify({
                              operations: productOperations,
                              store_id: user?.store_id,
                            }),
                          },
                          true,
                          user?.store_id
                        );

                        if (response.success) {
                          setResult(response.data);
                          alert(
                            `Successfully processed ${response.data.success_count} product operation(s)`
                          );
                          setProductOperations([]);
                        } else {
                          throw new Error(
                            response.message || "Failed to process products"
                          );
                        }
                      } catch (err: any) {
                        alert(err.message || "Failed to process products");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || productOperations.length === 0}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base font-medium"
                  >
                    <Save className="h-5 w-5" />
                    {loading ? "Processing..." : "Process Products"}
                  </button>
                </div>
              )}

              {/* Bulk Variant Management */}
              {activeTab === "manage-variants" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      Bulk Variant Management
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
                      Create, update, or delete multiple product variants at
                      once.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                      Instructions:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                      <li>
                        <strong>Create:</strong> Select product, provide
                        variant_name, and variant_price (all required)
                      </li>
                      <li>
                        <strong>Update:</strong> Provide variant_id (required),
                        then any fields to update
                      </li>
                      <li>
                        <strong>Delete:</strong> Provide variant_id (required).
                        This will also delete inventory.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-6">
                    {variantOperations.map((op, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-slate-700/50"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <select
                            value={op.action}
                            onChange={(e) => {
                              const newOps = [...variantOperations];
                              newOps[index].action = e.target.value as any;
                              setVariantOperations(newOps);
                            }}
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-medium"
                          >
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setVariantOperations(
                                variantOperations.filter((_, i) => i !== index)
                              );
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {op.action !== "create" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Select Variant *
                              </label>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!showVariantSelector) {
                                      fetchVariants();
                                    }
                                    setShowVariantSelector(
                                      !showVariantSelector
                                    );
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-left flex items-center justify-between"
                                >
                                  <span>
                                    {op.variant_id
                                      ? (() => {
                                          const variant = variants.find(
                                            (v) =>
                                              v.variant_id === op.variant_id
                                          );
                                          return variant
                                            ? `${variant.product_name} - ${variant.variant_name}`
                                            : `Variant #${op.variant_id}`;
                                        })()
                                      : "Select Variant"}
                                  </span>
                                  <Search className="h-4 w-4" />
                                </button>
                                {showVariantSelector && (
                                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    <div className="p-2 sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
                                      <input
                                        type="text"
                                        placeholder="Search variants..."
                                        value={variantSearchTerm}
                                        onChange={(e) => {
                                          setVariantSearchTerm(e.target.value);
                                          fetchVariants(e.target.value);
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                      />
                                    </div>
                                    {variantsLoading ? (
                                      <div className="p-4 text-center text-gray-500">
                                        Loading...
                                      </div>
                                    ) : (
                                      <div className="max-h-48 overflow-auto">
                                        {variants
                                          .filter(
                                            (v) =>
                                              v.product_name
                                                .toLowerCase()
                                                .includes(
                                                  variantSearchTerm.toLowerCase()
                                                ) ||
                                              v.variant_name
                                                .toLowerCase()
                                                .includes(
                                                  variantSearchTerm.toLowerCase()
                                                )
                                          )
                                          .map((variant) => (
                                            <button
                                              key={variant.variant_id}
                                              type="button"
                                              onClick={() => {
                                                const newOps = [
                                                  ...variantOperations,
                                                ];
                                                newOps[index].variant_id =
                                                  variant.variant_id;
                                                setVariantOperations(newOps);
                                                setShowVariantSelector(false);
                                                setVariantSearchTerm("");
                                              }}
                                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white"
                                            >
                                              <div className="font-medium">
                                                {variant.product_name}
                                              </div>
                                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {variant.variant_name}
                                              </div>
                                            </button>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {op.action !== "delete" && (
                            <>
                              {op.action === "create" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Select Product *
                                  </label>
                                  <select
                                    value={op.product_id || ""}
                                    onChange={(e) => {
                                      const newOps = [...variantOperations];
                                      newOps[index].product_id = e.target.value
                                        ? parseInt(e.target.value)
                                        : undefined;
                                      setVariantOperations(newOps);
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                  >
                                    <option value="">Select product</option>
                                    {products.map((p) => (
                                      <option
                                        key={p.product_id}
                                        value={p.product_id}
                                      >
                                        {p.product_name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Variant Name {op.action === "create" && "*"}
                                </label>
                                <input
                                  type="text"
                                  value={op.variant_name || ""}
                                  onChange={(e) => {
                                    const newOps = [...variantOperations];
                                    newOps[index].variant_name = e.target.value;
                                    setVariantOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Variant Price {op.action === "create" && "*"}
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={op.variant_price || ""}
                                  onChange={(e) => {
                                    const newOps = [...variantOperations];
                                    newOps[index].variant_price = e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined;
                                    setVariantOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Active
                                </label>
                                <select
                                  value={
                                    op.is_active === undefined
                                      ? ""
                                      : op.is_active
                                      ? "1"
                                      : "0"
                                  }
                                  onChange={(e) => {
                                    const newOps = [...variantOperations];
                                    newOps[index].is_active =
                                      e.target.value === ""
                                        ? undefined
                                        : e.target.value === "1";
                                    setVariantOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                >
                                  <option value="">No change</option>
                                  <option value="1">Active</option>
                                  <option value="0">Inactive</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Initial Stock (optional)
                                </label>
                                <input
                                  type="number"
                                  value={op.stock || ""}
                                  onChange={(e) => {
                                    const newOps = [...variantOperations];
                                    newOps[index].stock = e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined;
                                    setVariantOperations(newOps);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  Stock will be set for all active branches
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setVariantOperations([
                          ...variantOperations,
                          { action: "create" },
                        ]);
                      }}
                      className="px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 w-full"
                    >
                      + Add Variant Operation
                    </button>
                  </div>

                  <button
                    onClick={async () => {
                      if (variantOperations.length === 0) {
                        alert("Please add at least one variant operation");
                        return;
                      }

                      try {
                        setLoading(true);
                        const response: any = await makeAuthenticatedRequest(
                          `/bulk-operations/manage/variants?store_id=${user?.store_id}`,
                          {
                            method: "POST",
                            body: JSON.stringify({
                              operations: variantOperations,
                              store_id: user?.store_id,
                            }),
                          },
                          true,
                          user?.store_id
                        );

                        if (response.success) {
                          setResult(response.data);
                          alert(
                            `Successfully processed ${response.data.success_count} variant operation(s)`
                          );
                          setVariantOperations([]);
                        } else {
                          throw new Error(
                            response.message || "Failed to process variants"
                          );
                        }
                      } catch (err: any) {
                        alert(err.message || "Failed to process variants");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || variantOperations.length === 0}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base font-medium"
                  >
                    <Save className="h-5 w-5" />
                    {loading ? "Processing..." : "Process Variants"}
                  </button>
                </div>
              )}

              {/* Bulk Inventory Management */}
              {activeTab === "manage-inventory" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      Bulk Inventory Management
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
                      Update stock levels for multiple variants across branches.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                      Stock Operations:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                      <li>
                        <strong>Set:</strong> Set stock to a specific value
                      </li>
                      <li>
                        <strong>Add:</strong> Add to existing stock (e.g., +10)
                      </li>
                      <li>
                        <strong>Subtract:</strong> Subtract from existing stock
                        (e.g., -5)
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-6">
                    {inventoryUpdates.map((update, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-slate-700/50"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-base font-medium text-gray-700 dark:text-gray-300">
                            Update #{index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setInventoryUpdates(
                                inventoryUpdates.filter((_, i) => i !== index)
                              );
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Select Variant *
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!showVariantSelector) {
                                    fetchVariants();
                                  }
                                  setShowVariantSelector(!showVariantSelector);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-left flex items-center justify-between"
                              >
                                <span>
                                  {update.variant_id
                                    ? (() => {
                                        const variant = variants.find(
                                          (v) =>
                                            v.variant_id === update.variant_id
                                        );
                                        return variant
                                          ? `${variant.product_name} - ${variant.variant_name}`
                                          : `Variant #${update.variant_id}`;
                                      })()
                                    : "Select Variant"}
                                </span>
                                <Search className="h-4 w-4" />
                              </button>
                              {showVariantSelector && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                  <div className="p-2 sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
                                    <input
                                      type="text"
                                      placeholder="Search variants..."
                                      value={variantSearchTerm}
                                      onChange={(e) => {
                                        setVariantSearchTerm(e.target.value);
                                        fetchVariants(e.target.value);
                                      }}
                                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  {variantsLoading ? (
                                    <div className="p-4 text-center text-gray-500">
                                      Loading...
                                    </div>
                                  ) : (
                                    <div className="max-h-48 overflow-auto">
                                      {variants
                                        .filter(
                                          (v) =>
                                            v.product_name
                                              .toLowerCase()
                                              .includes(
                                                variantSearchTerm.toLowerCase()
                                              ) ||
                                            v.variant_name
                                              .toLowerCase()
                                              .includes(
                                                variantSearchTerm.toLowerCase()
                                              )
                                        )
                                        .map((variant) => (
                                          <button
                                            key={variant.variant_id}
                                            type="button"
                                            onClick={() => {
                                              const newUpdates = [
                                                ...inventoryUpdates,
                                              ];
                                              newUpdates[index].variant_id =
                                                variant.variant_id;
                                              setInventoryUpdates(newUpdates);
                                              setShowVariantSelector(false);
                                              setVariantSearchTerm("");
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white"
                                          >
                                            <div className="font-medium">
                                              {variant.product_name}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                              {variant.variant_name}
                                            </div>
                                          </button>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Branch *
                            </label>
                            <select
                              value={update.branch_id || ""}
                              onChange={(e) => {
                                const newUpdates = [...inventoryUpdates];
                                newUpdates[index].branch_id = e.target.value
                                  ? parseInt(e.target.value)
                                  : 0;
                                setInventoryUpdates(newUpdates);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            >
                              <option value="">Select branch</option>
                              {branches.map((branch) => (
                                <option
                                  key={branch.branch_id}
                                  value={branch.branch_id}
                                >
                                  {branch.branch_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Operation *
                            </label>
                            <select
                              value={update.operation}
                              onChange={(e) => {
                                const newUpdates = [...inventoryUpdates];
                                newUpdates[index].operation = e.target
                                  .value as any;
                                setInventoryUpdates(newUpdates);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            >
                              <option value="set">Set</option>
                              <option value="add">Add</option>
                              <option value="subtract">Subtract</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Stock Value *
                            </label>
                            <input
                              type="number"
                              value={update.stock || ""}
                              onChange={(e) => {
                                const newUpdates = [...inventoryUpdates];
                                newUpdates[index].stock = e.target.value
                                  ? parseInt(e.target.value)
                                  : 0;
                                setInventoryUpdates(newUpdates);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setInventoryUpdates([
                          ...inventoryUpdates,
                          {
                            variant_id: 0,
                            branch_id: 0,
                            stock: 0,
                            operation: "set",
                          },
                        ]);
                      }}
                      className="px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 w-full"
                    >
                      + Add Inventory Update
                    </button>
                  </div>

                  <button
                    onClick={async () => {
                      if (inventoryUpdates.length === 0) {
                        alert("Please add at least one inventory update");
                        return;
                      }

                      // Validate all updates
                      const invalid = inventoryUpdates.some(
                        (u) => !u.variant_id || !u.branch_id
                      );
                      if (invalid) {
                        alert(
                          "Please fill in all required fields (Variant ID and Branch ID)"
                        );
                        return;
                      }

                      try {
                        setLoading(true);
                        const response: any = await makeAuthenticatedRequest(
                          `/bulk-operations/inventory?store_id=${user?.store_id}`,
                          {
                            method: "POST",
                            body: JSON.stringify({
                              updates: inventoryUpdates,
                              store_id: user?.store_id,
                            }),
                          },
                          true,
                          user?.store_id
                        );

                        if (response.success) {
                          setResult(response.data);
                          alert(
                            `Successfully updated ${response.data.success_count} inventory item(s)`
                          );
                          setInventoryUpdates([]);
                        } else {
                          throw new Error(
                            response.message || "Failed to update inventory"
                          );
                        }
                      } catch (err: any) {
                        alert(err.message || "Failed to update inventory");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || inventoryUpdates.length === 0}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base font-medium"
                  >
                    <Save className="h-5 w-5" />
                    {loading ? "Updating..." : "Update Inventory"}
                  </button>
                </div>
              )}

              {/* CSV Import/Export */}
              {activeTab === "import-export" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      CSV Import/Export
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Export products to CSV for editing or import products from
                      CSV file.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export Section */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Download className="h-5 w-5 text-indigo-600" />
                        Export Products
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Download all products as a CSV file. You can edit this
                        file and import it back.
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong>How to use:</strong>
                        </p>
                        <ol className="text-sm text-blue-700 dark:text-blue-400 mt-2 list-decimal list-inside space-y-1">
                          <li>
                            Click "Export to CSV" to download your products
                          </li>
                          <li>Open the CSV file in Excel or Google Sheets</li>
                          <li>Edit product details (prices, names, etc.)</li>
                          <li>
                            Save the file and import it back using the Import
                            section
                          </li>
                        </ol>
                      </div>
                      <button
                        onClick={handleExportProducts}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {loading ? "Exporting..." : "Export to CSV"}
                      </button>
                    </div>

                    {/* Import Section */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Upload className="h-5 w-5 text-indigo-600" />
                        Import Products
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                                CSV Format Required:
                              </p>
                              <div className="text-xs text-yellow-700 dark:text-yellow-400 font-mono bg-white dark:bg-slate-800 p-2 rounded overflow-x-auto">
                                Product Name,Category,Base Price,Product
                                Active,Variant Name,Variant Price,Variant
                                Active,Stock
                              </div>
                              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                                Example:
                                "Pizza","Food",299.00,Yes,"Large",399.00,Yes,50
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={downloadSampleCSV}
                              className="ml-4 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm flex items-center gap-2 whitespace-nowrap"
                            >
                              <Download className="h-4 w-4" />
                              Download Template
                            </button>
                          </div>
                          <div className="bg-white dark:bg-slate-800 rounded p-3 mt-3">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Sample Data Preview:
                            </p>
                            <div className="text-xs font-mono text-gray-600 dark:text-gray-400 space-y-1">
                              <div>
                                "Margherita
                                Pizza","Pizza",299.00,Yes,"Regular",299.00,Yes,50
                              </div>
                              <div>
                                "Margherita
                                Pizza","Pizza",299.00,Yes,"Large",399.00,Yes,30
                              </div>
                              <div>
                                "Chicken
                                Burger","Burgers",199.00,Yes,"Single",199.00,Yes,60
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Branch (for stock assignment)
                          </label>
                          <select
                            value={importBranch || ""}
                            onChange={(e) =>
                              setImportBranch(
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select branch (optional)</option>
                            {branches.map((branch) => (
                              <option
                                key={branch.branch_id}
                                value={branch.branch_id}
                              >
                                {branch.branch_name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Select a branch if you want to set stock levels
                            during import
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Upload CSV File
                          </label>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Select a CSV file from your computer
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Or Paste CSV Data
                          </label>
                          <textarea
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            placeholder='Paste CSV data here...\nExample:\n"Product Name","Category","Base Price","Product Active","Variant Name","Variant Price","Variant Active","Stock"\n"Pizza","Food",299.00,Yes,"Large",399.00,Yes,50'
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-mono text-sm"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Paste your CSV data directly here (include header
                            row)
                          </p>
                        </div>

                        <button
                          onClick={handleImportProducts}
                          disabled={loading || !csvData.trim()}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {loading ? "Importing..." : "Import from CSV"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CSV Template Example */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      CSV Template Example
                    </h3>
                    <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-300 dark:border-gray-700">
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Product Name
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Category
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Base Price
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Product Active
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Variant Name
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Variant Price
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Variant Active
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Stock
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              Margherita Pizza
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              Pizza
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              299.00
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              Yes
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              Regular
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              299.00
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              Yes
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              50
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              Margherita Pizza
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              Pizza
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              299.00
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              Yes
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              Large
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              399.00
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              Yes
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              30
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              Chicken Burger
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              Burgers
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              199.00
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              Yes
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              Single
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              199.00
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              Yes
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              60
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                      <p className="text-sm text-indigo-800 dark:text-indigo-300">
                        <strong>Important Notes:</strong>
                      </p>
                      <ul className="text-sm text-indigo-700 dark:text-indigo-400 mt-2 list-disc list-inside space-y-1">
                        <li>
                          Use "Yes" or "No" for Active fields (case-insensitive)
                        </li>
                        <li>Product names and categories are case-sensitive</li>
                        <li>If a product doesn't exist, it will be created</li>
                        <li>
                          If a category doesn't exist, it will be created
                          automatically
                        </li>
                        <li>
                          Stock is optional - only set if you selected a branch
                        </li>
                        <li>
                          One product can have multiple variants (multiple rows
                          with same product name)
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-indigo-600" />
                      How to Use CSV Import/Export
                    </h3>
                    <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <h4 className="font-semibold mb-2">
                          Step 1: Export Products
                        </h4>
                        <p>
                          Click "Export to CSV" to download all your products.
                          This creates a CSV file with all product information.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Step 2: Edit CSV File
                        </h4>
                        <p>
                          Open the downloaded CSV file in Excel, Google Sheets,
                          or any spreadsheet application. You can:
                        </p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>Update product prices</li>
                          <li>Change product names</li>
                          <li>Add new products</li>
                          <li>Update stock levels</li>
                          <li>Change product status (Active/Inactive)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Step 3: Import Back
                        </h4>
                        <p>After editing, either:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>
                            Upload the CSV file using the file upload button, OR
                          </li>
                          <li>
                            Copy and paste the CSV content into the text area
                          </li>
                        </ul>
                        <p className="mt-2">
                          Click "Import from CSV" to update your products.
                        </p>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 mt-4">
                        <p className="text-indigo-800 dark:text-indigo-300 font-medium">
                          💡 Tip: Always export first to see the correct format,
                          then edit and import back.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Operation Results
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Success: {result.success_count}
                    </span>
                  </div>
                  {result.error_count > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">
                        Errors: {result.error_count}
                      </span>
                    </div>
                  )}
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Errors:
                    </h4>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <div
                          key={index}
                          className="text-sm text-red-600 dark:text-red-400 mb-1"
                        >
                          {error.product_id && `Product ${error.product_id}: `}
                          {error.order_id && `Order ${error.order_id}: `}
                          {error.row && `Row ${error.row}: `}
                          {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
