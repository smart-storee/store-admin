'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Order } from '@/types';

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    order_status: '',
    delivery_address: '',
    delivery_notes: '',
    total_amount: 0,
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: ApiResponse<{ data: Order }> = 
          await makeAuthenticatedRequest(
            `/orders/${params.id}?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (response.success) {
          const fetchedOrder = response.data.data || response.data;
          setOrder(fetchedOrder);
          setFormData({
            order_status: fetchedOrder.order_status,
            delivery_address: fetchedOrder.delivery_address,
            delivery_notes: fetchedOrder.delivery_notes || '',
            total_amount: fetchedOrder.total_amount,
          });
        } else {
          throw new Error(response.message || 'Failed to fetch order');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
        console.error('Load order error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user?.store_id) {
      fetchOrder();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response: ApiResponse<{ data: any }> =
        await makeAuthenticatedRequest(
          `/orders/${params.id}/status`,
          {
            method: 'PUT',
            body: JSON.stringify({
              order_status: formData.order_status,
              notes: formData.delivery_notes || undefined,
              store_id: user?.store_id,
              branch_id: user?.branch_id || null,
            }),
          },
          true, // auto-refresh token
          user?.store_id,
          user?.branch_id || undefined
        );

      if (response.success) {
        router.push(`/orders/${params.id}`); // Redirect to order details
      } else {
        throw new Error(response.message || 'Failed to update order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update order');
      console.error('Update order error:', err);
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
      requiredPermissions={['manage_orders']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage orders.
          </div>
        </div>
      }
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Order #{order?.order_number}</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {order && (
          <form onSubmit={handleSubmit} className="bg-white shadow overflow-hidden sm:rounded-md max-w-3xl">
            <div className="px-4 py-5 bg-white sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label htmlFor="order_status" className="block text-sm font-medium text-gray-700">
                    Order Status
                  </label>
                  <select
                    id="order_status"
                    name="order_status"
                    value={formData.order_status}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="col-span-6">
                  <label htmlFor="delivery_address" className="block text-sm font-medium text-gray-700">
                    Delivery Address
                  </label>
                  <textarea
                    id="delivery_address"
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
                
                <div className="col-span-6">
                  <label htmlFor="delivery_notes" className="block text-sm font-medium text-gray-700">
                    Delivery Notes
                  </label>
                  <textarea
                    id="delivery_notes"
                    name="delivery_notes"
                    value={formData.delivery_notes}
                    onChange={handleChange}
                    rows={2}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
                
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    id="total_amount"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="button"
                onClick={() => router.push(`/orders/${order.order_id}`)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </RoleGuard>
  );
}
