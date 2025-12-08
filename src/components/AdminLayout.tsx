"use client";

import { useState, ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useStore } from "@/contexts/StoreContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { makeAuthenticatedRequest } from "@/utils/api";
import DarkModeToggle from "@/components/DarkModeToggle";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [dropdownTimer, setDropdownTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [storeName, setStoreName] = useState<string>("Store Admin");
  const [storeLogo, setStoreLogo] = useState<string>("");
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { features } = useStore();
  const {
    storeFeatures,
    isFeatureEnabled,
    userPermissions,
    loading: featuresLoading,
  } = usePermissions();
  const pathname = usePathname();
  const isDarkMode = theme === "dark";

  // Fetch store name and logo from app_config
  useEffect(() => {
    const fetchStoreConfig = async () => {
      if (!user?.store_id) {
        setStoreName(user?.store_name || "Store Admin");
        return;
      }

      try {
        const response = await makeAuthenticatedRequest(
          `/app-settings?store_id=${user.store_id}`,
          {},
          true,
          user.store_id,
          user.branch_id || undefined
        );

        if (response.success) {
          const config = response.data.data || response.data;
          setStoreName(config.app_name || user.store_name || "Store Admin");
          setStoreLogo(config.logo_url || "");
        } else {
          setStoreName(user.store_name || "Store Admin");
          setStoreLogo("");
        }
      } catch (err) {
        console.error("Error fetching store config:", err);
        setStoreName(user.store_name || "Store Admin");
        setStoreLogo("");
      }
    };

    fetchStoreConfig();
  }, [user?.store_id, user?.store_name]);

  // Get first letter of store name for avatar fallback
  const getStoreInitial = () => {
    if (storeName && storeName !== "Store Admin") {
      return storeName.charAt(0).toUpperCase();
    }
    return "S";
  };

  const handleMouseEnterProfile = () => {
    if (dropdownTimer) {
      clearTimeout(dropdownTimer);
      setDropdownTimer(null);
    }
    setProfileDropdownOpen(true);
  };

  const handleMouseLeaveProfile = () => {
    const timer = setTimeout(() => {
      setProfileDropdownOpen(false);
    }, 200);
    setDropdownTimer(timer);
  };

  interface NavigationItem {
    name: string;
    href: string;
    permission?: string;
    feature?: string; // Feature flag name to check
  }

  // Navigation items based on permissions
  const allNavigationItems: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", permission: "view_dashboard" },
    {
      name: "Branches",
      href: "/branches",
      permission: "manage_branches",
      feature: "branches_enabled",
    },
    {
      name: "Business Setup Flow",
      href: "/business-setup-flow",
      permission: "manage_categories",
      feature: "categories_enabled", // Business setup flow requires categories
    },
    {
      name: "Orders",
      href: "/orders",
      permission: "manage_orders",
      feature: "orders_enabled",
    },
    {
      name: "Coupons",
      href: "/coupons",
      permission: "manage_orders",
      feature: "coupon_codes_enabled",
    },
    {
      name: "Customers",
      href: "/customers",
      permission: "manage_customers",
      feature: "customers_enabled",
    },
    {
      name: "Employees",
      href: "/users",
      permission: "manage_users",
      feature: "employees_enabled",
    },
    {
      name: "Notifications",
      href: "/notifications",
      permission: "manage_notifications",
      feature: "notifications_enabled",
    },
    {
      name: "Communication Logs",
      href: "/communication-logs",
      permission: "view_reports",
      feature: "communication_logs_enabled",
    },
    {
      name: "Home Config",
      href: "/home-config",
      permission: "app_settings",
      feature: "home_config_enabled",
    },
    {
      name: "Reports",
      href: "/reports",
      permission: "view_reports",
      feature: "reports_enabled",
    },
    { name: "API Logs", href: "/api-logs", permission: "view_dashboard" },
    {
      name: "Billing",
      href: "/billing",
      permission: "view_reports",
      feature: "billings_enabled",
    },
    {
      name: "Settings",
      href: "/settings",
      permission: "app_settings",
      feature: "app_settings_enabled",
    },
  ];

  // Filter navigation based on user permissions, role, and feature flags
  // Owner role should only see Branches and Reports
  const navigation = allNavigationItems.filter((item) => {
    // Check feature flag if specified - use PermissionsContext first, fallback to StoreContext
    if (item.feature) {
      let featureEnabled = false; // Default to disabled for safety
      console.log(storeFeatures, isFeatureEnabled);
      // Try PermissionsContext first (more accurate)
      if (storeFeatures && isFeatureEnabled) {
        featureEnabled = isFeatureEnabled(item.feature);
        console.log(
          `Feature check for ${item.name} (${item.feature}):`,
          featureEnabled
        );
      }
      // Fallback to StoreContext
      else if (features) {
        featureEnabled =
          features[item.feature as keyof typeof features] === true ||
          features[item.feature as keyof typeof features] === 1;
        console.log(
          `Feature check (fallback) for ${item.name} (${item.feature}):`,
          featureEnabled
        );
      }
      // If neither is available and we're still loading, don't filter yet (show it temporarily)
      // This prevents hiding items before features are loaded
      else {
        // Only show if we're still loading features, otherwise hide for safety
        featureEnabled = featuresLoading === true; // Show only while loading
      }

      if (!featureEnabled) {
        console.log(
          `Hiding ${item.name} because feature ${item.feature} is disabled`
        );
        return false; // Hide menu item if feature is disabled
      }
    }

    // If user is owner, only show branches and reports
    // if (user?.role === 'owner') {
    //   return item.permission === 'manage_branches' || item.permission === 'view_reports';
    // }

    // For other roles, check permissions
    // Use userPermissions from PermissionsContext (permission codes) instead of user?.permissions (permission names)
    let permissionsToCheck: string[] = [];

    if (userPermissions && userPermissions.length > 0) {
      // Use permission codes from PermissionsContext
      permissionsToCheck = userPermissions;
    } else if (user?.permissions && user.permissions.length > 0) {
      // Fallback: Convert permission names to codes if we only have names
      const nameToCodeMap: Record<string, string> = {
        "View Dashboard": "view_dashboard",
        "Manage Stores": "manage_stores",
        "Manage Categories": "manage_categories",
        "Manage Products": "manage_products",
        "Manage Orders": "manage_orders",
        "Manage Customers": "manage_customers",
        "Manage Users": "manage_users",
        "Manage App Settings": "app_settings",
        "Manage Notifications": "manage_notifications",
        "Manage Branches": "manage_branches",
        "View Reports": "view_reports",
      };

      permissionsToCheck = user.permissions.map(
        (name: string) =>
          nameToCodeMap[name] || name.toLowerCase().replace(/\s+/g, "_")
      );
    }

    if (item.permission && permissionsToCheck.length > 0) {
      const hasPermission = permissionsToCheck.includes(item.permission);
      if (!hasPermission) {
        console.log(
          `Hiding ${item.name} because user doesn't have permission ${
            item.permission
          }. Available permissions: ${permissionsToCheck.join(", ")}`
        );
      }
      return hasPermission;
    }
    // If no permission specified, show it (fallback)
    return !item.permission;
  });

  console.log(
    "Filtered navigation items:",
    navigation.map((item) => item.name)
  );
  console.log("Store features:", storeFeatures);
  console.log("User permissions (from AuthContext):", user?.permissions);
  console.log("User permissions (from PermissionsContext):", userPermissions);

  const isActive = (href: string) => pathname === href;

  const getIcon = (name: string) => {
    switch (name) {
      case "Dashboard":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        );
      case "Branches":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case "Business Setup Flow":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m5.2-15.8l-4.2 4.2m0 6l-4.2 4.2M23 12h-6m-6 0H1m20.8-5.2l-4.2 4.2m0 6l-4.2 4.2"></path>
          </svg>
        );
      case "Orders":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        );
      case "Coupons":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="8" width="18" height="4" rx="1"></rect>
            <path d="M12 8v13"></path>
            <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path>
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
          </svg>
        );
      case "Customers":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case "Employees":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        );
      case "Notifications":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        );
      case "Reports":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        );
      case "API Logs":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      case "Communication Logs":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <line x1="9" y1="10" x2="15" y2="10"></line>
            <line x1="9" y1="14" x2="13" y2="14"></line>
          </svg>
        );
      case "Home Config":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        );
      case "Settings":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6"></path>
            <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24"></path>
            <path d="M1 12h6m6 0h6"></path>
            <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: isDarkMode ? "#0f172a" : "#F9FAFB",
      }}
    >
      {/* Mobile sidebar */}
      <div className="md:hidden">
        {/* Mobile header with theme toggle */}
        <div
          className="fixed top-0 left-0 right-0 shadow-sm z-40 px-4 py-3 flex items-center justify-between"
          style={{
            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
          }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {pathname === "/dashboard" && "Dashboard"}
            {pathname === "/branches" && "Branches"}
            {pathname === "/orders" && "Orders"}
            {pathname === "/coupons" && "Coupons"}
            {pathname === "/customers" && "Customers"}
            {pathname === "/users" && "Employees"}
            {pathname === "/notifications" && "Notifications"}
            {pathname === "/communication-logs" && "Communication Logs"}
            {pathname === "/reports" && "Reports"}
            {pathname === "/api-logs" && "API Logs"}
            {pathname === "/settings" && "Settings"}
          </h2>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {sidebarOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-lg z-50">
              <div className="h-full overflow-y-auto">
                <div className="px-4 pt-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium text-gray-900">
                      Menu
                    </div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close menu</span>
                      <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <nav className="mt-5">
                    <div className="space-y-1">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`${
                            isActive(item.href)
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300"
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
          borderRight: isDarkMode ? "1px solid #334155" : "1px solid #E5E7EB",
          width: sidebarCollapsed ? "80px" : "256px",
        }}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div
              className="flex items-center flex-shrink-0 px-4 mb-8"
              style={{
                justifyContent: sidebarCollapsed ? "center" : "space-between",
              }}
            >
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                }}
              >
                {storeLogo ? (
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                      backgroundColor: "#4169E1",
                      padding: "4px",
                    }}
                  >
                    <img
                      src={storeLogo}
                      alt={storeName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: "4px",
                      }}
                      onError={(e) => {
                        // Fallback to initial if image fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `<span style="color: #FFFFFF; font-size: 20px; font-weight: bold;">${getStoreInitial()}</span>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#4169E1",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                      fontSize: "20px",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {getStoreInitial()}
                  </div>
                )}
                {!sidebarCollapsed && (
                  <h1
                    style={{
                      color: isDarkMode ? "#f8fafc" : "#111827",
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    {storeName}
                  </h1>
                )}
              </div>
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDarkMode ? "#cbd5e1" : "#6B7280",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? "#334155"
                      : "#F3F4F6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
            </div>
            <nav className="mt-2 flex-1 px-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  title={sidebarCollapsed ? item.name : ""}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    gap: sidebarCollapsed ? "0" : "12px",
                    padding: sidebarCollapsed ? "12px" : "12px 16px",
                    fontSize: "15px",
                    fontWeight: "500",
                    borderRadius: "8px",
                    backgroundColor: isActive(item.href)
                      ? isDarkMode
                        ? "rgba(65, 105, 225, 0.2)"
                        : "#4169E120"
                      : "transparent",
                    color: isActive(item.href)
                      ? "#4169E1"
                      : isDarkMode
                      ? "#cbd5e1"
                      : "#6B7280",
                    borderLeft: isActive(item.href)
                      ? "3px solid #4169E1"
                      : "3px solid transparent",
                    marginLeft: isActive(item.href) ? "-3px" : "0",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.href)) {
                      e.currentTarget.style.backgroundColor = isDarkMode
                        ? "#334155"
                        : "#F3F4F6";
                      e.currentTarget.style.color = isDarkMode
                        ? "#f8fafc"
                        : "#111827";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.href)) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = isDarkMode
                        ? "#cbd5e1"
                        : "#6B7280";
                    }
                  }}
                >
                  {getIcon(item.name)}
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
            </nav>
          </div>
          <div
            className="flex-shrink-0 p-4"
            style={{
              borderTop: isDarkMode ? "1px solid #334155" : "1px solid #E5E7EB",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: sidebarCollapsed ? "column" : "row",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                gap: sidebarCollapsed ? "12px" : "12px",
                width: "100%",
              }}
            >
              {!sidebarCollapsed && <DarkModeToggle />}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{
          paddingLeft: sidebarCollapsed ? "80px" : "256px",
        }}
      >
        <div className="md:pr-4">
          {/* Top header with branch selector */}
          <div
            className="shadow-sm"
            style={{
              backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
            }}
          >
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pathname === "/dashboard" && "Dashboard"}
                    {pathname === "/branches" && "Branches Management"}
                    {pathname === "/orders" && "Orders Management"}
                    {pathname === "/coupons" && "Coupons Management"}
                    {pathname === "/customers" && "Customers Management"}
                    {pathname === "/users" && "Employees Management"}
                    {pathname === "/notifications" && "Notifications"}
                    {pathname === "/communication-logs" && "Communication Logs"}
                    {pathname === "/home-config" && "Home Screen Configuration"}
                    {pathname === "/reports" && "Reports & Analytics"}
                    {pathname === "/api-logs" && "API Logs"}
                    {pathname === "/settings" && "App Settings"}
                  </h2>
                </div>

                {/* Store/Branch selector */}
                {/* <StoreBranchSelector /> */}
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 dark:text-gray-300">
                    Welcome, {user?.name || "Admin"}
                  </span>

                  {/* Theme Toggle */}
                  <div className="hidden md:block">
                    <DarkModeToggle />
                  </div>

                  {/* Profile Dropdown */}
                  <div
                    style={{ position: "relative" }}
                    onMouseEnter={handleMouseEnterProfile}
                    onMouseLeave={handleMouseLeaveProfile}
                  >
                    <div
                      className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white cursor-pointer hover:bg-indigo-600 transition-colors"
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                      }}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                    </div>

                    {/* Dropdown Menu */}
                    {profileDropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          marginTop: "8px",
                          width: "200px",
                          backgroundColor: "#FFFFFF",
                          borderRadius: "8px",
                          boxShadow:
                            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                          border: "1px solid #E5E7EB",
                          zIndex: 50,
                          overflow: "hidden",
                        }}
                        onMouseEnter={handleMouseEnterProfile}
                        onMouseLeave={handleMouseLeaveProfile}
                      >
                        {/* User Info */}
                        <div
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #E5E7EB",
                            backgroundColor: "#F9FAFB",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#111827",
                              marginBottom: "2px",
                            }}
                          >
                            {user?.name || "Admin"}
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#6B7280",
                            }}
                          >
                            {user?.email || ""}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div style={{ padding: "8px 0" }}>
                          <Link
                            href="/settings"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 16px",
                              fontSize: "14px",
                              color: "#374151",
                              textDecoration: "none",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#F3F4F6";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <IoSettingsOutline size={18} />
                            Settings
                          </Link>

                          <button
                            onClick={logout}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 16px",
                              fontSize: "14px",
                              color: "#EF4444",
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                              textAlign: "left",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#FEF2F2";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <IoLogOutOutline size={18} />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6 md:pt-6 pt-20">
            <div className="px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
