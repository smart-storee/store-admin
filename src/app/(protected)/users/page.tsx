'use client';

import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { AdminUser, ApiResponse, Pagination } from '@/types';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      
      if(user?.store_id){
        params.append('store_id', user.store_id.toString());
      }


      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      console.log('Fetching users with params:', params.toString()); // Debug log
      
      const response: ApiResponse<{ users: AdminUser[], pagination: Pagination }> = 
        await makeAuthenticatedRequest(`/users?${params.toString()}`);
      
      console.log('Users API response:', response); // Debug log
      
      if (response.success) {
        setUsers(response.data.users || response.data);
        setTotalPages(response.pagination ? Math.ceil(response.pagination.total / response.pagination.limit) : 1);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Users fetch error details:', err);
      
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('connect to the server')) {
          setError('Cannot connect to the server. Please make sure the backend API is running.');
        } else if (err.message.includes('403') || err.message.includes('Access forbidden')) {
          setError('Access denied. You do not have permission to view users.');
        } else if (err.message.includes('401') || err.message.includes('Authentication failed')) {
          setError('Authentication expired. Please log in again.');
        } else {
          setError(err.message || 'Failed to fetch users. Please try again later.');
        }
      } else {
        setError('Failed to fetch users. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response: ApiResponse<null> = await makeAuthenticatedRequest(
        `/users/${userId}`,
        { method: 'DELETE' }
      );
      
      if (response.success) {
        fetchUsers(); // Refresh the list
      } else {
        alert(response.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      if (err instanceof Error) {
        alert(err.message || 'Failed to delete user');
      } else {
        alert('Failed to delete user');
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
      requiredPermissions={['manage_users']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage users.
          </div>
        </div>
      }
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Add New User
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-l-md px-4 py-2"
            />
            <button 
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
        </form>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="p-6 text-center">Loading users...</div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user.user_id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white mr-4">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-indigo-600 truncate">{user.user_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                          <div className="flex space-x-2">
                            <button className="text-indigo-600 hover:text-indigo-900">
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.user_id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <div className="mr-6 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            {user.phone}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              {users.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === totalPages 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-500 hover:bg-gray-50'
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
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                            currentPage === totalPages
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-500 hover:bg-gray-50'
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
}