"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { ApiResponse, Review } from "@/types";
import {
  Star,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  X,
} from "lucide-react";
import Link from "next/link";

interface ReviewWithOrder extends Review {
  order_number: string;
  order_status: string;
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  customer_full_name?: string;
}

export default function ReviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [orderIdFilter, setOrderIdFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const [selectedReview, setSelectedReview] = useState<ReviewWithOrder | null>(
    null
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [reviewToUpdate, setReviewToUpdate] = useState<ReviewWithOrder | null>(
    null
  );
  const [adminResponse, setAdminResponse] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.store_id) {
      fetchReviews();
    }
  }, [user?.store_id, currentPage, statusFilter, ratingFilter, orderIdFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (statusFilter !== "all") {
        params.append("is_approved", statusFilter);
      }

      if (ratingFilter !== "all") {
        params.append("rating", ratingFilter);
      }

      if (orderIdFilter) {
        params.append("order_id", orderIdFilter);
      }

      const response: any = await makeAuthenticatedRequest(
        `/reviews?${params.toString()}&store_id=${user?.store_id}`,
        {},
        true,
        user?.store_id
      );

      console.log("Reviews API Response:", response);

      if (response.success) {
        // Handle different response structures
        let reviewsData: ReviewWithOrder[] = [];
        let paginationData: any = {};

        if (Array.isArray(response.data)) {
          // Response structure: { success: true, data: [...], pagination: {...} }
          reviewsData = response.data;
          paginationData = response.pagination || {};
        } else if (response.data?.data) {
          // Response structure: { success: true, data: { data: [...], pagination: {...} } }
          reviewsData = response.data.data || [];
          paginationData = response.data.pagination || {};
        } else {
          reviewsData = [];
          paginationData = {};
        }

        console.log("Parsed Reviews Data:", reviewsData);
        console.log("Parsed Pagination Data:", paginationData);

        setReviews(reviewsData);
        setTotalCount(paginationData?.total || 0);
        setTotalPages(paginationData?.totalPages || 1);
      } else {
        throw new Error(response.message || "Failed to fetch reviews");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load reviews");
      console.error("Load reviews error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (isApproved: number) => {
    if (!reviewToUpdate) return;

    try {
      setUpdating(true);
      const response: any = await makeAuthenticatedRequest(
        `/reviews/${reviewToUpdate.review_id}/status?store_id=${user?.store_id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_approved: isApproved,
            admin_response: adminResponse || null,
          }),
        },
        true,
        user?.store_id
      );

      if (response.success) {
        await fetchReviews();
        setShowStatusModal(false);
        setReviewToUpdate(null);
        setAdminResponse("");
      } else {
        throw new Error(response.message || "Failed to update review");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update review");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-IN", {
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

  const filteredReviews = reviews.filter((review) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        review.order_number?.toLowerCase().includes(searchLower) ||
        review.customer_name?.toLowerCase().includes(searchLower) ||
        review.customer_phone?.includes(searchTerm) ||
        review.review_text?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Debug logging
  useEffect(() => {
    console.log("Reviews state:", reviews);
    console.log("Filtered reviews:", filteredReviews);
    console.log("Loading:", loading);
    console.log("Error:", error);
  }, [reviews, filteredReviews, loading, error]);

  return (
    <RoleGuard requiredPermissions={["view_reports"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Product Reviews
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage and moderate customer reviews
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by order, customer..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="0">Pending</option>
                <option value="1">Approved</option>
                <option value="2">Rejected</option>
              </select>
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
              <input
                type="text"
                value={orderIdFilter}
                onChange={(e) => {
                  setOrderIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Order ID"
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Reviews Table */}
          {!loading && !error && (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 border-b-2 border-gray-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Review
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Status
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
                      {filteredReviews.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                              <p className="text-gray-500 dark:text-gray-400 font-medium">
                                No reviews found
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredReviews.map((review) => (
                          <tr
                            key={review.review_id}
                            className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/orders/${review.order_id}`}
                                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                #{review.order_number}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {review.customer_full_name ||
                                  review.customer_name ||
                                  "N/A"}
                              </div>
                              {review.customer_phone && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {review.customer_phone}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                                  {review.rating}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                                {review.review_text}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  review.is_approved === 1
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : review.is_approved === 2
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                }`}
                              >
                                {review.is_approved === 1
                                  ? "Approved"
                                  : review.is_approved === 2
                                  ? "Rejected"
                                  : "Pending"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(
                                  review.review_created_at ||
                                    review.created_at ||
                                    ""
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedReview(review);
                                    setShowReviewModal(true);
                                  }}
                                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-all"
                                  title="View Details"
                                >
                                  <Eye className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewToUpdate(review);
                                    setAdminResponse(
                                      review.admin_response || ""
                                    );
                                    setShowStatusModal(true);
                                  }}
                                  className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-all"
                                  title="Update Status"
                                >
                                  <MessageSquare className="h-5 w-5" />
                                </button>
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

          {/* Review Details Modal */}
          {showReviewModal && selectedReview && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Review Details
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Order #{selectedReview.order_number}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedReview(null);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Customer
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedReview.customer_full_name ||
                          selectedReview.customer_name ||
                          "N/A"}
                      </p>
                      {selectedReview.customer_phone && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedReview.customer_phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rating
                      </label>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-6 w-6 ${
                              i < selectedReview.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedReview.rating}/5
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Review Text
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
                        {selectedReview.review_text}
                      </p>
                    </div>
                    {selectedReview.admin_response && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Admin Response
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          {selectedReview.admin_response}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          selectedReview.is_approved === 1
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : selectedReview.is_approved === 2
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        }`}
                      >
                        {selectedReview.is_approved === 1
                          ? "Approved"
                          : selectedReview.is_approved === 2
                          ? "Rejected"
                          : "Pending"}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reviewed On
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(
                          selectedReview.review_created_at ||
                            selectedReview.created_at ||
                            ""
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedReview(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      Close
                    </button>
                    <Link
                      href={`/orders/${selectedReview.order_id}`}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update Status Modal */}
          {showStatusModal && reviewToUpdate && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Update Review Status
                    </h2>
                    <button
                      onClick={() => {
                        setShowStatusModal(false);
                        setReviewToUpdate(null);
                        setAdminResponse("");
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Admin Response (Optional)
                    </label>
                    <textarea
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      placeholder="Add a response to the customer..."
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={() => handleUpdateStatus(2)}
                      disabled={updating}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating ? "Updating..." : "Reject"}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(0)}
                      disabled={updating}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating ? "Updating..." : "Set Pending"}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(1)}
                      disabled={updating}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating ? "Updating..." : "Approve"}
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
