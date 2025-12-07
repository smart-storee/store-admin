'use client';

import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useStore } from '@/contexts/StoreContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Customer, Branch, Pagination } from '@/types';

interface CustomerWithBranch extends Customer {
  branch_name?: string;
}

export default function CustomersPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { features } = useStore();
  const [customers, setCustomers] = useState<CustomerWithBranch[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

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
        setError(err.message || 'Failed to load branches');
        console.error('Load branches error:', err);
      }
    };

    if (user?.store_id) {
      fetchData();
    }
  }, [user?.store_id, user?.branch_id]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          store_id: user?.store_id?.toString() || '1',
        });

        if (searchTerm) {
          params.append('search', searchTerm);
        }

        if (selectedBranch) {
          params.append('branch_id', selectedBranch.toString());
        }

        const response: ApiResponse<Customer[] | { data: Customer[]; pagination?: Pagination } | { [key: string]: Customer }> =
          await makeAuthenticatedRequest(
            `/customers?${params.toString()}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            selectedBranch || user?.branch_id || undefined
          );

        if (response.success) {
          // Handle different response structures
          let customersData: CustomerWithBranch[] = [];
          if (Array.isArray(response.data)) {
            customersData = response.data;
          } else if (response.data && Array.isArray(response.data.data)) {
            customersData = response.data.data;
          } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            customersData = Object.values(response.data).filter((item): item is CustomerWithBranch => 
              typeof item === 'object' && 
              item !== null && 
              'cust_id' in item && 
              !('total' in item && 'page' in item && 'limit' in item) // Exclude Pagination objects
            ) as CustomerWithBranch[];
          }

          setCustomers(customersData);

          if (response.pagination) {
            setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
            setTotalCount(response.pagination.total);
          } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && 'pagination' in response.data) {
            const pagination = (response.data as { pagination: Pagination }).pagination;
            setTotalPages(Math.ceil(pagination.total / pagination.limit));
            setTotalCount(pagination.total);
          } else {
            setTotalPages(1);
            setTotalCount(customersData.length);
          }
        } else {
          throw new Error(response.message || 'Failed to fetch customers');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load customers');
        console.error('Load customers error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.store_id) {
      fetchCustomers();
    }
  }, [user?.store_id, selectedBranch, currentPage, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleBranchChange = (branchId: number | null) => {
    setSelectedBranch(branchId);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Calculate stats
  const totalCustomers = totalCount; // Use totalCount from pagination instead of customers.length
  const activeCustomers = customers.filter(c => c.is_active === 1).length;
  const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);

  // Check if customers feature is enabled
  if (features && !features.customers_enabled) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
        <div className={`max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 text-center`}>
          <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Customer List Access Disabled
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Customer list access is not enabled for this store. Please contact support to enable this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={['manage_customers']}
      fallback={
        <div className="p-6 text-center">
          <div className={`border rounded-lg px-4 py-3 mb-4 ${theme === 'dark' ? 'bg-red-900/30 border-red-700/50 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}>
            Access denied. You do not have permission to manage customers.
          </div>
        </div>
      }
    >
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Customer Management</h1>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Customers</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{totalCustomers}</p>
          </div>
          <div className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Active Customers</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activeCustomers}</p>
          </div>
          <div className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{totalOrders}</p>
          </div>
          <div className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <form onSubmit={handleSearch} className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="customer-search" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Search Customers
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="customer-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className={`w-full px-4 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <label htmlFor="branch-filter" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter by Branch
              </label>
              <select
                id="branch-filter"
                value={selectedBranch || ''}
                onChange={(e) => handleBranchChange(e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-4 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
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
        </form>

        {error && (
          <div className={`border px-4 py-3 rounded mb-4 ${theme === 'dark' ? 'bg-red-900/30 border-red-700/50 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}>
            {error}
          </div>
        )}

        {loading ? (
          <div className={`p-6 text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-md shadow`}>
            <div className="flex justify-center">
              <div className={`h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1`}></div>
              <div className={`h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1`}></div>
              <div className={`h-4 w-4 rounded-full bg-indigo-600 animate-bounce`}></div>
            </div>
          </div>
        ) : (
          <div className={`shadow overflow-hidden sm:rounded-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            {customers.length > 0 ? (
              <>
                <ul className={`${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                  {customers.map((customer, index) => (
                    <li key={customer.cust_id || `customer-${index}`}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                              {customer.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {customer.name}
                              </p>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {customer.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {customer.total_orders} orders
                              </p>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Spent ₹{(customer.total_spent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              customer.is_active === 1
                                ? theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'
                                : theme === 'dark' ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800'
                            }`}>
                              {customer.is_active === 1 ? 'Active' : 'Inactive'}
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  const customerId = customer.cust_id ? String(customer.cust_id) : '';
                                  if (customerId) {
                                    window.location.href = `/customers/${encodeURIComponent(customerId)}`;
                                  }
                                }}
                                className={`${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-900'}`}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {customer.phone}
                          </div>
                          {customer.branch_name && (
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Branch: {customer.branch_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={`bg-gray-50 px-4 py-3 sm:px-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * 10, totalCount)}
                        </span>{' '}
                        of <span className="font-medium">{totalCount}</span> results
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                            currentPage === 1
                              ? theme === 'dark' 
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : theme === 'dark'
                                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                              currentPage === page
                                ? theme === 'dark' 
                                  ? 'z-10 bg-indigo-600 text-white' 
                                  : 'z-10 bg-indigo-50 text-indigo-600 border border-indigo-500'
                                : theme === 'dark'
                                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                            currentPage === totalPages
                              ? theme === 'dark' 
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : theme === 'dark'
                                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={`text-center py-12 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-md shadow`}>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>No customers found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}