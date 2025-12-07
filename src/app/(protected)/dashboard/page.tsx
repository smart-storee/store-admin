'use client';

import { useState, useEffect } from 'react';
import ProtectedRouteWrapper from '@/components/ProtectedRouteWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { makeAuthenticatedRequest } from '@/utils/api';
import { DashboardSummary, Branch, Store } from '@/types';
import { LoadingWrapper } from '@/components/LoadingWrapper';

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [storeConfig, setStoreConfig] = useState<{ app_name: string; logo_url: string } | null>(null);

  const getSummaryIcon = (title: string, color: string) => {
    switch (title) {
      case 'Total Orders':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        );
      case 'Total Revenue':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6"></circle>
            <path d="M18.09 10.37A6 6 0 1 1 10.37 18.09"></path>
            <path d="M12 2v6"></path>
            <path d="M12 16v6"></path>
            <path d="M2 12h6"></path>
            <path d="M16 12h6"></path>
          </svg>
        );
      case 'Total Customers':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'Active Branches':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case 'SMS Sent':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <line x1="9" y1="10" x2="15" y2="10"></line>
            <line x1="9" y1="14" x2="13" y2="14"></line>
          </svg>
        );
      case 'Notifications Sent':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            <circle cx="18" cy="8" r="3" fill={color}></circle>
          </svg>
        );
      case 'OTP Sent':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            <line x1="12" y1="16" x2="12" y2="19"></line>
            <circle cx="12" cy="20" r="1"></circle>
          </svg>
        );
      default:
        return null;
    }
  };

  // Effect to handle store selection and data fetching
  useEffect(() => {
    if (user?.store_id) {
      setSelectedStore(user.store_id);
    } else {
      setError('No store assigned. Please contact an administrator.');
    }
  }, [user]);

  // Fetch store config (app_name and logo)
  useEffect(() => {
    const fetchStoreConfig = async () => {
      if (!user?.store_id) return;

      try {
        const response = await makeAuthenticatedRequest(
          `/app-settings?store_id=${user.store_id}`,
          {},
          true,
          user.store_id,
          user.branch_id || undefined
        );

        if (response.success) {
          const config = response.data.data || response.data;
          setStoreConfig({
            app_name: config.app_name || user.store_name || 'Store',
            logo_url: config.logo_url || ''
          });
        }
      } catch (err) {
        console.error('Error fetching store config:', err);
        // Fallback to user.store_name if API fails
        setStoreConfig({
          app_name: user.store_name || 'Store',
          logo_url: ''
        });
      }
    };

    fetchStoreConfig();
  }, [user?.store_id, user?.store_name]);

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
          setSelectedBranch(null);

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
      if (branches.length > 0 && !selectedBranch) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (!user || !user.store_id) {
          throw new Error('User information is not available');
        }

        const params = new URLSearchParams({
          store_id: user.store_id.toString(),
        });

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
  }, [selectedBranch, user, branches.length]);

  if (error) {
    return (
      <ProtectedRouteWrapper>
        <div className="container mx-auto px-4 py-8">
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderLeft: '4px solid #EF4444'
            }}
          >
            <p style={{ color: '#EF4444' }}>{error}</p>
          </div>
        </div>
      </ProtectedRouteWrapper>
    );
  }

  return (
    <ProtectedRouteWrapper>
      <LoadingWrapper loading={loading} loadingText="Loading dashboard...">
        <div style={{ width: '100%' }}>
          {dashboardData && (
            <>
              {/* Hero Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '32px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ zIndex: 1, flex: 1 }}>
                  <h1 style={{
                    color: '#FFFFFF',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}>
                    Hello, {user?.name || 'Admin'}! Welcome to {storeConfig?.app_name || user?.store_name || 'Store Admin'}
                  </h1>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    marginBottom: '24px',
                    maxWidth: '600px'
                  }}>
                    Track your store's orders, manage inventory, and monitor your business performance in real-time.
                  </p>
                  <button
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#4169E1',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    View All Orders
                  </button>
                </div>

                {/* Store Logo */}
                {storeConfig?.logo_url ? (
                  <div style={{
                    width: '300px',
                    height: '200px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '32px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    padding: '16px'
                  }}>
                    <img
                      src={storeConfig.logo_url}
                      alt={storeConfig.app_name || 'Store Logo'}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = '<span style="color: rgba(255, 255, 255, 0.5); font-size: 14px;">Store Logo</span>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '300px',
                    height: '200px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '32px'
                  }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                      {storeConfig?.app_name || 'Store'} Logo
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                color: isDarkMode ? '#f8fafc' : '#111827'
              }}>
                Today's Summary
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
              }}>
                {[
                  { title: 'Total Orders', subtitle: `${dashboardData.summary.total_orders} ${dashboardData.summary.total_orders === 1 ? 'order' : 'orders'}`, color: '#3B82F6' },
                  { title: 'Total Revenue', subtitle: `₹${dashboardData.summary.total_revenue.toLocaleString()}`, color: '#10B981' },
                  { title: 'Total Customers', subtitle: `${dashboardData.summary.total_customers} ${dashboardData.summary.total_customers === 1 ? 'customer' : 'customers'}`, color: '#8B5CF6' },
                  { title: 'Active Branches', subtitle: `${dashboardData.summary.active_branches} ${dashboardData.summary.active_branches === 1 ? 'branch' : 'branches'}`, color: '#F59E0B' },
                  { title: 'SMS Sent', subtitle: `${dashboardData.summary.total_sms_sent || 0} ${dashboardData.summary.total_sms_sent === 1 ? 'SMS' : 'SMS'}`, color: '#EC4899' },
                  { title: 'Notifications Sent', subtitle: `${dashboardData.summary.total_notifications_sent || 0} ${dashboardData.summary.total_notifications_sent === 1 ? 'notification' : 'notifications'}`, color: '#06B6D4' },
                  { title: 'OTP Sent', subtitle: `${dashboardData.summary.total_otp_sent || 0} ${dashboardData.summary.total_otp_sent === 1 ? 'OTP' : 'OTPs'}`, color: '#10B981' }
                ].map((action, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                  borderRadius: '12px',
                  padding: '20px',
                  border: isDarkMode ? '1px solid #334155' : '1px solid #E5E7EB',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderLeft: `4px solid ${action.color}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#334155' : '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#1e293b' : '#FFFFFF';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: isDarkMode ? '#f8fafc' : '#111827',
                      marginBottom: '4px'
                    }}>
                      {action.title}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: isDarkMode ? '#cbd5e1' : '#6B7280'
                    }}>
                      {action.subtitle}
                    </p>
                  </div>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: `${action.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getSummaryIcon(action.title, action.color)}
                  </div>
                </div>
              </div>
            ))}
          </div>

              {/* Recent Orders Section */}
              <>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginTop: '32px',
                  marginBottom: '16px',
                  color: isDarkMode ? '#f8fafc' : '#111827'
                }}>
                  Recent Orders
                </h2>
                <div style={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                  borderRadius: '12px',
                  border: isDarkMode ? '1px solid #334155' : '1px solid #E5E7EB',
                  overflow: 'hidden',
                  marginBottom: '32px'
                }}>
                  {dashboardData.recent_orders && dashboardData.recent_orders.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ 
                          backgroundColor: isDarkMode ? '#334155' : '#F9FAFB', 
                          borderBottom: isDarkMode ? '1px solid #475569' : '1px solid #E5E7EB' 
                        }}>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                            Order ID
                          </th>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                            Customer
                          </th>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                            Date
                          </th>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                            Amount
                          </th>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                            Payment
                          </th>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                            Status
                          </th>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recent_orders.map((order, index) => {
                          const getStatusColor = (status: string | undefined | null) => {
                            if (!status) {
                              return { bg: '#6B728020', color: '#6B7280' };
                            }
                            switch (status.toLowerCase()) {
                              case 'completed':
                              case 'delivered':
                                return { bg: '#10B98120', color: '#10B981' };
                              case 'pending':
                                return { bg: '#F59E0B20', color: '#F59E0B' };
                              case 'confirmed':
                              case 'preparing':
                              case 'ready':
                                return { bg: '#3B82F620', color: '#3B82F6' };
                              case 'cancelled':
                                return { bg: '#EF444420', color: '#EF4444' };
                              case 'out_for_delivery':
                                return { bg: '#8B5CF620', color: '#8B5CF6' };
                              default:
                                return { bg: '#6B728020', color: '#6B7280' };
                            }
                          };
                          const statusColors = getStatusColor(order.status);

                          return (
                            <tr
                              key={index}
                              style={{
                                borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #F3F4F6',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isDarkMode ? '#334155' : '#F9FAFB';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isDarkMode ? '#1e293b' : '#FFFFFF';
                              }}
                            >
                              <td style={{ padding: '16px', fontSize: '14px', color: isDarkMode ? '#f8fafc' : '#111827', fontWeight: '600' }}>
                                #{order.order_id}
                              </td>
                              <td style={{ padding: '16px', fontSize: '14px', color: isDarkMode ? '#f8fafc' : '#111827' }}>
                                <div>
                                  <div style={{ fontWeight: '500' }}>{order.customer_name}</div>
                                  {order.customer_email && (
                                    <div style={{ fontSize: '12px', color: isDarkMode ? '#cbd5e1' : '#6B7280', marginTop: '2px' }}>
                                      {order.customer_email}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '16px', fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                                {new Date(order.order_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td style={{ padding: '16px', fontSize: '14px', color: isDarkMode ? '#f8fafc' : '#111827', fontWeight: '600' }}>
                                ₹{order.total_amount.toLocaleString()}
                              </td>
                              <td style={{ padding: '16px', fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#6B7280', textTransform: 'uppercase' }}>
                                {order.payment_method || 'N/A'}
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span style={{
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  backgroundColor: statusColors.bg,
                                  color: statusColors.color,
                                  textTransform: 'capitalize'
                                }}>
                                  {order.status ? order.status.replace(/_/g, ' ') : 'Unknown'}
                                </span>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <button
                                  onClick={() => window.location.href = `/orders/${order.order_id}`}
                                  style={{
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    border: isDarkMode ? '1px solid #475569' : '1px solid #E5E7EB',
                                    backgroundColor: isDarkMode ? '#334155' : '#FFFFFF',
                                    fontSize: '13px',
                                    color: isDarkMode ? '#cbd5e1' : '#6B7280',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isDarkMode ? '#475569' : '#F9FAFB';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = isDarkMode ? '#334155' : '#FFFFFF';
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{
                      padding: '60px 20px',
                      textAlign: 'center'
                    }}>
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9CA3AF"
                        strokeWidth="1.5"
                        style={{ margin: '0 auto 16px' }}
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                      <p style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#6B7280',
                        marginBottom: '8px'
                      }}>
                        No orders yet
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: '#9CA3AF'
                      }}>
                        There are no orders placed by customers yet.
                      </p>
                    </div>
                  )}
                </div>
              </>

              {/* Top Products Table */}
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                color: isDarkMode ? '#f8fafc' : '#111827'
              }}>
                Top Products
              </h2>
              <div style={{
                backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                borderRadius: '12px',
                border: isDarkMode ? '1px solid #334155' : '1px solid #E5E7EB',
                overflow: 'hidden'
              }}>
                {dashboardData.top_products && dashboardData.top_products.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ 
                        backgroundColor: isDarkMode ? '#334155' : '#F9FAFB', 
                        borderBottom: isDarkMode ? '1px solid #475569' : '1px solid #E5E7EB' 
                      }}>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                          Image
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                          Product Name
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                          Total Sold
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                          Revenue
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                          Status
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.top_products.map((product, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #F3F4F6',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#334155' : '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#1e293b' : '#FFFFFF';
                        }}
                      >
                        <td style={{ padding: '16px' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: isDarkMode ? '#334155' : '#F3F4F6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: isDarkMode ? '1px solid #334155' : '1px solid #E5E7EB'
                            }}
                          >
                            {product.product_image ? (
                              <img
                                src={product.product_image}
                                alt={product.product_name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : null}
                            {!product.product_image && (
                              <span style={{
                                color: isDarkMode ? '#6B7280' : '#9CA3AF',
                                fontSize: '20px'
                              }}>
                                📦
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: isDarkMode ? '#f8fafc' : '#111827', fontWeight: '500' }}>
                          {product.product_name}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                          {product.total_sold}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                          ₹{product.revenue.toLocaleString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '500',
                            backgroundColor: '#10B98120',
                            color: '#10B981'
                          }}>
                            {product.total_sold} sold
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                border: isDarkMode ? '1px solid #475569' : '1px solid #E5E7EB',
                                backgroundColor: isDarkMode ? '#334155' : '#FFFFFF',
                                fontSize: '13px',
                                color: isDarkMode ? '#cbd5e1' : '#6B7280',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isDarkMode ? '#475569' : '#F9FAFB';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isDarkMode ? '#334155' : '#FFFFFF';
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{
                    padding: '60px 20px',
                    textAlign: 'center'
                  }}>
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      style={{ margin: '0 auto 16px' }}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#6B7280',
                      marginBottom: '8px'
                    }}>
                      No products added
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: '#9CA3AF'
                    }}>
                      There are no products added yet.
                    </p>
                  </div>
                )}
              </div>

            </>
          )}
        </div>
      </LoadingWrapper>
    </ProtectedRouteWrapper>
  );
}
