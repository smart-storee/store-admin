"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { makeAuthenticatedRequest } from "@/utils/api";
import { Coupon, ApiResponse, Branch } from "@/types";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useStore } from "@/contexts/StoreContext";

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<string>("all"); // 'all', 'active', 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const { user } = useAuth();
  const { theme } = useTheme();
  const { features } = useStore();
  const router = useRouter();

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response: ApiResponse<Branch[] | { data: Branch[] }> =
          await makeAuthenticatedRequest(
            `/branches?store_id=${user?.store_id}`
          );
        if (response.success) {
          const branchesData = Array.isArray(response.data)
            ? response.data
            : (response.data as { data: Branch[] })?.data || [];
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

  // Fetch coupons
  useEffect(() => {
    fetchCoupons();
  }, [selectedBranch, filterActive, user, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranch, filterActive]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
      });
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());

      if (selectedBranch) {
        params.append("branch_id", selectedBranch.toString());
      }

      // Only add is_active filter when explicitly set to 'active' or 'inactive'
      if (filterActive === "active") {
        params.append("is_active", "1");
      } else if (filterActive === "inactive") {
        params.append("is_active", "0");
      }
      // When filterActive is 'all', don't add is_active parameter at all

      const response: ApiResponse<Coupon[] | { data: Coupon[] }> =
        await makeAuthenticatedRequest(`/coupons?${params.toString()}`);

      if (response.success) {
        const couponsData = Array.isArray(response.data)
          ? response.data
          : (response.data as { data: Coupon[] })?.data || [];
        setCoupons(couponsData);
        const pagination = (response as any).pagination;
        const total = Number(pagination?.total) || couponsData.length;
        const limit = Number(pagination?.limit) || pageSize;
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        throw new Error(response?.message || "Failed to fetch coupons");
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const isActive = coupon.is_active === 1;
    const action = isActive ? "deactivate" : "activate";
    const actionCapitalized = isActive ? "Deactivate" : "Activate";

    if (!confirm(`Are you sure you want to ${action} this coupon?`)) {
      return;
    }

    try {
      // Use PUT to update the is_active status
      const response = await makeAuthenticatedRequest(
        `/coupons/${coupon.coupon_id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_active: isActive ? 0 : 1,
          }),
        }
      );

      if (response.success) {
        fetchCoupons();
      } else {
        alert(response.message || `Failed to ${action} coupon`);
      }
    } catch (err) {
      console.error(`Error ${action}ing coupon:`, err);
      alert(`Failed to ${action} coupon`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);

    if (!coupon.is_active) {
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            isDark
              ? "bg-gray-700 text-gray-200"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Inactive
        </span>
      );
    }

    if (now < startDate) {
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            isDark
              ? "bg-blue-900/40 text-blue-200"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          Upcoming
        </span>
      );
    }

    if (now > endDate) {
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            isDark ? "bg-red-900/40 text-red-200" : "bg-red-100 text-red-700"
          }`}
        >
          Expired
        </span>
      );
    }

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          isDark
            ? "bg-green-900/40 text-green-200"
            : "bg-green-100 text-green-700"
        }`}
      >
        Active
      </span>
    );
  };

  const isDark = theme === "dark";

  return (
    <FeatureGuard
      feature="coupon_codes_enabled"
      fallback={
        <div className="p-6 text-center">
          <div className="border rounded-lg px-4 py-3 mb-4">
            <p className="text-yellow-700 dark:text-yellow-300">
              Coupon codes feature is disabled for this store. Please contact
              support to enable it.
            </p>
          </div>
        </div>
      }
    >
      <RoleGuard
        requiredPermissions={["manage_coupon"]}
        fallback={
          <div className="p-6 text-center">
            <div className="border rounded-lg px-4 py-3 mb-4">
              <p className="text-red-700 dark:text-red-300">
                Access denied. You do not have permission to manage coupons.
              </p>
            </div>
          </div>
        }
      >
        <div
          className={` ${
            isDark ? "bg-gray-900" : "bg-gray-50"
          } min-h-screen`}
        >
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1
                  className={`text-3xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Coupons
                </h1>
                <p
                  className={`mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Manage discount coupons for your store
                </p>
              </div>
              <button
                onClick={() => router.push("/coupons/new")}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
              >
                + Create Coupon
              </button>
            </div>

            {/* Filters */}
            <div
              className={`mb-6 p-4 rounded-lg ${
                isDark ? "bg-gray-800" : "bg-white"
              } shadow-sm`}
            >
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Branch
                  </label>
                  <select
                    value={selectedBranch || ""}
                    onChange={(e) =>
                      setSelectedBranch(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className={`px-3 py-2 border rounded-lg ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
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
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Status
                  </label>
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value)}
                    className={`px-3 py-2 border rounded-lg ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p
                  className={`mt-4 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Loading coupons...
                </p>
              </div>
            ) : coupons.length === 0 ? (
              <div
                className={`text-center py-12 ${
                  isDark ? "bg-gray-800" : "bg-white"
                } rounded-lg`}
              >
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                  No coupons found
                </p>
                <button
                  onClick={() => router.push("/coupons/new")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create First Coupon
                </button>
              </div>
            ) : (
              /* Coupons Table */
              <div
                className={`rounded-lg shadow-sm overflow-hidden ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={isDark ? "bg-gray-700" : "bg-gray-50"}>
                      <tr>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Code
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Type
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Discount
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Branch
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Usage
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Valid Period
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Status
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isDark ? "divide-gray-700" : "divide-gray-200"
                      }`}
                    >
                      {coupons.map((coupon) => (
                        <tr
                          key={coupon.coupon_id}
                          className={
                            isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                          }
                        >
                          <td
                            className={`px-6 py-4 whitespace-nowrap ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            <span className="font-mono font-semibold">
                              {coupon.coupon_code}
                            </span>
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap ${
                              isDark ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {coupon.coupon_type === "percentage"
                              ? "Percentage"
                              : "Fixed Amount"}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {coupon.coupon_type === "percentage" ? (
                              <span>{coupon.discount_value}%</span>
                            ) : (
                              <span>₹{coupon.discount_value}</span>
                            )}
                            {coupon.coupon_type === "percentage" &&
                              coupon.max_discount_amount && (
                                <span
                                  className={`text-xs ${
                                    isDark ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  {" "}
                                  (max ₹{coupon.max_discount_amount})
                                </span>
                              )}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap ${
                              isDark ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {coupon.branch_name || "All Branches"}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap ${
                              isDark ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {coupon.used_count}
                            {coupon.total_usage_limit &&
                              ` / ${coupon.total_usage_limit}`}
                            <div className="text-xs text-gray-500 mt-1">
                              {coupon.usage_limit_per_user} per user
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              isDark ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            <div>{formatDate(coupon.start_date)}</div>
                            <div className="text-xs">
                              to {formatDate(coupon.end_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(coupon)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/coupons/${coupon.coupon_id}/usage`
                                  )
                                }
                                className="text-purple-600 hover:text-purple-900"
                                title="View usage details"
                              >
                                Details
                              </button>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/coupons/${coupon.coupon_id}/edit`
                                  )
                                }
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleStatus(coupon)}
                                className={
                                  coupon.is_active === 1
                                    ? "text-red-600 hover:text-red-900"
                                    : "text-green-600 hover:text-green-900"
                                }
                              >
                                {coupon.is_active === 1
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages >= 1 && (
                  <div
                    className={`px-6 py-4 ${
                      isDark ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`text-sm ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
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
                          className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                            isDark
                              ? "bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-400"
                              : "bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                          } disabled:cursor-not-allowed`}
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
                                : isDark
                                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                                  : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                            isDark
                              ? "bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-400"
                              : "bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                          } disabled:cursor-not-allowed`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
};

export default CouponsPage;
