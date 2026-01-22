"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { Order, ApiResponse, Pagination, Branch } from "@/types";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  Phone,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  Filter,
  X,
  Truck,
  ChefHat,
  ShoppingBag,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  Download,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingDelivery, setExportingDelivery] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response: ApiResponse<{ data: Branch[] }> =
          await makeAuthenticatedRequest(
            `/branches?store_id=${user?.store_id}`
          );
        if (response.success) {
          setBranches(response.data.data || response.data);
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };

    if (user?.store_id) {
      fetchBranches();
    }
  }, [user?.store_id]);

  useEffect(() => {
    fetchOrders();
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    selectedBranch,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    itemsPerPage,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Refresh on 'R' key
      if ((e.key === "r" || e.key === "R") && !loading && !refreshing) {
        e.preventDefault();
        setRefreshing(true);
        fetchOrders().finally(() => {
          setTimeout(() => setRefreshing(false), 500);
        });
      }

      // Toggle filters on 'F' key
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setShowFilters((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [loading, refreshing]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.store_id) {
        setError("No store selected");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        store_id: user.store_id.toString(),
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (selectedBranch) {
        params.append("branch_id", selectedBranch.toString());
      }

      if (dateFrom) {
        params.append("date_from", dateFrom);
      }

      if (dateTo) {
        params.append("date_to", dateTo);
      }

      if (sortBy) {
        params.append("sort_by", sortBy);
        params.append("sort_order", sortOrder);
      }

      const response: ApiResponse<{ data: Order[]; pagination: Pagination }> =
        await makeAuthenticatedRequest(
          `/orders?${params.toString()}`,
          { method: "GET" },
          true,
          user.store_id,
          selectedBranch || undefined
        );

      if (response.success) {
        const ordersData = response.data.data || response.data;
        setOrders(ordersData);

        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / itemsPerPage));
          setTotalCount(response.pagination.total);
        }

        // Calculate stats from current page (note: these are page-level stats)
        const stats: OrderStats = {
          total: totalCount,
          pending: ordersData.filter((o) => o.order_status === "pending")
            .length,
          confirmed: ordersData.filter((o) => o.order_status === "confirmed")
            .length,
          preparing: ordersData.filter((o) => o.order_status === "preparing")
            .length,
          ready: ordersData.filter((o) => o.order_status === "ready").length,
          delivered: ordersData.filter((o) => o.order_status === "delivered")
            .length,
          cancelled: ordersData.filter((o) => o.order_status === "cancelled")
            .length,
        };
        setOrderStats(stats);
      } else {
        throw new Error(response.message || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("Orders fetch error:", err);
      if (err instanceof Error) {
        setError(
          err.message || "Failed to fetch orders. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId);

    try {
      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        `/orders/${orderId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ order_status: newStatus }),
        }
      );

      if (response.success) {
        const statusLabel = newStatus
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        setSuccessMessage(`Order status updated to ${statusLabel}`);
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchOrders();
      } else {
        alert(response.message || "Failed to update order status");
      }
    } catch (err) {
      console.error("Update order status error:", err);
      alert(
        err instanceof Error ? err.message : "Failed to update order status"
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleQuickAction = async (orderId: number, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
      ready: "out_for_delivery",
      out_for_delivery: "delivered",
    };

    const nextStatus = nextStatusMap[currentStatus];
    if (nextStatus) {
      await handleStatusUpdate(orderId, nextStatus);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setTimeout(() => setRefreshing(false), 500);
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const nextStatusMap: Record<string, string> = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
      ready: "out_for_delivery",
      out_for_delivery: "delivered",
    };
    return nextStatusMap[currentStatus] || null;
  };

  const getQuickActionLabel = (currentStatus: string): string => {
    const labelMap: Record<string, string> = {
      pending: "Confirm",
      confirmed: "Start Preparing",
      preparing: "Mark Ready",
      ready: "Out for Delivery",
      out_for_delivery: "Mark Delivered",
    };
    return labelMap[currentStatus] || "";
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      {
        label: string;
        icon: any;
        bg: string;
        text: string;
        border: string;
      }
    > = {
      pending: {
        label: "Pending",
        icon: Clock,
        bg: isDarkMode ? "bg-yellow-900/30" : "bg-yellow-50",
        text: isDarkMode ? "text-yellow-300" : "text-yellow-700",
        border: isDarkMode ? "border-yellow-700/50" : "border-yellow-200",
      },
      confirmed: {
        label: "Confirmed",
        icon: CheckCircle,
        bg: isDarkMode ? "bg-blue-900/30" : "bg-blue-50",
        text: isDarkMode ? "text-blue-300" : "text-blue-700",
        border: isDarkMode ? "border-blue-700/50" : "border-blue-200",
      },
      preparing: {
        label: "Preparing",
        icon: ChefHat,
        bg: isDarkMode ? "bg-purple-900/30" : "bg-purple-50",
        text: isDarkMode ? "text-purple-300" : "text-purple-700",
        border: isDarkMode ? "border-purple-700/50" : "border-purple-200",
      },
      ready: {
        label: "Ready",
        icon: ShoppingBag,
        bg: isDarkMode ? "bg-indigo-900/30" : "bg-indigo-50",
        text: isDarkMode ? "text-indigo-300" : "text-indigo-700",
        border: isDarkMode ? "border-indigo-700/50" : "border-indigo-200",
      },
      out_for_delivery: {
        label: "Out for Delivery",
        icon: Truck,
        bg: isDarkMode ? "bg-teal-900/30" : "bg-teal-50",
        text: isDarkMode ? "text-teal-300" : "text-teal-700",
        border: isDarkMode ? "border-teal-700/50" : "border-teal-200",
      },
      delivered: {
        label: "Delivered",
        icon: CheckCircle,
        bg: isDarkMode ? "bg-green-900/30" : "bg-green-50",
        text: isDarkMode ? "text-green-300" : "text-green-700",
        border: isDarkMode ? "border-green-700/50" : "border-green-200",
      },
      cancelled: {
        label: "Cancelled",
        icon: XCircle,
        bg: isDarkMode ? "bg-red-900/30" : "bg-red-50",
        text: isDarkMode ? "text-red-300" : "text-red-700",
        border: isDarkMode ? "border-red-700/50" : "border-red-200",
      },
    };
    return configs[status] || configs.pending;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSelectedBranch(null);
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    selectedBranch ||
    dateFrom ||
    dateTo;

  const handleSortChange = (value: string) => {
    const [field, order] = value.split(":");
    if (!field || !order) return;
    setSortBy(field);
    setSortOrder(order as "asc" | "desc");
    setCurrentPage(1);
  };

  const setDatePreset = (preset: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    switch (preset) {
      case "today":
        setDateFrom(formatDate(today));
        setDateTo(formatDate(today));
        break;
      case "yesterday":
        setDateFrom(formatDate(yesterday));
        setDateTo(formatDate(yesterday));
        break;
      case "last7days":
        setDateFrom(formatDate(last7Days));
        setDateTo(formatDate(today));
        break;
      case "last30days":
        setDateFrom(formatDate(last30Days));
        setDateTo(formatDate(today));
        break;
      case "thisMonth":
        setDateFrom(formatDate(thisMonth));
        setDateTo(formatDate(today));
        break;
      case "lastMonth":
        setDateFrom(formatDate(lastMonth));
        setDateTo(formatDate(lastMonthEnd));
        break;
      default:
        break;
    }
    setCurrentPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
        limit: "100", // Maximum allowed limit
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (selectedBranch) params.append("branch_id", selectedBranch.toString());
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (sortBy) {
        params.append("sort_by", sortBy);
        params.append("sort_order", sortOrder);
      }

      const response: ApiResponse<{ data: Order[] }> =
        await makeAuthenticatedRequest(
          `/orders?${params.toString()}`,
          { method: "GET" },
          true,
          user?.store_id,
          selectedBranch || undefined
        );

      if (response.success) {
        const ordersData = response.data.data || response.data;
        const csv = convertToCSV(ordersData);
        downloadCSV(
          csv,
          `orders-${new Date().toISOString().split("T")[0]}.csv`
        );
        setSuccessMessage("Orders exported successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export orders");
    } finally {
      setExporting(false);
    }
  };

  const handleDeliveryExport = async () => {
    setExportingDelivery(true);
    try {
      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
        limit: "100", // Maximum allowed limit
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (selectedBranch) params.append("branch_id", selectedBranch.toString());
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (sortBy) {
        params.append("sort_by", sortBy);
        params.append("sort_order", sortOrder);
      }

      const response: ApiResponse<{ data: Order[] }> =
        await makeAuthenticatedRequest(
          `/orders?${params.toString()}`,
          { method: "GET" },
          true,
          user?.store_id,
          selectedBranch || undefined
        );

      if (response.success) {
        const ordersData = response.data.data || response.data;

        // Fetch full order details with items for each order
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            try {
              const detailResponse: ApiResponse<{ data: Order }> =
                await makeAuthenticatedRequest(
                  `/orders/${order.order_id}?store_id=${user?.store_id}`,
                  { method: "GET" },
                  true,
                  user?.store_id,
                  order.branch_id
                );
              if (detailResponse.success) {
                return detailResponse.data.data || detailResponse.data;
              }
              return order;
            } catch (err) {
              console.error(`Failed to fetch order ${order.order_id}:`, err);
              return order;
            }
          })
        );

        const csv = convertToDeliveryCSV(ordersWithItems);
        downloadCSV(
          csv,
          `delivery-orders-${new Date().toISOString().split("T")[0]}.csv`
        );
        setSuccessMessage("Delivery orders exported successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error("Delivery export error:", err);
      alert("Failed to export delivery orders");
    } finally {
      setExportingDelivery(false);
    }
  };

  const convertToCSV = (orders: Order[]): string => {
    const headers = [
      "Order Number",
      "Customer Name",
      "Customer Phone",
      "Branch",
      "Status",
      "Items Count",
      "Total Amount",
      "Payment Method",
      "Created At",
    ];

    const rows = orders.map((order) => [
      order.order_number || "",
      order.customer_name || "",
      order.customer_phone || "",
      order.branch_name || "",
      order.order_status || "",
      order.items_count?.toString() || "0",
      order.total_amount?.toString() || "0",
      order.payment_method || "",
      order.created_at
        ? new Date(order.created_at).toLocaleString("en-IN")
        : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return csvContent;
  };

  const convertToDeliveryCSV = (orders: Order[]): string => {
    const headers = [
      "Order Number",
      "Customer Name",
      "Customer Phone",
      "Delivery Address",
      "Landmark",
      "Delivery Notes",
      "Items List",
      "Item Quantities",
      "Subtotal",
      "Delivery Charge",
      "Total Amount",
      "Payment Method",
      "Branch Name",
      "Branch Phone",
      "Order Status",
      "Created At",
    ];

    const rows = orders.map((order) => {
      const itemsList = (order.items || [])
        .map(
          (item) =>
            `${item.product_name}${
              item.variant_name ? ` (${item.variant_name})` : ""
            }`
        )
        .join("; ");

      const quantities = (order.items || [])
        .map((item) => `${item.product_name}: ${item.quantity}`)
        .join("; ");

      return [
        order.order_number || "",
        order.customer_name || "",
        order.customer_phone || "",
        order.delivery_address || "",
        order.delivery_landmark || "",
        order.delivery_notes || "",
        itemsList || "N/A",
        quantities || "N/A",
        order.subtotal?.toString() || "0",
        order.delivery_charge?.toString() || "0",
        order.total_amount?.toString() || "0",
        order.payment_method || "",
        order.branch_name || "",
        order.branch_phone || "",
        order.order_status || "",
        order.created_at
          ? new Date(order.created_at).toLocaleString("en-IN")
          : "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return csvContent;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <FeatureGuard
      feature="orders_enabled"
      fallback={
        <div className="p-6 text-center">
          <div className="border rounded-lg px-4 py-3 mb-4">
            <p className="text-yellow-700 dark:text-yellow-300">
              Orders feature is disabled for this store. Please contact support
              to enable it.
            </p>
          </div>
        </div>
      }
    >
      <RoleGuard
        requiredPermissions={["manage_orders"]}
        fallback={
          <div className="p-6 text-center">
            <div className="border rounded-lg px-4 py-3 mb-4">
              <p className="text-red-700 dark:text-red-300">
                Access denied. You do not have permission to view orders.
              </p>
            </div>
          </div>
        }
      >
        <div
          className={`min-h-screen transition-colors duration-300 ${
            isDarkMode ? "bg-slate-900" : "bg-gray-50"
          }`}
        >
          {/* Header */}
          <div
            className={`${
              isDarkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            } border-b sticky top-0 z-40 backdrop-blur-xl transition-all duration-300`}
          >
            <div className="px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Orders
                  </h1>
                  <p
                    className={`${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    } text-sm mt-1`}
                  >
                    Manage and track all customer orders
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="relative w-full sm:w-64">
                    <Search
                      size={18}
                      className={`absolute left-3 top-3 ${
                        isDarkMode ? "text-slate-400" : "text-gray-400"
                      }`}
                    />
                    <input
                      type="text"
                      aria-label="Search orders"
                      placeholder="Order #, customer name, phone..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className={`w-full h-10 pl-10 pr-4 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        isDarkMode
                          ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      }`}
                    />
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={exporting || loading || orders.length === 0}
                    className={`flex items-center justify-center gap-2 px-4 py-2 h-10 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                    title="Export orders to CSV"
                  >
                    <Download
                      size={16}
                      className={exporting ? "animate-pulse" : ""}
                    />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <button
                    onClick={handleDeliveryExport}
                    disabled={
                      exportingDelivery || loading || orders.length === 0
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-2 h-10 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      isDarkMode
                        ? "bg-green-700 border-green-600 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        : "bg-green-600 border-green-500 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                    title="Export for delivery partner (includes customer, address, items, price)"
                  >
                    <Truck
                      size={16}
                      className={exportingDelivery ? "animate-pulse" : ""}
                    />
                    <span className="hidden sm:inline">Delivery Export</span>
                    <span className="sm:hidden">Delivery</span>
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className={`flex items-center justify-center gap-2 px-4 py-2 h-10 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                    title="Refresh orders (R)"
                  >
                    <RefreshCw
                      size={16}
                      className={refreshing ? "animate-spin" : ""}
                    />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  <select
                    value={`${sortBy}:${sortOrder}`}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className={`h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    aria-label="Sort orders"
                  >
                    <option value="created_at:desc">Date (Newest First)</option>
                    <option value="created_at:asc">Date (Oldest First)</option>
                    <option value="total_amount:desc">Amount (High to Low)</option>
                    <option value="total_amount:asc">Amount (Low to High)</option>
                    <option value="order_status:asc">Status (A-Z)</option>
                    <option value="order_status:desc">Status (Z-A)</option>
                  </select>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 h-10 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      hasActiveFilters
                        ? isDarkMode
                          ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                          : "bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                        : isDarkMode
                        ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Filter size={16} />
                    <span className="hidden sm:inline">Filters</span>
                    {hasActiveFilters && (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">
                        {
                          [
                            searchTerm,
                            statusFilter !== "all",
                            selectedBranch,
                            dateFrom,
                            dateTo,
                          ].filter(Boolean).length
                        }
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 sm:px-6 py-4 sm:py-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
              {[
                {
                  label: "Total",
                  value: totalCount,
                  status: "all",
                  color: "blue",
                },
                {
                  label: "Pending",
                  value: orderStats.pending,
                  status: "pending",
                  color: "yellow",
                },
                {
                  label: "Confirmed",
                  value: orderStats.confirmed,
                  status: "confirmed",
                  color: "blue",
                },
                {
                  label: "Preparing",
                  value: orderStats.preparing,
                  status: "preparing",
                  color: "purple",
                },
                {
                  label: "Ready",
                  value: orderStats.ready,
                  status: "ready",
                  color: "indigo",
                },
                {
                  label: "Delivered",
                  value: orderStats.delivered,
                  status: "delivered",
                  color: "green",
                },
                {
                  label: "Cancelled",
                  value: orderStats.cancelled,
                  status: "cancelled",
                  color: "red",
                },
              ].map((stat) => (
                <button
                  key={stat.label}
                  onClick={() => {
                    setStatusFilter(stat.status);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg border p-4 text-left transition-all duration-200 hover:shadow-md ${
                    statusFilter === stat.status
                      ? isDarkMode
                        ? "bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/50"
                        : "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                      : isDarkMode
                      ? "bg-slate-800 border-slate-700 hover:bg-slate-750"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    } mb-1`}
                  >
                    {stat.label}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stat.value}
                  </p>
                </button>
              ))}
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div
                className={`${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-gray-200"
                } rounded-lg border p-4 mb-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-base font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Filters
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className={`text-sm font-medium ${
                        isDarkMode
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-700"
                      } flex items-center gap-1.5 transition-colors`}
                    >
                      <X size={16} />
                      <span>Clear all</span>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {/* Quick Date Presets */}
                  <div>
                    <label
                      className={`block text-sm font-medium ${
                        isDarkMode ? "text-slate-300" : "text-gray-700"
                      } mb-2`}
                    >
                      Quick Date Filters
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Today", value: "today" },
                        { label: "Yesterday", value: "yesterday" },
                        { label: "Last 7 Days", value: "last7days" },
                        { label: "Last 30 Days", value: "last30days" },
                        { label: "This Month", value: "thisMonth" },
                        { label: "Last Month", value: "lastMonth" },
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setDatePreset(preset.value)}
                          className={`px-3 py-1.5 h-8 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-200 ${
                            isDarkMode
                              ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Filters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-slate-300" : "text-gray-700"
                        } mb-2`}
                      >
                        Branch
                      </label>
                      <select
                        value={selectedBranch || ""}
                        onChange={(e) => {
                          setSelectedBranch(
                            e.target.value ? parseInt(e.target.value) : null
                          );
                          setCurrentPage(1);
                        }}
                        className={`w-full h-10 px-4 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="">All Branches</option>
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
                      <label
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-slate-300" : "text-gray-700"
                        } mb-2`}
                      >
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className={`w-full h-10 px-4 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="all">All Statuses</option>
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
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-slate-300" : "text-gray-700"
                        } mb-2`}
                      >
                        From Date
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                          setCurrentPage(1);
                        }}
                        className={`w-full h-10 px-4 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-slate-300" : "text-gray-700"
                        } mb-2`}
                      >
                        To Date
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                          setDateTo(e.target.value);
                          setCurrentPage(1);
                        }}
                        className={`w-full h-10 px-4 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Items Per Page */}
                  <div className="flex items-center gap-4">
                    <label
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      Items per page:
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className={`h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        isDarkMode
                          ? "bg-slate-700 border-slate-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div
                className={`rounded-lg border p-4 mb-6 flex items-center gap-3 animate-in slide-in-from-top-5 ${
                  isDarkMode
                    ? "bg-green-900/30 border-green-700/50"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <CheckCircle
                  size={20}
                  className={isDarkMode ? "text-green-400" : "text-green-600"}
                />
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-green-300" : "text-green-800"
                  }`}
                >
                  {successMessage}
                </p>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className={`ml-auto ${
                    isDarkMode
                      ? "text-green-400 hover:text-green-300"
                      : "text-green-600 hover:text-green-700"
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className={`rounded-lg border p-4 mb-6 flex items-center gap-3 ${
                  isDarkMode
                    ? "bg-red-900/30 border-red-700/50"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <XCircle
                  size={20}
                  className={isDarkMode ? "text-red-400" : "text-red-600"}
                />
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-red-300" : "text-red-800"
                  }`}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Orders Table */}
            {loading ? (
              <div
                className={`${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-gray-200"
                } rounded-lg border p-12`}
              >
                <div className="flex flex-col items-center justify-center gap-4">
                  <div
                    className={`w-12 h-12 border-4 ${
                      isDarkMode
                        ? "border-slate-700 border-t-blue-500"
                        : "border-blue-200 border-t-blue-600"
                    } rounded-full animate-spin`}
                  ></div>
                  <p
                    className={`${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    } font-medium`}
                  >
                    Loading orders...
                  </p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div
                className={`${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-gray-200"
                } rounded-lg border p-12 text-center`}
              >
                <Package
                  size={48}
                  className={`mx-auto ${
                    isDarkMode ? "text-slate-600" : "text-gray-300"
                  } mb-3`}
                />
                <p
                  className={`${
                    isDarkMode ? "text-slate-400" : "text-gray-600"
                  } font-medium`}
                >
                  No orders found
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className={`mt-4 text-sm ${
                      isDarkMode
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-blue-600 hover:text-blue-700"
                    }`}
                  >
                    Clear filters to see all orders
                  </button>
                )}
              </div>
            ) : (
              <div
                className={`${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-gray-200"
                } rounded-lg border overflow-hidden`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead
                      className={isDarkMode ? "bg-slate-900" : "bg-gray-50"}
                    >
                      <tr>
                        <th
                          className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Order
                        </th>
                        <th
                          className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Customer
                        </th>
                        <th
                          className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Branch
                        </th>
                        <th
                          className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Payment Method
                        </th>
                        <th
                          className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Items
                        </th>
                        <th
                          className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Amount
                        </th>
                        <th
                          className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Status
                        </th>
                        <th
                          className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Date
                        </th>
                        <th
                          className={`px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isDarkMode ? "divide-slate-700" : "divide-gray-200"
                      }`}
                    >
                      {orders.map((order) => {
                        const statusConfig = getStatusConfig(
                          order.order_status
                        );
                        const StatusIcon = statusConfig.icon;
                        const nextStatus = getNextStatus(order.order_status);
                        const quickActionLabel = getQuickActionLabel(
                          order.order_status
                        );
                        return (
                          <tr
                            key={order.order_id}
                            onClick={(e) => {
                              // Don't navigate if clicking on action buttons or dropdown
                              const target = e.target as HTMLElement;
                              if (
                                target.closest("select") ||
                                target.closest("a") ||
                                target.closest("button") ||
                                target.closest('[role="button"]')
                              ) {
                                return;
                              }
                              window.location.href = `/orders/${order.order_id}`;
                            }}
                            className={`transition-all cursor-pointer ${
                              isDarkMode
                                ? "hover:bg-slate-750 hover:shadow-lg"
                                : "hover:bg-gray-50 hover:shadow-md"
                            }`}
                          >
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div>
                                <div
                                  className={`font-semibold text-sm ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  #{order.order_number}
                                </div>
                                <div className="sm:hidden mt-1">
                                  {order.payment_method === "cod" ? (
                                    <span
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                                        isDarkMode
                                          ? "bg-orange-900/30 text-orange-300"
                                          : "bg-orange-50 text-orange-700"
                                      }`}
                                    >
                                      COD
                                    </span>
                                  ) : order.payment_method === "online" ? (
                                    <span
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                                        isDarkMode
                                          ? "bg-green-900/30 text-green-300"
                                          : "bg-green-50 text-green-700"
                                      }`}
                                    >
                                      Online
                                    </span>
                                  ) : (
                                    <span
                                      className={`text-xs ${
                                        isDarkMode
                                          ? "text-slate-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {order.payment_method?.toUpperCase() ||
                                        "N/A"}
                                    </span>
                                  )}
                                </div>
                                <div className="sm:hidden mt-1">
                                  <div
                                    className={`text-xs font-medium ${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {order.customer_name || "N/A"}
                                  </div>
                                  <div
                                    className={`text-xs flex items-center gap-1 ${
                                      isDarkMode
                                        ? "text-slate-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    <Phone size={10} />
                                    {order.customer_phone || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                              <div>
                                <div
                                  className={`font-medium text-sm ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {order.customer_name || "N/A"}
                                </div>
                                <div
                                  className={`text-xs flex items-center gap-1 ${
                                    isDarkMode
                                      ? "text-slate-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  <Phone size={12} />
                                  {order.customer_phone || "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                              <div
                                className={`text-sm ${
                                  isDarkMode
                                    ? "text-slate-300"
                                    : "text-gray-700"
                                }`}
                              >
                                {order.branch_name || "N/A"}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                              <div className="flex items-center gap-1.5">
                                {order.payment_method === "cod" ? (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                      isDarkMode
                                        ? "bg-orange-900/30 text-orange-300 border border-orange-700/50"
                                        : "bg-orange-50 text-orange-700 border border-orange-200"
                                    }`}
                                  >
                                    <ShoppingBag size={12} />
                                    COD
                                  </span>
                                ) : order.payment_method === "online" ? (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                      isDarkMode
                                        ? "bg-green-900/30 text-green-300 border border-green-700/50"
                                        : "bg-green-50 text-green-700 border border-green-200"
                                    }`}
                                  >
                                    <CreditCard size={12} />
                                    Online
                                  </span>
                                ) : (
                                  <span
                                    className={`text-xs ${
                                      isDarkMode
                                        ? "text-slate-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {order.payment_method?.toUpperCase() ||
                                      "N/A"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                              <div
                                className={`flex items-center gap-1 ${
                                  isDarkMode
                                    ? "text-slate-300"
                                    : "text-gray-700"
                                }`}
                              >
                                <Package size={16} />
                                <span className="font-medium text-sm">
                                  {order.items_count || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div
                                className={`font-semibold text-sm ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                ₹
                                {parseFloat(
                                  String(order.total_amount || 0)
                                ).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                              >
                                <StatusIcon size={14} />
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                              <div
                                className={`text-sm ${
                                  isDarkMode
                                    ? "text-slate-400"
                                    : "text-gray-500"
                                }`}
                              >
                                {order.created_at
                                  ? new Date(
                                      order.created_at
                                    ).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "N/A"}
                              </div>
                              <div
                                className={`text-xs ${
                                  isDarkMode
                                    ? "text-slate-500"
                                    : "text-gray-400"
                                }`}
                              >
                                {order.created_at
                                  ? new Date(
                                      order.created_at
                                    ).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </div>
                            </td>
                            <td
                              className="px-4 sm:px-6 py-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-2 flex-nowrap">
                                {nextStatus && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickAction(
                                        order.order_id,
                                        order.order_status
                                      );
                                    }}
                                    disabled={
                                      updatingOrderId === order.order_id
                                    }
                                    className={`h-9 px-3 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${
                                      updatingOrderId === order.order_id
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    } ${
                                      isDarkMode
                                        ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95"
                                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95"
                                    }`}
                                    title={`Quick action: ${quickActionLabel}`}
                                  >
                                    {updatingOrderId === order.order_id ? (
                                      <Loader2
                                        size={14}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <>
                                        <span className="hidden lg:inline">
                                          {quickActionLabel}
                                        </span>
                                        <span className="lg:hidden">Next</span>
                                      </>
                                    )}
                                  </button>
                                )}
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                    {updatingOrderId === order.order_id ? (
                                      <Loader2
                                        size={14}
                                        className={`${statusConfig.text} animate-spin`}
                                      />
                                    ) : (
                                      <StatusIcon
                                        size={14}
                                        className={statusConfig.text}
                                      />
                                    )}
                                  </div>
                                  <select
                                    value={order.order_status}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleStatusUpdate(
                                        order.order_id,
                                        e.target.value
                                      );
                                    }}
                                    disabled={
                                      updatingOrderId === order.order_id
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className={`h-9 text-sm font-semibold pl-9 pr-8 rounded-lg border-2 transition-all duration-200 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 min-w-[130px] ${
                                      updatingOrderId === order.order_id
                                        ? "opacity-60 cursor-not-allowed"
                                        : "cursor-pointer"
                                    } ${
                                      isDarkMode
                                        ? `${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} hover:opacity-90 focus:ring-blue-500`
                                        : `${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} hover:shadow-md focus:ring-blue-500`
                                    }`}
                                    style={{
                                      backgroundImage:
                                        updatingOrderId === order.order_id
                                          ? "none"
                                          : isDarkMode
                                          ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`
                                          : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                      backgroundRepeat: "no-repeat",
                                      backgroundPosition: "right 0.5rem center",
                                      backgroundSize: "10px",
                                    }}
                                    title={
                                      updatingOrderId === order.order_id
                                        ? "Updating status..."
                                        : "Update order status"
                                    }
                                  >
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
                                <Link
                                  href={`/orders/${order.order_id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                                    isDarkMode
                                      ? "text-slate-400 hover:text-white hover:bg-slate-700 hover:shadow-lg"
                                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-100 hover:shadow-md"
                                  }`}
                                  title="View order details"
                                >
                                  <Eye size={16} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className={`${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-gray-200"
                } rounded-lg border mt-6 px-6 py-4 flex items-center justify-between`}
              >
                <div
                  className={`text-sm ${
                    isDarkMode ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  Showing{" "}
                  <span
                    className={`font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span
                    className={`font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {Math.min(currentPage * itemsPerPage, totalCount)}
                  </span>{" "}
                  of{" "}
                  <span
                    className={`font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {totalCount}
                  </span>{" "}
                  orders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-10 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : isDarkMode
                              ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
}
