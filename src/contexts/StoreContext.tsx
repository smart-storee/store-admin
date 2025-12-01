"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { makeAuthenticatedRequest } from '@/utils/api';

type Store = {
  id: number;
  name: string;
};

type Branch = {
  id: number;
  name: string;
  store_id: number;
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

  // Fetch stores on component mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await makeAuthenticatedRequest(
          '/stores',
          {},
          true,
          null,
          null
        );
        if (response?.data) {
          setStores(response.data);
          // If user is not a super admin, set their store as selected
          if (user?.store_id && !user.is_superadmin) {
            setSelectedStore(user.store_id);
          } else if (response.data.length > 0) {
            setSelectedStore(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
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
          `/stores/${selectedStore}/branches`,
          {},
          true,
          null,
          null
        );
        if (response?.data) {
          setBranches(response.data);
          // If user is not a super admin, set their branch as selected if available
          if (response.data.length > 0) {
            setSelectedBranch(response.data[0].id);
          } else {
            setSelectedBranch(null);
          }
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
