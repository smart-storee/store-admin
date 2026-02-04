"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { ApiResponse } from "@/types";
import {
  Search,
  Calendar,
  Filter,
  X,
  Eye,
  Loader2,
  RefreshCw,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ShoppingBag,
  Package,
  Receipt,
  Info,
} from "lucide-react";
import Link from "next/link";

interface PaymentLog {
  log_id: number;
  order_id: number | null;
  txn_id: string | null;
  status: "success" | "failure" | "pending";
  amount: number | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  order_number?: string;
  order_amount?: number;
  order_payment_status?: string;
  order_payment_method?: string;
  order_status?: string;
}

interface PaymentLogsResponse {
  data: PaymentLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export default function PaymentLogsPage() {
  const { user } = useAuth();
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orderIdFilter, setOrderIdFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"cod" | "online">("cod"); // New state for tabs
  const [updatingPayment, setUpdatingPayment] = useState<number | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateOrderId, setUpdateOrderId] = useState<number | null>(null);
  const [updateOrderStatus, setUpdateOrderStatus] = useState<string>("");
  const pageSize = 20;

  const normalizeDateRange = (nextFrom: string, nextTo: string) => {
    if (nextFrom && nextTo && nextFrom > nextTo) {
      return { from: nextFrom, to: nextFrom };
    }
    return { from: nextFrom, to: nextTo };
  };

  useEffect(() => {
    if (user?.store_id) {
      fetchPaymentLogs();
    }
  }, [
    user?.store_id,
    currentPage,
    statusFilter,
    orderIdFilter,
    dateFrom,
    dateTo,
    activeTab, // Refetch when tab changes
  ]);

  // Reset to first page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fetchPaymentLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "20");

      // Add payment method filter based on active tab
      if (activeTab === "cod") {
        params.append("payment_method", "cod");
        // For COD, apply status filter if not "all"
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }
      } else if (activeTab === "online") {
        params.append("payment_method", "online");
        // For online, API automatically filters for success only
        // Don't send status filter for online tab
      }

      if (orderIdFilter) {
        params.append("order_id", orderIdFilter);
      }

      if (dateFrom) {
        params.append("from_date", dateFrom);
      }

      if (dateTo) {
        params.append("to_date", dateTo);
      }

      console.log("Fetching payment logs with params:", params.toString());
      const response = await makeAuthenticatedRequest(
        `/payment-logs?${params.toString()}`,
        {},
        true,
        user?.store_id,
        user?.branch_id
      );

      console.log("API Response:", response);
      console.log("Debug info:", response.debug);

      if (response.success && response.data) {
        // The data is directly in response.data, not response.data.data
        const logs = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        console.log("Payment logs data:", logs);
        console.log("Number of logs:", logs.length);
        console.log("First log sample:", logs[0]);
        setPaymentLogs(logs);

        // Update pagination - handle both response structures
        const totalItems = response.pagination?.total || logs.length;
        console.log("Total items:", totalItems);
        setTotalCount(totalItems);
        setTotalPages(Math.ceil(totalItems / 20));
      } else {
        throw new Error(response.message || "Failed to fetch payment logs");
      }
    } catch (err: any) {
      console.error("Error fetching payment logs:", err);
      setError(err.message || "Failed to load payment logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPaymentLogs();
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setOrderIdFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || orderIdFilter || dateFrom || dateTo;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatDateOnly = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTimeOnly = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  const formatCurrency = (amount: number | string | null) => {
    if (amount === null || amount === undefined) return "N/A";
    // Convert string to number if needed
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return `₹${numAmount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Success",
      },
      failure: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircle,
        label: "Failed",
      },
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Clock,
        label: "Pending",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      icon: Clock,
      label: status,
    };

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  // Filter logs based on search term only (API handles tab filtering)
  const normalizeText = (value?: string | null) =>
    value ? value.toLowerCase().trim().replace(/^#/, "") : "";
  const normalizeDigits = (value: string) => value.replace(/\D/g, "");

  const filteredLogs = paymentLogs.filter((log) => {
    // Filter out null/undefined logs
    if (!log) return false;

    // Apply search filter
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      const searchDigits = normalizeDigits(searchTerm);
      return (
        (normalizeText(log.txn_id).includes(normalizedSearch) ?? false) ||
        (normalizeText(log.order_number).includes(normalizedSearch) ??
          false) ||
        (searchDigits
          ? log.order_id?.toString().includes(searchDigits)
          : false)
      );
    }
    return true;
  });

  // Debug: Log filtered logs
  console.log("Payment logs state:", paymentLogs);
  console.log("Filtered logs:", filteredLogs);
  console.log("Active tab:", activeTab);
  console.log("Total count:", totalCount);

  // Calculate counts for each tab (use totalCount from API)
  const codPaymentCount = activeTab === "cod" ? totalCount : 0;
  const onlinePaymentCount = activeTab === "online" ? totalCount : 0;

  // Function to update payment status for COD orders
  const handleUpdatePaymentStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    try {
      setUpdatingPayment(orderId);

      // First, check order delivery status
      const orderResponse = await makeAuthenticatedRequest(
        `/orders/${orderId}`,
        {},
        true,
        user?.store_id,
        user?.branch_id
      );

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error("Failed to fetch order details");
      }

      const order = orderResponse.data;

      // Check if order is delivered - payment status can only be updated after delivery
      if (order.order_status !== "delivered") {
        alert(
          `Cannot update payment status. Order must be delivered first. Current status: ${order.order_status}`
        );
        setUpdatingPayment(null);
        return;
      }

      // Update payment status
      const updateResponse = await makeAuthenticatedRequest(
        `/orders/${orderId}/payment-status`,
        {
          method: "PUT",
          body: JSON.stringify({ payment_status: newStatus }),
        },
        true,
        user?.store_id,
        user?.branch_id
      );

      if (updateResponse.success) {
        alert("Payment status updated successfully!");
        setShowUpdateModal(false);
        setUpdateOrderId(null);
        setUpdateOrderStatus("");
        fetchPaymentLogs(); // Refresh the list
      } else {
        throw new Error(
          updateResponse.message || "Failed to update payment status"
        );
      }
    } catch (err: any) {
      console.error("Error updating payment status:", err);
      alert(err.message || "Failed to update payment status");
    } finally {
      setUpdatingPayment(null);
    }
  };

  return (
    <RoleGuard requiredPermissions={["manage_orders"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Payment Logs
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  View and track all payment transactions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                    showFilters
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab("cod")}
                className={`flex-1 px-6 py-4 font-medium text-sm transition-all ${
                  activeTab === "cod"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span>COD</span>
                  {codPaymentCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100">
                      {codPaymentCount}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 opacity-75">Pending & Success</p>
              </button>
              <button
                onClick={() => setActiveTab("online")}
                className={`flex-1 px-6 py-4 font-medium text-sm transition-all ${
                  activeTab === "online"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Online Payment</span>
                  {onlinePaymentCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100">
                      {onlinePaymentCount}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 opacity-75">Success Only</p>
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {activeTab === "cod" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">
                        All Status (Pending & Success)
                      </option>
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      const nextFrom = e.target.value;
                      const { from, to } = normalizeDateRange(
                        nextFrom,
                        dateTo
                      );
                      setDateFrom(from);
                      setDateTo(to);
                      setCurrentPage(1);
                    }}
                    max={dateTo || undefined}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      const nextTo = e.target.value;
                      const { from, to } = normalizeDateRange(
                        dateFrom,
                        nextTo
                      );
                      setDateFrom(from);
                      setDateTo(to);
                      setCurrentPage(1);
                    }}
                    min={dateFrom || undefined}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          {!loading && !error && filteredLogs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                      Total Transactions
                    </p>
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                      {activeTab === "cod"
                        ? codPaymentCount
                        : onlinePaymentCount}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-200 dark:bg-indigo-900/40 rounded-lg">
                    <Receipt className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {formatCurrency(
                        filteredLogs.reduce((sum, log) => {
                          const amount =
                            typeof log.amount === "string"
                              ? parseFloat(log.amount)
                              : log.amount || 0;
                          return sum + amount;
                        }, 0)
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-green-200 dark:bg-green-900/40 rounded-lg">
                    <CreditCard className="h-6 w-6 text-green-700 dark:text-green-300" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {filteredLogs.length > 0
                        ? Math.round(
                            (filteredLogs.filter(
                              (log) => log.status === "success"
                            ).length /
                              filteredLogs.length) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="p-3 bg-blue-200 dark:bg-blue-900/40 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Transaction ID, Order Number, or Order ID..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-5">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                  Error Loading Payment Logs
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-16">
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full animate-pulse"></div>
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400 relative" />
                </div>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Loading payment logs...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Please wait while we fetch your transaction data
                </p>
              </div>
            </div>
          )}

          {/* Payment Logs Table */}
          {!loading && !error && (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 border-b-2 border-gray-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Transaction ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                              <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-full mb-4">
                                <CreditCard className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                No Payment Logs Found
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                {activeTab === "cod"
                                  ? "No COD payments match your current filters. Try adjusting your search or filter criteria."
                                  : "No successful online payments found. Only successful online payments are shown in this tab."}
                              </p>
                              {hasActiveFilters && (
                                <button
                                  onClick={clearFilters}
                                  className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                >
                                  Clear Filters
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log, index) => (
                          <tr
                            key={
                              log.log_id && log.log_id !== 0
                                ? log.log_id
                                : `cod-${log.order_id}-${index}`
                            }
                            className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-150 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-slate-900/50 px-2 py-1 rounded">
                                  {log.txn_id || (
                                    <span className="text-gray-400 dark:text-gray-500 italic">
                                      N/A
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {log.order_id ? (
                                <Link
                                  href={`/orders/${log.order_id}`}
                                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors"
                                >
                                  <Package className="h-4 w-4" />#
                                  {log.order_number || log.order_id}
                                </Link>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-base font-bold text-gray-900 dark:text-white">
                                {formatCurrency(log.amount)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(log.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {log.payment_method === "cod" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                  COD
                                </span>
                              ) : log.payment_method === "online" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                                  <CreditCard className="h-3.5 w-3.5" />
                                  Online
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {log.payment_method || "N/A"}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatDateOnly(log.created_at)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {formatTimeOnly(log.created_at)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedLog(log);
                                    setShowLogDetails(true);
                                  }}
                                  className="p-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                                  title="View Details"
                                >
                                  <Eye className="h-5 w-5" />
                                </button>
                                {activeTab === "cod" &&
                                  log.order_id &&
                                  log.order_payment_status === "pending" &&
                                  log.order_status === "delivered" && (
                                    <button
                                      onClick={() => {
                                        setUpdateOrderId(log.order_id!);
                                        setUpdateOrderStatus(
                                          log.order_payment_status || "pending"
                                        );
                                        setShowUpdateModal(true);
                                      }}
                                      disabled={
                                        updatingPayment === log.order_id
                                      }
                                      className="p-2.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                      title="Update Payment Status"
                                    >
                                      {updatingPayment === log.order_id ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-5 w-5" />
                                      )}
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages >= 1 && (
                <div className="bg-gray-50 px-6 py-4 dark:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * pageSize + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalCount)}
                      </span>{" "}
                      of <span className="font-medium">{totalCount}</span>{" "}
                      results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: totalPages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                            currentPage === page
                              ? "z-10 bg-indigo-50 text-indigo-600 border border-indigo-500 dark:bg-indigo-600 dark:text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Payment Log Details Modal */}
          {showLogDetails && selectedLog && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <CreditCard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Payment Log Details
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Transaction information
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowLogDetails(false);
                        setSelectedLog(null);
                      }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto flex-1 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Transaction Information Card */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                          <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          Transaction
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Transaction ID
                          </label>
                          <p className="text-sm font-mono font-medium text-gray-900 dark:text-white break-all">
                            {selectedLog.txn_id || (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                N/A
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Status
                          </label>
                          <div className="mt-1">
                            {getStatusBadge(selectedLog.status)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Amount
                          </label>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(selectedLog.amount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Information Card */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                          <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          Order
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Order Number
                          </label>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedLog.order_id ? (
                              <Link
                                href={`/orders/${selectedLog.order_id}`}
                                className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
                              >
                                <Package className="h-3.5 w-3.5" />#
                                {selectedLog.order_number ||
                                  selectedLog.order_id}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                N/A
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Order Status
                          </label>
                          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {selectedLog.order_status || (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                N/A
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Payment Status
                          </label>
                          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {selectedLog.order_payment_status || (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                N/A
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method Card */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                          {selectedLog.payment_method === "cod" ? (
                            <ShoppingBag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          Payment Method
                        </h3>
                      </div>
                      <div>
                        {selectedLog.payment_method === "cod" ? (
                          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                            <ShoppingBag className="h-4 w-4" />
                            Cash on Delivery (COD)
                          </span>
                        ) : selectedLog.payment_method === "online" ||
                          selectedLog.order_payment_method === "online" ? (
                          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                            <CreditCard className="h-4 w-4" />
                            Online Payment
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedLog.payment_method ||
                              selectedLog.order_payment_method ||
                              "N/A"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date Information Card */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                          <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          Date & Time
                        </h3>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Created At
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(selectedLog.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowLogDetails(false);
                        setSelectedLog(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      Close
                    </button>
                    {selectedLog.order_id && (
                      <Link
                        href={`/orders/${selectedLog.order_id}`}
                        onClick={() => {
                          setShowLogDetails(false);
                          setSelectedLog(null);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        View Order
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update Payment Status Modal */}
          {showUpdateModal && updateOrderId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Update Payment Status
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Change payment status for COD order
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUpdateModal(false);
                        setUpdateOrderId(null);
                        setUpdateOrderStatus("");
                      }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Order Info Card */}
                  <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Order Information
                      </h3>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Order Number
                      </label>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        #{updateOrderId}
                      </p>
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Select New Payment Status
                    </label>
                    <select
                      value={updateOrderStatus}
                      onChange={(e) => setUpdateOrderStatus(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-medium"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  {/* Info Alert */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                          Important Note
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          Payment status can only be updated for orders that
                          have been delivered. This action will update the
                          order's payment status in the system.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowUpdateModal(false);
                        setUpdateOrderId(null);
                        setUpdateOrderStatus("");
                      }}
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        handleUpdatePaymentStatus(
                          updateOrderId,
                          updateOrderStatus
                        )
                      }
                      disabled={
                        !updateOrderStatus || updatingPayment === updateOrderId
                      }
                      className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                    >
                      {updatingPayment === updateOrderId ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Update Status
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
