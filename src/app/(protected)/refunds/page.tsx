"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { RefundRequest, RefundStatistics, ApiResponse, Branch } from "@/types";
import {
  Search,
  Filter,
  X,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Calendar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function RefundsPage() {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [statistics, setStatistics] = useState<RefundStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);
  const [processingAction, setProcessingAction] = useState<number | null>(null);

  useEffect(() => {
    if (user?.store_id) {
      fetchBranches();
      fetchRefunds();
      fetchStatistics();
    }
  }, [user?.store_id, currentPage, statusFilter, selectedBranch, searchTerm]);

  const fetchBranches = async () => {
    try {
      const response: ApiResponse<{ data: Branch[] }> =
        await makeAuthenticatedRequest(`/branches?store_id=${user?.store_id}`);
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

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
        page: currentPage.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(selectedBranch && { branch_id: selectedBranch.toString() }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response: ApiResponse<{
        data: RefundRequest[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }> = await makeAuthenticatedRequest(
        `/refunds?${params.toString()}`,
        {},
        true,
        user?.store_id
      );

      if (response.success) {
        const refundsData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setRefunds(refundsData);
        const pagination = response.data?.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        };
        setTotalPages(pagination.totalPages);
        setTotalCount(pagination.total);
      } else {
        throw new Error(response.message || "Failed to fetch refunds");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load refunds");
      console.error("Error fetching refunds:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
        ...(selectedBranch && { branch_id: selectedBranch.toString() }),
      });

      const response: ApiResponse<{ data: RefundStatistics }> =
        await makeAuthenticatedRequest(
          `/refunds/statistics?${params.toString()}`,
          {},
          true,
          user?.store_id
        );

      if (response.success) {
        setStatistics(response.data?.data || null);
      }
    } catch (err) {
      console.error("Failed to fetch statistics:", err);
    }
  };

  const handleApprove = async (refundId: number) => {
    if (!confirm("Are you sure you want to approve this refund request?")) {
      return;
    }

    try {
      setProcessingAction(refundId);
      const response: ApiResponse<{}> = await makeAuthenticatedRequest(
        `/refunds/${refundId}/approve`,
        {
          method: "PUT",
          body: JSON.stringify({}),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        alert("Refund approved successfully");
        fetchRefunds();
        fetchStatistics();
        if (showDetails) {
          setShowDetails(false);
        }
      } else {
        throw new Error(response.message || "Failed to approve refund");
      }
    } catch (err: any) {
      alert(err.message || "Failed to approve refund");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async (refundId: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      setProcessingAction(refundId);
      const response: ApiResponse<{}> = await makeAuthenticatedRequest(
        `/refunds/${refundId}/reject`,
        {
          method: "PUT",
          body: JSON.stringify({
            rejection_reason: reason,
          }),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        alert("Refund rejected successfully");
        fetchRefunds();
        fetchStatistics();
        if (showDetails) {
          setShowDetails(false);
        }
      } else {
        throw new Error(response.message || "Failed to reject refund");
      }
    } catch (err: any) {
      alert(err.message || "Failed to reject refund");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleComplete = async (refundId: number) => {
    const reference = prompt(
      "Enter refund reference/transaction ID (optional):"
    );

    try {
      setProcessingAction(refundId);
      const response: ApiResponse<{}> = await makeAuthenticatedRequest(
        `/refunds/${refundId}/complete`,
        {
          method: "PUT",
          body: JSON.stringify({
            refund_reference: reference || undefined,
          }),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        alert("Refund marked as completed");
        fetchRefunds();
        fetchStatistics();
        if (showDetails) {
          setShowDetails(false);
        }
      } else {
        throw new Error(response.message || "Failed to complete refund");
      }
    } catch (err: any) {
      alert(err.message || "Failed to complete refund");
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "processing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "failed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <RoleGuard requiredPermissions={["manage_orders"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Refund Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage refund requests and track refund status
            </p>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Refunds
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {statistics.total_refunds}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                      {statistics.pending_count}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {statistics.completed_count}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Refunded
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      ₹{(statistics.total_refunded_amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by order number, customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={selectedBranch || ""}
                onChange={(e) =>
                  setSelectedBranch(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Refunds Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Loading refunds...
                </p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-red-600" />
                <p className="mt-2 text-red-600">{error}</p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  No refund requests found
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Refund ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {refunds.map((refund) => (
                        <tr
                          key={refund.refund_id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            #{refund.refund_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <Link
                              href={`/orders/${refund.order_id}`}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              {refund.order_number ||
                                `Order #${refund.order_id}`}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {refund.customer_name || "N/A"}
                            <br />
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              {refund.customer_phone}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            ₹
                            {parseFloat(
                              refund.refund_amount.toString()
                            ).toFixed(2)}
                            {refund.refund_type === "partial" && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                of ₹
                                {parseFloat(
                                  refund.original_amount.toString()
                                ).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                refund.refund_status
                              )}`}
                            >
                              {getStatusIcon(refund.refund_status)}
                              {refund.refund_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {refund.payment_method || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(refund.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setShowDetails(true);
                                }}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              {refund.refund_status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApprove(refund.refund_id)
                                    }
                                    disabled={
                                      processingAction === refund.refund_id
                                    }
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 disabled:opacity-50"
                                  >
                                    <CheckCircle className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleReject(refund.refund_id)
                                    }
                                    disabled={
                                      processingAction === refund.refund_id
                                    }
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                                  >
                                    <XCircle className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                              {refund.refund_status === "processing" && (
                                <button
                                  onClick={() =>
                                    handleComplete(refund.refund_id)
                                  }
                                  disabled={
                                    processingAction === refund.refund_id
                                  }
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          </div>
        </div>

        {/* Refund Details Modal */}
        {showDetails && selectedRefund && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Refund Details
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Refund ID
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        #{selectedRefund.refund_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Order Number
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRefund.order_number ||
                          `Order #${selectedRefund.order_id}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Refund Amount
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ₹
                        {parseFloat(
                          selectedRefund.refund_amount.toString()
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Status
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          selectedRefund.refund_status
                        )}`}
                      >
                        {getStatusIcon(selectedRefund.refund_status)}
                        {selectedRefund.refund_status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Refund Reason
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRefund.refund_reason}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Payment Method
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRefund.payment_method}
                      </p>
                    </div>
                  </div>

                  {selectedRefund.refund_description && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Description
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedRefund.refund_description}
                      </p>
                    </div>
                  )}

                  {selectedRefund.refund_reference && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Refund Reference
                      </p>
                      <p className="font-mono text-sm text-gray-900 dark:text-white">
                        {selectedRefund.refund_reference}
                      </p>
                    </div>
                  )}

                  {selectedRefund.admin_notes && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Admin Notes
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedRefund.admin_notes}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      {selectedRefund.refund_status === "pending" && (
                        <>
                          <button
                            onClick={() => {
                              handleApprove(selectedRefund.refund_id);
                            }}
                            disabled={
                              processingAction === selectedRefund.refund_id
                            }
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              handleReject(selectedRefund.refund_id);
                            }}
                            disabled={
                              processingAction === selectedRefund.refund_id
                            }
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {selectedRefund.refund_status === "processing" && (
                        <button
                          onClick={() => {
                            handleComplete(selectedRefund.refund_id);
                          }}
                          disabled={
                            processingAction === selectedRefund.refund_id
                          }
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
