'use client';

import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { Product, ApiResponse, Pagination, Store, Branch } from '@/types';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { theme } = useTheme();

  // Fetch branches for the user's assigned store
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response: ApiResponse<{ data: Branch[] }> =
          await makeAuthenticatedRequest(`/branches?store_id=${user?.store_id}`);
        if (response.success) {
          const branchesData = Array.isArray(response.data)
            ? response.data
            : response.data?.data || [];
          setBranches(branchesData);
          setSelectedBranch(null); // Reset branch selection when store changes
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      }
    };

    if (user?.store_id) {
      fetchBranches();
    }
  }, [user]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, selectedBranch, user]);

  const fetchProducts = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '10',
      ...(searchTerm && { search: searchTerm }),
    });

    // Add store_id and branch_id based on user context
    if (user?.store_id) {
      // For all users, use their store_id from user context
      params.append('store_id', user.store_id.toString());
    }

    // Add branch_id if selected
    if (selectedBranch) {
      params.append('branch_id', selectedBranch.toString());
    }
    
    console.log('Fetching products with params:', params.toString());
    
    const response = await makeAuthenticatedRequest(`/products?${params.toString()}`);
    console.log('API Response:', response); // Debug log
    
    if (response?.success) {
      // Handle both array and object response formats
      const responseData = response.data || {};
      const productsData = Array.isArray(responseData) 
        ? responseData 
        : responseData.data || [];
      
      const pagination = responseData.pagination || response.pagination || { 
        total: productsData.length, 
        total_pages: 1,
        current_page: currentPage,
        limit: 10
      };
      
      setProducts(productsData);
      // setPagination(pagination);
    } else {
      throw new Error(response?.message || 'Failed to fetch products');
    }
  } catch (err) {
    console.error('Error in fetchProducts:', err);
    setError(err instanceof Error ? err.message : 'An error occurred while fetching products');
  } finally {
    setLoading(false);
  }
};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranch(e.target.value ? Number(e.target.value) : null);
    setCurrentPage(1);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        `/products/${productId}`,
        { method: 'DELETE' }
      );

      if (response.success) {
        fetchProducts(); // Refresh the list
      } else {
        alert(response.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete product error:', err);
      if (err instanceof Error) {
        alert(err.message || 'Failed to delete product');
      } else {
        alert('Failed to delete product');
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <RoleGuard
      requiredPermissions={['manage_products']}
      fallback={
        <div className="p-6 text-center">
          <div className={`border rounded-lg px-4 py-3 mb-4 ${theme === 'dark' ? 'bg-red-900/30 border-red-700/50 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}>
            Access denied. You do not have permission to manage products.
          </div>
        </div>
      }
    >
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Products Management</h1>
          <button
            onClick={() => window.location.href = '/products/new'}
            className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            Add New Product
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedBranch || ''}
              onChange={handleBranchChange}
              className={`border rounded-md px-3 py-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'}`}
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>

            <div className="flex">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`flex-1 rounded-l-md px-4 py-2 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700 text-white' : 'border border-gray-300'}`}
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded-r-md ${theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className={`border px-4 py-3 rounded mb-4 ${theme === 'dark' ? 'bg-red-900/30 border-red-700/50 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}>
            {error}
          </div>
        )}

        <div className={`shadow overflow-hidden sm:rounded-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          {loading ? (
            <div className="p-6 text-center">Loading products...</div>
          ) : (
            <>
              <ul className={`${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                {products.map((product) => (
                  <li key={product.product_id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img
                            src={product.product_image}
                            alt={product.product_name}
                            className="h-12 w-12 rounded-md object-cover mr-4"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/placeholder-image.jpg'; // fallback image
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} truncate`}>{product.product_name}</p>
                              {product.is_bestseller === 1 && (
                                <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${theme === 'dark' ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                                  ⭐ Bestseller
                                </span>
                              )}
                              {product.is_vegetarian === 1 && (
                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${theme === 'dark' ? 'bg-green-900/40 border-green-700' : 'bg-green-100 border-green-500'}`}>
                                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {product.category_name} • Serves {product.serves_count || 1}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.is_active === 1
                              ? theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'
                              : theme === 'dark' ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_active === 1 ? 'Active' : 'Inactive'}
                          </span>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₹{product.base_price}</p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{product.total_stock} in stock</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => window.location.href = `/products/${product.product_id}`}
                              className={`${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-900'}`}
                            >
                              View
                            </button>
                            <button
                              onClick={() => window.location.href = `/products/${product.product_id}/edit`}
                              className={`${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-900'}`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.product_id)}
                              className={`${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <div className={`mr-6 flex items-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {product.product_description.substring(0, 100)}{product.product_description.length > 100 ? '...' : ''}
                          </div>
                        </div>
                        <div className={`mt-2 flex items-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} sm:mt-0`}>
                          {product.total_sold} sold
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {products.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>No products found</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`px-4 py-3 flex items-center justify-between border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} sm:px-6`}>
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? theme === 'dark' ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? theme === 'dark' ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Showing page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                            currentPage === 1
                              ? theme === 'dark' ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          &larr;
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? theme === 'dark' ? 'z-10 bg-indigo-600 border-indigo-600 text-white' : 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                            currentPage === totalPages
                              ? theme === 'dark' ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          &rarr;
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
};

export default ProductsPage;