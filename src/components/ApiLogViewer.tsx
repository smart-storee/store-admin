'use client';

import { useState, useEffect } from 'react';
import { 
  getLogs, 
  getLogsByLevel, 
  clearLogs, 
  configureLogger,
  getLoggerConfig,
  LogLevel
} from '@/utils/apiLogger';

const ApiLogViewer = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [limit, setLimit] = useState(50);

  // Update logs
  const updateLogs = () => {
    let filteredLogs = filterLevel === 'all' 
      ? getLogs() 
      : getLogsByLevel(filterLevel);
    
    // Apply search filter
    if (searchTerm) {
      filteredLogs = filteredLogs.filter(log => 
        log.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.error?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.requestBody)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.responseBody)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply limit
    setLogs(filteredLogs.slice(-limit));
  };

  useEffect(() => {
    updateLogs();
    
    const interval = setInterval(() => {
      if (autoRefresh) {
        updateLogs();
      }
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [filterLevel, searchTerm, limit, autoRefresh]);

  const handleClearLogs = () => {
    clearLogs();
    setLogs([]);
  };

  const logLevelColors = {
    debug: 'text-gray-500',
    info: 'text-blue-500',
    warn: 'text-yellow-500',
    error: 'text-red-500',
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">API Logs</h2>
        <button 
          onClick={handleClearLogs}
          className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
        >
          Clear Logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Level</label>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as LogLevel | 'all')}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <div className={`block w-14 h-8 rounded-full ${autoRefresh ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
              <div
                className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                  autoRefresh ? 'transform translate-x-6' : ''
                }`}
              ></div>
            </div>
            <div className="ml-3 text-gray-700 font-medium">Auto-refresh</div>
          </label>
        </div>
      </div>

      <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No logs available</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`p-3 border rounded-md text-sm font-mono ${
                  log.level === 'error' 
                    ? 'bg-red-50 border-red-200' 
                    : log.level === 'warn' 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : log.level === 'debug' 
                        ? 'bg-gray-100 border-gray-200' 
                        : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <span className={`font-semibold ${logLevelColors[log.level as LogLevel]}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-gray-700">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="font-medium">{log.method}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-indigo-600">{log.url}</span>
                    {log.status && (
                      <>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className={`font-medium ${
                          log.status >= 400 ? 'text-red-600' : 
                          log.status >= 300 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {log.status}
                        </span>
                      </>
                    )}
                    {log.duration && (
                      <>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-gray-600">{log.duration}ms</span>
                      </>
                    )}
                  </div>
                </div>

                {log.requestBody && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">Request Body:</div>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.requestBody, null, 2)}
                    </pre>
                  </div>
                )}

                {log.responseBody && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">Response Body:</div>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.responseBody, null, 2)}
                    </pre>
                  </div>
                )}

                {log.error && (
                  <div className="mt-2">
                    <div className="text-xs text-red-600">Error:</div>
                    <div className="text-xs bg-red-100 text-red-800 p-2 rounded">
                      {log.error}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiLogViewer;