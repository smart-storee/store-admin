'use client';

import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { Order, ApiResponse, Pagination } from '@/types';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });


       if (!user?.store_id) {
        setError('No store selected');
        setLoading(false);
        return;
      }


      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      params.append('store_id', user.store_id.toString());

      console.log('Fetching orders with params:', params.toString()); // Debug log

      const response: ApiResponse<{ data: Order[], pagination: Pagination }> =
        await makeAuthenticatedRequest(`/orders?${params.toString()}`, { method: 'GET' }, true, user.store_id, user.branch_id || undefined);

      console.log('Orders API response:', response); // Debug log

      if (response.success) {
        setOrders(response.data.data || response.data);
        setTotalPages(response.pagination ? Math.ceil(response.pagination.total / response.pagination.limit) : 1);
      } else {
        throw new Error(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Orders fetch error details:', err);

      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('connect to the server')) {
          setError('Cannot connect to the server. Please make sure the backend API is running.');
        } else if (err.message.includes('403') || err.message.includes('Access forbidden')) {
          setError('Access denied. You do not have permission to view orders.');
        } else if (err.message.includes('401') || err.message.includes('Authentication failed')) {
          setError('Authentication expired. Please log in again.');
        } else {
          setError(err.message || 'Failed to fetch orders. Please try again later.');
        }
      } else {
        setError('Failed to fetch orders. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        `/orders/${orderId}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ order_status: newStatus }),
        }
      );
      
      if (response.success) {
        fetchOrders(); // Refresh the list
      } else {
        alert(response.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Update order status error:', err);
      if (err instanceof Error) {
        alert(err.message || 'Failed to update order status');
      } else {
        alert('Failed to update order status');
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery': return 'bg-teal-100 text-teal-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <RoleGuard
      requiredPermissions={['manage_orders']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to view orders.
          </div>
        </div>
      }
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-l-md px-4 py-2 w-full sm:w-auto"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="p-6 text-center">Loading orders...</div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <li key={order.order_id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate">Order #{order.order_number}</p>
                          <p className="text-sm text-gray-500">
                            {order.customer_name} | {order.customer_phone}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                            {order.order_status.replace('_', ' ')}
                          </span>
                          <p className="text-sm font-medium text-gray-900">₹{order.total_amount}</p>
                          <div className="flex space-x-2">
                            <select
                              value={order.order_status}
                              onChange={(e) => handleStatusUpdate(order.order_id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button className="text-indigo-600 hover:text-indigo-900 text-sm">
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <div className="mr-6 flex items-center text-sm text-gray-500">
                            Branch: {order.branch_name}
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 4a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          {order.items_count} items
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {orders.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No orders found</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          &larr;
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                            currentPage === totalPages
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          &rarr;
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}