'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, User } from '@/types';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_name: '',
    email: '',
    phone: '',
    role: '',
    status: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: ApiResponse<{ data: User }> = 
          await makeAuthenticatedRequest(
            `/users/${params.id}?store_id=${currentUser?.store_id}`,
            {},
            true, // auto-refresh token
            currentUser?.store_id,
            currentUser?.branch_id || undefined
          );

        if (response.success) {
          const userData = response.data.data || response.data;
          setUser(userData);
          setFormData({
            user_name: userData.user_name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            status: userData.status,
          });
        } else {
          throw new Error(response.message || 'Failed to fetch user');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load user');
        console.error('Load user error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && currentUser?.store_id) {
      fetchUser();
    }
  }, [params.id, currentUser?.store_id, currentUser?.branch_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response: ApiResponse<{ data: User }> = 
        await makeAuthenticatedRequest(
          `/users/${params.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              ...formData,
              store_id: currentUser?.store_id,
              branch_id: currentUser?.branch_id || null,
            }),
          },
          true, // auto-refresh token
          currentUser?.store_id,
          currentUser?.branch_id || undefined
        );

      if (response.success) {
        router.push(`/users/${params.id}`); // Redirect to user details
      } else {
        throw new Error(response.message || 'Failed to update user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      console.error('Update user error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
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
      requiredPermissions={['manage_users']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage users.
          </div>
        </div>
      }
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit User - {user?.user_name}</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {user && (
          <form onSubmit={handleSubmit} className="bg-white shadow overflow-hidden sm:rounded-md max-w-3xl">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label htmlFor="user_name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="user_name"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleChange}
                    required
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>
                
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled // Email might be immutable
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border bg-gray-100"
                  />
                </div>
                
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>
                
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full max-w-lg pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border p-2"
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
                
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full max-w-lg pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border p-2"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="button"
                onClick={() => router.push('/users')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </RoleGuard>
  );
}