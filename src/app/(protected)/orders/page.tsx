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
  }, [currentPage, searchTerm, statusFilter, selectedBranch]);

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
        limit: "20",
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
          setTotalPages(
            Math.ceil(response.pagination.total / response.pagination.limit)
          );
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
    if (
      !confirm(
        `Are you sure you want to update this order status to ${newStatus.replace(
          "_",
          " "
        )}?`
      )
    ) {
      return;
    }

    try {
      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        `/orders/${orderId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ order_status: newStatus }),
        }
      );

      if (response.success) {
        fetchOrders();
      } else {
        alert(response.message || "Failed to update order status");
      }
    } catch (err) {
      console.error("Update order status error:", err);
      alert(
        err instanceof Error ? err.message : "Failed to update order status"
      );
    }
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
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || selectedBranch;

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
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      hasActiveFilters
                        ? isDarkMode
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-blue-600 border-blue-500 text-white"
                        : isDarkMode
                        ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Filter size={18} />
                    Filters
                    {hasActiveFilters && (
                      <span
                        className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                          isDarkMode ? "bg-blue-500" : "bg-blue-500"
                        }`}
                      >
                        {
                          [
                            searchTerm,
                            statusFilter !== "all",
                            selectedBranch,
                          ].filter(Boolean).length
                        }
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
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
                    className={`font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Filters
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className={`text-sm ${
                        isDarkMode
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-700"
                      } flex items-center gap-1`}
                    >
                      <X size={16} />
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${
                        isDarkMode ? "text-slate-300" : "text-gray-700"
                      } mb-2`}
                    >
                      Search
                    </label>
                    <div className="relative">
                      <Search
                        size={18}
                        className={`absolute left-3 top-3 ${
                          isDarkMode ? "text-slate-400" : "text-gray-400"
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Order #, customer name, phone..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        }`}
                      />
                    </div>
                  </div>
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
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode
                          ? "bg-slate-700 border-slate-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
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
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
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
                  <table className="w-full">
                    <thead
                      className={isDarkMode ? "bg-slate-900" : "bg-gray-50"}
                    >
                      <tr>
                        <th
                          className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Order
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Customer
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Branch
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Items
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Amount
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Status
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          Date
                        </th>
                        <th
                          className={`px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider ${
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
                        return (
                          <tr
                            key={order.order_id}
                            className={`transition-colors ${
                              isDarkMode
                                ? "hover:bg-slate-750"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div
                                  className={`font-semibold ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  #{order.order_number}
                                </div>
                                <div
                                  className={`text-sm ${
                                    isDarkMode
                                      ? "text-slate-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {order.payment_method?.toUpperCase() || "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div
                                  className={`font-medium ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {order.customer_name || "N/A"}
                                </div>
                                <div
                                  className={`text-sm flex items-center gap-1 ${
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
                            <td className="px-6 py-4">
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`flex items-center gap-1 ${
                                  isDarkMode
                                    ? "text-slate-300"
                                    : "text-gray-700"
                                }`}
                              >
                                <Package size={16} />
                                <span className="font-medium">
                                  {order.items_count || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`font-semibold ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                ₹
                                {parseFloat(
                                  String(order.total_amount || 0)
                                ).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                              >
                                <StatusIcon size={14} />
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
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
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <select
                                  value={order.order_status}
                                  onChange={(e) =>
                                    handleStatusUpdate(
                                      order.order_id,
                                      e.target.value
                                    )
                                  }
                                  className={`text-xs px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    isDarkMode
                                      ? "bg-slate-700 border-slate-600 text-slate-300"
                                      : "bg-white border-gray-300 text-gray-700"
                                  }`}
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
                                <Link
                                  href={`/orders/${order.order_id}`}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isDarkMode
                                      ? "text-slate-400 hover:text-white hover:bg-slate-700"
                                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                  }`}
                                >
                                  <Eye size={18} />
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
                    {(currentPage - 1) * 20 + 1}
                  </span>{" "}
                  to{" "}
                  <span
                    className={`font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {Math.min(currentPage * 20, totalCount)}
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
                    className={`p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ChevronLeft size={18} />
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
                          className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
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
                    className={`p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ChevronRight size={18} />
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
