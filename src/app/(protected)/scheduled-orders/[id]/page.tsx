"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { makeAuthenticatedRequest } from "@/utils/api";
import { ScheduledOrder, ApiResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  Package,
  Phone,
  Mail,
  DollarSign,
} from "lucide-react";

export default function ScheduledOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<ScheduledOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const scheduledOrderId = params.id as string;

  useEffect(() => {
    fetchScheduledOrderDetails();
  }, [scheduledOrderId]);

  const fetchScheduledOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<{ data: ScheduledOrder }> =
        await makeAuthenticatedRequest(
          `/scheduled-orders/${scheduledOrderId}`,
          { method: "GET" },
          true,
          user?.store_id || null
        );

      if (response.success) {
        setOrder(response.data.data || response.data);
      } else {
        setError(response.message || "Failed to fetch scheduled order");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch scheduled order");
      console.error("Error fetching scheduled order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (
      !confirm("Accept this scheduled order and convert it to a regular order?")
    ) {
      return;
    }

    try {
      setProcessing(true);
      const response: ApiResponse<any> = await makeAuthenticatedRequest(
        `/scheduled-orders/${scheduledOrderId}/accept`,
        { method: "POST" },
        true,
        user?.store_id || null
      );

      if (response.success) {
        alert("Scheduled order accepted successfully! Order created.");
        router.push("/orders");
      } else {
        alert(response.message || "Failed to accept scheduled order");
      }
    } catch (err: any) {
      alert(err.message || "Failed to accept scheduled order");
      console.error("Error accepting scheduled order:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason || reason.trim() === "") {
      return;
    }

    try {
      setProcessing(true);
      const response: ApiResponse<any> = await makeAuthenticatedRequest(
        `/scheduled-orders/${scheduledOrderId}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason }),
        },
        true,
        user?.store_id || null
      );

      if (response.success) {
        alert("Scheduled order rejected successfully");
        router.push("/scheduled-orders");
      } else {
        alert(response.message || "Failed to reject scheduled order");
      }
    } catch (err: any) {
      alert(err.message || "Failed to reject scheduled order");
      console.error("Error rejecting scheduled order:", err);
    } finally {
      setProcessing(false);
    }
  };

  const getFrequencyText = (order: ScheduledOrder) => {
    switch (order.frequency) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "biweekly":
        return "Bi-weekly";
      case "monthly":
        return "Monthly";
      case "custom":
        return `Every ${order.frequency_value || 0} days`;
      default:
        return order.frequency;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            {error || "Scheduled order not found"}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Scheduled Order #{order.scheduled_order_id}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {getFrequencyText(order)} delivery schedule
            </p>
          </div>
        </div>

        {order.order_status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Accept Order
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject Order
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Customer Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {order.customer_name || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {order.customer_phone || "N/A"}
                </span>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Email:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {order.customer_email}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Schedule Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Frequency:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getFrequencyText(order)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Next Delivery:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(order.next_delivery_date)}
                  {order.delivery_time && ` at ${order.delivery_time}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Start Date:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(order.start_date)}
                </span>
              </div>
              {order.end_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    End Date:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(order.end_date)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Delivery Address
            </h2>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <p className="text-gray-900 dark:text-white">
                {order.delivery_address}
              </p>
            </div>
            {order.delivery_notes && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Notes:</strong> {order.delivery_notes}
                </p>
              </div>
            )}
          </div>

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.scheduled_order_item_id}
                    className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.product_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.variant_name} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ₹{item.total_price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ₹{order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Delivery Charge:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {order.is_free_delivery ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `₹${order.delivery_charge.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Platform Fee:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ₹{order.platform_fee.toFixed(2)}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Discount:
                  </span>
                  <span className="font-medium text-green-600">
                    -₹{order.discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Total:
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ₹{order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Information
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Method:
                </span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.payment_method.toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.order_status.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Status Information
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Schedule Status:
                </span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.status.toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Order Status:
                </span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.order_status.toUpperCase()}
                </p>
              </div>
              {order.last_edited_at && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Last Edited:
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(order.last_edited_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
