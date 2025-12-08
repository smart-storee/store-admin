"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useTheme } from "@/contexts/ThemeContext";
import { ApiResponse, Product, Branch, ProductVariant } from "@/types";

export default function NewProductVariantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const productId = searchParams.get("product_id");

  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    product_id: parseInt(productId || "") || 0,
    variant_name: "",
    variant_price: 0,
    stock: 0,
    is_active: 1,
    branch_id: user?.branch_id,
  });

  // Fetch products and branches on initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError(null);

        // Fetch products
        const productsResponse: ApiResponse<{ data: Product[] }> =
          await makeAuthenticatedRequest(
            `/products?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (productsResponse.success) {
          setProducts(productsResponse.data.data || productsResponse.data);

          // If product_id was provided via URL param, pre-populate it
          if (productId) {
            const selectedProduct = productsResponse.data.data?.find(
              (p) => p.product_id === parseInt(productId)
            );
            if (selectedProduct) {
              setFormData((prev) => ({
                ...prev,
                product_id: parseInt(productId),
              }));
            }
          }
        } else {
          throw new Error(
            productsResponse.message || "Failed to fetch products"
          );
        }

        // Fetch branches
        const branchesResponse: ApiResponse<{ data: Branch[] }> =
          await makeAuthenticatedRequest(
            `/branches?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (branchesResponse.success) {
          setBranches(branchesResponse.data.data || branchesResponse.data);
        } else {
          throw new Error(
            branchesResponse.message || "Failed to fetch branches"
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to load initial data");
        console.error("New product variant fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.store_id) {
      fetchInitialData();
    }
  }, [user?.store_id, user?.branch_id, productId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]:
          name.includes("enabled") || name.includes("active")
            ? checked
              ? 1
              : 0
            : checked,
      }));
    } else if (name === "variant_price" || name === "stock") {
      const numericValue = parseFloat(value) || 0;
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response: ApiResponse<{ data: ProductVariant }> =
        await makeAuthenticatedRequest(
          `/products/${formData.product_id}/variants`,
          {
            method: "POST",
            body: JSON.stringify({
              variant_name: formData.variant_name,
              variant_price: formData.variant_price,
              stock: formData.stock || 0,
              is_active: formData.is_active,
              store_id: user?.store_id,
              branch_id: formData.branch_id || 1,
            }),
          },
          true, // auto-refresh token
          user?.store_id,
          formData.branch_id || undefined
        );

      if (response.success) {
        // Navigate back to the product details page
        router.push(`/products/${formData.product_id}`);
        router.refresh(); // Refresh to show the new variant
      } else {
        throw new Error(response.message || "Failed to create product variant");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create product variant");
      console.error("Create product variant error:", err);
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
              Access denied. You do not have permission to manage product
              variants.
            </div>
          </div>
        }
      >
        <div
          className={`p-6 min-h-screen ${
            theme === "dark" ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          <h1
            className={`text-2xl font-bold mb-6 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Add New Product Variant
          </h1>

          {error && (
            <div
              className={`mb-4 px-4 py-3 rounded ${
                theme === "dark"
                  ? "bg-red-900/40 border border-red-700 text-red-300"
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={`shadow sm:rounded-md ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label
                    htmlFor="product_id"
                    className={`block text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Product *
                  </label>
                  <select
                    id="product_id"
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleChange}
                    required
                    disabled={!!productId} // Disable if product_id was provided via URL
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option
                        key={product.product_id}
                        value={product.product_id}
                      >
                        {product.product_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="variant_name"
                    className={`block text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Variant Name *
                  </label>
                  <input
                    type="text"
                    id="variant_name"
                    name="variant_name"
                    value={formData.variant_name}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="variant_price"
                    className={`block text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    id="variant_price"
                    name="variant_price"
                    value={formData.variant_price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="stock"
                    className={`block text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>

                <div className="col-span-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_active"
                        name="is_active"
                        type="checkbox"
                        checked={formData.is_active === 1}
                        onChange={handleChange}
                        className={`focus:ring-indigo-500 h-4 w-4 text-indigo-600 rounded ${
                          theme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="is_active"
                        className={`font-medium ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Active
                      </label>
                      <p
                        className={
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }
                      >
                        When checked, this variant will be available for
                        purchase
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`px-4 py-3 sm:px-6 flex justify-end ${
                theme === "dark"
                  ? "bg-gray-800 border-t border-gray-700"
                  : "bg-gray-50"
              }`}
            >
              <button
                type="button"
                onClick={() => router.push(`/business-setup-flow`)}
                className={`py-2 px-4 border rounded-md text-sm font-medium mr-3 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Variant"}
              </button>
            </div>
          </form>
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
}
