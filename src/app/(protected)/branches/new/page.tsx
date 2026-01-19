"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import { ApiResponse } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function NewBranchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    branch_name: "",
    branch_phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
    delivery_charge: 0,
    surge_fee: 0,
    is_active: 1,
  });

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
    } else if (
      name === "latitude" ||
      name === "longitude" ||
      name === "delivery_charge" ||
      name === "surge_fee"
    ) {
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
    setLoading(true);

    try {
      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        "/branches",
        {
          method: "POST",
          body: JSON.stringify({
            branch_name: formData.branch_name,
            address_line_1: formData.address_line1,
            address_line_2: formData.address_line2,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            pincode: formData.pincode,
            branch_phone: formData.branch_phone,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
            delivery_charge: formData.delivery_charge,
            surge_fee: formData.surge_fee,
            is_active: formData.is_active,
            store_id: user?.store_id,
          }),
        },
        true,
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        router.push("/branches");
      } else {
        throw new Error(response.message || "Failed to create branch");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create branch");
      console.error("Create branch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureGuard feature="branches_enabled">
      <RoleGuard
        requiredPermissions={["manage_branches"]}
        fallback={
          <div className="p-6 text-center">
            <div
              className={`border rounded-lg p-4 ${
                isDarkMode
                  ? "bg-red-900/30 border-red-700/50 text-red-300"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              Access denied. You do not have permission to manage branches.
            </div>
          </div>
        }
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push("/branches")}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "hover:bg-slate-700 text-slate-300"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <h1
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Add New Branch
            </h1>
          </div>

          {error && (
            <div
              className={`border rounded-lg p-4 mb-6 ${
                isDarkMode
                  ? "bg-red-900/30 border-red-700/50 text-red-300"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={`shadow sm:rounded-md ${
              isDarkMode
                ? "bg-slate-800/50 border border-slate-700/50"
                : "bg-white"
            }`}
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="branch_name"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    id="branch_name"
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="branch_phone"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    Branch Phone *
                  </label>
                  <input
                    type="text"
                    id="branch_phone"
                    name="branch_phone"
                    value={formData.branch_phone}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                <div className="col-span-6">
                  <label
                    htmlFor="address_line1"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                <div className="col-span-6">
                  <label
                    htmlFor="address_line2"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label
                    htmlFor="city"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label
                    htmlFor="state"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label
                    htmlFor="pincode"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="latitude"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    Latitude
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude || ""}
                    onChange={handleChange}
                    step="any"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="longitude"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    Longitude
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude || ""}
                    onChange={handleChange}
                    step="any"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="delivery_charge"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    Delivery Charge (₹) *
                  </label>
                  <input
                    type="number"
                    id="delivery_charge"
                    name="delivery_charge"
                    value={formData.delivery_charge}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                {/* <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="surge_fee"
                    className={`block text-sm font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    Surge Fee (₹)
                  </label>
                  <input
                    type="number"
                    id="surge_fee"
                    name="surge_fee"
                    value={formData.surge_fee || ""}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50 text-white placeholder-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                </div> */}

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
                          isDarkMode
                            ? "border-slate-600 bg-slate-700"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="is_active"
                        className={`font-medium ${
                          isDarkMode ? "text-white" : "text-gray-700"
                        }`}
                      >
                        Active
                      </label>
                      <p
                        className={
                          isDarkMode ? "text-slate-400" : "text-gray-500"
                        }
                      >
                        When checked, this branch will be operational
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`px-4 py-3 sm:px-6 flex justify-end border-t ${
                isDarkMode
                  ? "bg-slate-800/50 border-slate-700/50"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => router.push("/branches")}
                className={`py-2 px-4 border rounded-md text-sm font-medium mr-3 transition-colors ${
                  isDarkMode
                    ? "bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors ${
                  isDarkMode
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Creating..." : "Create Branch"}
              </button>
            </div>
          </form>
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
}
