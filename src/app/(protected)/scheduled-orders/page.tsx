"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { ScheduledOrder, ApiResponse, Pagination, Branch } from "@/types";
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
  Filter,
  X,
  Truck,
  ChefHat,
  ShoppingBag,
  Play,
  Pause,
  Ban,
} from "lucide-react";
import Link from "next/link";

interface ScheduledOrderStats {
  total: number;
  active: number;
  paused: number;
  cancelled: number;
  pending: number;
}

export default function ScheduledOrdersPage() {
  const [scheduledOrders, setScheduledOrders] = useState<ScheduledOrder[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orderStats, setOrderStats] = useState<ScheduledOrderStats>({
    total: 0,
    active: 0,
    paused: 0,
    cancelled: 0,
    pending: 0,
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
    fetchScheduledOrders();
  }, [currentPage, searchTerm, statusFilter, selectedBranch]);

  const fetchScheduledOrders = async () => {
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

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (selectedBranch) {
        params.append("branch_id", selectedBranch.toString());
      }

      const response: ApiResponse<{
        data: ScheduledOrder[];
        pagination: Pagination;
      }> = await makeAuthenticatedRequest(
        `/scheduled-orders?${params.toString()}`,
        { method: "GET" },
        true,
        user.store_id,
        selectedBranch || undefined
      );

      if (response.success) {
        const ordersData = response.data.data || response.data;
        setScheduledOrders(ordersData);

        if (response.pagination) {
          setTotalPages(
            Math.ceil(response.pagination.total / response.pagination.limit)
          );
          setTotalCount(response.pagination.total);
        }

        // Calculate stats
        const stats: ScheduledOrderStats = {
          total: totalCount,
          active: ordersData.filter((o) => o.status === "active").length,
          paused: ordersData.filter((o) => o.status === "paused").length,
          cancelled: ordersData.filter((o) => o.status === "cancelled").length,
          pending: ordersData.filter((o) => o.order_status === "pending")
            .length,
        };
        setOrderStats(stats);
      } else {
        setError(response.message || "Failed to fetch scheduled orders");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch scheduled orders");
      console.error("Error fetching scheduled orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (scheduledOrderId: number) => {
    if (
      !confirm("Accept this scheduled order and convert it to a regular order?")
    ) {
      return;
    }

    try {
      const response: ApiResponse<any> = await makeAuthenticatedRequest(
        `/scheduled-orders/${scheduledOrderId}/accept`,
        { method: "POST" },
        true,
        user?.store_id || null,
        selectedBranch || undefined
      );

      if (response.success) {
        alert("Scheduled order accepted and converted to order successfully!");
        fetchScheduledOrders();
      } else {
        alert(response.message || "Failed to accept scheduled order");
      }
    } catch (err: any) {
      alert(err.message || "Failed to accept scheduled order");
      console.error("Error accepting scheduled order:", err);
    }
  };

  const handleRejectOrder = async (scheduledOrderId: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason || reason.trim() === "") {
      return;
    }

    try {
      const response: ApiResponse<any> = await makeAuthenticatedRequest(
        `/scheduled-orders/${scheduledOrderId}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason }),
        },
        true,
        user?.store_id || null,
        selectedBranch || undefined
      );

      if (response.success) {
        alert("Scheduled order rejected successfully");
        fetchScheduledOrders();
      } else {
        alert(response.message || "Failed to reject scheduled order");
      }
    } catch (err: any) {
      alert(err.message || "Failed to reject scheduled order");
      console.error("Error rejecting scheduled order:", err);
    }
  };

  const getFrequencyText = (order: ScheduledOrder) => {
    switch (order.frequency) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "biweekly":
        return "Bi-weekly";
      case "monthly":
        return "Monthly";
      case "custom":
        return `Every ${order.frequency_value || 0} days`;
      default:
        return order.frequency;
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
      active: {
        label: "Active",
        icon: Play,
        bg: isDarkMode ? "bg-green-900/30" : "bg-green-50",
        text: isDarkMode ? "text-green-300" : "text-green-700",
        border: isDarkMode ? "border-green-700/50" : "border-green-200",
      },
      paused: {
        label: "Paused",
        icon: Pause,
        bg: isDarkMode ? "bg-yellow-900/30" : "bg-yellow-50",
        text: isDarkMode ? "text-yellow-300" : "text-yellow-700",
        border: isDarkMode ? "border-yellow-700/50" : "border-yellow-200",
      },
      cancelled: {
        label: "Cancelled",
        icon: Ban,
        bg: isDarkMode ? "bg-red-900/30" : "bg-red-50",
        text: isDarkMode ? "text-red-300" : "text-red-700",
        border: isDarkMode ? "border-red-700/50" : "border-red-200",
      },
      completed: {
        label: "Completed",
        icon: CheckCircle,
        bg: isDarkMode ? "bg-blue-900/30" : "bg-blue-50",
        text: isDarkMode ? "text-blue-300" : "text-blue-700",
        border: isDarkMode ? "border-blue-700/50" : "border-blue-200",
      },
    };
    return configs[status] || configs.active;
  };

  const getOrderStatusConfig = (status: string) => {
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
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSelectedBranch(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== "all" || selectedBranch;

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
        allowedRoles={["owner", "manager"]}
        fallback={
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">
              You don't have permission to view scheduled orders.
            </p>
          </div>
        }
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Scheduled Orders
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage recurring orders and deliveries
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Scheduled
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {orderStats.total}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {orderStats.active}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Paused
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {orderStats.paused}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pending Delivery
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {orderStats.pending}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Cancelled
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {orderStats.cancelled}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {branches.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={selectedBranch || ""}
                    onChange={(e) =>
                      setSelectedBranch(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading scheduled orders...
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={fetchScheduledOrders}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : scheduledOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                No scheduled orders found
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Frequency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Next Delivery
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Order Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {scheduledOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        const orderStatusConfig = getOrderStatusConfig(
                          order.order_status
                        );
                        const StatusIcon = statusConfig.icon;
                        const OrderStatusIcon = orderStatusConfig.icon;

                        return (
                          <tr
                            key={order.scheduled_order_id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {order.customer_name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {order.customer_phone || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {getFrequencyText(order)}
                              </div>
                              {order.branch_name && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {order.branch_name}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(order.next_delivery_date)}
                              </div>
                              {order.delivery_time && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {order.delivery_time}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${orderStatusConfig.bg} ${orderStatusConfig.text} ${orderStatusConfig.border} border`}
                              >
                                <OrderStatusIcon className="w-3 h-3 mr-1" />
                                {orderStatusConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              ₹{order.total_amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <Link
                                  href={`/scheduled-orders/${order.scheduled_order_id}`}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                                {order.order_status === "pending" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleAcceptOrder(
                                          order.scheduled_order_id
                                        )
                                      }
                                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                      title="Accept Order"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRejectOrder(
                                          order.scheduled_order_id
                                        )
                                      }
                                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                      title="Reject Order"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-3">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing page {currentPage} of {totalPages} ({totalCount}{" "}
                    total)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
}
