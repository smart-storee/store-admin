"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { Edit2, Plus, ArrowLeft } from "lucide-react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ApiResponse,
  Product,
  Category,
  Branch,
  ProductVariant,
  Uom,
} from "@/types";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const encodedReturnTo = encodeURIComponent(returnTo);
  const { user } = useAuth();
  const { theme } = useTheme();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    product_name: "",
    product_description: "",
    base_price: 0,
    uom_id: 0,
    category_id: 0,
    branch_id: 0,
    is_active: 1,
    product_image: "",
    serves_count: 1,
    is_vegetarian: 0,
    is_bestseller: 0,
  });
  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [selectAllBranches, setSelectAllBranches] = useState(false);

  // Fetch product variants when product loads
  useEffect(() => {
    const fetchVariants = async () => {
      if (params.id && user?.store_id) {
        try {
          const response: ApiResponse<{ data: ProductVariant[] }> =
            await makeAuthenticatedRequest(
              `/products/${params.id}/variants?store_id=${user?.store_id}`,
              {},
              true, // auto-refresh token
              user?.store_id,
              user?.branch_id || undefined
            );

          if (response.success) {
            setVariants(response.data.data || response.data);
          } else {
            console.error("Failed to fetch variants:", response.message);
          }
        } catch (err) {
          console.error("Variants fetch error:", err);
        }
      }
    };

    if (params.id && user?.store_id) {
      fetchVariants();
    }
  }, [params.id, user?.store_id, user?.branch_id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product details
        const productResponse: ApiResponse<{ data: Product }> =
          await makeAuthenticatedRequest(
            `/products/${params.id}?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (productResponse.success) {
          const prod = productResponse.data.data || productResponse.data;
          setProduct(prod);
          setFormData({
            product_name: prod.product_name,
            product_description: prod.product_description || "",
            base_price: prod.base_price,
            uom_id: prod.uom_id || 0,
            category_id: prod.category_id,
            branch_id: prod.branch_id || 0,
            is_active: prod.is_active,
            product_image: prod.product_image || "",
            serves_count: prod.serves_count ?? 1,
            // Handle is_vegetarian: use 0 if null/undefined, otherwise use the actual value (0 or 1)
            is_vegetarian:
              prod.is_vegetarian !== null && prod.is_vegetarian !== undefined
                ? Number(prod.is_vegetarian)
                : 0,
            // Handle is_bestseller: use 0 if null/undefined, otherwise use the actual value (0 or 1)
            is_bestseller:
              prod.is_bestseller !== null && prod.is_bestseller !== undefined
                ? Number(prod.is_bestseller)
                : 0,
          });

          console.log("Loaded product data:", {
            is_vegetarian: prod.is_vegetarian,
            is_bestseller: prod.is_bestseller,
            formData_veg:
              prod.is_vegetarian !== null && prod.is_vegetarian !== undefined
                ? Number(prod.is_vegetarian)
                : 0,
            formData_best:
              prod.is_bestseller !== null && prod.is_bestseller !== undefined
                ? Number(prod.is_bestseller)
                : 0,
          });
        } else {
          throw new Error(productResponse.message || "Failed to fetch product");
        }

        // Fetch categories
        const categoriesResponse: ApiResponse<{ data: Category[] }> =
          await makeAuthenticatedRequest(
            `/categories?store_id=${user?.store_id}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            user?.branch_id || undefined
          );

        if (categoriesResponse.success) {
          setCategories(
            categoriesResponse.data.data || categoriesResponse.data
          );
        } else {
          throw new Error(
            categoriesResponse.message || "Failed to fetch categories"
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
          const branchesData =
            branchesResponse.data.data || branchesResponse.data;
          setBranches(branchesData);

          // Fetch product branch assignments
          try {
            const branchAssignmentsResponse: ApiResponse<{ data: any[] }> =
              await makeAuthenticatedRequest(
                `/products/${params.id}/branches?store_id=${user?.store_id}`,
                {},
                true,
                user?.store_id
              );

            if (branchAssignmentsResponse.success) {
              const assignments =
                branchAssignmentsResponse.data.data ||
                branchAssignmentsResponse.data ||
                [];
              // Get branch IDs that are assigned (is_available = true)
              const assignedBranchIds = assignments
                .filter(
                  (a: any) => a.is_available === true || a.is_available === 1
                )
                .map((a: any) => a.branch_id);
              setSelectedBranches(assignedBranchIds);
              setSelectAllBranches(
                assignedBranchIds.length === branchesData.length &&
                  branchesData.length > 0
              );
            }
          } catch (err) {
            console.error("Failed to fetch branch assignments:", err);
            // If no assignments found, use the branch_id from product
            if (product?.branch_id) {
              setSelectedBranches([product?.branch_id]);
            }
          }
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
      } catch (err: any) {
        setError(err.message || "Failed to load product data");
        console.error("Product edit fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user?.store_id) {
      fetchData();
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
        [name]: checked ? 1 : 0,
      }));
    } else if (name === "base_price") {
      const numericValue = parseFloat(value) || 0;
      // CRITICAL: Prevent negative prices
      const finalValue = Math.max(0, numericValue);
      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    } else if (name === "uom_id") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else if (name === "is_vegetarian") {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // CRITICAL: Validate required fields
    if (!formData.product_name || formData.product_name.trim() === "") {
      setError("Product name is required");
      setSaving(false);
      return;
    }

    if (!formData.category_id || formData.category_id === 0) {
      setError("Please select a category");
      setSaving(false);
      return;
    }

    if (formData.base_price <= 0) {
      setError("Base price must be greater than 0");
      setSaving(false);
      return;
    }

    if (!formData.uom_id || formData.uom_id === 0) {
      setError("Please select a UOM");
      setSaving(false);
      return;
    }

    // Validate that at least one branch is selected
    if (selectedBranches.length === 0) {
      setError("Please select at least one branch");
      setSaving(false);
      return;
    }

    try {
      // Prepare the request body with all fields including vegetarian and bestseller
      const requestBody = {
        product_name: formData.product_name,
        product_description: formData.product_description,
        base_price: formData.base_price,
        uom_id: formData.uom_id,
        category_id: formData.category_id,
        product_image: formData.product_image,
        is_active: formData.is_active,
        serves_count: formData.serves_count,
        is_vegetarian: formData.is_vegetarian, // Explicitly include
        is_bestseller: formData.is_bestseller, // Explicitly include
        branch_ids: selectedBranches,
        store_id: user?.store_id,
      };

      console.log("Submitting product update:", requestBody);

      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        `/products/${params.id}`,
        {
          method: "PUT",
          body: JSON.stringify(requestBody),
        },
        true, // auto-refresh token
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        router.push(`/products/${params.id}`); // Redirect to product detail
      } else {
        throw new Error(response.message || "Failed to update product");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update product");
      console.error("Update product error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`p-6 text-center min-h-screen ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
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
              Access denied. You do not have permission to manage products.
            </div>
          </div>
        }
      >
        <div
          className={`min-h-screen pb-20 ${
            theme === "dark" ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          <div className="max-w-4xl mx-auto p-6">
            {/* Header with action buttons */}
            <div className="mb-6">
              <button
                onClick={() => router.push(`/products/${params.id}`)}
                className={`inline-flex items-center mb-4 ${
                  theme === "dark"
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Product
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Edit Product
                  </h1>
                  <p
                    className={`text-sm mt-1 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {product?.product_name || "Loading..."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/products/new")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add New Product
                  </button>
                </div>
              </div>
            </div>

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
                      htmlFor="product_name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Product Name *
                    </label>
                    <input
                      type="text"
                      id="product_name"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="product_description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="product_description"
                      name="product_description"
                      value={formData.product_description}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    ></textarea>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="base_price"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      id="base_price"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="uom_id"
                      className="block text-sm font-medium text-gray-700"
                    >
                      UOM *
                    </label>
                    <select
                      id="uom_id"
                      name="uom_id"
                      value={formData.uom_id}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                      <option value="">Select UOM</option>
                      {uoms.map((uom) => (
                        <option key={uom.uom_id} value={uom.uom_id}>
                          {uom.uom_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="category_id"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Category *
                    </label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option
                          key={category.category_id}
                          value={category.category_id}
                        >
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Branches *
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      Select which branches this product should be available in.
                    </p>
                    <div className="mb-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectAllBranches}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectAllBranches(checked);
                            if (checked) {
                              setSelectedBranches(
                                branches.map((b) => b.branch_id)
                              );
                            } else {
                              setSelectedBranches([]);
                            }
                          }}
                          className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Select All Branches
                        </span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
                      {branches.map((branch) => (
                        <label
                          key={branch.branch_id}
                          className="flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBranches.includes(
                              branch.branch_id
                            )}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                setSelectedBranches([
                                  ...selectedBranches,
                                  branch.branch_id,
                                ]);
                                if (
                                  selectedBranches.length + 1 ===
                                  branches.length
                                ) {
                                  setSelectAllBranches(true);
                                }
                              } else {
                                setSelectedBranches(
                                  selectedBranches.filter(
                                    (id) => id !== branch.branch_id
                                  )
                                );
                                setSelectAllBranches(false);
                              }
                            }}
                            className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            {branch.branch_name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {selectedBranches.length === 0 && (
                      <p className="text-sm text-red-600 mt-2">
                        Please select at least one branch
                      </p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="product_image"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Image URL
                    </label>
                    <input
                      type="text"
                      id="product_image"
                      name="product_image"
                      value={formData.product_image}
                      onChange={handleChange}
                      className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Diet Type
                        </p>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="is_vegetarian"
                              value="1"
                              checked={formData.is_vegetarian === 1}
                              onChange={handleChange}
                              className="h-4 w-4 rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">
                              Vegetarian
                            </span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="is_vegetarian"
                              value="0"
                              checked={formData.is_vegetarian === 0}
                              onChange={handleChange}
                              className="h-4 w-4 rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">
                              Non Vegetarian
                            </span>
                          </label>
                        </div>
                      </div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.is_bestseller === 1}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              is_bestseller: e.target.checked ? 1 : 0,
                            }))
                          }
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                          Bestseller
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="col-span-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_active"
                          name="is_active"
                          type="checkbox"
                          checked={formData.is_active == 1}
                          onChange={handleChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="is_active"
                          className="font-medium text-gray-700"
                        >
                          Active
                        </label>
                        <p className="text-gray-500">
                          When checked, this product will be available for
                          purchase
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Variants Section */}
              <div
                className={`border-t px-4 py-5 sm:px-6 ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
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
                        `/product-variants/new?product_id=${params.id}&returnTo=${encodedReturnTo}`
                      )
                    }
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add New Variant
                  </button>
                </div>

                {/* Variants List */}
                <div id="variants-list" className="space-y-3">
                  {variants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table
                        className={`min-w-full divide-y ${
                          theme === "dark"
                            ? "divide-gray-700"
                            : "divide-gray-200"
                        }`}
                      >
                        <thead
                          className={
                            theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                          }
                        >
                          <tr>
                            <th
                              scope="col"
                              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                theme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-500"
                              }`}
                            >
                              Variant Name
                            </th>
                            <th
                              scope="col"
                              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                theme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-500"
                              }`}
                            >
                              Price
                            </th>
                            <th
                              scope="col"
                              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                theme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-500"
                              }`}
                            >
                              Stock
                            </th>
                            <th
                              scope="col"
                              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                theme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-500"
                              }`}
                            >
                              Status
                            </th>
                            <th
                              scope="col"
                              className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                                theme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-500"
                              }`}
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${
                            theme === "dark"
                              ? "bg-gray-800 divide-gray-700"
                              : "bg-white divide-gray-200"
                          }`}
                        >
                          {variants.map((variant) => (
                            <tr
                              key={variant.variant_id}
                              className={
                                theme === "dark"
                                  ? "hover:bg-gray-700/50"
                                  : "hover:bg-gray-50"
                              }
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className={`text-sm font-medium ${
                                    theme === "dark"
                                      ? "text-white"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {variant.variant_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className={`text-sm ${
                                    theme === "dark"
                                      ? "text-gray-300"
                                      : "text-gray-900"
                                  }`}
                                >
                                  ₹{variant.variant_price}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className={`text-sm ${
                                    theme === "dark"
                                      ? "text-gray-300"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {variant.stock || 0} units
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    variant.is_active == 1
                                      ? theme === "dark"
                                        ? "bg-green-900/40 text-green-300"
                                        : "bg-green-100 text-green-800"
                                      : theme === "dark"
                                      ? "bg-red-900/40 text-red-300"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {variant.is_active == 1
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/product-variants/${variant.variant_id}/edit`
                                      )
                                    }
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                                      theme === "dark"
                                        ? "text-indigo-400 hover:bg-indigo-900/40 border border-indigo-700"
                                        : "text-indigo-600 hover:bg-indigo-50 border border-indigo-200"
                                    }`}
                                    title="Edit Variant"
                                  >
                                    <Edit2 size={16} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/product-variants/${variant.variant_id}`
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-md transition-colors ${
                                      theme === "dark"
                                        ? "text-gray-400 hover:bg-gray-700"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                  >
                                    View
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                            `/product-variants/new?product_id=${params.id}&returnTo=${encodedReturnTo}`
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

              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => router.push(`/products/${params.id}`)}
                  className="bg-white py-2.5 px-6 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
}
