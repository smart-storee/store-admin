"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import AdminLayout from "@/components/AdminLayout";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Category, Branch, ApiResponse } from "@/types";
import { FeatureGuard } from "@/components/FeatureGuard";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Moon,
  Sun,
  ChevronDown,
  ChevronUp,
  Folder,
} from "lucide-react";

interface CategoryWithBranch extends Category {
  branch_id?: number;
  branch_name?: string;
}

export default function CategoriesPage() {
  const [categoriesByBranch, setCategoriesByBranch] = useState<
    Map<number, { branch_name: string; categories: CategoryWithBranch[] }>
  >(new Map());
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(
    new Set()
  );
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Fetch branches for the user's assigned store
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response: ApiResponse<{ data: Branch[] }> =
          await makeAuthenticatedRequest(
            `/branches?store_id=${user?.store_id}`
          );
        if (response.success) {
          const branchesData = response.data.data || response.data;
          setBranches(branchesData);
          if (branchesData.length > 0) {
            setExpandedBranches(new Set([branchesData[0].branch_id]));
          }
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
    const fetchCategories = async () => {
      if (!user?.store_id) {
        setError("No store selected");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          store_id: user.store_id.toString(),
        });

        if (selectedBranch) {
          params.append("branch_id", selectedBranch.toString());
        }

        const response = await makeAuthenticatedRequest(
          `/categories?${params.toString()}`,
          { method: "GET" },
          true,
          user.store_id,
          selectedBranch || undefined
        );

        if (response.success) {
          const categoriesData = response.data || [];

          if (selectedBranch) {
            // Single branch view
            const newMap = new Map();
            const branch = branches.find((b) => b.branch_id === selectedBranch);
            newMap.set(selectedBranch, {
              branch_name: branch?.branch_name || "Unknown Branch",
              categories: categoriesData,
            });
            setCategoriesByBranch(newMap);
          } else {
            // Group by branch
            const newMap = new Map<
              number,
              { branch_name: string; categories: CategoryWithBranch[] }
            >();

            branches.forEach((branch) => {
              newMap.set(branch.branch_id, {
                branch_name: branch.branch_name,
                categories: [],
              });
            });

            // Group categories by branch
            categoriesData.forEach((cat: CategoryWithBranch) => {
              const branchId = cat.branch_id || 1;
              const branch = branches.find((b) => b.branch_id === branchId);
              if (branch) {
                const branchData = newMap.get(branchId);
                if (branchData) {
                  branchData.categories.push(cat);
                }
              }
            });

            setCategoriesByBranch(newMap);
          }
        } else {
          throw new Error(response.message || "Failed to fetch categories");
        }
      } catch (err: any) {
        console.error("Error fetching categories:", err);
        setError(err.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user?.store_id, selectedBranch, branches]);

  const handleDeleteCategory = async (categoryId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(
        `/categories/${categoryId}`,
        { method: "DELETE" },
        true,
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        const newMap = new Map(categoriesByBranch);
        newMap.forEach((branchData) => {
          branchData.categories = branchData.categories.filter(
            (cat) => cat.category_id !== categoryId
          );
        });
        setCategoriesByBranch(newMap);
      } else {
        throw new Error(response.message || "Failed to delete category");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
    }
  };

  const toggleBranchExpand = (branchId: number) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId);
    } else {
      newExpanded.add(branchId);
    }
    setExpandedBranches(newExpanded);
  };

  const filteredCategories = (categories: CategoryWithBranch[]) => {
    if (!searchTerm) return categories;
    return categories.filter(
      (cat) =>
        cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const themeStyles = {
    dark: {
      bg: "bg-slate-900",
      headerBg: "bg-slate-800/50",
      cardBg: "bg-slate-800/50",
      cardBorder: "border-slate-700/50",
      text: "text-white",
      textSecondary: "text-slate-300",
      textTertiary: "text-slate-400",
      input:
        "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500 focus:ring-blue-500",
      button: {
        primary:
          "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
      },
      branchHeader: "bg-slate-700/30 hover:bg-slate-700/50",
      categoryRow: "hover:bg-slate-700/30",
    },
    light: {
      bg: "bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50",
      headerBg: "bg-white",
      cardBg: "bg-white",
      cardBorder: "border-slate-200",
      text: "text-slate-900",
      textSecondary: "text-slate-600",
      textTertiary: "text-slate-500",
      input:
        "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500",
      button: {
        primary:
          "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
      },
      branchHeader: "bg-blue-50/50 hover:bg-blue-100/50",
      categoryRow: "hover:bg-slate-50",
    },
  };

  const t = theme === "dark" ? themeStyles.dark : themeStyles.light;

  return (
    <FeatureGuard feature="categories_enabled">
      <div className="min-h-screen transition-colors duration-300">
        {/* Header */}
        <div
          className={`${t.headerBg} border-b ${t.cardBorder} sticky top-0 z-40 backdrop-blur-xl transition-all duration-300`}
        >
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Categories Management
                </h1>
                <p className={`${t.textSecondary} text-sm mt-1`}>
                  Organize and manage product categories by branch
                </p>
              </div>
              <button
                onClick={() => (window.location.href = "/categories/new")}
                className={`${t.button.primary} px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
              >
                <Plus size={20} />
                Add New Category
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Search and Filter */}
          <div
            className={`${t.cardBg} rounded-xl border ${t.cardBorder} p-5 mb-8 shadow-sm hover:shadow-md transition-shadow duration-300`}
          >
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className={`block text-sm font-medium ${t.text} mb-2`}>
                  Search Categories
                </label>
                <div className="relative">
                  <Search
                    size={18}
                    className={`absolute left-3 top-3.5 ${t.textTertiary}`}
                  />
                  <input
                    type="text"
                    placeholder="Search by category name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border ${t.input} rounded-lg focus:outline-none focus:ring-2 transition-all duration-300`}
                  />
                </div>
              </div>
              <div className="w-full md:w-auto">
                <label className={`block text-sm font-medium ${t.text} mb-2`}>
                  Filter by Branch
                </label>
                <select
                  value={selectedBranch || ""}
                  onChange={(e) =>
                    setSelectedBranch(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className={`w-full px-4 py-2.5 border ${t.input} rounded-lg focus:outline-none focus:ring-2 transition-all duration-300`}
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
              <div
                className={theme === "dark" ? "text-red-400" : "text-red-600"}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
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
                  Loading categories...
                </p>
              </div>
            </div>
          ) : categoriesByBranch.size === 0 ? (
            <div
              className={`${t.cardBg} rounded-xl border ${t.cardBorder} shadow-sm p-12 text-center`}
            >
              <Folder
                size={48}
                className={`mx-auto ${
                  theme === "dark" ? "text-slate-600" : "text-slate-300"
                } mb-3`}
              />
              <p className={`${t.textSecondary} font-medium`}>
                No categories found
              </p>
              <p className={`${t.textTertiary} text-sm mt-1`}>
                Get started by creating a new category.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(categoriesByBranch.entries()).map(
                ([branchId, { branch_name, categories }]) => {
                  const filtered = filteredCategories(categories);
                  if (selectedBranch && selectedBranch !== branchId)
                    return null;

                  return (
                    <div
                      key={branchId}
                      className={`${t.cardBg} rounded-xl border ${t.cardBorder} shadow-sm overflow-hidden transition-all duration-300`}
                    >
                      {/* Branch Header */}
                      <button
                        onClick={() => toggleBranchExpand(branchId)}
                        className={`w-full ${t.branchHeader} px-6 py-4 flex items-center justify-between transition-all duration-200`}
                      >
                        <div className="flex items-center gap-3">
                          <Folder size={22} className="text-blue-500" />
                          <div className="text-left">
                            <h2 className={`text-lg font-semibold ${t.text}`}>
                              {branch_name}
                            </h2>
                            <p className={`text-xs ${t.textTertiary}`}>
                              {filtered.length} categor
                              {filtered.length !== 1 ? "ies" : "y"}
                            </p>
                          </div>
                        </div>
                        {expandedBranches.has(branchId) ? (
                          <ChevronUp size={24} className={t.textSecondary} />
                        ) : (
                          <ChevronDown size={24} className={t.textSecondary} />
                        )}
                      </button>

                      {/* Categories List */}
                      {expandedBranches.has(branchId) && (
                        <div className={`border-t ${t.cardBorder}`}>
                          {filtered.length === 0 ? (
                            <div className={`px-6 py-8 text-center`}>
                              <p className={t.textTertiary}>
                                No categories in this branch
                              </p>
                            </div>
                          ) : (
                            <ul className={`divide-y ${t.cardBorder}`}>
                              {filtered.map((category, idx) => (
                                <li
                                  key={category.category_id}
                                  className={`${t.categoryRow} transition-all duration-200`}
                                >
                                  <div className="px-6 py-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex-1">
                                        <p
                                          className={`text-sm font-semibold ${t.text}`}
                                        >
                                          {category.category_name}
                                        </p>
                                        <p
                                          className={`text-xs ${t.textTertiary} mt-1`}
                                        >
                                          {category.description ||
                                            "No description"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 ml-4">
                                        <span
                                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                            category.is_active
                                              ? isDarkMode
                                                ? "bg-green-900/40 text-green-300"
                                                : "bg-green-100 text-green-700"
                                              : isDarkMode
                                              ? "bg-slate-700/50 text-slate-300"
                                              : "bg-slate-100 text-slate-700"
                                          }`}
                                        >
                                          {category.is_active
                                            ? "● Active"
                                            : "● Inactive"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-opacity-20">
                                      <div
                                        className={`text-xs ${t.textTertiary}`}
                                      >
                                        {category.total_products || 0} product
                                        {(category.total_products || 0) !== 1
                                          ? "s"
                                          : ""}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() =>
                                            (window.location.href = `/categories/${category.category_id}`)
                                          }
                                          className={`p-1.5 rounded-lg transition-colors duration-200 ${
                                            isDarkMode
                                              ? "hover:bg-blue-900/40 text-blue-400"
                                              : "hover:bg-blue-100 text-blue-600"
                                          }`}
                                          title="View"
                                        >
                                          <Eye size={16} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            (window.location.href = `/categories/${category.category_id}/edit`)
                                          }
                                          className={`p-1.5 rounded-lg transition-colors duration-200 ${
                                            isDarkMode
                                              ? "hover:bg-indigo-900/40 text-indigo-400"
                                              : "hover:bg-indigo-100 text-indigo-600"
                                          }`}
                                          title="Edit"
                                        >
                                          <Edit3 size={16} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteCategory(
                                              category.category_id
                                            )
                                          }
                                          className={`p-1.5 rounded-lg transition-colors duration-200 ${
                                            isDarkMode
                                              ? "hover:bg-red-900/40 text-red-400"
                                              : "hover:bg-red-100 text-red-600"
                                          }`}
                                          title="Delete"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </FeatureGuard>
  );
}

// Add layout to the page
CategoriesPage.getLayout = function getLayout(page: ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};
