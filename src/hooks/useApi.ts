"use client";

import { useStore } from "@/contexts/StoreContext";
import { makeAuthenticatedRequest } from "@/utils/api";

export const useApi = () => {
  const { selectedStore, selectedBranch } = useStore();

  const apiRequest = async (
    endpoint: string,
    options: RequestInit = {},
    autoRefresh = true
  ) => {
    return makeAuthenticatedRequest(
      endpoint,
      options,
      autoRefresh,
      selectedStore,
      selectedBranch
    );
  };

  return { apiRequest };
};
