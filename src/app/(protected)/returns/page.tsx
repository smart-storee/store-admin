"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { ReturnRequest, ReturnStatistics, ApiResponse, Branch } from "@/types";
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
  Package,
  TrendingUp,
  Truck,
  FileText,
  Calendar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function ReturnsPage() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [statistics, setStatistics] = useState<ReturnStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(
    null
  );
  const [returnDetails, setReturnDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [processingAction, setProcessingAction] = useState<number | null>(null);

  useEffect(() => {
    if (user?.store_id) {
      fetchBranches();
      fetchReturns();
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

  const fetchReturns = async () => {
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
        data: ReturnRequest[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }> = await makeAuthenticatedRequest(
        `/returns?${params.toString()}`,
        {},
        true,
        user?.store_id
      );

      if (response.success) {
        const returnsData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setReturns(returnsData);
        const pagination = response.data?.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        };
        setTotalPages(pagination.totalPages);
        setTotalCount(pagination.total);
      } else {
        throw new Error(response.message || "Failed to fetch returns");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load returns");
      console.error("Error fetching returns:", err);
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

      const response: ApiResponse<{ data: ReturnStatistics }> =
        await makeAuthenticatedRequest(
          `/returns/statistics?${params.toString()}`,
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

  const handleApprove = async (returnId: number) => {
    const scheduledAt = prompt(
      "Enter pickup scheduled date/time (YYYY-MM-DD HH:MM) or leave empty:"
    );

    try {
      setProcessingAction(returnId);
      const response: ApiResponse = await makeAuthenticatedRequest(
        `/returns/${returnId}/approve`,
        {
          method: "PUT",
          body: JSON.stringify({
            pickup_scheduled_at: scheduledAt || undefined,
          }),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        alert("Return approved successfully");
        fetchReturns();
        fetchStatistics();
        if (showDetails && selectedReturn) {
          await fetchReturnDetails(selectedReturn.return_id);
        }
      } else {
        throw new Error(response.message || "Failed to approve return");
      }
    } catch (err: any) {
      alert(err.message || "Failed to approve return");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async (returnId: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      setProcessingAction(returnId);
      const response: ApiResponse = await makeAuthenticatedRequest(
        `/returns/${returnId}/reject`,
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
        alert("Return rejected successfully");
        fetchReturns();
        fetchStatistics();
        if (showDetails && selectedReturn) {
          await fetchReturnDetails(selectedReturn.return_id);
        }
      } else {
        throw new Error(response.message || "Failed to reject return");
      }
    } catch (err: any) {
      alert(err.message || "Failed to reject return");
    } finally {
      setProcessingAction(null);
    }
  };

  const handlePickupCompleted = async (returnId: number) => {
    try {
      setProcessingAction(returnId);
      const response: ApiResponse = await makeAuthenticatedRequest(
        `/returns/${returnId}/pickup-completed`,
        {
          method: "PUT",
          body: JSON.stringify({}),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        alert("Pickup marked as completed");
        fetchReturns();
        fetchStatistics();
        if (showDetails && selectedReturn) {
          await fetchReturnDetails(selectedReturn.return_id);
        }
      } else {
        throw new Error(response.message || "Failed to mark pickup completed");
      }
    } catch (err: any) {
      alert(err.message || "Failed to mark pickup completed");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleItemsReceived = async (returnId: number) => {
    try {
      setProcessingAction(returnId);
      const response: ApiResponse = await makeAuthenticatedRequest(
        `/returns/${returnId}/items-received`,
        {
          method: "PUT",
          body: JSON.stringify({}),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        alert("Items marked as received");
        fetchReturns();
        fetchStatistics();
        if (showDetails && selectedReturn) {
          await fetchReturnDetails(selectedReturn.return_id);
        }
      } else {
        throw new Error(response.message || "Failed to mark items received");
      }
    } catch (err: any) {
      alert(err.message || "Failed to mark items received");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleComplete = async (returnId: number) => {
    try {
      setProcessingAction(returnId);
      const response: ApiResponse = await makeAuthenticatedRequest(
        `/returns/${returnId}/complete`,
        {
          method: "PUT",
          body: JSON.stringify({}),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        alert("Return marked as completed");
        fetchReturns();
        fetchStatistics();
        if (showDetails && selectedReturn) {
          await fetchReturnDetails(selectedReturn.return_id);
        }
      } else {
        throw new Error(response.message || "Failed to complete return");
      }
    } catch (err: any) {
      alert(err.message || "Failed to complete return");
    } finally {
      setProcessingAction(null);
    }
  };

  const fetchReturnDetails = async (returnId: number) => {
    try {
      setLoadingDetails(true);
      const response: ApiResponse<{ data: any }> =
        await makeAuthenticatedRequest(
          `/returns/${returnId}`,
          {},
          true,
          user?.store_id
        );

      if (response.success) {
        setReturnDetails(response.data?.data || response.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch return details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (returnReq: ReturnRequest) => {
    setSelectedReturn(returnReq);
    setShowDetails(true);
    await fetchReturnDetails(returnReq.return_id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "picked_up":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "received":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400";
      case "processing_refund":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "cancelled":
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
      case "picked_up":
        return <Truck className="h-4 w-4" />;
      case "received":
        return <Package className="h-4 w-4" />;
      case "processing_refund":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
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
              <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Return Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage return requests and track return status
            </p>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Returns
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {statistics.total_returns}
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
                      Received
                    </p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      {statistics.received_count}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
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
                <option value="picked_up">Picked Up</option>
                <option value="received">Received</option>
                <option value="processing_refund">Processing Refund</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
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

          {/* Returns Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Loading returns...
                </p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-red-600" />
                <p className="mt-2 text-red-600">{error}</p>
              </div>
            ) : returns.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  No return requests found
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Return ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
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
                      {returns.map((returnReq) => (
                        <tr
                          key={returnReq.return_id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            #{returnReq.return_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <Link
                              href={`/orders/${returnReq.order_id}`}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              {returnReq.order_number ||
                                `Order #${returnReq.order_id}`}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {returnReq.customer_name || "N/A"}
                            <br />
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              {returnReq.customer_phone}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {returnReq.return_reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                returnReq.return_status
                              )}`}
                            >
                              {getStatusIcon(returnReq.return_status)}
                              {returnReq.return_status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(
                              returnReq.created_at
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewDetails(returnReq)}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              {returnReq.return_status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApprove(returnReq.return_id)
                                    }
                                    disabled={
                                      processingAction === returnReq.return_id
                                    }
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 disabled:opacity-50"
                                  >
                                    <CheckCircle className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleReject(returnReq.return_id)
                                    }
                                    disabled={
                                      processingAction === returnReq.return_id
                                    }
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                                  >
                                    <XCircle className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                              {returnReq.return_status === "approved" && (
                                <button
                                  onClick={() =>
                                    handlePickupCompleted(returnReq.return_id)
                                  }
                                  disabled={
                                    processingAction === returnReq.return_id
                                  }
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                                >
                                  Mark Picked Up
                                </button>
                              )}
                              {returnReq.return_status === "picked_up" && (
                                <button
                                  onClick={() =>
                                    handleItemsReceived(returnReq.return_id)
                                  }
                                  disabled={
                                    processingAction === returnReq.return_id
                                  }
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50"
                                >
                                  Mark Received
                                </button>
                              )}
                              {returnReq.return_status === "received" && (
                                <button
                                  onClick={() =>
                                    handleComplete(returnReq.return_id)
                                  }
                                  disabled={
                                    processingAction === returnReq.return_id
                                  }
                                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 disabled:opacity-50"
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
                {totalPages > 1 && (
                  <div className="bg-gray-50 dark:bg-slate-700 px-6 py-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing page {currentPage} of {totalPages} ({totalCount}{" "}
                      total)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
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

        {/* Return Details Modal */}
        {showDetails && selectedReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Return Details
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Return ID: #{selectedReturn.return_id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setReturnDetails(null);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                    <span className="ml-3 text-gray-600 dark:text-gray-400">
                      Loading details...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Basic Information */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Order Number
                          </p>
                          <Link
                            href={`/orders/${selectedReturn.order_id}`}
                            className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2"
                          >
                            {selectedReturn.order_number ||
                              `Order #${selectedReturn.order_id}`}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Status
                          </p>
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(
                              selectedReturn.return_status
                            )}`}
                          >
                            {getStatusIcon(selectedReturn.return_status)}
                            {selectedReturn.return_status
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Return Type
                          </p>
                          <p className="text-base font-medium text-gray-900 dark:text-white capitalize">
                            {returnDetails?.return_type ||
                              selectedReturn.return_type ||
                              "Full"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Created At
                          </p>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {new Date(
                              selectedReturn.created_at
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Return Reason
                          </p>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {selectedReturn.return_reason}
                          </p>
                        </div>
                        {selectedReturn.return_description && (
                          <div className="space-y-1 md:col-span-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Description
                            </p>
                            <p className="text-base text-gray-900 dark:text-white bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                              {selectedReturn.return_description}
                            </p>
                          </div>
                        )}
                        {selectedReturn.pickup_address && (
                          <div className="space-y-1 md:col-span-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Pickup Address
                            </p>
                            <p className="text-base text-gray-900 dark:text-white bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                              {selectedReturn.pickup_address}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        Customer Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Customer Name
                          </p>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {selectedReturn.customer_name || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Phone Number
                          </p>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {selectedReturn.customer_phone || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Return Items */}
                    {(returnDetails?.items || selectedReturn.items) &&
                      (returnDetails?.items || selectedReturn.items).length >
                        0 && (
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Package className="h-5 w-5 text-indigo-600" />
                            Return Items (
                            {
                              (returnDetails?.items || selectedReturn.items)
                                .length
                            }
                            )
                          </h3>
                          <div className="space-y-3">
                            {(returnDetails?.items || selectedReturn.items).map(
                              (item: any) => (
                                <div
                                  key={item.return_item_id}
                                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-2">
                                      <p className="font-semibold text-gray-900 dark:text-white text-base">
                                        {item.product_name} -{" "}
                                        {item.variant_name}
                                      </p>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <p className="text-gray-500 dark:text-gray-400">
                                            Quantity
                                          </p>
                                          <p className="font-medium text-gray-900 dark:text-white">
                                            {item.quantity} /{" "}
                                            {item.original_quantity}
                                          </p>
                                        </div>
                                        {item.refund_amount && (
                                          <div>
                                            <p className="text-gray-500 dark:text-gray-400">
                                              Refund Amount
                                            </p>
                                            <p className="font-medium text-green-600 dark:text-green-400">
                                              ₹
                                              {parseFloat(
                                                item.refund_amount.toString()
                                              ).toFixed(2)}
                                            </p>
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-gray-500 dark:text-gray-400">
                                            Condition
                                          </p>
                                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                                            {item.item_condition || "N/A"}
                                          </p>
                                        </div>
                                        {item.return_reason && (
                                          <div>
                                            <p className="text-gray-500 dark:text-gray-400">
                                              Item Reason
                                            </p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                              {item.return_reason}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Return History */}
                    {returnDetails?.history &&
                      returnDetails.history.length > 0 && (
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-indigo-600" />
                            Return History
                          </h3>
                          <div className="space-y-3">
                            {returnDetails.history.map(
                              (history: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-white dark:bg-slate-800 border-l-4 border-indigo-500 rounded-lg p-4"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {history.action}
                                      </p>
                                      {history.notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                          {history.notes}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {history.performed_by_name || "System"}{" "}
                                        •{" "}
                                        {new Date(
                                          history.created_at
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                        history.status
                                      )}`}
                                    >
                                      {history.status}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50">
                <div className="flex flex-wrap gap-3">
                  {selectedReturn.return_status === "pending" && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(selectedReturn.return_id);
                        }}
                        disabled={processingAction === selectedReturn.return_id}
                        className="flex-1 min-w-[120px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedReturn.return_id);
                        }}
                        disabled={processingAction === selectedReturn.return_id}
                        className="flex-1 min-w-[120px] px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <XCircle className="h-5 w-5" />
                        Reject
                      </button>
                    </>
                  )}
                  {selectedReturn.return_status === "approved" && (
                    <button
                      onClick={() => {
                        handlePickupCompleted(selectedReturn.return_id);
                      }}
                      disabled={processingAction === selectedReturn.return_id}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Truck className="h-5 w-5" />
                      Mark Pickup Completed
                    </button>
                  )}
                  {selectedReturn.return_status === "picked_up" && (
                    <button
                      onClick={() => {
                        handleItemsReceived(selectedReturn.return_id);
                      }}
                      disabled={processingAction === selectedReturn.return_id}
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Package className="h-5 w-5" />
                      Mark Items Received
                    </button>
                  )}
                  {selectedReturn.return_status === "received" && (
                    <button
                      onClick={() => {
                        handleComplete(selectedReturn.return_id);
                      }}
                      disabled={processingAction === selectedReturn.return_id}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Complete Return
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
