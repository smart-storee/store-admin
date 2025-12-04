'use client';

import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Branch } from '@/types';

interface ReportData {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
  }>;
  daily_revenue: Array<{
    date: string;
    revenue: number;
  }>;
  monthly_summary: Array<{
    month: string;
    total_orders: number;
    total_revenue: number;
  }>;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch branches
        if (user?.store_id) {
          const branchesResponse: ApiResponse<{ data: Branch[] }> =
            await makeAuthenticatedRequest(
              `/branches?store_id=${user?.store_id}`,
              {},
              true, // auto-refresh token
              user?.store_id,
              user?.branch_id || undefined
            );

          if (branchesResponse.success) {
            const branchesData = Array.isArray(branchesResponse.data.data)
              ? branchesResponse.data.data
              : branchesResponse.data.data || branchesResponse.data || [];
            setBranches(branchesData);
          } else {
            throw new Error(branchesResponse.message || 'Failed to fetch branches');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load initial data');
        console.error('Load initial data error:', err);
      }
    };

    if (user?.store_id) {
      fetchInitialData();
    }
  }, [user?.store_id, user?.branch_id]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          store_id: user?.store_id?.toString() || '1',
        });

        if (selectedBranch) {
          params.append('branch_id', selectedBranch.toString());
        }

        if (dateRange.startDate) {
          params.append('start_date', dateRange.startDate);
        }

        if (dateRange.endDate) {
          params.append('end_date', dateRange.endDate);
        }

        const response: ApiResponse<{ data: ReportData }> =
          await makeAuthenticatedRequest(
            `/reports/summary?${params.toString()}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            selectedBranch || user?.branch_id || undefined
          );

        if (response.success) {
          setReportData(response.data.data || response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch report data');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load report data');
        console.error('Load report data error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.store_id) {
      fetchReportData();
    }
  }, [user?.store_id, selectedBranch, dateRange]);

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBranchChange = (branchId: number | null) => {
    setSelectedBranch(branchId);
  };

  return (
    <RoleGuard
      requiredPermissions={['view_reports']}
      fallback={
        <div className="p-6 text-center">
          <div className={`border rounded-lg px-4 py-3 mb-4 ${theme === 'dark' ? 'bg-red-900/30 border-red-700/50 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}>
            Access denied. You do not have permission to view reports.
          </div>
        </div>
      }
    >
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
        <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Reports & Analytics
                </h1>
                <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Detailed insights and analytics for your business
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className={`mb-8 p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label htmlFor="branch-filter" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Filter by Branch
                  </label>
                  <select
                    id="branch-filter"
                    value={selectedBranch || ''}
                    onChange={(e) => handleBranchChange(e.target.value ? parseInt(e.target.value) : null)}
                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
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
                  <label htmlFor="start-date" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateRangeChange}
                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div>
                  <label htmlFor="end-date" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateRangeChange}
                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setDateRange({ startDate: '', endDate: '' });
                      setSelectedBranch(null);
                    }}
                    className={`w-full py-2 px-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className={`mb-8 p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/30 border border-red-700/50 text-red-300' : 'bg-red-100 border border-red-400 text-red-700'}`}>
                {error}
              </div>
            )}

            {loading ? (
              <div className={`flex justify-center items-center h-64 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="text-center">
                  <div className="inline-flex items-center">
                    <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1"></div>
                    <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1"></div>
                    <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce"></div>
                  </div>
                  <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading reports...</p>
                </div>
              </div>
            ) : reportData ? (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'}`}>
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                        <svg className={`h-6 w-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Total Orders</p>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{reportData.total_orders}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/50' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'}`}>
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100'}`}>
                        <svg className={`h-6 w-6 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Total Revenue</p>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₹{reportData.total_revenue.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'}`}>
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                        <svg className={`h-6 w-6 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>Avg. Order Value</p>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₹{reportData.avg_order_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts and Tables Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Top Products */}
                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top Selling Products</h2>
                    <div className="space-y-4">
                      {reportData.top_products.map((product, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{product.product_name}</p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{product.quantity_sold} units sold</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'}`}>
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Revenue Chart Placeholder */}
                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Revenue Trend</h2>
                    <div className={`h-64 flex items-center justify-center rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Interactive revenue chart would be displayed here</p>
                    </div>
                  </div>
                </div>

                {/* Monthly Summary */}
                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                  <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Monthly Summary</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Month</th>
                          <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Total Orders</th>
                          <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {reportData.monthly_summary.map((monthData, index) => (
                          <tr key={index} className={index % 2 === 0 ? (theme === 'dark' ? 'bg-gray-800' : 'bg-white') : (theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50')}>
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{monthData.month}</td>
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{monthData.total_orders}</td>
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>₹{monthData.total_revenue.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-center py-12 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>No report data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}