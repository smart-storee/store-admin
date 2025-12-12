"use client";

import { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useStore } from "@/contexts/StoreContext";
import { RoleGuard } from "@/components/RoleGuard";
import HomeScreenPreview from "@/components/HomeScreenPreview";
import { ApiResponse, Product, Category } from "@/types";

interface HomeScreenConfig {
  hero: {
    enabled: boolean;
    images: string[];
    greetingText: string;
    showLocation: boolean;
  };
  categories: {
    enabled: boolean;
    showCount: number;
    title: string;
    featuredCategoryIds?: number[]; // IDs of featured categories
  };
  products: {
    enabled: boolean;
    showCount: number;
    title: string;
    featuredProductIds?: number[]; // IDs of featured products
  };
  banners: {
    enabled: boolean;
    items: Array<{
      image: string;
      title: string;
      link?: string;
    }>;
  };
  dynamicContent: {
    enabled: boolean;
    sections: Array<{
      type: string;
      title: string;
      content: any;
    }>;
  };
  sectionOrder?: string[]; // Order of sections: 'banners', 'products', 'categories'
}

const defaultConfig: HomeScreenConfig = {
  hero: {
    enabled: true,
    images: [""],
    greetingText: "Hello, User! 👋",
    showLocation: true,
  },
  categories: {
    enabled: true,
    showCount: 8,
    title: "Food for every mood",
    featuredCategoryIds: [],
  },
  products: {
    enabled: true,
    showCount: 6,
    title: "Featured Items",
    featuredProductIds: [],
  },
  banners: {
    enabled: false,
    items: [],
  },
  dynamicContent: {
    enabled: true,
    sections: [],
  },
  sectionOrder: ["banners", "products", "categories"], // Default order
};

export default function HomeConfigPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { features } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<HomeScreenConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<"config" | "preview">("config");
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>("morning");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<
    Array<{ id: number; image_url: string; title?: string }>
  >([]);
  const [loadingData, setLoadingData] = useState(false);
  const [storeConfig, setStoreConfig] = useState<{
    primary_color: string;
    secondary_color: string;
    app_name: string;
  } | null>(null);

  const isDarkMode = theme === "dark";
  const bgClass = isDarkMode ? "dark bg-slate-950" : "bg-slate-50";
  const cardBgClass = isDarkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-gray-600";

  useEffect(() => {
    if (user?.store_id) {
      fetchConfig();
      fetchRealData();
      fetchStoreConfig();
    }
  }, [user?.store_id]);

  const fetchStoreConfig = async () => {
    try {
      const response: ApiResponse<{ data: any }> =
        await makeAuthenticatedRequest(
          `/app-settings?store_id=${user?.store_id}`,
          {},
          true,
          user?.store_id,
          user?.branch_id || undefined
        );

      if (response.success) {
        const data = response.data.data || response.data;
        setStoreConfig({
          primary_color: data.primary_color?.replace("#", "") || "10b981",
          secondary_color: data.secondary_color?.replace("#", "") || "10b981",
          app_name: data.app_name || "Store",
        });
      }
    } catch (err) {
      console.error("Error fetching store config:", err);
      // Use default colors
      setStoreConfig({
        primary_color: "10b981",
        secondary_color: "10b981",
        app_name: "Store",
      });
    }
  };

  const fetchRealData = async () => {
    try {
      setLoadingData(true);

      // Fetch products
      const productsResponse: ApiResponse<{ data: Product[] }> =
        await makeAuthenticatedRequest(
          `/products?store_id=${user?.store_id}&limit=100`,
          {},
          true,
          user?.store_id,
          user?.branch_id || undefined
        );

      if (productsResponse.success) {
        const productsData = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : productsResponse.data?.data || [];
        setProducts(productsData);
      }

      // Fetch categories
      const categoriesResponse: ApiResponse<{ data: Category[] }> =
        await makeAuthenticatedRequest(
          `/categories?store_id=${user?.store_id}`,
          {},
          true,
          user?.store_id,
          user?.branch_id || undefined
        );

      if (categoriesResponse.success) {
        const categoriesData = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : categoriesResponse.data?.data || [];
        setCategories(categoriesData);
      }

      // Fetch banners for home screen
      try {
        const bannersResponse: ApiResponse<{ data: any[] }> =
          await makeAuthenticatedRequest(
            `/banners?store_id=${user?.store_id}&screen_location=HOME&is_active=1`,
            {},
            true,
            user?.store_id,
            user?.branch_id || undefined
          );

        if (bannersResponse.success) {
          const bannersData = Array.isArray(bannersResponse.data)
            ? bannersResponse.data
            : bannersResponse.data?.data || [];
          setBanners(
            bannersData.map((b: any) => ({
              id: b.id,
              image_url: b.image_url,
              title: b.title || "Banner",
            }))
          );
        }
      } catch (err) {
        console.log("Banners endpoint might not exist yet");
      }
    } catch (err) {
      console.error("Error fetching real data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch saved config, fallback to default
      try {
        const response: ApiResponse<{ config: HomeScreenConfig }> =
          await makeAuthenticatedRequest(
            `/home-screen-config?store_id=${user?.store_id}`,
            {},
            true,
            user?.store_id,
            user?.branch_id || undefined
          );

        if (response.success && response.data?.config) {
          setConfig({
            ...defaultConfig,
            ...response.data.config,
            sectionOrder:
              response.data.config.sectionOrder || defaultConfig.sectionOrder,
          });
        }
      } catch (err) {
        // If endpoint doesn't exist yet, use default config
        console.log("Using default config");
      }
    } catch (err: any) {
      console.error("Load config error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        `/home-screen-config`,
        {
          method: "PUT",
          body: JSON.stringify({
            store_id: user?.store_id,
            config: config,
          }),
        },
        true,
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(response.message || "Failed to save configuration");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save configuration");
      console.error("Save config error:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof HomeScreenConfig, updates: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${bgClass}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${textSecondary}`}>Loading configuration...</p>
        </div>
      </div>
    );
  }

  // Check if home config feature is enabled
  if (features && !features.home_config_enabled) {
    return (
      <div className={`min-h-screen ${bgClass} p-8`}>
        <div
          className={`max-w-4xl mx-auto ${cardBgClass} rounded-lg shadow-lg p-8 text-center`}
        >
          <h1 className={`text-2xl font-bold mb-4 ${textPrimary}`}>
            Home Config Management Disabled
          </h1>
          <p className={textSecondary}>
            Home config management is not enabled for this store. Please contact
            support to enable this feature.
          </p>
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
              You do not have permission to manage home screen configuration.
            </p>
          </div>
        </div>
      }
    >
      <div className={`p-6 ${bgClass} min-h-screen`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${textPrimary} mb-2`}>
                Home Screen Configuration
              </h1>
              <p className={textSecondary}>
                Configure all aspects of your mobile app home screen with live
                preview
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setActiveTab(activeTab === "config" ? "preview" : "config")
                }
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "preview"
                    ? "bg-indigo-600 text-white"
                    : isDarkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {activeTab === "config" ? "👁️ Preview" : "⚙️ Configure"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "💾 Save Configuration"}
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              ✅ Configuration saved successfully!
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              ❌ {error}
            </div>
          )}

          {activeTab === "preview" ? (
            /* Preview Tab */
            <div className="flex justify-center">
              <HomeScreenPreview
                config={config}
                isDarkMode={isDarkMode}
                products={products}
                categories={categories}
                banners={banners}
                storeConfig={storeConfig}
              />
            </div>
          ) : (
            /* Configuration Tab */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Configuration */}
              <div className="lg:col-span-2 space-y-6">
                {/* Section Order Configuration */}
                <div className={`${cardBgClass} rounded-lg border p-6`}>
                  <h2 className={`text-xl font-semibold ${textPrimary} mb-4`}>
                    Section Order
                  </h2>
                  <p className={`text-sm ${textSecondary} mb-4`}>
                    Drag and drop sections to reorder them on the home screen
                  </p>
                  <div className="space-y-2">
                    {(
                      config.sectionOrder || [
                        "banners",
                        "products",
                        "categories",
                      ]
                    ).map((section, index) => {
                      const sectionNames: { [key: string]: string } = {
                        banners: "Promotional Banners",
                        products: "Featured Products",
                        categories: "Categories",
                      };
                      const sectionIcons: { [key: string]: string } = {
                        banners: "🖼️",
                        products: "⭐",
                        categories: "📂",
                      };
                      return (
                        <div
                          key={section}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isDarkMode
                              ? "bg-slate-800 border-slate-700"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {sectionIcons[section] || "📦"}
                            </span>
                            <div>
                              <div className={`font-medium ${textPrimary}`}>
                                {sectionNames[section] || section}
                              </div>
                              <div className={`text-xs ${textSecondary}`}>
                                Position {index + 1}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (index > 0) {
                                  const newOrder = [
                                    ...(config.sectionOrder || [
                                      "banners",
                                      "products",
                                      "categories",
                                    ]),
                                  ];
                                  [newOrder[index], newOrder[index - 1]] = [
                                    newOrder[index - 1],
                                    newOrder[index],
                                  ];
                                  setConfig({
                                    ...config,
                                    sectionOrder: newOrder,
                                  });
                                }
                              }}
                              disabled={index === 0}
                              className={`p-2 rounded ${
                                index === 0
                                  ? "opacity-50 cursor-not-allowed"
                                  : isDarkMode
                                  ? "hover:bg-slate-700"
                                  : "hover:bg-gray-200"
                              }`}
                              title="Move up"
                            >
                              ⬆️
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const currentOrder = config.sectionOrder || [
                                  "banners",
                                  "products",
                                  "categories",
                                ];
                                if (index < currentOrder.length - 1) {
                                  const newOrder = [...currentOrder];
                                  [newOrder[index], newOrder[index + 1]] = [
                                    newOrder[index + 1],
                                    newOrder[index],
                                  ];
                                  setConfig({
                                    ...config,
                                    sectionOrder: newOrder,
                                  });
                                }
                              }}
                              disabled={
                                index ===
                                (
                                  config.sectionOrder || [
                                    "banners",
                                    "products",
                                    "categories",
                                  ]
                                ).length -
                                  1
                              }
                              className={`p-2 rounded ${
                                index ===
                                (
                                  config.sectionOrder || [
                                    "banners",
                                    "products",
                                    "categories",
                                  ]
                                ).length -
                                  1
                                  ? "opacity-50 cursor-not-allowed"
                                  : isDarkMode
                                  ? "hover:bg-slate-700"
                                  : "hover:bg-gray-200"
                              }`}
                              title="Move down"
                            >
                              ⬇️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Categories Section */}
                <div className={`${cardBgClass} rounded-lg border p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-semibold ${textPrimary}`}>
                      Categories
                    </h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.categories.enabled}
                        onChange={(e) =>
                          updateConfig("categories", {
                            enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {config.categories.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label
                          className={`block text-sm font-medium ${textPrimary} mb-2`}
                        >
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={config.categories.title}
                          onChange={(e) =>
                            updateConfig("categories", {
                              title: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${textPrimary} mb-2`}
                        >
                          Number to Display
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={config.categories.showCount}
                          onChange={(e) =>
                            updateConfig("categories", {
                              showCount: parseInt(e.target.value) || 8,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                        />
                        <p className={`text-xs mt-1 ${textSecondary}`}>
                          Only applies if no categories are selected below
                        </p>
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${textPrimary} mb-3`}
                        >
                          Select Featured Categories (
                          {config.categories.featuredCategoryIds?.length || 0}{" "}
                          selected)
                        </label>
                        {loadingData ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className={`mt-2 text-sm ${textSecondary}`}>
                              Loading categories...
                            </p>
                          </div>
                        ) : categories.length === 0 ? (
                          <p className={`text-sm ${textSecondary}`}>
                            No categories available. Create categories first.
                          </p>
                        ) : (
                          <div className="max-h-64 overflow-y-auto border rounded-lg p-3 dark:border-slate-700">
                            {categories.map((category) => {
                              const isSelected =
                                config.categories.featuredCategoryIds?.includes(
                                  category.category_id
                                ) || false;
                              return (
                                <label
                                  key={category.category_id}
                                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 ${
                                    isSelected
                                      ? "bg-indigo-50 dark:bg-indigo-900/20"
                                      : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const currentIds =
                                        config.categories.featuredCategoryIds ||
                                        [];
                                      const newIds = e.target.checked
                                        ? [...currentIds, category.category_id]
                                        : currentIds.filter(
                                            (id) => id !== category.category_id
                                          );
                                      updateConfig("categories", {
                                        featuredCategoryIds: newIds,
                                      });
                                    }}
                                    className="rounded"
                                  />
                                  <div className="flex-1 flex items-center gap-3">
                                    {category.category_image && (
                                      <img
                                        src={category.category_image}
                                        alt={category.category_name}
                                        className="w-12 h-12 rounded object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "https://via.placeholder.com/48";
                                        }}
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p
                                        className={`text-sm font-medium ${textPrimary}`}
                                      >
                                        {category.category_name}
                                      </p>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                        <p className={`text-xs mt-2 ${textSecondary}`}>
                          {config.categories.featuredCategoryIds &&
                          config.categories.featuredCategoryIds.length > 0
                            ? "Only selected categories will be shown in the customer app. Uncheck to show all categories."
                            : 'No categories selected. All categories will be shown (limited by "Number to Display" above).'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Products Section */}
                <div className={`${cardBgClass} rounded-lg border p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-semibold ${textPrimary}`}>
                      Featured Products
                    </h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.products.enabled}
                        onChange={(e) =>
                          updateConfig("products", {
                            enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {config.products.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label
                          className={`block text-sm font-medium ${textPrimary} mb-2`}
                        >
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={config.products.title}
                          onChange={(e) =>
                            updateConfig("products", { title: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${textPrimary} mb-2`}
                        >
                          Number to Display
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={config.products.showCount}
                          onChange={(e) =>
                            updateConfig("products", {
                              showCount: parseInt(e.target.value) || 6,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${textPrimary} mb-3`}
                        >
                          Select Featured Products (
                          {config.products.featuredProductIds?.length || 0}{" "}
                          selected)
                        </label>
                        {loadingData ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className={`mt-2 text-sm ${textSecondary}`}>
                              Loading products...
                            </p>
                          </div>
                        ) : products.length === 0 ? (
                          <p className={`text-sm ${textSecondary}`}>
                            No products available. Create products first.
                          </p>
                        ) : (
                          <div className="max-h-64 overflow-y-auto border rounded-lg p-3 dark:border-slate-700">
                            {products.map((product) => {
                              const isSelected =
                                config.products.featuredProductIds?.includes(
                                  product.product_id
                                ) || false;
                              return (
                                <label
                                  key={product.product_id}
                                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 ${
                                    isSelected
                                      ? "bg-indigo-50 dark:bg-indigo-900/20"
                                      : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const currentIds =
                                        config.products.featuredProductIds ||
                                        [];
                                      const newIds = e.target.checked
                                        ? [...currentIds, product.product_id]
                                        : currentIds.filter(
                                            (id) => id !== product.product_id
                                          );
                                      updateConfig("products", {
                                        featuredProductIds: newIds,
                                      });
                                    }}
                                    className="rounded"
                                  />
                                  <div className="flex-1 flex items-center gap-3">
                                    {product.product_image && (
                                      <img
                                        src={product.product_image}
                                        alt={product.product_name}
                                        className="w-12 h-12 rounded object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "https://via.placeholder.com/48";
                                        }}
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p
                                        className={`text-sm font-medium ${textPrimary}`}
                                      >
                                        {product.product_name}
                                      </p>
                                      <p className={`text-xs ${textSecondary}`}>
                                        ₹{product.base_price} •{" "}
                                        {product.category_name}
                                      </p>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Banners Section */}
                <div className={`${cardBgClass} rounded-lg border p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-semibold ${textPrimary}`}>
                      Promotional Banners
                    </h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.banners.enabled}
                        onChange={(e) =>
                          updateConfig("banners", { enabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {config.banners.enabled && (
                    <div className="space-y-4">
                      <div className="mb-3">
                        <p className={`text-sm ${textSecondary} mb-2`}>
                          Select from existing banners or add custom ones:
                        </p>
                        {banners.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 dark:border-slate-700">
                            {banners.map((banner) => {
                              const isSelected = config.banners.items.some(
                                (item) => item.image === banner.image_url
                              );
                              return (
                                <label
                                  key={banner.id}
                                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 ${
                                    isSelected
                                      ? "bg-indigo-50 dark:bg-indigo-900/20"
                                      : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const currentItems = config.banners.items;
                                      if (e.target.checked) {
                                        updateConfig("banners", {
                                          items: [
                                            ...currentItems,
                                            {
                                              image: banner.image_url,
                                              title: banner.title || "Banner",
                                            },
                                          ],
                                        });
                                      } else {
                                        updateConfig("banners", {
                                          items: currentItems.filter(
                                            (item) =>
                                              item.image !== banner.image_url
                                          ),
                                        });
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <img
                                    src={banner.image_url}
                                    alt={banner.title}
                                    className="w-16 h-10 rounded object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://via.placeholder.com/64x40";
                                    }}
                                  />
                                  <span
                                    className={`text-sm flex-1 ${textPrimary}`}
                                  >
                                    {banner.title}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const newItems = [
                            ...config.banners.items,
                            { image: "", title: "New Banner", link: "" },
                          ];
                          updateConfig("banners", { items: newItems });
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        + Add Custom Banner
                      </button>
                      {config.banners.items.map((banner, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg dark:border-slate-700"
                        >
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={banner.title}
                              onChange={(e) => {
                                const newItems = [...config.banners.items];
                                newItems[index].title = e.target.value;
                                updateConfig("banners", { items: newItems });
                              }}
                              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                              placeholder="Banner Title (e.g., Hearty Breakfast)"
                            />
                            <input
                              type="url"
                              value={banner.image}
                              onChange={(e) => {
                                const newItems = [...config.banners.items];
                                newItems[index].image = e.target.value;
                                updateConfig("banners", { items: newItems });
                              }}
                              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                              placeholder="Banner Image URL"
                            />
                            <button
                              onClick={() => {
                                const newItems = config.banners.items.filter(
                                  (_, i) => i !== index
                                );
                                updateConfig("banners", { items: newItems });
                              }}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Live Preview */}
              <div className="lg:col-span-1">
                <div
                  className={`${cardBgClass} rounded-lg border p-4 sticky top-6`}
                >
                  <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
                    📱 Live Preview
                  </h3>
                  <div className="transform scale-75 origin-top">
                    <HomeScreenPreview
                      config={config}
                      isDarkMode={isDarkMode}
                      products={products}
                      categories={categories}
                      banners={banners}
                      storeConfig={storeConfig}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
