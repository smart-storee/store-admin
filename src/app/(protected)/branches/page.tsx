"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { Branch, ApiResponse, Pagination } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import {
  MapPin,
  Plus,
  Search,
  Edit3,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Package,
  Users,
  Building2,
  TrendingUp,
  Moon,
  Sun,
  Power,
  PowerOff,
  DollarSign,
  IndianRupee,
} from "lucide-react";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const pageSize = 20;
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    fetchBranches();
  }, [currentPage, searchTerm, filterActive, sortBy, user?.store_id]);

  const fetchBranches = async () => {
    try {
      setLoading(true);

      // Fetch all branches for the store without search filter to allow client-side filtering
      const params = new URLSearchParams({
        page: "1",  // Get all pages initially
        limit: "100", // Maximum allowed limit
        store_id: user?.store_id?.toString() || "1",
      });

      // Apply other filters but not search (we'll filter search on client side)
      if (filterActive !== "all") {
        params.append("is_active", filterActive === "active" ? "1" : "0");
      }

      if (sortBy) {
        params.append("sort_by", sortBy);
      }

      const response: ApiResponse<{ data: Branch[]; pagination: Pagination }> =
        await makeAuthenticatedRequest(`/branches?${params.toString()}`);

      if (response.success) {
        let branchesData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        // Apply client-side case-insensitive search filtering if searchTerm exists
        if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          branchesData = branchesData.filter(branch =>
            branch.branch_name.toLowerCase().includes(lowerSearchTerm) ||
            (branch.city && branch.city.toLowerCase().includes(lowerSearchTerm)) ||
            (branch.address && branch.address.toLowerCase().includes(lowerSearchTerm)) ||
            (branch.address_line_1 && branch.address_line_1.toLowerCase().includes(lowerSearchTerm)) ||
            (branch.address_line_2 && branch.address_line_2.toLowerCase().includes(lowerSearchTerm)) ||
            (branch.pincode && branch.pincode.toLowerCase().includes(lowerSearchTerm))
          );
        }

        // Apply pagination after client-side filtering
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedBranches = branchesData.slice(startIndex, endIndex);

        setBranches(paginatedBranches);
        setTotalCount(branchesData.length);
        setTotalPages(Math.ceil(branchesData.length / pageSize));

        setError(null);
      } else {
        throw new Error(response.message || "Failed to fetch branches");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch branches");
      console.error("Branches fetch error:", err);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: "all" | "active" | "inactive") => {
    setFilterActive(filter);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleToggleActive = async (
    branchId: number,
    currentStatus: number
  ) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this branch?`)) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(`/branches/${branchId}`, {
        method: "PUT",
        body: JSON.stringify({
          is_active: newStatus,
          store_id: user?.store_id,
        }),
      });

      if (response.success) {
        fetchBranches(); // Refresh the list
      } else {
        throw new Error(response.message || `Failed to ${action} branch`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${action} branch`);
      console.error(`Toggle branch status error:`, err);
    }
  };

  const activeBranches = branches.filter((b) => b.is_active === 1).length;
  const totalOrders = branches.reduce(
    (sum, b) => sum + (b.total_orders || 0),
    0
  );
  // const totalEmployees = branches.reduce((sum, b) => sum + (b.employees || 0), 0);

  const themeStyles = {
    dark: {
      bg: "bg-slate-900",
      bgGradient: "from-slate-900 via-slate-800 to-slate-900",
      headerBg: "bg-slate-800/50",
      headerBorder: "border-slate-700/50",
      cardBg: "bg-slate-800/50",
      cardBorder: "border-slate-700/50",
      text: "text-white",
      textSecondary: "text-slate-300",
      textTertiary: "text-slate-400",
      table: {
        headerBg: "from-slate-700/50 to-slate-700/30",
        rowHover: "bg-slate-700/30",
        border: "border-slate-700/30",
      },
      input:
        "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500 focus:ring-blue-500",
      button: {
        primary:
          "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
        secondary: "bg-slate-700/50 hover:bg-slate-700 text-slate-300",
        filter: "bg-slate-700/50 text-slate-300 hover:bg-slate-600",
        filterActive: "bg-blue-600 text-white",
      },
      statCard: {
        blue: "from-blue-900/40 to-blue-800/40 border-blue-700/50 bg-blue-900/20 backdrop-blur-xl",
        green:
          "from-green-900/40 to-green-800/40 border-green-700/50 bg-green-900/20 backdrop-blur-xl",
        purple:
          "from-purple-900/40 to-purple-800/40 border-purple-700/50 bg-purple-900/20 backdrop-blur-xl",
        orange:
          "from-orange-900/40 to-orange-800/40 border-orange-700/50 bg-orange-900/20 backdrop-blur-xl",
      },
    },
    light: {
      bg: "bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50",
      bgGradient: "from-slate-50 via-blue-50 to-slate-50",
      headerBg: "bg-white",
      headerBorder: "border-slate-200",
      cardBg: "bg-white",
      cardBorder: "border-slate-200",
      text: "text-slate-900",
      textSecondary: "text-slate-600",
      textTertiary: "text-slate-500",
      table: {
        headerBg: "from-slate-50 to-slate-100",
        rowHover: "bg-blue-50/50",
        border: "border-slate-100",
      },
      input:
        "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500",
      button: {
        primary:
          "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
        secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
        filter: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        filterActive: "bg-blue-600 text-white",
      },
      statCard: {
        blue: "from-blue-500/10 to-blue-600/10 border-blue-200 bg-white",
        green: "from-green-500/10 to-green-600/10 border-green-200 bg-white",
        purple:
          "from-purple-500/10 to-purple-600/10 border-purple-200 bg-white",
        orange:
          "from-orange-500/10 to-orange-600/10 border-orange-200 bg-white",
      },
    },
  };

  const t = theme === "dark" ? themeStyles.dark : themeStyles.light;
  const isDarkMode = theme === "dark";

  return (
    <FeatureGuard
      feature="branches_enabled"
      fallback={
        <div className="p-6 text-center">
          <div
            className={`border rounded-lg p-4 ${
              isDarkMode
                ? "bg-yellow-900/30 border-yellow-700/50 text-yellow-300"
                : "bg-yellow-100 border-yellow-400 text-yellow-700"
            }`}
          >
            Branches feature is disabled for this store. Please contact support
            to enable it.
          </div>
        </div>
      }
    >
      <RoleGuard
        requiredPermissions={["manage_branches"]}
        fallback={
          <div className="p-6 text-center">
            <div
              className={`border rounded-lg p-4 ${
                isDarkMode
                  ? "bg-red-900/30 border-red-700/50 text-red-300"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              Access denied. You do not have permission to view branches.
            </div>
          </div>
        }
      >
        <div className="min-h-screen transition-colors duration-300">
          <div className="py-1">
            {/* Combined Header with Search and Filter Bar */}
            <div
              className={`rounded-xl border p-6 mb-8 shadow-sm ${
                isDarkMode
                  ? "bg-slate-800/50 border-slate-700/50"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Search */}
                <div className="md:col-span-5">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-slate-300" : "text-gray-600"
                    }`}
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
                      placeholder="Search by branch name, city, or address..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        isDarkMode
                          ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      }`}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-slate-300" : "text-gray-600"
                    }`}
                  >
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={filterActive}
                      onChange={(e) =>
                        handleFilterChange(
                          e.target.value as "all" | "active" | "inactive"
                        )
                      }
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-200 ${
                        isDarkMode
                          ? "bg-slate-800/80 border-slate-700/50 text-white"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      }`}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
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
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                {/* Sort By */}
                <div className="md:col-span-3">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-slate-300" : "text-gray-600"
                    }`}
                  >
                    Sort By
                  </label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(
                          e.target.value as "newest" | "oldest" | "name"
                        );
                        setCurrentPage(1);
                      }}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-200 ${
                        isDarkMode
                          ? "bg-slate-800/80 border-slate-700/50 text-white"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      }`}
                    >
                      <option value="newest">Date (Newest First)</option>
                      <option value="oldest">Date (Oldest First)</option>
                      <option value="name">Name (A-Z)</option>
                    </select>
                    <svg
                      className={`absolute right-3 top-3.5 pointer-events-none ${
                        isDarkMode ? "text-slate-400" : "text-gray-400"
                      }`}
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                {/* Right side: Add New Branch button */}
                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={() => (window.location.href = "/branches/new")}
                    className={`${t.button.primary} w-full px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap`}
                  >
                    <Plus size={20} />
                    Add New Branch
                  </button>
                </div>
              </div>

              {/* Results count */}
              <div
                className={`text-sm mt-4 ${
                  isDarkMode ? "text-slate-300" : "text-gray-600"
                }`}
              >
                Showing {branches.length} of {totalCount} branches
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className={`border rounded-xl p-4 mb-8 flex items-center gap-3 ${
                  theme === "dark"
                    ? "bg-red-900/30 border-red-700/50"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <AlertCircle
                  size={20}
                  className={theme === "dark" ? "text-red-400" : "text-red-600"}
                />
                <p
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-red-300" : "text-red-800"
                  }`}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div
                className={`${t.cardBg} rounded-xl border ${t.cardBorder} shadow-sm p-12`}
              >
                <div className="flex flex-col items-center justify-center gap-4">
                  <div
                    className={`w-12 h-12 border-4 ${
                      theme === "dark"
                        ? "border-slate-700 border-t-blue-500"
                        : "border-blue-200 border-t-blue-600"
                    } rounded-full animate-spin`}
                  ></div>
                  <p className={`${t.textSecondary} font-medium`}>
                    Loading branches...
                  </p>
                </div>
              </div>
            ) : (
              /* Branches Table */
              <div
                className={`${t.cardBg} rounded-xl border ${t.cardBorder} shadow-sm overflow-hidden`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr
                        className={`bg-gradient-to-r ${t.table.headerBg} border-b ${t.table.border}`}
                      >
                        <th
                          className={`px-6 py-4 text-left text-sm font-semibold ${t.text}`}
                        >
                          Branch Name
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-sm font-semibold ${t.text}`}
                        >
                          Location
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-sm font-semibold ${t.text}`}
                        >
                          Address
                        </th>
                        <th
                          className={`px-6 py-4 text-center text-sm font-semibold ${t.text}`}
                        >
                          Delivery Charge
                        </th>
                        <th
                          className={`px-6 py-4 text-center text-sm font-semibold ${t.text}`}
                        >
                          Orders
                        </th>
                        <th
                          className={`px-6 py-4 text-center text-sm font-semibold ${t.text}`}
                        >
                          Status
                        </th>
                        <th
                          className={`px-6 py-4 text-right text-sm font-semibold ${t.text}`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.length > 0 ? (
                        branches.map((branch) => (
                          <tr
                            key={branch.branch_id}
                            onMouseEnter={() => setHoveredRow(branch.branch_id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className={`border-b ${
                              t.table.border
                            } transition-all duration-200 ${
                              hoveredRow === branch.branch_id
                                ? t.table.rowHover
                                : ""
                            }`}
                          >
                            <td className={`px-6 py-4 font-semibold ${t.text}`}>
                              {branch.branch_name}
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className={`flex items-center gap-2 ${t.textSecondary} text-sm`}
                              >
                                <MapPin
                                  size={16}
                                  className="text-blue-500 flex-shrink-0"
                                />
                                <span>
                                  {branch.city || "N/A"}
                                  {branch.pincode && `, ${branch.pincode}`}
                                  {branch.latitude && branch.longitude && (
                                    <span className="text-xs opacity-70 ml-1">
                                      ({Number(branch.latitude).toFixed(4)},{" "}
                                      {Number(branch.longitude).toFixed(4)})
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td
                              className={`px-6 py-4 ${t.textSecondary} text-sm`}
                            >
                              {branch.address ||
                                (branch.address_line_1 && branch.address_line_2
                                  ? `${branch.address_line_1}, ${
                                      branch.address_line_2
                                    }, ${branch.city || ""}, ${
                                      branch.pincode || ""
                                    }`
                                  : branch.address_line_1 || "N/A")}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div
                                className={`inline-flex items-center gap-1 ${
                                  theme === "dark"
                                    ? "bg-green-900/40 text-green-300"
                                    : "bg-green-50 text-green-900"
                                } px-3 py-1.5 rounded-lg`}
                              >
                                <IndianRupee size={14} />
                                <span className="font-semibold">
                                  {parseFloat(
                                    branch.delivery_charge?.toString() || "0"
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div
                                className={`inline-flex items-center gap-2 ${
                                  theme === "dark"
                                    ? "bg-blue-900/40 text-blue-300"
                                    : "bg-blue-50 text-blue-900"
                                } px-3 py-1.5 rounded-lg`}
                              >
                                <Package size={16} />
                                <span className="font-semibold">
                                  {(branch.total_orders || 0).toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${
                                  branch.is_active == 1
                                    ? theme === "dark"
                                      ? "bg-green-900/40 text-green-300"
                                      : "bg-green-100 text-green-700"
                                    : theme === "dark"
                                    ? "bg-slate-700/50 text-slate-300"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {branch.is_active == 1
                                  ? "● Active"
                                  : "● Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div
                                className={`flex items-center justify-end gap-2 transition-all duration-300 ${
                                  hoveredRow === branch.branch_id
                                    ? "opacity-100"
                                    : "opacity-60"
                                }`}
                              >
                                <button
                                  onClick={() =>
                                    (window.location.href = `/branches/${branch.branch_id}`)
                                  }
                                  className={`p-2 rounded-lg transition-colors duration-200 ${
                                    theme === "dark"
                                      ? "hover:bg-blue-900/40 text-blue-400"
                                      : "hover:bg-blue-100 text-blue-600"
                                  }`}
                                  title="View"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() =>
                                    (window.location.href = `/branches/${branch.branch_id}/edit`)
                                  }
                                  className={`p-2 rounded-lg transition-colors duration-200 ${
                                    theme === "dark"
                                      ? "hover:bg-indigo-900/40 text-indigo-400"
                                      : "hover:bg-indigo-100 text-indigo-600"
                                  }`}
                                  title="Edit"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleToggleActive(
                                      branch.branch_id,
                                      branch.is_active || 0
                                    )
                                  }
                                  className={`p-2 rounded-lg transition-colors duration-200 ${
                                    branch.is_active == 1
                                      ? theme === "dark"
                                        ? "hover:bg-orange-900/40 text-orange-400"
                                        : "hover:bg-orange-100 text-orange-600"
                                      : theme === "dark"
                                      ? "hover:bg-green-900/40 text-green-400"
                                      : "hover:bg-green-100 text-green-600"
                                  }`}
                                  title={
                                    branch.is_active == 1
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                >
                                  {branch.is_active == 1 ? (
                                    <PowerOff size={18} />
                                  ) : (
                                    <Power size={18} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className={`px-6 py-12 text-center`}>
                            <Building2
                              size={48}
                              className={`mx-auto ${
                                isDarkMode ? "text-slate-600" : "text-slate-300"
                              } mb-3`}
                            />
                            <p className={`${t.textSecondary} font-medium`}>
                              No branches found
                            </p>
                            <p className={`${t.textTertiary} text-sm mt-1`}>
                              Try adjusting your search or filters
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages >= 1 && (
                  <div
                    className={`bg-gray-50 px-6 py-4 ${
                      theme === "dark" ? "bg-gray-700" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
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
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                            currentPage === 1
                              ? theme === "dark"
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : theme === "dark"
                              ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                          (page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                                currentPage === page
                                  ? theme === "dark"
                                    ? "z-10 bg-indigo-600 text-white"
                                    : "z-10 bg-indigo-50 text-indigo-600 border border-indigo-500"
                                  : theme === "dark"
                                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                                  : "bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          )
                        )}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                            currentPage === totalPages
                              ? theme === "dark"
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : theme === "dark"
                              ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
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
}
