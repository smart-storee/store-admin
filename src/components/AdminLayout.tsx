'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DarkModeToggle from '@/components/DarkModeToggle';
import StoreBranchSelector from '@/components/StoreBranchSelector';
import { IoSettingsOutline, IoLogOutOutline } from 'react-icons/io5';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [dropdownTimer, setDropdownTimer] = useState<NodeJS.Timeout | null>(null);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleMouseEnterProfile = () => {
    if (dropdownTimer) {
      clearTimeout(dropdownTimer);
      setDropdownTimer(null);
    }
    setProfileDropdownOpen(true);
  };

  const handleMouseLeaveProfile = () => {
    const timer = setTimeout(() => {
      setProfileDropdownOpen(false);
    }, 200);
    setDropdownTimer(timer);
  };

  interface NavigationItem {
    name: string;
    href: string;
    permission?: string;
  }

  // Navigation items based on permissions
  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', permission: 'view_dashboard' },
    { name: 'Branches', href: '/branches', permission: 'manage_branches' },
    { name: 'Setup Flow', href: '/setup-flow', permission: 'manage_categories' },
    // { name: 'Products', href: '/products', permission: 'manage_products' },
    // { name: 'Categories', href: '/categories', permission: 'manage_categories' },
    { name: 'Orders', href: '/orders', permission: 'manage_orders' },
    { name: 'Customers', href: '/customers', permission: 'manage_customers' },
    { name: 'Employees', href: '/users', permission: 'manage_users' },
    { name: 'Notifications', href: '/notifications', permission: 'manage_notifications' },
    { name: 'Reports', href: '/reports', permission: 'view_reports' },
    { name: 'API Logs', href: '/api-logs', permission: 'view_dashboard' },
    { name: 'Settings', href: '/settings', permission: 'app_settings' },
  ];

  const isActive = (href: string) => pathname === href;

  const getIcon = (name: string) => {
    switch (name) {
      case 'Dashboard':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        );
      case 'Branches':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case 'Setup Flow':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m5.2-15.8l-4.2 4.2m0 6l-4.2 4.2M23 12h-6m-6 0H1m20.8-5.2l-4.2 4.2m0 6l-4.2 4.2"></path>
          </svg>
        );
      case 'Orders':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        );
      case 'Customers':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'Employees':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        );
      case 'Notifications':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        );
      case 'Reports':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        );
      case 'API Logs':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      case 'Settings':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6"></path>
            <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24"></path>
            <path d="M1 12h6m6 0h6"></path>
            <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">

      {/* Mobile sidebar */}
      <div className="md:hidden">
        {/* Mobile menu button */}
        <button
          type="button"
          className="fixed bottom-4 right-4 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white z-50"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="sr-only">Open main menu</span>
          {sidebarOpen ? (
            <svg
              className="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-lg z-50">
              <div className="h-full overflow-y-auto">
                <div className="px-4 pt-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium text-gray-900">Menu</div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close menu</span>
                      <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <nav className="mt-5">
                    <div className="space-y-1">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`${
                            isActive(item.href)
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300"
        style={{
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          width: sidebarCollapsed ? '80px' : '256px'
        }}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8" style={{ justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#4169E1',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  S
                </div>
                {!sidebarCollapsed && (
                  <h1 style={{ color: '#111827', fontSize: '18px', fontWeight: '700' }}>Store Admin</h1>
                )}
              </div>
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B7280',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
            </div>
            <nav className="mt-2 flex-1 px-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  title={sidebarCollapsed ? item.name : ''}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    gap: sidebarCollapsed ? '0' : '12px',
                    padding: sidebarCollapsed ? '12px' : '12px 16px',
                    fontSize: '15px',
                    fontWeight: '500',
                    borderRadius: '8px',
                    backgroundColor: isActive(item.href) ? '#4169E120' : 'transparent',
                    color: isActive(item.href) ? '#4169E1' : '#6B7280',
                    borderLeft: isActive(item.href) ? '3px solid #4169E1' : '3px solid transparent',
                    marginLeft: isActive(item.href) ? '-3px' : '0',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.href)) {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                      e.currentTarget.style.color = '#111827';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.href)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6B7280';
                    }
                  }}
                >
                  {getIcon(item.name)}
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid #E5E7EB' }}>
            <div style={{
              display: 'flex',
              flexDirection: sidebarCollapsed ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: sidebarCollapsed ? '12px' : '12px',
              width: '100%'
            }}>
              {!sidebarCollapsed && <DarkModeToggle />}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{
          paddingLeft: sidebarCollapsed ? '80px' : '256px'
        }}
      >
        <div className="md:pr-4">
          {/* Top header with branch selector */}
          <div className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pathname === '/dashboard' && 'Dashboard'}
                    {pathname === '/branches' && 'Branches Management'}
                    {/* {pathname === '/products' && 'Products Management'} */}
                    {/* {pathname === '/categories' && 'Categories Management'} */}
                    {pathname === '/orders' && 'Orders Management'}
                    {pathname === '/customers' && 'Customers Management'}
                    {pathname === '/users' && 'Employees Management'}
                    {pathname === '/notifications' && 'Notifications'}
                    {pathname === '/reports' && 'Reports & Analytics'}
                    {pathname === '/api-logs' && 'API Logs'}
                    {pathname === '/settings' && 'App Settings'}
                  </h2>
                </div>

                {/* Store/Branch selector */}
                {/* <StoreBranchSelector /> */}
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 dark:text-gray-300">Welcome, {user?.name || 'Admin'}</span>

                  {/* Profile Dropdown */}
                  <div
                    style={{ position: 'relative' }}
                    onMouseEnter={handleMouseEnterProfile}
                    onMouseLeave={handleMouseLeaveProfile}
                  >
                    <div
                      className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white cursor-pointer hover:bg-indigo-600 transition-colors"
                      style={{
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>

                    {/* Dropdown Menu */}
                    {profileDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '8px',
                          width: '200px',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          border: '1px solid #E5E7EB',
                          zIndex: 50,
                          overflow: 'hidden'
                        }}
                        onMouseEnter={handleMouseEnterProfile}
                        onMouseLeave={handleMouseLeaveProfile}
                      >
                        {/* User Info */}
                        <div style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #E5E7EB',
                          backgroundColor: '#F9FAFB'
                        }}>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '2px'
                          }}>
                            {user?.name || 'Admin'}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            color: '#6B7280'
                          }}>
                            {user?.email || ''}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div style={{ padding: '8px 0' }}>
                          <Link
                            href="/settings"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px 16px',
                              fontSize: '14px',
                              color: '#374151',
                              textDecoration: 'none',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F3F4F6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <IoSettingsOutline size={18} />
                            Settings
                          </Link>

                          <button
                            onClick={logout}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px 16px',
                              fontSize: '14px',
                              color: '#EF4444',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEF2F2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <IoLogOutOutline size={18} />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;