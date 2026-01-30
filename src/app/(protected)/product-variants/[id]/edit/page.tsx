"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useTheme } from "@/contexts/ThemeContext";
import { ApiResponse, Product, Branch, ProductVariant, Uom } from "@/types";

export default function EditProductVariantPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const returnToParam = searchParams.get("returnTo");
  const returnTo = returnToParam ? decodeURIComponent(returnToParam) : "";
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    product_id: 0,
    variant_name: "",
    variant_price: 0,
    stock: 0,
    uom_id: 0,
    is_active: 1,
    branch_ids: [] as number[],
  });

  // Fetch initial data (products and branches) and the variant to edit
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

        // Fetch UOMs
        const uomsResponse: ApiResponse<{ data: Uom[] }> =
          await makeAuthenticatedRequest(
            "/uoms",
            {},
            true,
            user?.store_id,
            user?.branch_id || undefined
          );

        if (uomsResponse.success) {
          setUoms(uomsResponse.data.data || uomsResponse.data);
        } else {
          throw new Error(uomsResponse.message || "Failed to fetch UOMs");
        }

        // Fetch the specific variant to edit
        const variantResponse: ApiResponse<{ data: ProductVariant }> =
          await makeAuthenticatedRequest(
            `/product-variants/${params.id}?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (variantResponse.success) {
          const v = variantResponse.data.data || variantResponse.data;
          setVariant(v);
          // Get branch_ids from variant (if available) or use branch_id as fallback
          const branchIds =
            (v as any).branch_ids && Array.isArray((v as any).branch_ids)
              ? (v as any).branch_ids
              : (v as any).branch_id
              ? [(v as any).branch_id]
              : user?.branch_id
              ? [user.branch_id]
              : [];
          setFormData({
            product_id: v.product_id,
            variant_name: v.variant_name,
            variant_price: parseFloat(String(v.variant_price || 0)),
            stock: parseFloat(String(v.stock || 0)),
            uom_id: v.uom_id || 0,
            is_active: v.is_active || 1,
            branch_ids: branchIds,
          });
        } else {
          throw new Error(variantResponse.message || "Failed to fetch variant");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load initial data");
        console.error("Load product variant error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user?.store_id) {
      fetchInitialData();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

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
      // CRITICAL: Prevent negative values for both price and stock
      const finalValue = Math.max(0, numericValue);
      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    } else if (name === "product_id") {
      const parsedId = parseInt(value) || 0;
      const selectedProduct = products.find(
        (p) => p.product_id === parsedId
      );
      setFormData((prev) => ({
        ...prev,
        [name]: parsedId,
        uom_id: selectedProduct?.uom_id || prev.uom_id,
      }));
    } else if (name === "uom_id") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleActiveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      is_active: checked ? 1 : 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // CRITICAL: Validate required fields
    if (!formData.variant_name || formData.variant_name.trim() === "") {
      setError("Variant name is required");
      setSaving(false);
      return;
    }

    if (formData.variant_price <= 0) {
      setError("Variant price must be greater than 0");
      setSaving(false);
      return;
    }

    if (formData.stock <= 0) {
      setError("Stock quantity is required and must be greater than 0");
      setSaving(false);
      return;
    }

    if (!formData.uom_id || formData.uom_id === 0) {
      setError("Please select a UOM");
      setSaving(false);
      return;
    }

    // Validate that at least one branch is selected
    if (formData.branch_ids.length === 0) {
      setError("Please select at least one branch");
      setSaving(false);
      return;
    }

    try {
      // Only send fields that exist in the database
      const response: ApiResponse<{ data: ProductVariant }> =
        await makeAuthenticatedRequest(
          `/product-variants/${params.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              variant_name: formData.variant_name,
              variant_price: formData.variant_price,
              stock: formData.stock,
              uom_id: formData.uom_id,
              is_active: formData.is_active,
              store_id: user?.store_id,
              branch_ids: formData.branch_ids,
            }),
          },
          true, // auto-refresh token
          user?.store_id,
          formData.branch_ids[0] || undefined
        );

      if (response.success) {
        // Redirect back to where the user came from when available
        router.push(returnTo || `/products/${formData.product_id}`);
      } else {
        throw new Error(response.message || "Failed to update product variant");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update product variant");
      console.error("Update product variant error:", err);
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
            isDarkMode ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() =>
                router.push(
                  returnTo ||
                    `/products/${variant?.product_id || formData.product_id}`
                )
              }
              className={`inline-flex items-center mb-4 ${
                isDarkMode
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-700"
              }`}
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Product
            </button>
            <h1
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Edit Product Variant
            </h1>
            {variant && (
              <p
                className={`text-sm mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Editing: {variant.variant_name}
              </p>
            )}
          </div>

          {error && (
            <div
              className={`mb-4 px-4 py-3 rounded ${
                isDarkMode
                  ? "bg-red-900/40 border border-red-700 text-red-300"
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          {variant ? (
            <form
              onSubmit={handleSubmit}
              className={`shadow sm:rounded-md ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  {/* Product - Read-only display */}
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      className={`block text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Product
                    </label>
                    <div
                      className={`mt-1 px-3 py-2 rounded-md border ${
                        isDarkMode
                          ? "!bg-gray-700 !text-gray-200 border-gray-600"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {products.find(
                        (p) => p.product_id === formData.product_id
                      )?.product_name || "Loading..."}
                    </div>
                    <p
                      className={`mt-1 text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Product cannot be changed. Create a new variant if needed.
                    </p>
                  </div>

                  <div className="col-span-6">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Branches * (Select one or more)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {branches.map((branch) => (
                        <label
                          key={branch.branch_id}
                          className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                            isDarkMode
                              ? "border-gray-600 hover:bg-gray-700"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.branch_ids.includes(
                              branch.branch_id
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  branch_ids: [
                                    ...prev.branch_ids,
                                    branch.branch_id,
                                  ],
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  branch_ids: prev.branch_ids.filter(
                                    (id) => id !== branch.branch_id
                                  ),
                                }));
                              }
                            }}
                            className={`rounded border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 transition-colors`}
                          />
                          <span
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {branch.branch_name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {formData.branch_ids.length === 0 && (
                      <p
                        className={`text-xs mt-2 ${
                          isDarkMode ? "text-red-400" : "text-red-600"
                        }`}
                      >
                        Please select at least one branch
                      </p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="variant_name"
                      className={`block text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
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
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="variant_price"
                      className={`block text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
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
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="stock"
                      className={`block text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
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
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="uom_id"
                      className={`block text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      UOM *
                    </label>
                    <select
                      id="uom_id"
                      name="uom_id"
                      value={formData.uom_id}
                      onChange={handleChange}
                      required
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="">Select UOM</option>
                      {uoms.map((uom) => (
                        <option key={uom.uom_id} value={uom.uom_id}>
                          {uom.uom_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_active"
                          name="is_active"
                          type="checkbox"
                          checked={formData.is_active === 1}
                          onChange={handleActiveToggle}
                          className={`focus:ring-indigo-500 h-4 w-4 text-indigo-600 rounded ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-700"
                              : "border-gray-300"
                          }`}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="is_active"
                          className={`font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Active
                        </label>
                        <p
                          className={
                            isDarkMode ? "text-gray-400" : "text-gray-500"
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
                className={`px-4 py-3 sm:px-6 flex justify-end space-x-3 sticky bottom-0 ${
                  isDarkMode
                    ? "bg-gray-800 border-t border-gray-700"
                    : "bg-gray-50 border-t border-gray-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      returnTo || `/products/${variant.product_id}`
                    )
                  }
                  className={`py-2 px-4 border rounded-md text-sm font-medium ${
                    isDarkMode
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
                  {saving ? "Saving..." : "Save Variant"}
                </button>
              </div>
            </form>
          ) : (
            <div
              className={`text-center py-8 ${
                isDarkMode
                  ? "bg-gray-800 rounded-md"
                  : "bg-white rounded-md shadow"
              }`}
            >
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                Product variant not found
              </p>
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
