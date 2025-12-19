"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { ApiResponse, Category, Branch } from "@/types";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
    category_image: "",
    is_active: 1,
  });
  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [selectAllBranches, setSelectAllBranches] = useState(false);

  // Fetch branches when component loads
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response: ApiResponse<{ data: Branch[] }> =
          await makeAuthenticatedRequest(
            `/branches?store_id=${user?.store_id}`
          );
        if (response.success) {
          setBranches(response.data.data || response.data);
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };

    if (user?.store_id) {
      fetchBranches();
    }
  }, [user?.store_id]);

  // Fetch category and determine which branches have it
  useEffect(() => {
    const fetchCategory = async () => {
      if (!params.id || !user?.store_id) {
        console.log("Missing params:", {
          id: params.id,
          store_id: user?.store_id,
        });
        if (!params.id) {
          setError("Category ID is missing from URL");
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching category with ID:", params.id);

        // Fetch the category
        const categoryResponse: ApiResponse<{ data: Category }> =
          await makeAuthenticatedRequest(
            `/categories/${params.id}`,
            {},
            true,
            user?.store_id,
            user?.branch_id || undefined
          );

        console.log("Category API response:", categoryResponse);

        if (!categoryResponse.success) {
          throw new Error(
            categoryResponse.message || "Failed to fetch category"
          );
        }

        const category = categoryResponse.data.data || categoryResponse.data;

        console.log("Fetched category:", category);

        // Set form data
        setFormData({
          category_name: category.category_name || "",
          description: category.description || "",
          category_image: category.category_image || "",
          is_active: category.is_active ? 1 : 0,
        });

        console.log("Set form data:", {
          category_name: category.category_name || "",
          description: category.description || "",
          category_image: category.category_image || "",
          is_active: category.is_active ? 1 : 0,
        });

        // Fetch all categories with the same name in the store to find which branches have it
        const allCategoriesResponse: ApiResponse<{ data: Category[] }> =
          await makeAuthenticatedRequest(
            `/categories?store_id=${user?.store_id}`,
            {},
            true,
            user?.store_id
          );

        if (allCategoriesResponse.success) {
          const allCategories = Array.isArray(allCategoriesResponse.data)
            ? allCategoriesResponse.data
            : allCategoriesResponse.data?.data || [];

          // Find all categories with the same name (same master category across branches)
          const sameNameCategories = allCategories.filter(
            (cat: Category) => cat.category_name === category.category_name
          );

          // Get branch IDs that have this category
          const branchIdsWithCategory = sameNameCategories
            .map((cat: any) => cat.branch_id)
            .filter((id: number) => id !== undefined && id !== null);

          setSelectedBranches(branchIdsWithCategory);

          // Set select all only if we have branches loaded
          if (branches.length > 0) {
            setSelectAllBranches(
              branchIdsWithCategory.length === branches.length
            );
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load category");
        console.error("Load category error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch category data - don't wait for branches, we'll update branch selection when branches load
    if (params.id && user?.store_id) {
      fetchCategory();
    }
  }, [params.id, user?.store_id]);

  // Update branch selection when branches are loaded
  useEffect(() => {
    if (branches.length > 0 && selectedBranches.length > 0) {
      setSelectAllBranches(selectedBranches.length === branches.length);
    }
  }, [branches.length, selectedBranches.length]);

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
    if (!formData.category_name || formData.category_name.trim() === "") {
      setError("Category name is required");
      setSaving(false);
      return;
    }

    if (selectedBranches.length === 0) {
      setError("Please select at least one branch");
      setSaving(false);
      return;
    }

    try {
      // Update/create category for each selected branch
      const responses = [];

      for (const branchId of selectedBranches) {
        // First, check if category exists in this branch
        const checkResponse: ApiResponse<{ data: Category[] }> =
          await makeAuthenticatedRequest(
            `/categories?store_id=${user?.store_id}&branch_id=${branchId}`,
            {},
            true,
            user?.store_id,
            branchId
          );

        let categoryExists = false;
        let existingCategoryId = null;

        if (checkResponse.success) {
          const branchCategories = Array.isArray(checkResponse.data)
            ? checkResponse.data
            : checkResponse.data?.data || [];

          const existingCategory = branchCategories.find(
            (cat: Category) => cat.category_name === formData.category_name
          );

          if (existingCategory) {
            categoryExists = true;
            existingCategoryId = existingCategory.category_id;
          }
        }

        // Update existing or create new
        if (categoryExists && existingCategoryId) {
          // Update existing category
          const response = await makeAuthenticatedRequest(
            `/categories/${existingCategoryId}`,
            {
              method: "PUT",
              body: JSON.stringify({
                category_name: formData.category_name,
                description: formData.description,
                category_image: formData.category_image,
                is_active: formData.is_active,
                store_id: user?.store_id,
                branch_id: branchId,
              }),
            },
            true,
            user?.store_id,
            branchId
          );
          responses.push(response);
        } else {
          // Create new category for this branch
          const response = await makeAuthenticatedRequest(
            "/categories",
            {
              method: "POST",
              body: JSON.stringify({
                category_name: formData.category_name,
                category_description: formData.description,
                category_image: formData.category_image,
                is_active: formData.is_active,
                store_id: user?.store_id,
                branch_id: branchId,
              }),
            },
            true,
            user?.store_id,
            branchId
          );
          responses.push(response);
        }
      }

      if (responses.every((r) => r.success)) {
        // Navigate to setup flow (categories page with setup view) instead of list
        router.push("/categories?setup=true");
      } else {
        const failedResponse = responses.find((r) => !r.success);
        throw new Error(failedResponse?.message || "Failed to update category");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update category");
      console.error("Update category error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !formData.category_name) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center">
          <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1"></div>
          <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1"></div>
          <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading category data...</p>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={["manage_categories"]}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage categories.
          </div>
        </div>
      }
    >
      <div className="min-h-screen pb-20">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Edit Category {params.id ? `(ID: ${params.id})` : ""}
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  if (params.id && user?.store_id) {
                    setLoading(true);
                    // Retry fetching
                    window.location.reload();
                  }
                }}
                className="mt-2 text-sm text-red-700 underline"
              >
                Retry
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white shadow overflow-hidden sm:rounded-md"
          >
            <div className="px-4 py-5 bg-white sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label
                    htmlFor="category_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category Name *
                  </label>
                  <input
                    type="text"
                    id="category_name"
                    name="category_name"
                    value={formData.category_name}
                    onChange={handleChange}
                    required
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>

                <div className="col-span-6">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-lg sm:text-sm border-gray-300 rounded-md p-2 border"
                  ></textarea>
                </div>

                <div className="col-span-6">
                  <label
                    htmlFor="category_image"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category Image URL
                  </label>
                  <input
                    type="url"
                    id="category_image"
                    name="category_image"
                    value={formData.category_image}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Optional: Enter a URL for the category image
                  </p>
                </div>

                {branches.length > 0 ? (
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Branches
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      Select which branches this category should be available
                      in. The category will be updated in selected branches and
                      created in newly selected branches.
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
                      <p className="text-sm text-yellow-600 mt-2">
                        Please select at least one branch.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="col-span-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            No branches found. Please{" "}
                            <a
                              href="/branches/new"
                              className="font-medium text-yellow-700 underline hover:text-yellow-600"
                            >
                              create a branch
                            </a>{" "}
                            before editing categories.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-span-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_active"
                        name="is_active"
                        type="checkbox"
                        checked={formData.is_active === 1}
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
                        When checked, this category will be available for
                        products
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || selectedBranches.length === 0}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  selectedBranches.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {saving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}
