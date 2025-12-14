"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import Link from "next/link";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { ApiResponse, Order, OrderItem } from "@/types";
import { FeatureGuard } from "@/components/FeatureGuard";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          const orderData = response.data.data || response.data;
          setOrder(orderData);
        } else {
          throw new Error(response.message || "Failed to fetch order");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order");
        console.error("Load order error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user?.store_id) {
      fetchOrder();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push("/orders")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <FeatureGuard
      feature="orders_enabled"
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Orders feature is disabled for this store. Please contact support to
            enable it.
          </div>
        </div>
      }
    >
      <RoleGuard
        allowedRoles={["owner"]}
        fallback={
          <div className="p-6 text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Access denied. You do not have permission to view orders.
            </div>
          </div>
        }
      >
        <div className="p-6">
          {order && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Order #{order.order_number}
                  </h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() =>
                        router.push(`/orders/${order.order_id}/edit`)
                      }
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Edit Order
                    </button>
                    <button
                      onClick={() => router.push("/orders")}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                      Back to Orders
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {/* Order Summary */}
                <div className="border-b border-gray-200 pb-5 mb-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Customer Information
                      </h4>
                      <div className="mt-2">
                        <p className="text-sm text-gray-900">
                          {order.customer_name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          User Mobile: {order.customer_phone || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customer_email || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Order Information
                      </h4>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-sm text-gray-500">
                            Order ID:
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-900">
                            {order.order_number}
                          </span>
                        </div>

                        <div>
                          <span className="text-sm text-gray-500">
                            Order Date:
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-900">
                            {new Date(order.created_at).toLocaleString(
                              "en-IN",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="text-sm text-gray-500">Status:</span>
                        </div>
                        <div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                              order.order_status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : order.order_status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : order.order_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.order_status === "confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : order.order_status === "preparing"
                                ? "bg-purple-100 text-purple-800"
                                : order.order_status === "ready"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-teal-100 text-teal-800"
                            }`}
                          >
                            {order.order_status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="border-b border-gray-200 pb-5 mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Delivery Information
                  </h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-900">
                        <strong>Delivery Address:</strong>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.delivery_address}
                      </p>
                      {order.customer_phone && (
                        <p className="text-sm text-gray-500 mt-1">
                          Address Mobile: {order.customer_phone}
                        </p>
                      )}
                      {order.delivery_landmark && (
                        <p className="text-sm text-gray-500">
                          Landmark: {order.delivery_landmark}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        <strong>Delivery Instructions:</strong>
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {order.delivery_notes || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-b border-gray-200 pb-5 mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Order Items
                  </h4>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Product
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Price
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Quantity
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {(order.items || []).map((item, index) => (
                          <tr
                            key={
                              item.item_id || item.product_id || `item-${index}`
                            }
                          >
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {item.product_name}
                              {item.variant_name && (
                                <div className="text-gray-500">
                                  {item.variant_name}
                                </div>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              ₹
                              {Number(
                                item.unit_price || item.price || 0
                              ).toFixed(2)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              ₹
                              {Number(
                                item.total_price ||
                                  (item.unit_price || item.price || 0) *
                                    item.quantity
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Review Section */}
                {order.review &&
                  (() => {
                    const review = order.review;
                    return (
                      <div className="border-b border-gray-200 pb-5 mb-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">
                          Customer Review
                        </h4>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`h-5 w-5 ${
                                      i < review.rating
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {review.rating}/5
                              </span>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                review.is_approved === 1
                                  ? "bg-green-100 text-green-800"
                                  : review.is_approved === 2
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {review.is_approved === 1
                                ? "Approved"
                                : review.is_approved === 2
                                ? "Rejected"
                                : "Pending"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">
                            {review.review_text}
                          </p>
                          {review.admin_response && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-500 mb-1">
                                Admin Response:
                              </p>
                              <p className="text-sm text-gray-700">
                                {review.admin_response}
                              </p>
                            </div>
                          )}
                          {review.review_created_at && (
                            <p className="text-xs text-gray-400 mt-2">
                              Reviewed on{" "}
                              {formatDate(review.review_created_at!)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                {/* Payment Information */}
                <div className="border-b b
                order-gray-200 pb-5 mb-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-3">
                        Payment Information
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-sm text-gray-500">
                            Payment Method:
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-900 capitalize">
                            {order.payment_method
                              ? order.payment_method
                                  .replace("_", " ")
                                  .toUpperCase()
                              : "N/A"}
                          </span>
                        </div>

                        <div>
                          <span className="text-sm text-gray-500">
                            Payment Status:
                          </span>
                        </div>
                        <div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                              order.payment_status === "completed"
                                ? "bg-green-100 text-green-800"
                                : order.payment_status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.payment_status
                              ? order.payment_status
                                  .replace("_", " ")
                                  .toUpperCase()
                              : "N/A"}
                          </span>
                        </div>
                        {order.payment_reference && (
                          <>
                            <div>
                              <span className="text-sm text-gray-500">
                                Payment Reference:
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-900 font-mono">
                                {order.payment_reference}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {order.payment_method === "online" && (
                        <div className="mt-3">
                          <Link
                            href={`/payment-logs?order_id=${order.order_id}`}
                            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            <CreditCard className="h-4 w-4" />
                            View Payment Logs
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">
                            Subtotal
                          </span>
                          <span className="text-sm text-gray-900">
                            ₹{order.subtotal || "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">
                            Delivery Charge
                            {order.is_free_delivery &&
                              order.free_delivery_reason && (
                                <span className="ml-2 text-xs text-green-600">
                                  ({order.free_delivery_reason})
                                </span>
                              )}
                          </span>
                          <span
                            className={`text-sm ${
                              order.is_free_delivery
                                ? "text-gray-400 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            ₹{order.delivery_charge || "0.00"}
                          </span>
                          {order.is_free_delivery && (
                            <span className="text-sm text-green-600 font-medium ml-2">
                              FREE
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">
                            Platform Fee
                          </span>
                          <span className="text-sm text-gray-900">
                            ₹{order.platform_fee || "0.00"}
                          </span>
                        </div>
                        {order.discount_amount && order.discount_amount > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">
                                Coupon Discount
                                {order.coupon_code && (
                                  <span className="ml-2 text-xs text-gray-400">
                                    ({order.coupon_code})
                                  </span>
                                )}
                              </span>
                              <span className="text-sm text-green-600 font-medium">
                                -₹{(order.discount_amount || 0).toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-base font-medium text-gray-900">
                            Total
                          </span>
                          <span className="text-base font-medium text-gray-900">
                            ₹{order.total_amount || "0.00"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Branch Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Branch Information
                  </h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-900">
                        <strong>Branch:</strong> {order.branch_name || "N/A"}
                      </p>
                      {order.branch_address && (
                        <p className="text-sm text-gray-500 mt-1">
                          {order.branch_address}
                        </p>
                      )}
                    </div>

                    <div>
                      {order.branch_phone && (
                        <p className="text-sm text-gray-500">
                          <strong>Branch Phone:</strong> {order.branch_phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
}
