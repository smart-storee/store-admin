'use client';

import { useState } from 'react';
import ProtectedRouteWrapper from '@/components/ProtectedRouteWrapper';
import ApiLogViewer from '@/components/ApiLogViewer';
import { RoleGuard } from '@/components/RoleGuard';

export default function ApiLogsPage() {
  const [showViewer, setShowViewer] = useState(true);

  return (
    <ProtectedRouteWrapper>
      <RoleGuard 
        requiredPermissions={['view_dashboard']} // Allow users who can view dashboard to see logs
        fallback={
          <div className="p-6 text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Access denied. You do not have permission to view API logs.
            </div>
          </div>
        }
      >
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">API Logs</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowViewer(!showViewer)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  {showViewer ? 'Hide Logs' : 'Show Logs'}
                </button>
              </div>
            </div>
          </header>
          
          <main>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {showViewer && <ApiLogViewer />}
            </div>
          </main>
        </div>
      </RoleGuard>
    </ProtectedRouteWrapper>
  );
}