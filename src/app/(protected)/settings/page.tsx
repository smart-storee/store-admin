export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">App Settings</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Store Information</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="store-name" className="block text-sm font-medium text-gray-700">
                Store Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="store-name"
                  id="store-name"
                  defaultValue="Thangaiah Sweets"
                  className="py-2 px-3 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-700">
                Tagline
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="tagline"
                  id="tagline"
                  defaultValue="Your sweet treats delivered fresh"
                  className="py-2 px-3 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700">
                Primary Color
              </label>
              <div className="mt-1">
                <input
                  type="color"
                  name="primary-color"
                  id="primary-color"
                  defaultValue="#F59E0B"
                  className="py-2 px-3 block w-20 h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="secondary-color" className="block text-sm font-medium text-gray-700">
                Secondary Color
              </label>
              <div className="mt-1">
                <input
                  type="color"
                  name="secondary-color"
                  id="secondary-color"
                  defaultValue="#cd0a7b"
                  className="py-2 px-3 block w-20 h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="min-order" className="block text-sm font-medium text-gray-700">
                Min Order Amount
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="min-order"
                  id="min-order"
                  defaultValue="100"
                  className="py-2 px-3 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Settings</h2>
          <div className="grid grid-cols-1 gap-y-4">
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="cod-enabled"
                  name="cod-enabled"
                  type="checkbox"
                  defaultChecked
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="cod-enabled" className="font-medium text-gray-700">
                  Cash on Delivery (COD) Enabled
                </label>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="online-payment-enabled"
                  name="online-payment-enabled"
                  type="checkbox"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="online-payment-enabled" className="font-medium text-gray-700">
                  Online Payment Enabled
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Maintenance Mode</h2>
          <div className="grid grid-cols-1 gap-y-4">
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="maintenance-mode"
                  name="maintenance-mode"
                  type="checkbox"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="maintenance-mode" className="font-medium text-gray-700">
                  Enable Maintenance Mode
                </label>
                <p className="text-gray-500">App will be temporarily unavailable to customers</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}