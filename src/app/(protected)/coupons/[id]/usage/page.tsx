'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Users, ShoppingBag, DollarSign, ArrowLeft } from 'lucide-react';

interface UsageRecord {
  usage_id: number;
  order_id: number;
  order_number: string;
  user_id: number;
  user_name: string;
  user_email: string | null;
  user_phone: string | null;
  discount_amount: number;
  order_status: string;
  payment_status: string;
  total_amount: number;
  order_date: string;
  used_at: string;
}

interface UserStat {
  user_id: number;
  user_name: string;
  user_email: string | null;
  user_phone: string | null;
  total_orders: number;
  total_discount: number;
  orders: Array<{
    order_id: number;
    order_number: string;
    order_status: string;
    payment_status: string;
    total_amount: number;
    discount_amount: number;
    order_date: string;
    used_at: string;
  }>;
}

interface CouponUsageData {
  coupon: {
    coupon_id: number;
    coupon_code: string;
    coupon_type: string;
    discount_value: number;
    used_count: number;
    total_usage_limit: number | null;
  };
  summary: {
    total_users: number;
    total_usage: number;
    total_discount_given: number;
  };
  users: UserStat[];
  all_usage: UsageRecord[];
}

const CouponUsagePage = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<CouponUsageData | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'all'>('users');

  const isDark = theme === 'dark';

  useEffect(() => {
    fetchUsageDetails();
  }, [params.id, user]);

  const fetchUsageDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(
        `/coupons/${params.id}/usage?store_id=${user?.store_id}`
      );

      if (response.success) {
        setUsageData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch coupon usage details');
      }
    } catch (err) {
      console.error('Error fetching coupon usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch coupon usage details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['owner']}>
        <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading usage details...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error || !usageData) {
    return (
      <RoleGuard allowedRoles={['owner']}>
        <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.back()}
              className={`mb-4 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              ← Back to Coupons
            </button>
            <div className="text-center py-12">
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{error || 'Failed to load usage details'}</p>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['owner']}>
      <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className={`mb-4 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              ← Back to Coupons
            </button>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Coupon Usage Details
            </h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {usageData.coupon.coupon_code} - {usageData.coupon.coupon_type === 'percentage' ? `${usageData.coupon.discount_value}%` : `₹${usageData.coupon.discount_value}`} discount
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex items-center">
                <Users className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'} mr-3`} />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {usageData.summary.total_users}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex items-center">
                <ShoppingBag className={`h-8 w-8 ${isDark ? 'text-green-400' : 'text-green-600'} mr-3`} />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Usage</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {usageData.summary.total_usage}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex items-center">
                <DollarSign className={`h-8 w-8 ${isDark ? 'text-purple-400' : 'text-purple-600'} mr-3`} />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Discount Given</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(usageData.summary.total_discount_given)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={`mb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? isDark
                      ? 'border-blue-500 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                By User ({usageData.users.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? isDark
                      ? 'border-blue-500 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Usage Records ({usageData.all_usage.length})
              </button>
            </nav>
          </div>

          {/* Content */}
          {activeTab === 'users' ? (
            <div className={`rounded-lg shadow-sm overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              {usageData.users.length === 0 ? (
                <div className="text-center py-12">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No users have used this coupon yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {usageData.users.map((userStat) => (
                    <div key={userStat.user_id} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {userStat.user_name}
                          </h3>
                          <div className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {userStat.user_phone && <span>Phone: {userStat.user_phone}</span>}
                            {userStat.user_email && (
                              <span className="ml-4">Email: {userStat.user_email}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {userStat.total_orders} {userStat.total_orders === 1 ? 'order' : 'orders'}
                          </p>
                          <p className={`text-lg font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            Total Discount: {formatCurrency(userStat.total_discount)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full">
                          <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                            <tr>
                              <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Order Number
                              </th>
                              <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Date
                              </th>
                              <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Order Amount
                              </th>
                              <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Discount
                              </th>
                              <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {userStat.orders.map((order) => (
                              <tr key={order.order_id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                <td className={`px-4 py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  <button
                                    onClick={() => router.push(`/orders/${order.order_id}`)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    {order.order_number}
                                  </button>
                                </td>
                                <td className={`px-4 py-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {formatDate(order.order_date)}
                                </td>
                                <td className={`px-4 py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {formatCurrency(order.total_amount)}
                                </td>
                                <td className={`px-4 py-2 text-green-600 font-medium`}>
                                  -{formatCurrency(order.discount_amount)}
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    order.order_status === 'delivered' 
                                      ? 'bg-green-100 text-green-700'
                                      : order.order_status === 'cancelled'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {order.order_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`rounded-lg shadow-sm overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Order
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Customer
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Date
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Order Amount
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Discount
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {usageData.all_usage.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No usage records found</p>
                        </td>
                      </tr>
                    ) : (
                      usageData.all_usage.map((usage) => (
                        <tr key={usage.usage_id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <button
                              onClick={() => router.push(`/orders/${usage.order_id}`)}
                              className="text-blue-600 hover:text-blue-900 font-mono"
                            >
                              {usage.order_number}
                            </button>
                          </td>
                          <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <div>
                              <div className="font-medium">{usage.user_name}</div>
                              {usage.user_phone && (
                                <div className="text-xs text-gray-500">{usage.user_phone}</div>
                              )}
                              {usage.user_email && (
                                <div className="text-xs text-gray-500">{usage.user_email}</div>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {formatDate(usage.order_date)}
                          </td>
                          <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(usage.total_amount)}
                          </td>
                          <td className={`px-6 py-4 text-green-600 font-medium`}>
                            -{formatCurrency(usage.discount_amount)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              usage.order_status === 'delivered' 
                                ? 'bg-green-100 text-green-700'
                                : usage.order_status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {usage.order_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
};

export default CouponUsagePage;
