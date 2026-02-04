"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { Edit2, Plus, ArrowLeft } from "lucide-react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useTheme } from "@/contexts/ThemeContext";
import { ApiResponse, Product, ProductVariant } from "@/types";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const encodedReturnTo = encodeURIComponent(returnTo);
  const returnToParam = searchParams.get("returnTo");
  const backTo = returnToParam ? decodeURIComponent(returnToParam) : "/business-setup-flow";
  const { user } = useAuth();
  const { theme } = useTheme();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product details
        const response: ApiResponse<{ data: Product }> =
          await makeAuthenticatedRequest(
            `/products/${params.id}?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (response.success) {
          setProduct(response.data.data || response.data);
        } else {
          throw new Error(response.message || "Failed to fetch product");
        }

        // Fetch product variants
        const variantsResponse: ApiResponse<{ data: ProductVariant[] }> =
          await makeAuthenticatedRequest(
            `/products/${params.id}/variants?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (variantsResponse.success) {
          setVariants(variantsResponse.data.data || variantsResponse.data);
        } else {
          console.error("Failed to fetch variants:", variantsResponse.message);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product");
        console.error("Product detail fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user?.store_id) {
      fetchProduct();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
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
          onClick={() => router.push(backTo)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Back to Product Categories
        </button>
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
              Access denied. You do not have permission to manage products.
            </div>
          </div>
        }
      >
        <div
          className={`p-6 min-h-screen ${
            theme === "dark" ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          {product && (
            <div
              className={`shadow overflow-hidden sm:rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div
                className={`px-4 py-5 sm:px-6 border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push(backTo)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === "dark"
                          ? "hover:bg-gray-700 text-gray-300"
                          : "hover:bg-gray-100 text-gray-600"
                      }`}
                      title="Back to Product Categories"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h3
                      className={`text-lg leading-6 font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {product.product_name}
                    </h3>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() =>
                        router.push(`/products/${product.product_id}/edit`)
                      }
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <Edit2 size={16} />
                      Edit Product
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                  {/* Product Image */}
                  <div className="lg:col-span-1 flex justify-center items-start">
                    <div className={`w-full max-w-sm overflow-hidden rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                    }`}>
                      <img
                        src={
                          product.product_image || "/placeholder-product.svg"
                        }
                        alt={product.product_name}
                        className="w-full h-auto object-contain object-center"
                        style={{
                          maxHeight: '350px',
                          display: 'block',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder-product.svg";
                        }}
                      />
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="lg:col-span-1">
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <h4
                            className={`text-xs font-medium uppercase tracking-wide ${
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Product ID
                          </h4>
                          <p
                            className={`mt-1 text-sm font-medium ${
                              theme === "dark" ? "text-gray-200" : "text-gray-900"
                            }`}
                          >
                            {product.product_id}
                          </p>
                        </div>

                        <div>
                          <h4
                            className={`text-xs font-medium uppercase tracking-wide ${
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Category
                          </h4>
                          <p
                            className={`mt-1 text-sm font-medium ${
                              theme === "dark" ? "text-gray-200" : "text-gray-900"
                            }`}
                          >
                            {product.category_name}
                          </p>
                        </div>

                        <div>
                          <h4
                            className={`text-xs font-medium uppercase tracking-wide ${
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Base Price
                          </h4>
                          <p
                            className={`mt-1 text-lg font-semibold ${
                              theme === "dark" ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            ₹{parseFloat(String(product.base_price || 0)).toFixed(2)}
                            {product.uom_name ? ` / ${product.uom_name}` : ""}
                          </p>
                        </div>

                        <div>
                          <h4
                            className={`text-xs font-medium uppercase tracking-wide ${
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Status
                          </h4>
                          <span
                            className={`inline-flex mt-1 px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                              product.is_active == 1
                                ? theme === "dark"
                                  ? "bg-green-900/40 text-green-300 border border-green-700"
                                  : "bg-green-100 text-green-800"
                                : theme === "dark"
                                ? "bg-red-900/40 text-red-300 border border-red-700"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.is_active == 1 ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <h4
                            className={`text-xs font-medium uppercase tracking-wide ${
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Stock
                          </h4>
                          <p
                            className={`mt-1 text-sm font-medium ${
                              theme === "dark" ? "text-gray-200" : "text-gray-900"
                            }`}
                          >
                            {product.total_stock || 0} units
                          </p>
                        </div>

                        <div>
                          <h4
                            className={`text-xs font-medium uppercase tracking-wide ${
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Total Sold
                          </h4>
                          <p
                            className={`mt-1 text-sm font-medium ${
                              theme === "dark" ? "text-gray-200" : "text-gray-900"
                            }`}
                          >
                            {product.total_sold || 0} units
                          </p>
                        </div>

                        <div>
                          <h4
                            className={`text-xs font-medium uppercase tracking-wide ${
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Branch
                          </h4>
                          <p
                            className={`mt-1 text-sm font-medium ${
                              theme === "dark" ? "text-gray-200" : "text-gray-900"
                            }`}
                          >
                            {product.branch_name || "N/A"}
                          </p>
                        </div>

                        <div>
                          <h4
                            className={`text-xs font-medium uppercase tracking-wide ${
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Created At
                          </h4>
                          <p
                            className={`mt-1 text-xs ${
                              theme === "dark" ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {product.created_at &&
                            !isNaN(new Date(product.created_at).getTime())
                              ? new Date(product.created_at).toLocaleDateString(
                                  "en-IN",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description - Full Width */}
                    {product.product_description && (
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4
                          className={`text-xs font-medium uppercase tracking-wide mb-2 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Description
                        </h4>
                        <p
                          className={`text-sm leading-relaxed ${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {product.product_description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Variants */}
                <div className="mt-10">
                  <div className="flex justify-between items-center mb-4">
                    <h3
                      className={`text-lg font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Product Variants
                    </h3>
                    <button
                      onClick={() =>
                        router.push(
                          `/product-variants/new?product_id=${product.product_id}&returnTo=${encodedReturnTo}`
                        )
                      }
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Variant
                    </button>
                  </div>

                  {variants.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {variants.map((variant) => (
                        <div
                          key={variant.variant_id}
                          className={`border rounded-md p-4 transition-all hover:shadow-md ${
                            theme === "dark"
                              ? "border-gray-700 bg-gray-700/50 hover:bg-gray-700"
                              : "border-gray-200 bg-white hover:border-indigo-300"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4
                              className={`font-medium ${
                                theme === "dark"
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {variant.variant_name}
                            </h4>
                            <button
                              onClick={() =>
                                router.push(
                                  `/product-variants/${variant.variant_id}/edit?returnTo=${encodedReturnTo}`
                                )
                              }
                              className={`p-1.5 rounded transition-colors ${
                                theme === "dark"
                                  ? "text-indigo-400 hover:bg-indigo-900/40"
                                  : "text-indigo-600 hover:bg-indigo-50"
                              }`}
                              title="Edit Variant"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            Price: ₹
                            {parseFloat(
                              String(variant.variant_price || 0)
                            ).toFixed(2)}
                            {variant.uom_name ? ` / ${variant.uom_name}` : ""}
                          </p>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            Stock: {variant.stock || 0} units
                          </p>
                          <div className="mt-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                                variant.is_active == 1
                                  ? theme === "dark"
                                    ? "bg-green-900/40 text-green-300"
                                    : "bg-green-100 text-green-800"
                                  : theme === "dark"
                                  ? "bg-red-900/40 text-red-300"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {variant.is_active == 1 ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              router.push(
                                `/product-variants/${variant.variant_id}?returnTo=${encodedReturnTo}`
                              )
                            }
                            className={`mt-3 text-sm w-full py-1.5 rounded transition-colors ${
                              theme === "dark"
                                ? "text-blue-400 hover:bg-blue-900/40"
                                : "text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`text-center py-8 rounded-md ${
                        theme === "dark"
                          ? "bg-gray-800 border border-gray-700"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <p
                        className={
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }
                      >
                        No variants found for this product.
                      </p>
                      <button
                        onClick={() =>
                          router.push(
                            `/product-variants/new?product_id=${product.product_id}&returnTo=${encodedReturnTo}`
                          )
                        }
                        className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 mx-auto"
                      >
                        <Plus size={16} />
                        Add First Variant
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
}
