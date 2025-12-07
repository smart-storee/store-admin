'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Customer, Order } from '@/types';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError(null);

        // Handle params.id - it might be an array or object in Next.js 14
        const customerId = Array.isArray(params.id) ? params.id[0] : (typeof params.id === 'object' ? String(params.id) : params.id);
        
        if (!customerId) {
          throw new Error('Customer ID is required');
        }

        console.log('Fetching customer with ID:', customerId);
        const response: ApiResponse<{ profile: Customer; stats?: { total_orders: number; total_spent: number }; addresses?: any[]; orders?: Order[] } | Customer> =
          await makeAuthenticatedRequest(
            `/customers/${customerId}?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        console.log('Customer API Response:', response);

        if (response.success) {
          // Backend returns: { success: true, data: { profile, stats, addresses, orders } }
          const responseData = response.data as { profile?: Customer; stats?: { total_orders: number; total_spent: number }; addresses?: any[]; orders?: Order[] } | Customer;
          const customerData = ('profile' in responseData ? responseData.profile : responseData) as Customer;
          console.log('Customer Data:', customerData);

          // Merge stats into customer data for display
          if ('stats' in responseData && responseData.stats) {
            customerData.total_orders = responseData.stats.total_orders;
            customerData.total_spent = responseData.stats.total_spent;
          }

          setCustomer(customerData);

          // Use orders from the same response
          if ('orders' in responseData && responseData.orders) {
            setOrders(responseData.orders);
          }
        } else {
          throw new Error(response.message || 'Failed to fetch customer');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load customer');
        console.error('Load customer error:', err);
      } finally {
        setLoading(false);
      }
    };

    const customerId = Array.isArray(params.id) ? params.id[0] : (typeof params.id === 'object' ? String(params.id) : params.id);
    if (customerId && user?.store_id) {
      fetchCustomer();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  if (loading) {
    return (
      <div className={`p-6 text-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="inline-flex items-center">
          <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1"></div>
          <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1"></div>
          <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce"></div>
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
            Access denied. You do not have permission to view customers.
          </div>
        </div>
      }
    >
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Customer Details</h1>
          <button
            onClick={() => router.push('/customers')}
            className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
          >
            Back to Customers
          </button>
        </div>

        {error && (
          <div className={`border px-4 py-3 rounded mb-4 ${theme === 'dark' ? 'bg-red-900/30 border-red-700/50 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}>
            {error}
          </div>
        )}

        {customer ? (
          <div className={`shadow overflow-hidden sm:rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-4 py-5 sm:px-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl">
                  {(customer.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {customer.name || 'Unknown Customer'}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Member since {new Date(customer.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Contact Information</h4>
                  <div className="mt-2">
                    <div className={`flex items-center text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                      <svg className={`flex-shrink-0 mr-1.5 h-5 w-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      {customer.email}
                    </div>
                    <div className={`mt-1 flex items-center text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                      <svg className={`flex-shrink-0 mr-1.5 h-5 w-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      {customer.phone}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Customer Activity</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders</p>
                      <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{customer.total_orders || 0}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Spent</p>
                      <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        ₹{(customer.total_spent || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.is_active === 1
                        ? theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'
                        : theme === 'dark' ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Orders */}
              <div className="mt-8">
                <h4 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Recent Orders</h4>
                {orders.length > 0 ? (
                  <div className={`border rounded-lg ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <ul className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {orders.map((order) => (
                        <li key={order.order_id} className="px-4 py-4 hover:bg-opacity-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                #{order.order_number}
                              </span>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.order_status === 'delivered' ? (theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800') :
                                order.order_status === 'cancelled' ? (theme === 'dark' ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800') :
                                order.order_status === 'pending' ? (theme === 'dark' ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800') :
                                order.order_status === 'confirmed' ? (theme === 'dark' ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800') :
                                (theme === 'dark' ? 'bg-gray-900/40 text-gray-300' : 'bg-gray-100 text-gray-800')
                              }`}>
                                {order.order_status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                ₹{order.total_amount}
                              </span>
                              <button
                                onClick={() => router.push(`/orders/${order.order_id}`)}
                                className={`ml-4 text-sm ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-900'}`}
                              >
                                View Order
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No orders found for this customer
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`text-center py-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-md`}>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Customer not found</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}