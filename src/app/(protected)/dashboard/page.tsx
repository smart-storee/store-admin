'use client';

import { useState, useEffect } from 'react';
import ProtectedRouteWrapper from '@/components/ProtectedRouteWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { makeAuthenticatedRequest } from '@/utils/api';
import { DashboardSummary, Branch, Store } from '@/types';
import { LoadingWrapper } from '@/components/LoadingWrapper';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);

  // Effect to handle store selection and data fetching
  useEffect(() => {
    // Set the store based on the user's assigned store
    if (user?.store_id) {
      setSelectedStore(user.store_id);
    } else {
      setError('No store assigned. Please contact an administrator.');
    }
  }, [user]);

  // Effect to fetch branches when store is selected
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedStore) {
        setBranches([]);
        setSelectedBranch(null);
        return;
      }

      try {
        setLoading(true);
        const branchesResponse = await makeAuthenticatedRequest(
          `/branches?store_id=${selectedStore}`
        );

        if (branchesResponse.success) {
          setBranches(branchesResponse.data);
          // Reset selected branch when store changes
          setSelectedBranch(null);

          // Set the first branch as default if available
          if (branchesResponse.data.length > 0) {
            setSelectedBranch(branchesResponse.data[0].branch_id);
          }
        } else {
          throw new Error(branchesResponse.message || 'Failed to fetch branches');
        }
      } catch (err: any) {
        console.error('Error fetching branches:', err);
        setError(`Failed to load branches: ${err.message || 'Unknown error'}`);
        setBranches([]);
        setSelectedBranch(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [selectedStore]);

  // Effect to fetch dashboard data when store or branch changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Don't fetch if we don't have a store selected
      // if (!selectedStore) {
      //   setError('Please select a store');
      //   return;
      // }

      // Don't fetch if we have branches but no branch is selected
      if (branches.length > 0 && !selectedBranch) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Add null check for user
        if (!user || !user.store_id) {
          throw new Error('User information is not available');
        }

        const params = new URLSearchParams({
          store_id: user.store_id.toString(),
        });

        // Only add branch_id if a branch is selected
        if (selectedBranch) {
          params.append('branch_id', selectedBranch.toString());
        }

        const data = await makeAuthenticatedRequest(`/dashboard?${params.toString()}`);
        if (data.success) {
          setDashboardData(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch dashboard data');
        }
      } catch (err: any) {
        // More specific error handling
        if (err.message.includes('connect to the server')) {
          setError('Cannot connect to the server. Please make sure the backend API is running.');
        } else if (err.message.includes('403') || err.message.includes('Access forbidden')) {
          setError('Access denied. You do not have permission to view dashboard data.');
        } else if (err.message.includes('401') || err.message.includes('Authentication failed')) {
          setError('Authentication expired. Please log in again.');
        } else {
          setError(err.message || 'Failed to fetch dashboard data');
        }
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [selectedBranch]);



  if (error) {
    return (
      <ProtectedRouteWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRouteWrapper>
    );
  }

  return (
    <ProtectedRouteWrapper>
      <div >

        <main>
          <div className="mx-auto">
            <LoadingWrapper
              loading={loading}
              loadingText="Loading dashboard data..."
            >
              <>


                {dashboardData && (
                  <div className="px-4 py-6 sm:px-0">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                      {/* Total Orders */}
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                                <dd className="flex items-baseline">
                                  <div className="text-2xl font-semibold text-gray-900">{dashboardData.summary.total_orders}</div>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Revenue */}
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                <dd className="flex items-baseline">
                                  <div className="text-2xl font-semibold text-gray-900">₹{dashboardData.summary.total_revenue.toLocaleString()}</div>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Customers */}
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                                <dd className="flex items-baseline">
                                  <div className="text-2xl font-semibold text-gray-900">{dashboardData.summary.total_customers}</div>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active Branches */}
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Active Branches</dt>
                                <dd className="flex items-baseline">
                                  <div className="text-2xl font-semibold text-gray-900">{dashboardData.summary.active_branches}</div>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Today's Metrics */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Metrics</h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <dl>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Orders Today</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{dashboardData.today_metrics.orders_today}</dd>
                          </div>
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Revenue Today</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">₹{dashboardData.today_metrics.revenue_today.toLocaleString()}</dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Pending Orders</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{dashboardData.today_metrics.pending_orders}</dd>
                          </div>
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Completed Orders</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{dashboardData.today_metrics.completed_orders}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Top Products</h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <ul className="divide-y divide-gray-200">
                          {dashboardData.top_products.map((product) => (
                            <li key={product.product_id}>
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-indigo-600 truncate">{product.product_name}</div>
                                  <div className="ml-2 flex-shrink-0 flex">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      {product.total_sold} sold
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                  <div className="text-sm text-gray-500 truncate">Revenue: ₹{product.revenue.toLocaleString()}</div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Order Status Summary */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-8">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Order Status Summary</h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-yellow-700">Pending</dt>
                            <dd className="mt-1 text-2xl font-semibold text-yellow-900">{dashboardData.today_metrics.pending_orders}</dd>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-blue-700">Confirmed</dt>
                            <dd className="mt-1 text-2xl font-semibold text-blue-900">{dashboardData.today_metrics.confirmed_orders}</dd>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-purple-700">Preparing</dt>
                            <dd className="mt-1 text-2xl font-semibold text-purple-900">{dashboardData.today_metrics.preparing_orders}</dd>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-green-700">Completed</dt>
                            <dd className="mt-1 text-2xl font-semibold text-green-900">{dashboardData.today_metrics.completed_orders}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}
              </>
            </LoadingWrapper>
          </div>
        </main>
      </div>
    </ProtectedRouteWrapper>
  );
}