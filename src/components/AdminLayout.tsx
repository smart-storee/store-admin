'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DarkModeToggle from '@/components/DarkModeToggle';
import StoreBranchSelector from '@/components/StoreBranchSelector';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

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
    { name: 'Users', href: '/users', permission: 'manage_users' },
    { name: 'Notifications', href: '/notifications', permission: 'manage_notifications' },
    { name: 'Reports', href: '/reports', permission: 'view_reports' },
    { name: 'API Logs', href: '/api-logs', permission: 'view_dashboard' },
    { name: 'Settings', href: '/settings', permission: 'app_settings' },
  ];

  const isActive = (href: string) => pathname === href;

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
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-indigo-700">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-white text-xl font-bold">Admin Panel</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-indigo-800 p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <DarkModeToggle />
                <button
                  onClick={logout}
                  className="text-sm text-indigo-200 hover:text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="md:pr-4">
          {/* Top header with branch selector */}
          <div className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pathname === '/dashboard' && 'Dashboard'}
                    {pathname === '/branches' && 'Branches Management'}
                    {/* {pathname === '/products' && 'Products Management'} */}
                    {/* {pathname === '/categories' && 'Categories Management'} */}
                    {pathname === '/orders' && 'Orders Management'}
                    {pathname === '/customers' && 'Customers Management'}
                    {pathname === '/users' && 'Users Management'}
                    {pathname === '/notifications' && 'Notifications'}
                    {pathname === '/reports' && 'Reports & Analytics'}
                    {pathname === '/api-logs' && 'API Logs'}
                    {pathname === '/settings' && 'App Settings'}
                  </h2>
                </div>

                {/* Store/Branch selector */}
                {/* <StoreBranchSelector /> */}
                <div className="flex items-center">
                <span className="mr-4">Welcome, {user?.user_name}</span>
                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  {user?.user_name.charAt(0).toUpperCase()}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;