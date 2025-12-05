'use client';

import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { Order, ApiResponse, Pagination, Branch } from '@/types';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight, Search, MapPin, Phone, Calendar, Package, TrendingUp, Clock, CheckCircle, XCircle, Eye, Edit, Moon, Sun, MoreVertical, Filter, Download } from 'lucide-react';

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response: ApiResponse<{ data: Branch[] }> =
          await makeAuthenticatedRequest(`/branches?store_id=${user?.store_id}`);
        if (response.success) {
          setBranches(response.data.data || response.data);
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      }
    };

    if (user?.store_id) {
      fetchBranches();
    }
  }, [user?.store_id]);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, selectedBranch]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.store_id) {
        setError('No store selected');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        store_id: user.store_id.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (selectedBranch) {
        params.append('branch_id', selectedBranch.toString());
      }

      const response: ApiResponse<{ data: Order[]; pagination: Pagination }> =
        await makeAuthenticatedRequest(`/orders?${params.toString()}`, { method: 'GET' }, true, user.store_id, selectedBranch || undefined);

      if (response.success) {
        const ordersData = response.data.data || response.data;
        setOrders(ordersData);
        
        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
          setTotalCount(response.pagination.total);
        }

        // Calculate stats
        const stats: OrderStats = {
          total: ordersData.length,
          pending: ordersData.filter(o => o.order_status === 'pending').length,
          confirmed: ordersData.filter(o => o.order_status === 'confirmed').length,
          preparing: ordersData.filter(o => o.order_status === 'preparing').length,
          ready: ordersData.filter(o => o.order_status === 'ready').length,
          delivered: ordersData.filter(o => o.order_status === 'delivered').length,
          cancelled: ordersData.filter(o => o.order_status === 'cancelled').length,
        };
        setOrderStats(stats);
      } else {
        throw new Error(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Orders fetch error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch orders. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
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
        fetchOrders();
        setExpandedOrder(null);
      } else {
        alert(response.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Update order status error:', err);
      alert(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; bgLight: string; bgDark: string; textLight: string; textDark: string; badge: string }> = {
      pending: { icon: Clock, bgLight: 'bg-yellow-50 border-yellow-200', bgDark: 'bg-yellow-900/20 border-yellow-700/50', textLight: 'text-yellow-700', textDark: 'text-yellow-300', badge: 'bg-yellow-100 text-yellow-800' },
      confirmed: { icon: CheckCircle, bgLight: 'bg-blue-50 border-blue-200', bgDark: 'bg-blue-900/20 border-blue-700/50', textLight: 'text-blue-700', textDark: 'text-blue-300', badge: 'bg-blue-100 text-blue-800' },
      preparing: { icon: Package, bgLight: 'bg-purple-50 border-purple-200', bgDark: 'bg-purple-900/20 border-purple-700/50', textLight: 'text-purple-700', textDark: 'text-purple-300', badge: 'bg-purple-100 text-purple-800' },
      ready: { icon: TrendingUp, bgLight: 'bg-indigo-50 border-indigo-200', bgDark: 'bg-indigo-900/20 border-indigo-700/50', textLight: 'text-indigo-700', textDark: 'text-indigo-300', badge: 'bg-indigo-100 text-indigo-800' },
      out_for_delivery: { icon: TrendingUp, bgLight: 'bg-teal-50 border-teal-200', bgDark: 'bg-teal-900/20 border-teal-700/50', textLight: 'text-teal-700', textDark: 'text-teal-300', badge: 'bg-teal-100 text-teal-800' },
      delivered: { icon: CheckCircle, bgLight: 'bg-green-50 border-green-200', bgDark: 'bg-green-900/20 border-green-700/50', textLight: 'text-green-700', textDark: 'text-green-300', badge: 'bg-green-100 text-green-800' },
      cancelled: { icon: XCircle, bgLight: 'bg-red-50 border-red-200', bgDark: 'bg-red-900/20 border-red-700/50', textLight: 'text-red-700', textDark: 'text-red-300', badge: 'bg-red-100 text-red-800' },
    };
    return configs[status] || configs.pending;
  };

  const themeStyles = {
    dark: {
      bg: 'bg-slate-900',
      headerBg: 'bg-slate-800/50',
      cardBg: 'bg-slate-800/50',
      cardBorder: 'border-slate-700/50',
      text: 'text-white',
      textSecondary: 'text-slate-300',
      textTertiary: 'text-slate-400',
      input: 'bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500 focus:ring-blue-500',
      button: {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
        secondary: 'bg-slate-700/50 hover:bg-slate-700 text-slate-300',
      },
      statCard: 'bg-slate-700/50 border-slate-600/50',
      orderCard: 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50',
    },
    light: {
      bg: 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50',
      headerBg: 'bg-white',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      text: 'text-slate-900',
      textSecondary: 'text-slate-600',
      textTertiary: 'text-slate-500',
      input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500',
      button: {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
        secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
      },
      statCard: 'bg-blue-50 border-blue-200',
      orderCard: 'bg-white border-slate-200 hover:bg-slate-50',
    }
  };

  const t = theme === 'dark' ? themeStyles.dark : themeStyles.light;

  return (
    <RoleGuard
      requiredPermissions={['manage_orders']}
      fallback={
        <div className="p-6 text-center">
          <div className="border rounded-lg px-4 py-3 mb-4">
            <p className="text-red-700 dark:text-red-300">Access denied. You do not have permission to view orders.</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen transition-colors duration-300">
        {/* Header */}
        <div className={`${t.headerBg} border-b ${t.cardBorder} sticky top-0 z-40 backdrop-blur-xl transition-all duration-300`}>
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Orders Management
                </h1>
                <p className={`${t.textSecondary} text-sm mt-1`}>Track and manage all customer orders</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            {[
              { label: 'Total', value: totalCount, icon: '📋', color: 'blue' },
              { label: 'Pending', value: orderStats.pending, icon: '⏳', color: 'yellow' },
              { label: 'Confirmed', value: orderStats.confirmed, icon: '✓', color: 'blue' },
              { label: 'Preparing', value: orderStats.preparing, icon: '👨‍🍳', color: 'purple' },
              { label: 'Ready', value: orderStats.ready, icon: '📦', color: 'indigo' },
              { label: 'Delivered', value: orderStats.delivered, icon: '✔', color: 'green' },
              { label: 'Cancelled', value: orderStats.cancelled, icon: '✕', color: 'red' },
            ].map((stat, i) => (
              <button
                key={i}
                onClick={() => stat.label !== 'Total' ? setStatusFilter(stat.label.toLowerCase().replace(' ', '_')) : setStatusFilter('all')}
                className={`rounded-lg border ${t.statCard} p-3 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 ${
                  (statusFilter === 'all' && stat.label === 'Total') || 
                  (statusFilter === stat.label.toLowerCase().replace(' ', '_')) 
                    ? 'ring-2 ring-blue-500' 
                    : ''
                }`}
              >
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className={`text-xl font-bold ${t.text}`}>{stat.value}</p>
                <p className={`text-xs ${t.textTertiary}`}>{stat.label}</p>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className={`${t.cardBg} rounded-xl border ${t.cardBorder} p-5 mb-8 shadow-sm`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium ${t.text} mb-2`}>Search Orders</label>
                <div className="relative">
                  <Search size={18} className={`absolute left-3 top-3.5 ${t.textTertiary}`} />
                  <input
                    type="text"
                    placeholder="Order #, customer name, phone..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className={`w-full pl-10 pr-4 py-2.5 border ${t.input} rounded-lg focus:outline-none focus:ring-2 transition-all duration-300`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${t.text} mb-2`}>Branch</label>
                <select
                  value={selectedBranch || ''}
                  onChange={(e) => { setSelectedBranch(e.target.value ? parseInt(e.target.value) : null); setCurrentPage(1); }}
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
              <div>
                <label className={`block text-sm font-medium ${t.text} mb-2`}>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className={`w-full px-4 py-2.5 border ${t.input} rounded-lg focus:outline-none focus:ring-2 transition-all duration-300`}
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
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`border rounded-xl p-4 mb-8 flex items-center gap-3 ${theme === 'dark' ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-200'}`}>
              <XCircle size={20} className={theme === 'dark' ? 'text-red-400' : 'text-red-600'} />
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className={`${t.cardBg} rounded-xl border ${t.cardBorder} shadow-sm p-12`}>
              <div className="flex flex-col items-center justify-center gap-4">
                <div className={`w-12 h-12 border-4 ${theme === 'dark' ? 'border-slate-700 border-t-blue-500' : 'border-blue-200 border-t-blue-600'} rounded-full animate-spin`}></div>
                <p className={`${t.textSecondary} font-medium`}>Loading orders...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className={`${t.cardBg} rounded-xl border ${t.cardBorder} shadow-sm p-12 text-center`}>
              <Package size={48} className={`mx-auto ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'} mb-3`} />
              <p className={`${t.textSecondary} font-medium`}>No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.order_status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div
                    key={order.order_id}
                    className={`${t.orderCard} border rounded-xl transition-all duration-300 overflow-hidden`}
                  >
                    {/* Order Header */}
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                      className="w-full px-6 py-4 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className={`text-lg font-bold ${t.text}`}>Order #{order.order_number}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.badge}`}>
                            {order.order_status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`text-lg font-bold ${t.text}`}>₹{order.total_amount}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className={`flex items-center gap-1 ${t.textSecondary}`}>
                            <span className="font-semibold">{order.customer_name}</span>
                          </div>
                          <div className={`flex items-center gap-1 ${t.textSecondary}`}>
                            <Phone size={14} />
                            {order.customer_phone}
                          </div>
                          <div className={`flex items-center gap-1 ${t.textSecondary}`}>
                            <MapPin size={14} />
                            {order.branch_name}
                          </div>
                          <div className={`flex items-center gap-1 ${t.textSecondary}`}>
                            <Calendar size={14} />
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div className={`flex items-center gap-1 ${t.textSecondary}`}>
                            <Package size={14} />
                            {order.items_count} items
                          </div>
                        </div>
                      </div>
                      <div className={`ml-4 ${expandedOrder === order.order_id ? 'rotate-180' : ''} transition-transform duration-300`}>
                        <ChevronLeft size={24} className={t.textSecondary} />
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {expandedOrder === order.order_id && (
                      <div className={`border-t ${t.cardBorder} px-6 py-4 space-y-4`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className={`${t.textTertiary} text-xs mb-1`}>STATUS WORKFLOW</p>
                            <div className="flex flex-wrap gap-2">
                              {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusUpdate(order.order_id, status)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                                    order.order_status === status
                                      ? 'ring-2 ring-blue-500 ' + getStatusConfig(status).badge
                                      : isDarkMode ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {status.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className={`${t.textTertiary} text-xs mb-1`}>QUICK ACTIONS</p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleStatusUpdate(order.order_id, 'confirmed')}
                                className={`${t.button.primary} px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300`}
                              >
                                ✓ Accept
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(order.order_id, 'cancelled')}
                                className={`${isDarkMode ? 'bg-red-900/40 hover:bg-red-900/60 text-red-300' : 'bg-red-50 hover:bg-red-100 text-red-600'} px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300`}
                              >
                                ✕ Reject
                              </button>
                              <button
                                onClick={() => window.location.href = `/orders/${order.order_id}`}
                                className={`${isDarkMode ? 'bg-slate-700/50 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2`}
                              >
                                <Eye size={16} /> View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`${t.cardBg} border ${t.cardBorder} rounded-xl mt-8 px-6 py-4 flex items-center justify-between`}>
              <div className={`text-sm ${t.textSecondary}`}>
                Showing <span className={`font-semibold ${t.text}`}>{(currentPage - 1) * 10 + 1}</span> to{' '}
                <span className={`font-semibold ${t.text}`}>{Math.min(currentPage * 10, totalCount)}</span> of{' '}
                <span className={`font-semibold ${t.text}`}>{totalCount}</span> orders
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
                        : t.button.secondary
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
      </div>
    </RoleGuard>
  );
}