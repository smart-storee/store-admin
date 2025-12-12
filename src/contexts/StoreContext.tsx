"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { makeAuthenticatedRequest } from "@/utils/api";
import { StoreFeatures } from "@/types";

type Store = {
  id: number;
  name: string;
};

type Branch = {
  id: number;
  name: string;
  store_id: number;
  [key: string]: any;
};

type StoreContextType = {
  stores: Store[];
  branches: Branch[];
  selectedStore: number | null;
  selectedBranch: number | null;
  setSelectedStore: (storeId: number | null) => void;
  setSelectedBranch: (branchId: number | null) => void;
  loading: boolean;
  features: StoreFeatures | null;
  refreshFeatures: () => Promise<void>;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<StoreFeatures | null>(null);
  const { user } = useAuth();

  // Set the user's assigned store on component mount
  useEffect(() => {
    if (user?.store_id) {
      // Fetch store details for the user's assigned store
      const fetchStoreDetails = async () => {
        try {
          // Fetch store details and app config (which includes features)
          const [storeResponse, appConfigResponse] = await Promise.all([
            makeAuthenticatedRequest(
              `/stores/${user.store_id}`,
              {},
              true,
              user.store_id,
              user.branch_id || undefined
            ),
            makeAuthenticatedRequest(
              `/app-settings?store_id=${user.store_id}`,
              {},
              true,
              user.store_id,
              user.branch_id || undefined
            ),
          ]);

          if (storeResponse?.success && storeResponse?.data) {
            // Handle both array and object response formats
            const storeData = Array.isArray(storeResponse.data)
              ? storeResponse.data[0]
              : storeResponse.data?.data || storeResponse.data;

            // Format the store data to match the Store type
            setStores([
              {
                id: storeData.store_id || user.store_id,
                name: storeData.store_name || "User Store",
              },
            ]);

            setSelectedStore(user.store_id);
          } else {
            // If we can't fetch store details, just use the store_id from user
            setStores([
              {
                id: user.store_id,
                name: user.store_name || "User Store",
              },
            ]);
            setSelectedStore(user.store_id);
          }

          // Extract features from app config response
          if (appConfigResponse?.success && appConfigResponse?.data) {
            const configData =
              appConfigResponse.data.data || appConfigResponse.data;
            if (configData.features) {
              setFeatures({
                push_notifications_enabled:
                  configData.features.push_notifications_enabled === true ||
                  configData.features.push_notifications_enabled === 1,
                sms_enabled:
                  configData.features.sms_enabled === true ||
                  configData.features.sms_enabled === 1,
                whatsapp_enabled:
                  configData.features.whatsapp_enabled === true ||
                  configData.features.whatsapp_enabled === 1,
                email_enabled:
                  configData.features.email_enabled === true ||
                  configData.features.email_enabled === 1,
                coupon_codes_enabled:
                  configData.features.coupon_codes_enabled === true ||
                  configData.features.coupon_codes_enabled === 1,
                app_settings_enabled:
                  configData.features.app_settings_enabled === true ||
                  configData.features.app_settings_enabled === 1,
                add_options_enabled:
                  configData.features.add_options_enabled === true ||
                  configData.features.add_options_enabled === 1,
                customers_enabled:
                  configData.features.customers_enabled === true ||
                  configData.features.customers_enabled === 1,
                employees_enabled:
                  configData.features.employees_enabled === true ||
                  configData.features.employees_enabled === 1,
                home_config_enabled:
                  configData.features.home_config_enabled === true ||
                  configData.features.home_config_enabled === 1,
                reports_enabled:
                  configData.features.reports_enabled === true ||
                  configData.features.reports_enabled === 1,
                max_categories: configData.features.max_categories ?? null,
                max_products: configData.features.max_products ?? null,
                max_variants: configData.features.max_variants ?? null,
              });
            } else {
              // If no features in response, set defaults (all enabled)
              setFeatures({
                push_notifications_enabled: true,
                sms_enabled: true,
                whatsapp_enabled: false,
                email_enabled: false,
                coupon_codes_enabled: true,
                app_settings_enabled: true,
                add_options_enabled: true,
                customers_enabled: true,
                employees_enabled: true,
                home_config_enabled: true,
                reports_enabled: true,
                max_categories: null,
                max_products: null,
                max_variants: null,
              });
            }
          } else {
            // If app config fetch fails, set defaults
            setFeatures({
              push_notifications_enabled: true,
              sms_enabled: true,
              whatsapp_enabled: false,
              email_enabled: false,
              coupon_codes_enabled: true,
              app_settings_enabled: true,
              add_options_enabled: true,
              customers_enabled: true,
              employees_enabled: true,
              home_config_enabled: true,
              reports_enabled: true,
              max_categories: null,
              max_products: null,
              max_variants: null,
            });
          }
        } catch (error) {
          console.error("Error fetching store details:", error);
          // If we can't fetch store details, just use the store_id from user
          setStores([
            {
              id: user.store_id,
              name: "User Store",
            },
          ]);
          setSelectedStore(user.store_id);
        } finally {
          setLoading(false);
        }
      };

      fetchStoreDetails();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Function to refresh features (can be called after super admin updates)
  const refreshFeatures = async () => {
    if (!user?.store_id) return;

    try {
      const appConfigResponse = await makeAuthenticatedRequest(
        `/app-settings?store_id=${user.store_id}`,
        {},
        true,
        user.store_id,
        user.branch_id || undefined
      );

      if (appConfigResponse?.success && appConfigResponse?.data) {
        const configData =
          appConfigResponse.data.data || appConfigResponse.data;
        if (configData.features) {
          setFeatures({
            push_notifications_enabled:
              configData.features.push_notifications_enabled === true ||
              configData.features.push_notifications_enabled === 1,
            sms_enabled:
              configData.features.sms_enabled === true ||
              configData.features.sms_enabled === 1,
            whatsapp_enabled:
              configData.features.whatsapp_enabled === true ||
              configData.features.whatsapp_enabled === 1,
            email_enabled:
              configData.features.email_enabled === true ||
              configData.features.email_enabled === 1,
            coupon_codes_enabled:
              configData.features.coupon_codes_enabled === true ||
              configData.features.coupon_codes_enabled === 1,
            app_settings_enabled:
              configData.features.app_settings_enabled === true ||
              configData.features.app_settings_enabled === 1,
            add_options_enabled:
              configData.features.add_options_enabled === true ||
              configData.features.add_options_enabled === 1,
            customers_enabled:
              configData.features.customers_enabled === true ||
              configData.features.customers_enabled === 1,
            employees_enabled:
              configData.features.employees_enabled === true ||
              configData.features.employees_enabled === 1,
            home_config_enabled:
              configData.features.home_config_enabled === true ||
              configData.features.home_config_enabled === 1,
            reports_enabled:
              configData.features.reports_enabled === true ||
              configData.features.reports_enabled === 1,
            max_categories: configData.features.max_categories ?? null,
            max_products: configData.features.max_products ?? null,
            max_variants: configData.features.max_variants ?? null,
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing features:", error);
    }
  };

  // Fetch branches when selectedStore changes
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedStore) {
        setBranches([]);
        setSelectedBranch(null);
        return;
      }

      try {
        const response = await makeAuthenticatedRequest(
          `/branches?store_id=${selectedStore}`,
          {},
          true,
          selectedStore,
          user?.branch_id || undefined
        );
        if (response?.success && response?.data) {
          const branchesData = Array.isArray(response.data)
            ? response.data
            : response.data?.data || [];

          // Transform API response to match expected format
          const transformedBranches = branchesData.map((branch: any) => ({
            id: branch.branch_id || branch.id,
            name: branch.branch_name || branch.name,
            store_id: branch.store_id,
          }));

          setBranches(transformedBranches);

          // If user has a specific branch assigned, set that as selected
          if (user?.branch_id) {
            setSelectedBranch(user.branch_id);
          } else if (transformedBranches.length > 0) {
            // Otherwise, set the first branch as selected
            setSelectedBranch(transformedBranches[0].id);
          } else {
            setSelectedBranch(null);
          }
        } else {
          setBranches([]);
          setSelectedBranch(null);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setBranches([]);
        setSelectedBranch(null);
      }
    };

    fetchBranches();
  }, [selectedStore, user]);

  return (
    <StoreContext.Provider
      value={{
        stores,
        branches,
        selectedStore,
        selectedBranch,
        setSelectedStore,
        setSelectedBranch,
        loading,
        features,
        refreshFeatures,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
