'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { Coupon, Branch, ApiResponse } from '@/types';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const EditCouponPage = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    branch_id: null as number | null,
    coupon_code: '',
    coupon_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_amount: 0,
    max_discount_amount: null as number | null,
    usage_limit_per_user: 1,
    total_usage_limit: null as number | null,
    start_date: '',
    end_date: '',
    is_active: 1,
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    fetchCoupon();
    fetchBranches();
  }, [params.id, user]);

  const fetchCoupon = async () => {
    try {
      setLoading(true);
      const response: ApiResponse<Coupon> = await makeAuthenticatedRequest(
        `/coupons/${params.id}?store_id=${user?.store_id}`
      );

      if (response.success) {
        const couponData = response.data;
        setCoupon(couponData);
        setFormData({
          branch_id: couponData.branch_id,
          coupon_code: couponData.coupon_code,
          coupon_type: couponData.coupon_type,
          discount_value: couponData.discount_value,
          min_order_amount: couponData.min_order_amount,
          max_discount_amount: couponData.max_discount_amount,
          usage_limit_per_user: couponData.usage_limit_per_user,
          total_usage_limit: couponData.total_usage_limit,
          start_date: new Date(couponData.start_date).toISOString().slice(0, 16),
          end_date: new Date(couponData.end_date).toISOString().slice(0, 16),
          is_active: couponData.is_active === 1 || couponData.is_active === true ? 1 : 0,
        });
      } else {
        setError(response.message || 'Failed to fetch coupon');
      }
    } catch (err) {
      console.error('Error fetching coupon:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch coupon');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response: ApiResponse<Branch[]> = await makeAuthenticatedRequest(
        `/branches?store_id=${user?.store_id}`
      );
      if (response.success) {
        const branchesData = Array.isArray(response.data)
          ? response.data
          : (response.data as ApiResponse<Branch[]>)?.data || [];
        setBranches(branchesData);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString().slice(0, 19).replace('T', ' '),
        end_date: new Date(formData.end_date).toISOString().slice(0, 19).replace('T', ' '),
        branch_id: formData.branch_id || null,
        max_discount_amount: formData.max_discount_amount || null,
        total_usage_limit: formData.total_usage_limit || null,
        is_active: formData.is_active === 1 ? 1 : 0, // Explicitly ensure it's 1 or 0
      };

      const response = await makeAuthenticatedRequest(`/coupons/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(submitData),
      });

      if (response.success) {
        router.push('/coupons');
      } else {
        setError(response.message || 'Failed to update coupon');
      }
    } catch (err) {
      console.error('Error updating coupon:', err);
      setError(err instanceof Error ? err.message : 'Failed to update coupon');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading coupon...</p>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
        <div className="text-center py-12">
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Coupon not found</p>
          <button
            onClick={() => router.push('/coupons')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Coupons
          </button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'manager']}>
      <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className={`mb-4 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              ← Back to Coupons
            </button>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Edit Coupon
            </h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {coupon.coupon_code}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={`p-6 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="space-y-6">
              {/* Coupon Code */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.coupon_code}
                  onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Coupon Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Discount Type *
                </label>
                <select
                  value={formData.coupon_type}
                  onChange={(e) => setFormData({ ...formData, coupon_type: e.target.value as 'percentage' | 'fixed' })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Discount Value *
                  {formData.coupon_type === 'percentage' ? ' (%)' : ' (₹)'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={formData.coupon_type === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Max Discount Amount (for percentage) */}
              {formData.coupon_type === 'percentage' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Max Discount Amount (₹) <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.max_discount_amount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount_amount: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Leave empty for no limit"
                  />
                </div>
              )}

              {/* Branch */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Branch <span className="text-gray-500">(Leave empty for all branches)</span>
                </label>
                <select
                  value={formData.branch_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branch_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Order Amount */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_order_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) || 0 })
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Usage Limit Per User
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit_per_user}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit_per_user: Number(e.target.value) || 1 })
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Total Usage Limit <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_usage_limit || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_usage_limit: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4"
                  />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Active</span>
                </label>
              </div>

              {/* Usage Stats */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Usage Statistics</h3>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Used: {coupon.used_count} times
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
};

export default EditCouponPage;
