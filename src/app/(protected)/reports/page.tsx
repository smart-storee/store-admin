export default function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Sales Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold">245</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">₹45,000.00</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="text-2xl font-bold">₹183.67</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Products</h2>
          <ul className="divide-y divide-gray-200">
            <li className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">Rasgulla</p>
                <p className="text-sm text-gray-500">85 sold</p>
              </div>
            </li>
            <li className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">Kaju Barfi</p>
                <p className="text-sm text-gray-500">32 sold</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Revenue</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Revenue Chart Visualization</p>
          </div>
        </div>
      </div>
    </div>
  );
}