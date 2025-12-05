'use client';

import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { Branch, ApiResponse, Pagination } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin, Plus, Search, Edit3, Trash2, Eye, ChevronLeft, ChevronRight, AlertCircle, Package, Users, Building2, TrendingUp, Moon, Sun } from 'lucide-react';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    fetchBranches();
  }, [currentPage, searchTerm, filterActive]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        store_id: user?.store_id?.toString() || '1',
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (filterActive !== 'all') {
        params.append('is_active', filterActive === 'active' ? '1' : '0');
      }

      const response: ApiResponse<{ data: Branch[]; pagination: Pagination }> =
        await makeAuthenticatedRequest(`/branches?${params.toString()}`);

      if (response.success) {
        const branchesData = Array.isArray(response.data)
          ? response.data
          : (response.data?.data || []);

        setBranches(branchesData);

        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
          setTotalCount(response.pagination.total);
        } else {
          setTotalPages(1);
          setTotalCount(branchesData.length);
        }
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to fetch branches');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch branches');
      console.error('Branches fetch error:', err);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    setFilterActive(filter);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeleteBranch = async (branchId: number) => {
    if (!confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(`/branches/${branchId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        fetchBranches();
      } else {
        throw new Error(response.message || 'Failed to delete branch');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete branch');
      console.error('Branch delete error:', err);
    }
  };

  const activeBranches = branches.filter(b => b.is_active === 1).length;
  const totalOrders = branches.reduce((sum, b) => sum + (b.total_orders || 0), 0);
  // const totalEmployees = branches.reduce((sum, b) => sum + (b.employees || 0), 0);

  const themeStyles = {
    dark: {
      bg: 'bg-slate-900',
      bgGradient: 'from-slate-900 via-slate-800 to-slate-900',
      headerBg: 'bg-slate-800/50',
      headerBorder: 'border-slate-700/50',
      cardBg: 'bg-slate-800/50',
      cardBorder: 'border-slate-700/50',
      text: 'text-white',
      textSecondary: 'text-slate-300',
      textTertiary: 'text-slate-400',
      table: {
        headerBg: 'from-slate-700/50 to-slate-700/30',
        rowHover: 'bg-slate-700/30',
        border: 'border-slate-700/30',
      },
      input: 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500 focus:ring-blue-500',
      button: {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
        secondary: 'bg-slate-700/50 hover:bg-slate-700 text-slate-300',
        filter: 'bg-slate-700/50 text-slate-300 hover:bg-slate-600',
        filterActive: 'bg-blue-600 text-white',
      },
      statCard: {
        blue: 'from-blue-900/40 to-blue-800/40 border-blue-700/50 bg-blue-900/20 backdrop-blur-xl',
        green: 'from-green-900/40 to-green-800/40 border-green-700/50 bg-green-900/20 backdrop-blur-xl',
        purple: 'from-purple-900/40 to-purple-800/40 border-purple-700/50 bg-purple-900/20 backdrop-blur-xl',
        orange: 'from-orange-900/40 to-orange-800/40 border-orange-700/50 bg-orange-900/20 backdrop-blur-xl',
      }
    },
    light: {
      bg: 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50',
      bgGradient: 'from-slate-50 via-blue-50 to-slate-50',
      headerBg: 'bg-white',
      headerBorder: 'border-slate-200',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      text: 'text-slate-900',
      textSecondary: 'text-slate-600',
      textTertiary: 'text-slate-500',
      table: {
        headerBg: 'from-slate-50 to-slate-100',
        rowHover: 'bg-blue-50/50',
        border: 'border-slate-100',
      },
      input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500',
      button: {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
        secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
        filter: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        filterActive: 'bg-blue-600 text-white',
      },
      statCard: {
        blue: 'from-blue-500/10 to-blue-600/10 border-blue-200 bg-white',
        green: 'from-green-500/10 to-green-600/10 border-green-200 bg-white',
        purple: 'from-purple-500/10 to-purple-600/10 border-purple-200 bg-white',
        orange: 'from-orange-500/10 to-orange-600/10 border-orange-200 bg-white',
      }
    }
  };

  const t = theme === 'dark' ? themeStyles.dark : themeStyles.light;
  const isDarkMode = theme === 'dark';

  return (
    <div className="min-h-screen transition-colors duration-300">
      <div className="py-8">
        {/* Combined Header with Search and Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Search */}
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-600 mb-2">Search</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by branch name, city, or address..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
              <div className="relative">
                <select
                  value={filterActive}
                  onChange={(e) => handleFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-200"
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
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Sort By */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-600 mb-2">Sort By</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-200"
                >
                  <option value="newest">Date (Newest First)</option>
                  <option value="oldest">Date (Oldest First)</option>
                  <option value="name">Name (A-Z)</option>
                </select>
                <svg
                  className="absolute right-3 top-3.5 pointer-events-none text-gray-400"
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Right side: Add New Branch button */}
            <div className="md:col-span-2 flex items-end">
              <button
                onClick={() => window.location.href = '/branches/new'}
                className={`${t.button.primary} w-full px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap`}
              >
                <Plus size={20} />
                Add New Branch
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="text-gray-600 text-sm mt-4">
            Showing {branches.length} of {totalCount} branches
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`border rounded-xl p-4 mb-8 flex items-center gap-3 ${theme === 'dark' ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-200'}`}>
            <AlertCircle size={20} className={theme === 'dark' ? 'text-red-400' : 'text-red-600'} />
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className={`${t.cardBg} rounded-xl border ${t.cardBorder} shadow-sm p-12`}>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className={`w-12 h-12 border-4 ${theme === 'dark' ? 'border-slate-700 border-t-blue-500' : 'border-blue-200 border-t-blue-600'} rounded-full animate-spin`}></div>
              <p className={`${t.textSecondary} font-medium`}>Loading branches...</p>
            </div>
          </div>
        ) : (
          /* Branches Table */
          <div className={`${t.cardBg} rounded-xl border ${t.cardBorder} shadow-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`bg-gradient-to-r ${t.table.headerBg} border-b ${t.table.border}`}>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${t.text}`}>Branch Name</th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${t.text}`}>Location</th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${t.text}`}>Address</th>
                    <th className={`px-6 py-4 text-center text-sm font-semibold ${t.text}`}>Orders</th>
                    <th className={`px-6 py-4 text-center text-sm font-semibold ${t.text}`}>Status</th>
                    <th className={`px-6 py-4 text-right text-sm font-semibold ${t.text}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <tr
                        key={branch.branch_id}
                        onMouseEnter={() => setHoveredRow(branch.branch_id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className={`border-b ${t.table.border} transition-all duration-200 ${
                          hoveredRow === branch.branch_id ? t.table.rowHover : ''
                        }`}
                      >
                        <td className={`px-6 py-4 font-semibold ${t.text}`}>{branch.branch_name}</td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 ${t.textSecondary} text-sm`}>
                            <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                            <span>{branch.city}, {branch.pincode}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${t.textSecondary} text-sm`}>{branch.address}</td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-2 ${theme === 'dark' ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-900'} px-3 py-1.5 rounded-lg`}>
                            <Package size={16} />
                            <span className="font-semibold">{(branch.total_orders || 0).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${
                            branch.is_active === 1
                              ? theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
                              : theme === 'dark' ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {branch.is_active === 1 ? '● Active' : '● Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`flex items-center justify-end gap-2 transition-all duration-300 ${
                            hoveredRow === branch.branch_id ? 'opacity-100' : 'opacity-60'
                          }`}>
                            <button
                              onClick={() => window.location.href = `/branches/${branch.branch_id}`}
                              className={`p-2 rounded-lg transition-colors duration-200 ${theme === 'dark' ? 'hover:bg-blue-900/40 text-blue-400' : 'hover:bg-blue-100 text-blue-600'}`}
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => window.location.href = `/branches/${branch.branch_id}/edit`}
                              className={`p-2 rounded-lg transition-colors duration-200 ${theme === 'dark' ? 'hover:bg-indigo-900/40 text-indigo-400' : 'hover:bg-indigo-100 text-indigo-600'}`}
                              title="Edit"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch.branch_id)}
                              className={`p-2 rounded-lg transition-colors duration-200 ${theme === 'dark' ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className={`px-6 py-12 text-center`}>
                        <Building2 size={48} className={`mx-auto ${isDarkMode ? 'text-slate-600' : 'text-slate-300'} mb-3`} />
                        <p className={`${t.textSecondary} font-medium`}>No branches found</p>
                        <p className={`${t.textTertiary} text-sm mt-1`}>Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`bg-gradient-to-r ${t.table.headerBg} border-t ${t.table.border} px-6 py-4 flex items-center justify-between`}>
                <div className={`text-sm ${t.textSecondary}`}>
                  Showing <span className={`font-semibold ${t.text}`}>{(currentPage - 1) * 10 + 1}</span> to{' '}
                  <span className={`font-semibold ${t.text}`}>{Math.min(currentPage * 10, totalCount)}</span> of{' '}
                  <span className={`font-semibold ${t.text}`}>{totalCount}</span> branches
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border ${t.cardBorder} ${t.button.secondary} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300`}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-md'
                          : `${t.textSecondary} hover:bg-slate-700/50`
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border ${t.cardBorder} ${t.button.secondary} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}