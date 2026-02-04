"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useTheme } from "@/contexts/ThemeContext";
import { ApiResponse, ProductVariant, Branch } from "@/types";
import { ShoppingCart, MapPin, CheckCircle2 } from "lucide-react";

export default function ProductVariantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const returnToParam = searchParams.get("returnTo");
  const returnTo = returnToParam ? decodeURIComponent(returnToParam) : "";
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: ApiResponse<{ data: ProductVariant }> =
          await makeAuthenticatedRequest(
            `/product-variants/${params.id}?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (response.success) {
          setVariant(response.data.data || response.data);
        } else {
          throw new Error(
            response.message || "Failed to fetch product variant"
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product variant");
        console.error("Product variant detail fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user?.store_id) {
      fetchVariant();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  // Fetch available branches
  useEffect(() => {
    const fetchBranches = async () => {
      if (!user?.store_id) return;

      try {
        setLoadingBranches(true);
        const response: ApiResponse<{ data: Branch[] }> =
          await makeAuthenticatedRequest(
            `/branches?store_id=${user.store_id}`,
            {},
            true,
            user.store_id,
            user?.branch_id || undefined
          );

        if (response.success) {
          const branchesData = response.data.data || response.data || [];
          // Filter only active branches
          const activeBranches = branchesData.filter(
            (branch: Branch) => branch.is_active === 1
          );
          setBranches(activeBranches);

          // Auto-select first branch if available
          if (activeBranches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(activeBranches[0].branch_id);
          }
        }
      } catch (err: any) {
        console.error("Error fetching branches:", err);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [user?.store_id, user?.branch_id]);

  const handleDeleteVariant = async () => {
    if (
      !confirm(
        "Are you sure you want to Inactivate this variant? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        `/product-variants/${params.id}`,
        {
          method: "DELETE",
        },
        true, // auto-refresh token
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        // Redirect back to the product that this variant belongs to
        router.push(`/products/${variant?.product_id}`);
      } else {
        throw new Error(response.message || "Failed to delete product variant");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete product variant");
      console.error("Delete variant error:", err);
    }
  };

  const handleCheckout = () => {
    if (!selectedBranchId) {
      setCheckoutError("Please select a branch");
      return;
    }

    if (!variant) {
      setCheckoutError("Variant information is missing");
      return;
    }

    setCheckoutError(null);
    setCheckoutSuccess(false);

    // Navigate to orders page with branch filter
    // The branch_id will be available in the URL query params
    router.push(`/orders?branch_id=${selectedBranchId}`);
  };

  const handleBranchSelect = (branchId: number) => {
    setSelectedBranchId(branchId);
    setCheckoutError(null);
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
    <FeatureGuard
      feature="products_enabled"
      fallback={
        <div className="p-6 text-center">
          <div className="border rounded-lg px-4 py-3 mb-4">
            <p className="text-yellow-700 dark:text-yellow-300">
              Products feature is disabled for this store. Please contact
              support to enable it.
            </p>
          </div>
        </div>
      }
    >
      <RoleGuard
        requiredPermissions={["manage_products"]}
        fallback={
          <div className="p-6 text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Access denied. You do not have permission to view product
              variants.
            </div>
          </div>
        }
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Variant Details
            </h1>
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  router.push(returnTo || `/products/${variant?.product_id}`)
                }
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Product
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/product-variants/${params.id}/edit` +
                      (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "")
                  )
                }
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Edit Variant
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {variant ? (
            <div
              className={`shadow overflow-hidden sm:rounded-lg ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div
                className={`px-4 py-5 sm:px-6 border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg leading-6 font-medium ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {variant.variant_name}
                </h3>
                <p
                  className={`mt-1 max-w-2xl text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Product Variant #{variant.variant_id}
                </p>
              </div>
              <div
                className={`border-t ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <dl>
                  <div
                    className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <dt
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Product Name
                    </dt>
                    <dd
                      className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {variant.product_name}
                    </dd>
                  </div>
                  <div
                    className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    }`}
                  >
                    <dt
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Variant Name
                    </dt>
                    <dd
                      className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {variant.variant_name}
                    </dd>
                  </div>
                  <div
                    className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <dt
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Price
                    </dt>
                    <dd
                      className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      ₹
                      {parseFloat(String(variant.variant_price || 0)).toFixed(
                        2
                      )}
                      {variant.uom_name ? ` / ${variant.uom_name}` : ""}
                    </dd>
                  </div>
                  <div
                    className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    }`}
                  >
                    <dt
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Stock Quantity
                    </dt>
                    <dd
                      className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {variant.stock || 0} units
                    </dd>
                  </div>
                  <div
                    className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <dt
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Status
                    </dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          variant.is_active == 1
                            ? isDarkMode
                              ? "bg-green-900/40 text-green-300 border border-green-700"
                              : "bg-green-100 text-green-800"
                            : isDarkMode
                            ? "bg-red-900/40 text-red-300 border border-red-700"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {variant.is_active == 1 ? "Active" : "Inactive"}
                      </span>
                    </dd>
                  </div>
                  <div
                    className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    }`}
                  >
                    <dt
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Created
                    </dt>
                    <dd
                      className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {new Date(variant.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </dd>
                  </div>
                  <div
                    className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <dt
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Updated
                    </dt>
                    <dd
                      className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {variant.updated_at
                        ? new Date(variant.updated_at).toLocaleDateString(
                            "en-IN",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "N/A"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Checkout Section */}
              
              {/* Actions */}
              {/* <div
                className={`px-4 py-4 sm:px-6 flex justify-end space-x-3 ${
                  isDarkMode
                    ? "bg-gray-800 border-t border-gray-700"
                    : "bg-gray-50"
                }`}
              >
                <button
                  onClick={handleDeleteVariant}
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? "bg-red-700 text-white hover:bg-red-600"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  Inactivate Variant
                </button>
              </div> */}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Product variant not found</p>
              <button
                onClick={() =>
                  router.push(returnTo || "/business-setup-flow")
                }
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Back to Product Categories
              </button>
            </div>
          )}
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
}
