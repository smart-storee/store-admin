"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useStore } from "@/contexts/StoreContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { RoleGuard } from "@/components/RoleGuard";
import { ApiResponse, AppSettings } from "@/types";

interface ExtendedAppSettings extends AppSettings {
  splash_background_url?: string;
  maintenance_message?: string;
  delivery_charge?: number;
  free_delivery_threshold?: number | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { features } = useStore();
  const { storeFeatures, refreshFeatures } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "payment" | "maintenance" | "splash" | "features"
  >("general");
  const { theme, toggleTheme } = useTheme();
  const [localFeatures, setLocalFeatures] = useState({
    categories_enabled: false,
    products_enabled: false,
    branches_enabled: false,
    orders_enabled: false,
    customers_enabled: false,
    employees_enabled: false,
    coupon_codes_enabled: false,
    reports_enabled: false,
    home_config_enabled: false,
    app_settings_enabled: false,
    notifications_enabled: false,
    communication_logs_enabled: false,
    billings_enabled: false,
  });
  const [settings, setSettings] = useState<ExtendedAppSettings>({
    app_config_id: 1,
    store_id: 1,
    app_name: " ",
    sub_title: "",
    logo_url: "",
    primary_color: "F59E0B",
    secondary_color: "cd0a7b",
    splash_background_url: "",
    min_order_amount: 100,
    platform_fee: 0,
    delivery_charge: 0,
    free_delivery_threshold: null,
    is_cod_enabled: 1,
    is_online_payment_enabled: 0,
    maintenance_mode: 0,
    maintenance_message: "",
    created_at: new Date().toISOString(),
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: ApiResponse<{ data: ExtendedAppSettings }> =
          await makeAuthenticatedRequest(
            `/app-settings?store_id=${user?.store_id}`,
            {},
            true,
            user?.store_id,
            user?.branch_id || undefined
          );

        if (response.success) {
          const data = response.data.data || response.data;
          setSettings({
            ...data,
            primary_color: data.primary_color?.replace("#", "") || "F59E0B",
            secondary_color: data.secondary_color?.replace("#", "") || "cd0a7b",
          });
        } else {
          throw new Error(response.message || "Failed to fetch store settings");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load store settings");
        console.error("Load settings error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.store_id) {
      fetchSettings();
    }
  }, [user?.store_id, features]);

  // Load store features when available
  useEffect(() => {
    if (storeFeatures) {
      setLocalFeatures({
        categories_enabled: storeFeatures.categories_enabled || false,
        products_enabled: storeFeatures.products_enabled || false,
        branches_enabled: storeFeatures.branches_enabled || false,
        orders_enabled: storeFeatures.orders_enabled || false,
        customers_enabled: storeFeatures.customers_enabled || false,
        employees_enabled: storeFeatures.employees_enabled || false,
        coupon_codes_enabled: storeFeatures.coupon_codes_enabled || false,
        reports_enabled: storeFeatures.reports_enabled || false,
        home_config_enabled: storeFeatures.home_config_enabled || false,
        app_settings_enabled: storeFeatures.app_settings_enabled || false,
        notifications_enabled: storeFeatures.notifications_enabled || false,
        communication_logs_enabled:
          storeFeatures.communication_logs_enabled || false,
        billings_enabled: storeFeatures.billings_enabled || false,
      });
    }
  }, [storeFeatures]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings((prev) => ({
        ...prev,
        [name]:
          name.includes("enabled") ||
          name.includes("mode") ||
          name.includes("active")
            ? checked
              ? 1
              : 0
            : checked,
      }));
    } else if (name.includes("amount") || name.includes("fee")) {
      setSettings((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFeatureToggle = (featureName: keyof typeof localFeatures) => {
    setLocalFeatures((prev) => ({
      ...prev,
      [featureName]: !prev[featureName],
    }));
  };

  const handleSaveFeatures = async () => {
    setError(null);
    setSavingFeatures(true);

    try {
      const response: ApiResponse<any> = await makeAuthenticatedRequest(
        `/stores/${user?.store_id}/features`,
        {
          method: "PUT",
          body: JSON.stringify(localFeatures),
        },
        true,
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Refresh features in context
        await refreshFeatures();
        // Force a small delay to ensure state updates
        setTimeout(() => {
          console.log("Features refreshed, storeFeatures:", storeFeatures);
        }, 500);
      } else {
        throw new Error(response.message || "Failed to update features");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update features");
      console.error("Update features error:", err);
    } finally {
      setSavingFeatures(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // Check if app settings are enabled
    if (features && !features.app_settings_enabled) {
      setError(
        "App settings are not enabled for your store. Please contact support."
      );
      setSaving(false);
      return;
    }

    try {
      const payload = {
        store_id: user?.store_id,
        app_name: settings.app_name,
        sub_title: settings.sub_title,
        logo_url: settings.logo_url,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        splash_background_url: settings.splash_background_url,
        min_order_amount: settings.min_order_amount,
        platform_fee: settings.platform_fee,
        delivery_charge: settings.delivery_charge,
        free_delivery_threshold: settings.free_delivery_threshold,
        is_cod_enabled: settings.is_cod_enabled,
        is_online_payment_enabled: settings.is_online_payment_enabled,
        maintenance_mode: settings.maintenance_mode,
        maintenance_message: settings.maintenance_message,
      };

      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        `/app-settings`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
        true,
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(response.message || "Failed to update app settings");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
      console.error("Update settings error:", err);
    } finally {
      setSaving(false);
    }
  };

  const isDarkMode = theme === "dark";
  const bgClass = isDarkMode ? "dark bg-slate-950" : "bg-slate-50";
  const cardBgClass = isDarkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-gray-600";
  const textTertiary = isDarkMode ? "text-slate-500" : "text-gray-500";
  const inputBgClass = isDarkMode
    ? "bg-slate-800 border-slate-700 text-white"
    : "bg-white border-gray-300 text-gray-900";

  // Check if app settings are enabled (wait for features to load)
  if (features !== null && features && !features.app_settings_enabled) {
    return (
      <RoleGuard allowedRoles={["super_admin", "admin", "manager"]}>
        <div
          className={`p-6 ${
            isDarkMode ? "bg-gray-900" : "bg-gray-50"
          } min-h-screen`}
        >
          <div className="max-w-2xl mx-auto text-center py-12">
            <div
              className={`p-6 rounded-lg ${
                isDarkMode
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                App Settings Disabled
              </h2>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                App settings feature is not enabled for your store. Please
                contact support to enable this feature.
              </p>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }
  const hoverClass = isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-50";
  const tabActiveBg = isDarkMode
    ? "bg-slate-800 border-indigo-500"
    : "bg-indigo-50 border-indigo-600";

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${bgClass} transition-colors duration-300`}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-indigo-600 rounded-full animate-pulse"></div>
              <div
                className={`absolute inset-1 rounded-full ${
                  isDarkMode ? "bg-slate-950" : "bg-white"
                }`}
              ></div>
            </div>
          </div>
          <p className={`text-sm ${textSecondary}`}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={["app_settings"]}
      fallback={
        <div className="p-6">
          <div
            className={`border rounded-lg px-4 py-3 ${
              isDarkMode
                ? "bg-red-950 border-red-900 text-red-200"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="font-semibold">Access Denied</p>
            <p className="text-sm mt-1">
              You do not have permission to manage settings.
            </p>
          </div>
        </div>
      }
    >
      <div>
        <div className="mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${textPrimary}`}>
              App Settings
            </h1>
            <p className={`mt-2 ${textSecondary}`}>
              Manage your store configuration and preferences
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div
              className={`mb-6 border rounded-lg px-4 py-3 flex items-start ${
                isDarkMode
                  ? "bg-red-950 border-red-900 text-red-200"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <svg
                className={`h-5 w-5 mr-3 flex-shrink-0 mt-0.5 ${
                  isDarkMode ? "text-red-400" : "text-red-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div
              className={`mb-6 border rounded-lg px-4 py-3 flex items-start ${
                isDarkMode
                  ? "bg-green-950 border-green-900 text-green-200"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <svg
                className={`h-5 w-5 mr-3 flex-shrink-0 mt-0.5 ${
                  isDarkMode ? "text-green-400" : "text-green-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold">Success</p>
                <p className="text-sm">Settings saved successfully!</p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div
            className={`mb-6 rounded-lg shadow-sm border ${cardBgClass} overflow-hidden`}
          >
            <div
              className={`flex border-b ${
                isDarkMode ? "border-slate-700" : "border-gray-200"
              } overflow-x-auto`}
            >
              {[
                { id: "general", label: "General", icon: "⚙️" },
                { id: "splash", label: "Splash Screen", icon: "🖼️" },
                { id: "payment", label: "Payment", icon: "💳" },
                { id: "maintenance", label: "Maintenance", icon: "⚠️" },
                // { id: "features", label: "Features", icon: "🔧" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? `text-indigo-600 border-b-2 border-indigo-600 ${tabActiveBg}`
                      : `${textSecondary} ${hoverClass}`
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>{tab.icon}</span>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className={`rounded-lg shadow-sm border ${cardBgClass} overflow-hidden transition-colors duration-300`}
          >
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="p-6 sm:p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* App Name */}
                  <div>
                    <label
                      htmlFor="app_name"
                      className={`block text-sm font-semibold ${textPrimary} mb-2`}
                    >
                      App Name
                    </label>
                    <input
                      type="text"
                      id="app_name"
                      name="app_name"
                      value={settings.app_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                    />
                  </div>

                  {/* Sub Title */}
                  <div>
                    <label
                      htmlFor="sub_title"
                      className={`block text-sm font-semibold ${textPrimary} mb-2`}
                    >
                      Sub Title
                    </label>
                    <input
                      type="text"
                      id="sub_title"
                      name="sub_title"
                      value={settings.sub_title}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                    />
                  </div>
                </div>

                {/* Logo */}
                <div
                  className={`border-2 border-dashed ${
                    isDarkMode ? "border-slate-700" : "border-gray-300"
                  } rounded-lg p-6`}
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div
                        className={`h-24 w-24 rounded-lg border-2 ${
                          isDarkMode
                            ? "border-slate-700 bg-slate-800"
                            : "border-gray-300 bg-gray-50"
                        } overflow-hidden flex items-center justify-center`}
                      >
                        {settings.logo_url ? (
                          <img
                            src={settings.logo_url}
                            alt="Logo Preview"
                            className="h-full w-full object-contain p-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : (
                          <svg
                            className={`h-12 w-12 ${
                              isDarkMode ? "text-slate-600" : "text-gray-400"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="logo_url"
                        className={`block text-sm font-semibold ${textPrimary} mb-2`}
                      >
                        Logo URL
                      </label>
                      <input
                        type="url"
                        id="logo_url"
                        name="logo_url"
                        value={settings.logo_url}
                        onChange={handleChange}
                        placeholder="https://example.com/logo.png"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                      />
                      <p className={`text-xs ${textTertiary} mt-2`}>
                        Enter the full URL of your logo image (PNG, JPG, SVG
                        recommended)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Primary Color */}
                  <div>
                    <label
                      className={`block text-sm font-semibold ${textPrimary} mb-2`}
                    >
                      Primary Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="primary_color_picker"
                        value={`#${settings.primary_color || "000000"}`}
                        onChange={(e) => {
                          const hexValue = e.target.value.startsWith("#")
                            ? e.target.value.slice(1)
                            : e.target.value;
                          handleChange({
                            target: {
                              name: "primary_color",
                              value: hexValue.toUpperCase(),
                              type: "text",
                            },
                          } as React.ChangeEvent<HTMLInputElement>);
                        }}
                        className={`w-16 h-10 rounded-lg border cursor-pointer ${
                          isDarkMode ? "border-slate-700" : "border-gray-300"
                        }`}
                      />
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          id="primary_color"
                          name="primary_color"
                          value={settings.primary_color || ""}
                          onChange={handleChange}
                          placeholder="F59E0B"
                          maxLength={6}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                        />
                        <span
                          className={`absolute right-3 top-2.5 text-sm ${textTertiary}`}
                        >
                          #
                        </span>
                      </div>
                    </div>
                    <div
                      className={`mt-3 h-8 rounded-lg border-2 ${
                        isDarkMode ? "border-slate-700" : "border-gray-200"
                      }`}
                      style={{ backgroundColor: `#${settings.primary_color}` }}
                    ></div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label
                      className={`block text-sm font-semibold ${textPrimary} mb-2`}
                    >
                      Secondary Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="secondary_color_picker"
                        value={`#${settings.secondary_color || "000000"}`}
                        onChange={(e) => {
                          const hexValue = e.target.value.startsWith("#")
                            ? e.target.value.slice(1)
                            : e.target.value;
                          handleChange({
                            target: {
                              name: "secondary_color",
                              value: hexValue.toUpperCase(),
                              type: "text",
                            },
                          } as React.ChangeEvent<HTMLInputElement>);
                        }}
                        className={`w-16 h-10 rounded-lg border cursor-pointer ${
                          isDarkMode ? "border-slate-700" : "border-gray-300"
                        }`}
                      />
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          id="secondary_color"
                          name="secondary_color"
                          value={settings.secondary_color || ""}
                          onChange={handleChange}
                          placeholder="CD0A7B"
                          maxLength={6}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                        />
                        <span
                          className={`absolute right-3 top-2.5 text-sm ${textTertiary}`}
                        >
                          #
                        </span>
                      </div>
                    </div>
                    <div
                      className={`mt-3 h-8 rounded-lg border-2 ${
                        isDarkMode ? "border-slate-700" : "border-gray-200"
                      }`}
                      style={{
                        backgroundColor: `#${settings.secondary_color}`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Min Order Amount, Platform Fee & Delivery Charge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label
                      htmlFor="min_order_amount"
                      className={`block text-sm font-semibold ${textPrimary} mb-2`}
                    >
                      Minimum Order Amount
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-4 top-2.5 ${textSecondary}`}
                      >
                        ₹
                      </span>
                      <input
                        type="number"
                        id="min_order_amount"
                        name="min_order_amount"
                        value={settings.min_order_amount}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="platform_fee"
                      className={`block text-sm font-semibold ${textPrimary} mb-2`}
                    >
                      Platform Fee
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-4 top-2.5 ${textSecondary}`}
                      >
                        ₹
                      </span>
                      <input
                        type="number"
                        id="platform_fee"
                        name="platform_fee"
                        value={settings.platform_fee}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="delivery_charge"
                      className={`block text-sm font-semibold ${textPrimary} mb-2`}
                    >
                      Store Delivery Charge
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-4 top-2.5 ${textSecondary}`}
                      >
                        ₹
                      </span>
                      <input
                        type="number"
                        id="delivery_charge"
                        name="delivery_charge"
                        value={settings.delivery_charge || 0}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                      />
                    </div>
                    <p className={`text-xs ${textTertiary} mt-1`}>
                      Default delivery charge for all branches (can be
                      overridden per branch)
                    </p>
                  </div>
                </div>

                {/* Free Delivery Threshold */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="free_delivery_threshold"
                      className={`block text-sm font-semibold ${textPrimary} mb-2`}
                    >
                      Free Delivery Threshold (Store Level)
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-4 top-2.5 ${textSecondary}`}
                      >
                        ₹
                      </span>
                      <input
                        type="number"
                        id="free_delivery_threshold"
                        name="free_delivery_threshold"
                        value={settings.free_delivery_threshold || ""}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="Leave empty to disable"
                        className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                      />
                    </div>
                    <p className={`text-xs ${textTertiary} mt-1`}>
                      Orders above this amount get free delivery. Leave empty to
                      disable. Branch-level settings override this.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Splash Screen Tab */}
            {activeTab === "splash" && (
              <div className="p-6 sm:p-8 space-y-8">
                <div
                  className={`border-2 border-dashed ${
                    isDarkMode ? "border-slate-700" : "border-gray-300"
                  } rounded-lg p-6`}
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div
                        className={`h-32 w-20 rounded-lg border-2 ${
                          isDarkMode
                            ? "border-slate-700 bg-slate-800"
                            : "border-gray-300 bg-gray-50"
                        } overflow-hidden flex items-center justify-center`}
                      >
                        {settings.splash_background_url ? (
                          <img
                            src={settings.splash_background_url}
                            alt="Splash Preview"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : (
                          <svg
                            className={`h-12 w-12 ${
                              isDarkMode ? "text-slate-600" : "text-gray-400"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="splash_background_url"
                        className={`block text-sm font-semibold ${textPrimary} mb-2`}
                      >
                        Splash Screen Background URL
                      </label>
                      <input
                        type="url"
                        id="splash_background_url"
                        name="splash_background_url"
                        value={settings.splash_background_url || ""}
                        onChange={handleChange}
                        placeholder="https://example.com/splash-background.jpg"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                      />
                      <p className={`text-xs ${textTertiary} mt-2`}>
                        Enter the full URL of your splash screen background
                        image. Recommended: 1080x1920px (9:16 aspect ratio)
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`${
                    isDarkMode
                      ? "bg-blue-950 border-blue-900"
                      : "bg-blue-50 border-blue-200"
                  } border rounded-lg p-4`}
                >
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-blue-200" : "text-blue-900"
                    }`}
                  >
                    <span className="font-semibold">💡 Tip:</span> The splash
                    screen appears when users first launch the app. Make sure to
                    use a high-quality image that represents your brand.
                  </p>
                </div>
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === "payment" && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-4">
                  {/* COD */}
                  <div
                    className={`flex items-center p-4 border rounded-lg ${hoverClass} transition ${
                      isDarkMode ? "border-slate-700" : "border-gray-200"
                    }`}
                  >
                    <input
                      id="is_cod_enabled"
                      name="is_cod_enabled"
                      type="checkbox"
                      checked={settings.is_cod_enabled === 1}
                      onChange={handleChange}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="ml-4 flex-1">
                      <label
                        htmlFor="is_cod_enabled"
                        className={`text-sm font-semibold ${textPrimary} cursor-pointer`}
                      >
                        Cash on Delivery (COD)
                      </label>
                      <p className={`text-xs ${textTertiary} mt-1`}>
                        Allow customers to pay when they receive their order
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        settings.is_cod_enabled === 1
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {settings.is_cod_enabled === 1 ? "Enabled" : "Disabled"}
                    </div>
                  </div>

                  {/* Online Payment */}
                  <div
                    className={`flex items-center p-4 border rounded-lg ${hoverClass} transition ${
                      isDarkMode ? "border-slate-700" : "border-gray-200"
                    }`}
                  >
                    <input
                      id="is_online_payment_enabled"
                      name="is_online_payment_enabled"
                      type="checkbox"
                      checked={settings.is_online_payment_enabled === 1}
                      onChange={handleChange}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="ml-4 flex-1">
                      <label
                        htmlFor="is_online_payment_enabled"
                        className={`text-sm font-semibold ${textPrimary} cursor-pointer`}
                      >
                        Online Payment
                      </label>
                      <p className={`text-xs ${textTertiary} mt-1`}>
                        Enable credit/debit card and digital wallet payments
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        settings.is_online_payment_enabled === 1
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {settings.is_online_payment_enabled === 1
                        ? "Enabled"
                        : "Disabled"}
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div
                  className={`${
                    isDarkMode
                      ? "bg-blue-950 border-blue-900"
                      : "bg-blue-50 border-blue-200"
                  } border rounded-lg p-4`}
                >
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-blue-200" : "text-blue-900"
                    }`}
                  >
                    <span className="font-semibold">ℹ️ Note:</span> At least one
                    payment method must be enabled for customers to place
                    orders.
                  </p>
                </div>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === "maintenance" && (
              <div className="p-6 sm:p-8 space-y-6">
                <div
                  className={`flex items-center p-4 border-2 rounded-lg ${
                    isDarkMode
                      ? "border-slate-700 bg-slate-800"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <input
                    id="maintenance_mode"
                    name="maintenance_mode"
                    type="checkbox"
                    checked={settings.maintenance_mode === 1}
                    onChange={handleChange}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="ml-4 flex-1">
                    <label
                      htmlFor="maintenance_mode"
                      className={`text-sm font-semibold ${textPrimary} cursor-pointer`}
                    >
                      Enable Maintenance Mode
                    </label>
                    <p className={`text-xs ${textTertiary} mt-1`}>
                      The app will be temporarily unavailable to customers
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      settings.maintenance_mode === 1
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {settings.maintenance_mode === 1 ? "Active" : "Inactive"}
                  </div>
                </div>

                {settings.maintenance_mode === 1 && (
                  <div
                    className={`${
                      isDarkMode
                        ? "bg-yellow-950 border-yellow-900"
                        : "bg-yellow-50 border-yellow-200"
                    } border rounded-lg p-4`}
                  >
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-yellow-200" : "text-yellow-900"
                      }`}
                    >
                      <span className="font-semibold">⚠️ Warning:</span>{" "}
                      Maintenance mode is currently active. Customers cannot
                      place orders or access the app.
                    </p>
                  </div>
                )}

                {/* Maintenance Message */}
                <div>
                  <label
                    htmlFor="maintenance_message"
                    className={`block text-sm font-semibold ${textPrimary} mb-2`}
                  >
                    Maintenance Message
                  </label>
                  <p className={`text-xs ${textTertiary} mb-2`}>
                    This message will be shown to customers when they try to
                    access the app during maintenance
                  </p>
                  <textarea
                    id="maintenance_message"
                    name="maintenance_message"
                    value={settings.maintenance_message || ""}
                    onChange={handleChange}
                    placeholder="We are currently undergoing maintenance. Please check back soon!"
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${inputBgClass}`}
                  />
                  <p className={`text-xs ${textTertiary} mt-2`}>
                    {settings.maintenance_message?.length || 0}/500 characters
                  </p>
                </div>
              </div>
            )}

            {/* Features Tab */}
            {/* {activeTab === "features" && (
              <div className="p-6 sm:p-8 space-y-6">
                <div
                  className={`${
                    isDarkMode
                      ? "bg-blue-950 border-blue-900"
                      : "bg-blue-50 border-blue-200"
                  } border rounded-lg p-4 mb-6`}
                >
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-blue-200" : "text-blue-900"
                    }`}
                  >
                    <span className="font-semibold">ℹ️ Note:</span> Enable or
                    disable features for your store. Disabled features will be
                    hidden from the admin portal and customer app.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: "categories_enabled",
                      label: "Categories",
                      description: "Manage product categories",
                    },
                    {
                      key: "products_enabled",
                      label: "Products",
                      description: "Manage products and inventory",
                    },
                    {
                      key: "branches_enabled",
                      label: "Branches",
                      description: "Manage store branches",
                    },
                    {
                      key: "orders_enabled",
                      label: "Orders",
                      description: "Process and manage orders",
                    },
                    {
                      key: "customers_enabled",
                      label: "Customers",
                      description: "Manage customer information",
                    },
                    {
                      key: "employees_enabled",
                      label: "Employees",
                      description: "Manage staff and employees",
                    },
                    {
                      key: "coupon_codes_enabled",
                      label: "Coupon Codes",
                      description: "Create and manage discount coupons",
                    },
                    {
                      key: "reports_enabled",
                      label: "Reports",
                      description: "View analytics and reports",
                    },
                    {
                      key: "home_config_enabled",
                      label: "Home Config",
                      description: "Configure home page settings",
                    },
                    {
                      key: "app_settings_enabled",
                      label: "App Settings",
                      description: "Manage app configuration",
                    },
                    {
                      key: "notifications_enabled",
                      label: "Notifications",
                      description: "Send push notifications",
                    },
                    {
                      key: "communication_logs_enabled",
                      label: "Communication Logs",
                      description: "View communication history",
                    },
                    {
                      key: "billings_enabled",
                      label: "Billings",
                      description: "Access billing information",
                    },
                  ].map((feature) => (
                    <div
                      key={feature.key}
                      className={`flex items-center p-4 border rounded-lg ${hoverClass} transition ${
                        isDarkMode ? "border-slate-700" : "border-gray-200"
                      }`}
                    >
                      <input
                        id={feature.key}
                        type="checkbox"
                        checked={
                          localFeatures[
                            feature.key as keyof typeof localFeatures
                          ]
                        }
                        onChange={() =>
                          handleFeatureToggle(
                            feature.key as keyof typeof localFeatures
                          )
                        }
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="ml-4 flex-1">
                        <label
                          htmlFor={feature.key}
                          className={`text-sm font-semibold ${textPrimary} cursor-pointer`}
                        >
                          {feature.label}
                        </label>
                        <p className={`text-xs ${textTertiary} mt-1`}>
                          {feature.description}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          localFeatures[
                            feature.key as keyof typeof localFeatures
                          ]
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {localFeatures[
                          feature.key as keyof typeof localFeatures
                        ]
                          ? "Enabled"
                          : "Disabled"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={handleSaveFeatures}
                    disabled={savingFeatures}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    {savingFeatures ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Save Features
                      </>
                    )}
                  </button>
                </div>
              </div>
            )} */}

            {/* Footer Actions - Only show for non-features tabs */}
            {activeTab !== "features" && (
              <div
                className={`flex justify-end gap-3 p-6 sm:p-8 border-t ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-800"
                    : "border-gray-200 bg-gray-50"
                } transition-colors`}
              >
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className={`px-6 py-2 border rounded-lg font-medium transition ${
                    isDarkMode
                      ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}
