'use client';

import { useState } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';

// Predefined notification templates
const PREDEFINED_TEMPLATES = [
  {
    id: 'good_morning',
    title: 'Good Morning!',
    message: 'Start your day with our delicious sweets!',
    image_url: '/images/good-morning-promo.jpg',
    deep_link: 'home'
  },
  {
    id: 'sunday_special',
    title: 'Sunday Special Offer',
    message: 'Enjoy 20% off on all sweets today!',
    image_url: '/images/sunday-special.jpg',
    deep_link: 'products'
  },
  {
    id: 'pay_day_deal',
    title: 'Pay Day Deal',
    message: 'Celebrate with our premium sweet collections!',
    image_url: '/images/pay-day-deal.jpg',
    deep_link: 'products'
  },
  {
    id: 'weekend_offer',
    title: 'Weekend Special',
    message: 'Special weekend offers on selected products',
    image_url: '/images/weekend-offer.jpg',
    deep_link: 'products'
  },
  {
    id: 'festival_special',
    title: 'Festival Special',
    message: 'Traditional sweets for the festive season',
    image_url: '/images/festival-special.jpg',
    deep_link: 'products'
  }
];

// Audience options
const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'new_users', label: 'New Users' },
  { value: 'frequent_customers', label: 'Frequent Customers' },
  { value: 'inactive_users', label: 'Inactive Users' }
];

// Deep linking options
const DEEP_LINK_OPTIONS = [
  { value: '', label: 'No Link' },
  { value: 'home', label: 'Home Screen' },
  { value: 'products', label: 'Products Page' },
  { value: 'categories', label: 'Categories Page' },
  { value: 'offers', label: 'Offers Page' },
  { value: 'cart', label: 'Cart Page' },
  { value: 'profile', label: 'Profile Page' }
];

// Notification types
const NOTIFICATION_TYPES = [
  { value: 'promotional', label: 'Promotional' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'alert', label: 'Alert' },
  { value: 'news', label: 'News/Update' }
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notificationType, setNotificationType] = useState('promotional');
  const [targetAudience, setTargetAudience] = useState('all');
  const [deepLink, setDeepLink] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const handleTemplateSelect = (template: typeof PREDEFINED_TEMPLATES[number]) => {
    setTitle(template.title);
    setMessage(template.message);
    setImageUrl(template.image_url);
    setDeepLink(template.deep_link);
  };

  const handleSendNotification = async () => {
    if (!title || !message) {
      setSendResult({ success: false, message: 'Title and message are required!' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await makeAuthenticatedRequest('/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          store_id: user?.store_id,
          notification_type: notificationType,
          target_audience: targetAudience,
          title,
          message,
          image_url: imageUrl,
          deep_link: deepLink
        })
      });

      if (response.success) {
        setSendResult({
          success: true,
          message: `Notification sent successfully to ${response.recipients_count} recipients!`
        });
        // Reset form after successful send
        setTitle('');
        setMessage('');
        setImageUrl('');
        setDeepLink('');
      } else {
        throw new Error(response.message || 'Failed to send notification');
      }
    } catch (error: any) {
      setSendResult({
        success: false,
        message: error.message || 'Failed to send notification'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Load notification history (to be implemented)
  const loadNotificationHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await makeAuthenticatedRequest(`/notifications?store_id=${user?.store_id}&page=1&limit=10`);
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <RoleGuard 
      requiredPermissions={['manage_notifications']}
      fallback={
        <div className="p-6 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Access denied. You do not have permission to manage notifications.
          </div>
        </div>
      }
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-600">Send customized push notifications to your customers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Predefined Templates */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Predefined Templates</h2>
              <div className="space-y-3">
                {PREDEFINED_TEMPLATES.map((template) => (
                  <div 
                    key={template.id}
                    className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h3 className="font-medium text-gray-900">{template.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Notification Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Create Notification</h2>
              
              {sendResult && (
                <div className={`mb-4 p-3 rounded-md ${sendResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {sendResult.message}
                </div>
              )}

              <div className="grid grid-cols-1 gap-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter notification title"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter notification message"
                  />
                </div>

                <div>
                  <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
                    Image URL (optional)
                  </label>
                  <input
                    type="text"
                    id="image_url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  {imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="h-32 w-32 object-cover rounded-md border border-gray-300"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="notification_type" className="block text-sm font-medium text-gray-700">
                      Notification Type
                    </label>
                    <select
                      id="notification_type"
                      value={notificationType}
                      onChange={(e) => setNotificationType(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {NOTIFICATION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700">
                      Target Audience
                    </label>
                    <select
                      id="target_audience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {AUDIENCE_OPTIONS.map((audience) => (
                        <option key={audience.value} value={audience.value}>
                          {audience.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="deep_link" className="block text-sm font-medium text-gray-700">
                    Deep Link (optional)
                  </label>
                  <select
                    id="deep_link"
                    value={deepLink}
                    onChange={(e) => setDeepLink(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {DEEP_LINK_OPTIONS.map((link) => (
                      <option key={link.value} value={link.value}>
                        {link.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleSendNotification}
                    disabled={isSending}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSending ? 'Sending...' : 'Send Notification'}
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications History Section */}
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notification History</h2>
              {loadingHistory ? (
                <div className="text-center py-4">Loading notification history...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No notifications sent yet</div>
              ) : (
                <div className="space-y-4">
                  {history.map((notification: any, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        <span className="text-sm text-gray-500">{new Date(notification.sent_at).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>Type: {notification.notification_type}</span>
                        <span className="mx-2">•</span>
                        <span>Audience: {notification.target_audience}</span>
                        <span className="mx-2">•</span>
                        <span>Recipients: {notification.recipients_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}