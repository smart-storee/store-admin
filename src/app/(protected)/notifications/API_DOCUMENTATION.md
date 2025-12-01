# Push Notifications API Documentation

## 1. Send Push Notification
**Endpoint:** `POST /notifications/send`

**Description:** Send push notification to users

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "store_id": 1,
  "notification_type": "promotional|transactional|alert|news",
  "target_audience": "all|new_users|frequent_customers|inactive_users",
  "title": "Notification Title",
  "message": "Notification Message",
  "image_url": "https://example.com/image.jpg",
  "deep_link": "home|products|categories|offers|cart|profile",
  "scheduled_at": "2025-12-01 10:00:00" // Optional - for scheduled notifications
}
```

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/admin/notifications/send" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "notification_type": "promotional",
    "target_audience": "all",
    "title": "Special Offer on Rasgulla",
    "message": "Get 20% off on Rasgulla this weekend",
    "image_url": "https://via.placeholder.com/300",
    "deep_link": "product:1"
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "notification_id": 1,
    "recipients_count": 120,
    "sent_at": "2025-12-01 10:30:00"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "title": "Title is required",
    "message": "Message is required"
  }
}
```

## 2. Get Notification History
**Endpoint:** `GET /notifications`

**Description:** Get notification history with optional filters

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Parameters:**
```
store_id=1
page=1
limit=10
notification_type=promotional // Optional: promotional, transactional, alert, news
start_date=2025-12-01 // Optional: ISO format
end_date=2025-12-07 // Optional: ISO format
```

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/notifications?store_id=1&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "notification_id": 1,
      "title": "Special Offer on Rasgulla",
      "message": "Get 20% off on Rasgulla this weekend",
      "notification_type": "promotional",
      "target_audience": "all",
      "image_url": "https://via.placeholder.com/300",
      "deep_link": "product:1",
      "recipients_count": 120,
      "status": "sent",
      "sent_at": "2025-12-01 10:30:00"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10
  }
}
```

## 3. Get Notification Details
**Endpoint:** `GET /notifications/{notification_id}`

**Description:** Get detailed information about a specific notification

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/notifications/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "notification_id": 1,
    "title": "Special Offer on Rasgulla",
    "message": "Get 20% off on Rasgulla this weekend",
    "notification_type": "promotional",
    "target_audience": "all",
    "image_url": "https://via.placeholder.com/300",
    "deep_link": "product:1",
    "recipients_count": 120,
    "status": "sent",
    "delivery_stats": {
      "delivered": 115,
      "opened": 89,
      "clicked": 32,
      "failed": 5
    },
    "sent_at": "2025-12-01 10:30:00"
  }
}
```

## 4. Schedule Notification
**Endpoint:** `POST /notifications/schedule`

**Description:** Schedule a notification to be sent at a later time

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "store_id": 1,
  "notification_type": "promotional",
  "target_audience": "all",
  "title": "Tomorrow's Special Offer",
  "message": "Don't miss our special offer tomorrow!",
  "image_url": "https://via.placeholder.com/300",
  "deep_link": "offers",
  "scheduled_at": "2025-12-02 09:00:00"
}
```

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/admin/notifications/schedule" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "notification_type": "promotional",
    "target_audience": "all",
    "title": "Tomorrow's Special Offer",
    "message": "Don\'t miss our special offer tomorrow!",
    "image_url": "https://via.placeholder.com/300",
    "deep_link": "offers",
    "scheduled_at": "2025-12-02 09:00:00"
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Notification scheduled successfully",
  "data": {
    "notification_id": 2,
    "title": "Tomorrow's Special Offer",
    "scheduled_at": "2025-12-02 09:00:00",
    "status": "scheduled"
  }
}
```

## 5. Cancel Scheduled Notification
**Endpoint:** `PUT /notifications/{notification_id}/cancel`

**Description:** Cancel a scheduled notification

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request Example:**
```bash
curl -X PUT "http://localhost:3000/api/v1/admin/notifications/2/cancel" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Notification cancelled successfully",
  "data": {
    "notification_id": 2,
    "status": "cancelled"
  }
}
```

## 6. Get Push Notification Statistics
**Endpoint:** `GET /notifications/stats`

**Description:** Get statistics for push notifications

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Parameters:**
```
store_id=1
start_date=2025-11-01
end_date=2025-11-30
```

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/notifications/stats?store_id=1&start_date=2025-11-01&end_date=2025-11-30" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "total_sent": 25,
    "total_delivered": 24,
    "total_opened": 18,
    "open_rate": "75%",
    "click_rate": "25%",
    "most_efficient_time": "10:00 AM",
    "best_performing_notification": {
      "title": "Weekly Special Offer",
      "delivery_rate": "96%",
      "open_rate": "82%"
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid input data",
  "errors": {
    "title": "Title is required",
    "target_audience": "Target audience must be one of: all, new_users, frequent_customers, inactive_users"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access",
  "code": "UNAUTHORIZED"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions",
  "code": "FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Notification not found",
  "code": "NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "code": "SERVER_ERROR"
}
```

## Notification Content Guidelines

### Title
- Maximum 40 characters
- Should be engaging and clear

### Message
- Maximum 120 characters
- Should be concise and actionable

### Image
- Recommended dimensions: 300x300 pixels
- Supported formats: JPEG, PNG, WEBP
- Maximum size: 2MB

### Deep Linking Options
- `home`: Navigate to home screen
- `products`: Navigate to products page
- `categories`: Navigate to categories page
- `offers`: Navigate to offers page
- `cart`: Navigate to cart page
- `profile`: Navigate to user profile
- `custom`: Custom deep link (e.g., `product:1`, `category:electronics`)

## Audience Segmentation
- `all`: All registered users
- `new_users`: Users who joined in the last 30 days
- `frequent_customers`: Users with more than 5 orders
- `inactive_users`: Users who haven't ordered in the last 60 days