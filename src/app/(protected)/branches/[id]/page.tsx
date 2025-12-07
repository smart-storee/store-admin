'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Branch } from '@/types';
import { MapPin, Phone, Package, DollarSign, Calendar, ArrowLeft, Edit2 } from 'lucide-react';

export default function BranchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: ApiResponse<{ data: Branch }> =
          await makeAuthenticatedRequest(
            `/branches/${params.id}?store_id=${user?.store_id}`,
            {},
            true,
            user?.store_id,
            user?.branch_id || undefined
          );

        if (response.success) {
          setBranch(response.data.data || response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch branch');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load branch');
        console.error('Load branch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user?.store_id) {
      fetchBranch();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  if (loading) {
    return (
      <div className={`p-6 text-center ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
        <div className="inline-flex items-center">
          <div className={`h-4 w-4 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-indigo-600'} animate-bounce mr-1`}></div>
          <div className={`h-4 w-4 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-indigo-600'} animate-bounce mr-1`}></div>
          <div className={`h-4 w-4 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-indigo-600'} animate-bounce`}></div>
        </div>
        <p className="mt-4">Loading branch details...</p>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={['manage_branches']}
      fallback={
        <div className="p-6 text-center">
          <div className={`border rounded-lg p-4 ${isDarkMode ? 'bg-red-900/30 border-red-700/50 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}>
            Access denied. You do not have permission to view branches.
          </div>
        </div>
      }
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/branches')}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-slate-700 text-slate-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Branch Details
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/branches/${branch?.branch_id}/edit`)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Edit2 size={18} />
              Edit Branch
            </button>
            {branch && branch.is_active === 1 && (
              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to deactivate this branch? This will make it inactive.')) {
                    return;
                  }
                  try {
                    const response: ApiResponse<null> = await makeAuthenticatedRequest(
                      `/branches/${branch.branch_id}`,
                      {
                        method: 'PUT',
                        body: JSON.stringify({
                          is_active: 0,
                          store_id: user?.store_id,
                        }),
                      },
                      true,
                      user?.store_id,
                      user?.branch_id || undefined
                    );
                    if (response.success) {
                      router.push('/branches');
                    } else {
                      setError(response.message || 'Failed to deactivate branch');
                    }
                  } catch (err: any) {
                    setError(err.message || 'Failed to deactivate branch');
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  isDarkMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Deactivate Branch
              </button>
            )}
            {branch && branch.is_active === 0 && (
              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to activate this branch?')) {
                    return;
                  }
                  try {
                    const response: ApiResponse<null> = await makeAuthenticatedRequest(
                      `/branches/${branch.branch_id}`,
                      {
                        method: 'PUT',
                        body: JSON.stringify({
                          is_active: 1,
                          store_id: user?.store_id,
                        }),
                      },
                      true,
                      user?.store_id,
                      user?.branch_id || undefined
                    );
                    if (response.success) {
                      router.push('/branches');
                    } else {
                      setError(response.message || 'Failed to activate branch');
                    }
                  } catch (err: any) {
                    setError(err.message || 'Failed to activate branch');
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  isDarkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Activate Branch
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className={`border rounded-lg p-4 mb-6 flex items-center gap-3 ${
            isDarkMode
              ? 'bg-red-900/30 border-red-700/50 text-red-300'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            {error}
          </div>
        )}

        {branch ? (
          <div className={`rounded-xl border shadow-sm overflow-hidden ${
            isDarkMode
              ? 'bg-slate-800/50 border-slate-700/50'
              : 'bg-white border-gray-200'
          }`}>
            {/* Branch Header */}
            <div className={`px-6 py-5 border-b ${
              isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {branch.branch_name}
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {branch.store_name || 'Store'}
              </p>
            </div>

            {/* Branch Details Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                <div className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? branch.is_active === 1
                      ? 'bg-green-900/20 border-green-700/50'
                      : 'bg-slate-700/50 border-slate-600/50'
                    : branch.is_active === 1
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        Status
                      </p>
                      <p className={`text-lg font-semibold mt-1 ${
                        isDarkMode
                          ? branch.is_active === 1 ? 'text-green-300' : 'text-slate-400'
                          : branch.is_active === 1 ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {branch.is_active === 1 ? '● Active' : '● Inactive'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone Card */}
                <div className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-700/50 border-slate-600/50'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <Phone size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        Phone
                      </p>
                      <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {branch.branch_phone || branch.phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Card */}
                <div className={`p-4 rounded-lg border md:col-span-2 ${
                  isDarkMode
                    ? 'bg-slate-700/50 border-slate-600/50'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className={`mt-1 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        Address
                      </p>
                      <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {branch.address_line_1 || ''}
                        {branch.address_line_2 && `, ${branch.address_line_2}`}
                        {branch.city && `, ${branch.city}`}
                        {branch.pincode && ` - ${branch.pincode}`}
                        {!branch.address_line_1 && !branch.city && 'N/A'}
                      </p>
                      {branch.latitude && branch.longitude && (
                        <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          Coordinates: {Number(branch.latitude).toFixed(6)}, {Number(branch.longitude).toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Charge */}
                <div className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-700/50 border-slate-600/50'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        Delivery Charge
                      </p>
                      <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ₹{parseFloat(branch.delivery_charge?.toString() || '0').toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Surge Fee */}
                <div className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-700/50 border-slate-600/50'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className={isDarkMode ? 'text-orange-400' : 'text-orange-600'} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        Surge Fee
                      </p>
                      <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ₹{parseFloat(branch.surge_fee?.toString() || '0').toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Orders */}
                <div className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? 'bg-blue-900/20 border-blue-700/50'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <Package size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        Total Orders
                      </p>
                      <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {branch.total_orders || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Revenue */}
                <div className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        Total Revenue
                      </p>
                      <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ₹{parseFloat(branch.total_revenue?.toString() || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Created Date */}
                <div className={`p-4 rounded-lg border md:col-span-2 ${
                  isDarkMode
                    ? 'bg-slate-700/50 border-slate-600/50'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        Created
                      </p>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {branch.created_at
                          ? new Date(branch.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`text-center py-12 rounded-xl border ${
            isDarkMode
              ? 'bg-slate-800/50 border-slate-700/50 text-slate-300'
              : 'bg-white border-gray-200 text-gray-500'
          }`}>
            <p>Branch not found</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
