'use client';

import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { AdminUser, ApiResponse, Pagination } from '@/types';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { Plus, Search, Edit3, Trash2, Eye, Moon, Sun, ChevronLeft, ChevronRight, AlertCircle, Users, Mail, Phone, Calendar, ShieldCheck, Zap } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hoveredUser, setHoveredUser] = useState<number | null>(null);
  const { user } = useAuth();
  const { features } = useStore();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, user, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (user?.store_id) {
        params.append('store_id', user.store_id.toString());
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response: ApiResponse<{ users: AdminUser[]; pagination: Pagination }> =
        await makeAuthenticatedRequest(`/users?${params.toString()}`);

      if (response.success) {
        const usersData = Array.isArray(response.data) ? response.data : [];
        setUsers(usersData);

        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
          setTotalCount(response.pagination.total);
        } else {
          setTotalCount(usersData.length);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('connect to the server')) {
          setError('Cannot connect to the server. Please make sure the backend API is running.');
        } else if (err.message.includes('403')) {
          setError('Access denied. You do not have permission to view users.');
        } else if (err.message.includes('401')) {
          setError('Authentication expired. Please log in again.');
        } else {
          setError(err.message || 'Failed to fetch users. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const response: ApiResponse<null> = await makeAuthenticatedRequest(`/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        fetchUsers();
      } else {
        alert(response.message || 'Failed to delete user');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, { light: string; dark: string }> = {
      admin: { light: 'bg-purple-100 text-purple-800', dark: 'bg-purple-900/40 text-purple-300' },
      manager: { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900/40 text-blue-300' },
      staff: { light: 'bg-green-100 text-green-800', dark: 'bg-green-900/40 text-green-300' },
      user: { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-900/40 text-gray-300' },
    };
    return colors[role] || colors.user;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { light: string; dark: string }> = {
      active: { light: 'bg-green-100 text-green-800', dark: 'bg-green-900/40 text-green-300' },
      inactive: { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-900/40 text-gray-300' },
      suspended: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900/40 text-red-300' },
    };
    return colors[status] || colors.inactive;
  };

  const theme = {
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
      userCard: 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50',
      statCard: 'bg-slate-700/50 border-slate-600/50',
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
      userCard: 'bg-white border-slate-200 hover:bg-slate-50',
      statCard: 'bg-blue-50 border-blue-200',
    }
  };

  const t = isDarkMode ? theme.dark : theme.light;

  // Check if employees feature is enabled
  if (features && !features.employees_enabled) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
        <div className={`max-w-4xl mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 text-center`}>
          <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Employee Management Disabled
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Employee management is not enabled for this store. Please contact support to enable this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={['manage_users']}
      fallback={
        <div className={`p-6 text-center ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'}`}>
          <div className={`${isDarkMode ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-200'} border rounded-lg px-4 py-3 mb-4`}>
            <p className={isDarkMode ? 'text-red-300' : 'text-red-700'}>Access denied. You do not have permission to manage users.</p>
          </div>
        </div>
      }
    >
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : theme.light.bg} transition-colors duration-300`}>
        {/* Header */}
        <div className={`${t.headerBg} border-b ${t.cardBorder} sticky top-0 z-40 backdrop-blur-xl transition-all duration-300`}>
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Users Management
                </h1>
                <p className={`${t.textSecondary} text-sm mt-1`}>Manage team members and user access</p>
              </div>
              <div className="flex items-center gap-4">
                {/* <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-slate-700/50 text-yellow-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition-all duration-300`}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button> */}
                <button
                  onClick={() => window.location.href = '/users/new'}
                  className={`${t.button.primary} px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                >
                  <Plus size={20} />
                  Add New User
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: totalCount, icon: Users },
              { label: 'Active', value: users.filter(u => u.status === 'active').length, icon: Zap },
              { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck },
              { label: 'Staff', value: users.filter(u => u.role === 'staff').length, icon: Users },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`${t.statCard} border rounded-xl p-6 hover:shadow-lg transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={24} className="text-blue-500" />
                  </div>
                  <p className={`${t.textTertiary} text-sm font-medium mb-1`}>{stat.label}</p>
                  <p className={`text-2xl font-bold ${t.text}`}>{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Search and Filters */}
          <div className={`${t.cardBg} rounded-xl border ${t.cardBorder} p-6 mb-8 shadow-sm`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium ${t.text} mb-2`}>Search Users</label>
                <div className="relative">
                  <Search size={18} className={`absolute left-3 top-3.5 ${t.textTertiary}`} />
                  <input
                    type="text"
                    placeholder="Name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className={`w-full pl-10 pr-4 py-2.5 border ${t.input} rounded-lg focus:outline-none focus:ring-2 transition-all duration-300`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${t.text} mb-2`}>Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                  className={`w-full px-4 py-2.5 border ${t.input} rounded-lg focus:outline-none focus:ring-2 transition-all duration-300`}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${t.text} mb-2`}>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className={`w-full px-4 py-2.5 border ${t.input} rounded-lg focus:outline-none focus:ring-2 transition-all duration-300`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`${isDarkMode ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-200'} border rounded-xl p-4 mb-8 flex items-center gap-3`}>
              <AlertCircle size={20} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
              <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className={`${t.cardBg} rounded-xl border ${t.cardBorder} shadow-sm p-12`}>
              <div className="flex flex-col items-center justify-center gap-4">
                <div className={`w-12 h-12 border-4 ${isDarkMode ? 'border-slate-700 border-t-blue-500' : 'border-blue-200 border-t-blue-600'} rounded-full animate-spin`}></div>
                <p className={`${t.textSecondary} font-medium`}>Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className={`${t.cardBg} rounded-xl border ${t.cardBorder} shadow-sm p-12 text-center`}>
              <Users size={48} className={`mx-auto ${isDarkMode ? 'text-slate-600' : 'text-slate-300'} mb-3`} />
              <p className={`${t.textSecondary} font-medium`}>No users found</p>
              <p className={`${t.textTertiary} text-sm mt-1`}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.user_id}
                  onMouseEnter={() => setHoveredUser(u.user_id)}
                  onMouseLeave={() => setHoveredUser(null)}
                  className={`${t.userCard} border rounded-xl p-5 transition-all duration-300 hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* User Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-blue-400 to-indigo-500'} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-semibold ${t.text} truncate`}>{u.name}</h3>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <div className={`flex items-center gap-1 ${t.textSecondary} text-sm`}>
                            <Mail size={14} />
                            <span className="truncate">{u.email}</span>
                          </div>
                          <div className={`flex items-center gap-1 ${t.textSecondary} text-sm`}>
                            <Phone size={14} />
                            {u.phone}
                          </div>
                          <div className={`flex items-center gap-1 ${t.textSecondary} text-sm`}>
                            <Calendar size={14} />
                            {new Date(u.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Badges and Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(u.role)[isDarkMode ? 'dark' : 'light']}`}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(u.status)[isDarkMode ? 'dark' : 'light']}`}>
                          {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className={`flex items-center gap-2 transition-all duration-300 ${hoveredUser === u.user_id ? 'opacity-100' : 'opacity-60'}`}>
                        <button
                          onClick={() => window.location.href = `/users/${u.user_id}`}
                          className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-blue-900/40 text-blue-400' : 'hover:bg-blue-100 text-blue-600'}`}
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => window.location.href = `/users/${u.user_id}/edit`}
                          className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-indigo-900/40 text-indigo-400' : 'hover:bg-indigo-100 text-indigo-600'}`}
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.user_id)}
                          className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`${t.cardBg} border ${t.cardBorder} rounded-xl mt-8 px-6 py-4 flex items-center justify-between`}>
              <div className={`text-sm ${t.textSecondary}`}>
                Showing <span className={`font-semibold ${t.text}`}>{(currentPage - 1) * 10 + 1}</span> to{' '}
                <span className={`font-semibold ${t.text}`}>{Math.min(currentPage * 10, totalCount)}</span> of{' '}
                <span className={`font-semibold ${t.text}`}>{totalCount}</span> users
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