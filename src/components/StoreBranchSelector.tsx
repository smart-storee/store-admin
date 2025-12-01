'use client';

import { useStore } from '@/contexts/StoreContext';

export const StoreBranchSelector = () => {
  const {
    stores,
    branches,
    selectedStore,
    selectedBranch,
    setSelectedStore,
    setSelectedBranch,
    loading,
  } = useStore();

  if (loading) {
    return (
      <div className="flex space-x-4 p-2 bg-gray-50 rounded-md">
        <div className="animate-pulse h-10 w-48 bg-gray-200 rounded-md"></div>
        <div className="animate-pulse h-10 w-48 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="flex space-x-4 p-2 bg-white border-b">
      <div className="w-48">
        <label htmlFor="store" className="block text-sm font-medium text-gray-700">
          Store
        </label>
        <select
          id="store"
          value={selectedStore || ''}
          onChange={(e) => {
            const storeId = e.target.value ? parseInt(e.target.value, 10) : null;
            setSelectedStore(storeId);
          }}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select Store</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-48">
        <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
          Branch
        </label>
        <select
          id="branch"
          value={selectedBranch || ''}
          onChange={(e) => {
            const branchId = e.target.value ? parseInt(e.target.value, 10) : null;
            setSelectedBranch(branchId);
          }}
          disabled={!selectedStore}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-50"
        >
          <option value="">Select Branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default StoreBranchSelector;
