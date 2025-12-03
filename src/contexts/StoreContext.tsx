"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { makeAuthenticatedRequest } from '@/utils/api';

type Store = {
  id: number;
  name: string;
};

type Branch = {
  id: number; // Using id to match what the context expects
  name: string; // Using name to match what the context expects
  store_id: number;
  [key: string]: any; // Allow additional fields
};

type StoreContextType = {
  stores: Store[];
  branches: Branch[];
  selectedStore: number | null;
  selectedBranch: number | null;
  setSelectedStore: (storeId: number | null) => void;
  setSelectedBranch: (branchId: number | null) => void;
  loading: boolean;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Set the user's assigned store on component mount
  useEffect(() => {
    if (user?.store_id) {
      // Fetch store details for the user's assigned store
      const fetchStoreDetails = async () => {
        try {
          const response = await makeAuthenticatedRequest(
            `/stores/${user.store_id}`,
            {},
            true,
            user.store_id,
            user.branch_id || undefined
          );
          if (response?.success && response?.data) {
            // Handle both array and object response formats
            const storeData = Array.isArray(response.data) ? response.data[0] : response.data?.data || response.data;

            // Format the store data to match the Store type
            setStores([{
              id: storeData.store_id || user.store_id,
              name: storeData.store_name || 'User Store'
            }]);

            setSelectedStore(user.store_id);
          } else {
            // If we can't fetch store details, just use the store_id from user
            setStores([{
              id: user.store_id,
              name: user.store_name || 'User Store'
            }]);
            setSelectedStore(user.store_id);
          }
        } catch (error) {
          console.error('Error fetching store details:', error);
          // If we can't fetch store details, just use the store_id from user
          setStores([{
            id: user.store_id,
            name: 'User Store'
          }]);
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
          const branchesData = Array.isArray(response.data) ? response.data : response.data?.data || [];

          // Transform API response to match expected format
          const transformedBranches = branchesData.map((branch: any) => ({
            id: branch.branch_id || branch.id,
            name: branch.branch_name || branch.name,
            store_id: branch.store_id
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
        console.error('Error fetching branches:', error);
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
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
