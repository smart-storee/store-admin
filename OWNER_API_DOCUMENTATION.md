# Store Owner API Documentation

## Base URL
```
http://localhost:3000/api/v1/admin
```

---

## 1. Admin Login
**Endpoint:** `POST /auth/login`

**Description:** Admin login with email and password

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@thangaiah.com",
    "password": "Admin@123"
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "user_id": 100,
      "user_name": "Admin",
      "email": "admin@thangaiah.com",
      "store_id": 1,
      "role": "admin",
      "permissions": [
        "view_dashboard",
        "manage_stores",
        "manage_branches",
        "manage_categories",
        "manage_products",
        "manage_orders",
        "manage_users",
        "app_settings",
        "manage_notifications"
      ]
    }
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 2. Refresh Token
**Endpoint:** `POST /auth/refresh-token`

**Description:** Refresh authentication token

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 3. Get Dashboard Summary
**Endpoint:** `GET /dashboard`

**Description:** Get dashboard overview with key metrics

**Headers:**
```json
{
  "Authorization": "Bearer {auth_token}"
}
```

**Query Params:**
```
date_range=today|week|month
store_id=1
```

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard?store_id=1&date_range=today" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_orders": 245,
      "total_revenue": 45000.00,
      "total_customers": 120,
      "active_branches": 3,
      "total_products": 45
    },
    "today_metrics": {
      "orders_today": 12,
      "revenue_today": 3500.00,
      "pending_orders": 3,
      "confirmed_orders": 5,
      "preparing_orders": 2,
      "ready_orders": 1,
      "out_for_delivery": 1,
      "completed_orders": 8,
      "cancelled_orders": 1
    },
    "top_products": [
      {
        "product_id": 1,
        "product_name": "Rasgulla",
        "total_sold": 45,
        "revenue": 6750.00
      },
      {
        "product_id": 5,
        "product_name": "Kaju Barfi",
        "total_sold": 32,
        "revenue": 8960.00
      }
    ],
    "revenue_chart": [
      {
        "date": "2025-11-30",
        "revenue": 3500.00,
        "orders": 12
      }
    ]
  }
}
```

---

## 5. Create Store (Note: This endpoint is intended for super admin use only)
**Endpoint:** `POST /stores`

**Description:** Create a new store

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/stores \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "Thangaiah Sweets",
    "owner_name": "Thangaiah",
    "owner_email": "thangaiah@sweets.com",
    "owner_phone": "9876543210"
  }'
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Store created successfully",
  "data": {
    "store_id": 1,
    "store_name": "Thangaiah Sweets",
    "owner_name": "Thangaiah",
    "created_at": "2025-11-30 10:00:00"
  }
}
```

---

## 6. Update Store
**Endpoint:** `PUT /stores/{store_id}`

**Description:** Update store information

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/stores/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "Thangaiah Sweets Updated",
    "owner_name": "Thangaiah Updated",
    "owner_email": "updated@sweets.com",
    "owner_phone": "9876543299"
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Store updated successfully",
  "data": {
    "store_id": 1,
    "store_name": "Thangaiah Sweets Updated",
    "updated_at": "2025-11-30 11:00:00"
  }
}
```

---

## 7. Get All Branches
**Endpoint:** `GET /branches`

**Description:** Get all branches for a store

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Params:**
```
store_id=1
page=1
limit=10
```

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/branches?store_id=1&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "branch_id": 1,
      "branch_name": "Branch - Indiranagar",
      "address": "123 Main St, Indiranagar",
      "city": "Bangalore",
      "pincode": "560038",
      "phone": "9876543210",
      "latitude": 13.3586,
      "longitude": 77.6404,
      "total_orders": 85,
      "total_revenue": 15000.00,
      "is_active": 1,
      "created_at": "2025-11-20 10:00:00"
    },
    {
      "branch_id": 2,
      "branch_name": "Branch - Koramangala",
      "address": "456 Park St, Koramangala",
      "city": "Bangalore",
      "pincode": "560034",
      "phone": "9876543211",
      "latitude": 12.9352,
      "longitude": 77.6245,
      "total_orders": 95,
      "total_revenue": 17000.00,
      "is_active": 1,
      "created_at": "2025-11-21 10:00:00"
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10
  }
}
```

---

## 8. Create Branch
**Endpoint:** `POST /branches`

**Description:** Create a new branch for store

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/branches \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "branch_name": "Branch - Whitefield",
    "address": "789 Tech St, Whitefield",
    "city": "Bangalore",
    "pincode": "560066",
    "phone": "9876543212",
    "latitude": 12.9698,
    "longitude": 77.7499,
    "delivery_charge": 30.00,
    "surge_fee": 0.00
  }'
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "branch_id": 3,
    "branch_name": "Branch - Whitefield",
    "address": "789 Tech St, Whitefield",
    "created_at": "2025-11-30 10:00:00"
  }
}
```

---

## 9. Update Branch
**Endpoint:** `PUT /branches/{branch_id}`

**Description:** Update branch information

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/branches/3 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "branch_name": "Branch - Whitefield Updated",
    "address": "789 Tech Street, Whitefield",
    "phone": "9876543212",
    "delivery_charge": 35.00,
    "is_active": 1
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Branch updated successfully",
  "data": {
    "branch_id": 3,
    "branch_name": "Branch - Whitefield Updated",
    "updated_at": "2025-11-30 11:00:00"
  }
}
```

---

## 10. Get All Categories
**Endpoint:** `GET /categories`

**Description:** Get all categories for a branch

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Params:**
```
store_id=1
branch_id=1
page=1
limit=10
```

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/categories?store_id=1&branch_id=1&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "category_id": 1,
      "category_name": "Traditional Sweets",
      "category_image": "https://via.placeholder.com/300?text=Traditional+Sweets",
      "description": "Traditional Indian sweets",
      "total_products": 2,
      "is_active": 1,
      "sort_order": 1,
      "created_at": "2025-11-20 10:00:00"
    },
    {
      "category_id": 2,
      "category_name": "Gulab Jamun Varieties",
      "category_image": "https://via.placeholder.com/300?text=Gulab+Jamun",
      "description": "Delicious gulab jamun varieties",
      "total_products": 2,
      "is_active": 1,
      "sort_order": 2,
      "created_at": "2025-11-20 10:00:00"
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10
  }
}
```

---

## 11. Create Category
**Endpoint:** `POST /categories`

**Description:** Create new category for branch

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/categories \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "branch_id": 1,
    "category_name": "Barfis & Fudges",
    "category_image": "https://via.placeholder.com/300?text=Barfis",
    "description": "Premium barfis and fudges",
    "sort_order": 3
  }'
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "category_id": 3,
    "category_name": "Barfis & Fudges",
    "branch_id": 1,
    "created_at": "2025-11-30 10:00:00"
  }
}
```

---

## 12. Update Category
**Endpoint:** `PUT /categories/{category_id}`

**Description:** Update category details

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/categories/3 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "category_name": "Barfis & Fudges Updated",
    "description": "Premium barfis and fudges collection",
    "sort_order": 3,
    "is_active": 1
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "category_id": 3,
    "category_name": "Barfis & Fudges Updated",
    "updated_at": "2025-11-30 11:00:00"
  }
}
```

---

## 13. Get All Products
**Endpoint:** `GET /products`

**Description:** Get all products with filters

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Params:**
```
store_id=1
branch_id=1
category_id=1
page=1
limit=10
search=rasgulla
```

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/products?store_id=1&branch_id=1&category_id=1&page=1&limit=10&search=rasgulla" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "product_id": 1,
      "product_name": "Rasgulla",
      "product_description": "Soft spongy rasgulla in sugar syrup",
      "product_image": "https://via.placeholder.com/300?text=Rasgulla",
      "category_id": 1,
      "category_name": "Traditional Sweets",
      "base_price": 150.00,
      "total_stock": 80,
      "total_sold": 45,
      "is_active": 1,
      "created_at": "2025-11-20 10:00:00"
    },
    {
      "product_id": 2,
      "product_name": "Kheer Kalam",
      "product_description": "Creamy kheer kalam sweet",
      "product_image": "https://via.placeholder.com/300?text=Kheer+Kalam",
      "category_id": 1,
      "category_name": "Traditional Sweets",
      "base_price": 200.00,
      "total_stock": 45,
      "total_sold": 32,
      "is_active": 1,
      "created_at": "2025-11-20 10:00:00"
    }
  ],
  "pagination": {
    "total": 6,
    "page": 1,
    "limit": 10
  }
}
```

---

## 14. Create Product
**Endpoint:** `POST /products`

**Description:** Create new product for branch

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "branch_id": 1,
    "category_id": 1,
    "product_name": "Rasgulla",
    "product_description": "Soft spongy rasgulla in sugar syrup",
    "product_image": "https://via.placeholder.com/300?text=Rasgulla",
    "base_price": 150.00
  }'
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product_id": 1,
    "product_name": "Rasgulla",
    "category_id": 1,
    "base_price": 150.00,
    "created_at": "2025-11-30 10:00:00"
  }
}
```

---

## 15. Update Product
**Endpoint:** `PUT /products/{product_id}`

**Description:** Update product information

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/products/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Rasgulla Premium",
    "product_description": "Premium soft spongy rasgulla",
    "base_price": 160.00,
    "is_active": 1
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product_id": 1,
    "product_name": "Rasgulla Premium",
    "base_price": 160.00,
    "updated_at": "2025-11-30 11:00:00"
  }
}
```

---

## 16. Delete Product
**Endpoint:** `DELETE /products/{product_id}`

**Description:** Delete a product (soft delete)

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/products/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 17. Get Product Variants
**Endpoint:** `GET /products/{product_id}/variants`

**Description:** Get all variants for a product

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/products/1/variants \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "variant_id": 1,
      "product_id": 1,
      "variant_name": "250g",
      "variant_price": 150.00,
      "stock": 50,
      "is_active": 1,
      "created_at": "2025-11-20 10:00:00"
    },
    {
      "variant_id": 2,
      "product_id": 1,
      "variant_name": "500g",
      "variant_price": 280.00,
      "stock": 30,
      "is_active": 1,
      "created_at": "2025-11-20 10:00:00"
    }
  ]
}
```

---

## 18. Create Product Variant
**Endpoint:** `POST /products/{product_id}/variants`

**Description:** Add variant to a product

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/products/1/variants \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "variant_name": "250g",
    "variant_price": 150.00,
    "stock": 50
  }'
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Variant created successfully",
  "data": {
    "variant_id": 1,
    "variant_name": "250g",
    "variant_price": 150.00,
    "stock": 50,
    "created_at": "2025-11-30 10:00:00"
  }
}
```

---

## 19. Update Product Variant
**Endpoint:** `PUT /products/variants/{variant_id}`

**Description:** Update variant details and stock

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/products/variants/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "variant_name": "250g Premium",
    "variant_price": 160.00,
    "stock": 45,
    "is_active": 1
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Variant updated successfully",
  "data": {
    "variant_id": 1,
    "variant_name": "250g Premium",
    "variant_price": 160.00,
    "stock": 45,
    "updated_at": "2025-11-30 11:00:00"
  }
}
```

---

## 20. Get All Orders
**Endpoint:** `GET /orders`

**Description:** Get all orders with filters

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Params:**
```
store_id=1
branch_id=1
status=pending|confirmed|preparing|ready|out_for_delivery|delivered|cancelled
payment_status=pending|completed|failed
date_from=2025-11-01
date_to=2025-11-30
page=1
limit=10
```

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/orders?store_id=1&branch_id=1&status=out_for_delivery&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "order_id": 1002,
      "order_number": "TS-2025-0002",
      "customer_name": "John Doe",
      "customer_phone": "9876543210",
      "branch_id": 1,
      "branch_name": "Branch - Indiranagar",
      "order_status": "out_for_delivery",
      "payment_method": "cod",
      "payment_status": "pending",
      "subtotal": 500.00,
      "delivery_charge": 20.00,
      "platform_fee": 10.00,
      "total_amount": 530.00,
      "items_count": 2,
      "created_at": "2025-11-30 14:30:00"
    },
    {
      "order_id": 1001,
      "order_number": "TS-2025-0001",
      "customer_name": "Jane Smith",
      "customer_phone": "9876543211",
      "branch_id": 1,
      "branch_name": "Branch - Indiranagar",
      "order_status": "delivered",
      "payment_method": "cod",
      "payment_status": "completed",
      "subtotal": 300.00,
      "delivery_charge": 20.00,
      "platform_fee": 10.00,
      "total_amount": 330.00,
      "items_count": 1,
      "created_at": "2025-11-28 16:00:00"
    }
  ],
  "pagination": {
    "total": 245,
    "page": 1,
    "limit": 10
  }
}
```

---

## 21. Get Order Details
**Endpoint:** `GET /orders/{order_id}`

**Description:** Get detailed order information

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/orders/1002 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "order_id": 1002,
    "order_number": "TS-2025-0002",
    "customer": {
      "cust_id": 1,
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com"
    },
    "branch_id": 1,
    "branch_name": "Branch - Indiranagar",
    "order_status": "out_for_delivery",
    "payment_method": "cod",
    "payment_status": "pending",
    "items": [
      {
        "product_name": "Rasgulla",
        "variant_name": "250g",
        "quantity": 2,
        "price": 150.00,
        "total": 300.00
      },
      {
        "product_name": "Kheer Kalam",
        "variant_name": "300g",
        "quantity": 1,
        "price": 200.00,
        "total": 200.00
      }
    ],
    "delivery_address": "123 Main Street, Apartment 4B, Bangalore 560038",
    "delivery_notes": "Ring the doorbell twice",
    "subtotal": 500.00,
    "delivery_charge": 20.00,
    "platform_fee": 10.00,
    "total_amount": 530.00,
    "status_timeline": [
      {
        "status": "pending",
        "timestamp": "2025-11-30 14:30:00"
      },
      {
        "status": "confirmed",
        "timestamp": "2025-11-30 14:35:00"
      },
      {
        "status": "preparing",
        "timestamp": "2025-11-30 14:45:00"
      },
      {
        "status": "ready",
        "timestamp": "2025-11-30 15:15:00"
      },
      {
        "status": "out_for_delivery",
        "timestamp": "2025-11-30 15:25:00"
      }
    ],
    "created_at": "2025-11-30 14:30:00"
  }
}
```

---

## 22. Update Order Status
**Endpoint:** `PUT /orders/{order_id}/status`

**Description:** Update order status (workflow management)

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/orders/1002/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "order_status": "preparing",
    "notes": "Started preparing the order"
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order_id": 1002,
    "order_number": "TS-2025-0002",
    "order_status": "preparing",
    "updated_at": "2025-11-30 15:00:00"
  }
}
```

---

## 23. Update Payment Status
**Endpoint:** `PUT /orders/{order_id}/payment-status`

**Description:** Update payment status

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/orders/1002/payment-status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": "completed"
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Payment status updated",
  "data": {
    "order_id": 1002,
    "payment_status": "completed",
    "updated_at": "2025-11-30 15:30:00"
  }
}
```

---

## 24. Get All Customers
**Endpoint:** `GET /customers`

**Description:** Get list of all customers

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Params:**
```
store_id=1
branch_id=1
search=john
page=1
limit=10
```

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/customers?store_id=1&branch_id=1&search=john&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "cust_id": 1,
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com",
      "total_orders": 5,
      "total_spent": 1650.00,
      "profile_picture": null,
      "created_at": "2025-11-20 10:00:00"
    },
    {
      "cust_id": 2,
      "name": "Jane Smith",
      "phone": "9876543211",
      "email": "jane@example.com",
      "total_orders": 3,
      "total_spent": 990.00,
      "profile_picture": null,
      "created_at": "2025-11-21 11:00:00"
    }
  ],
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 10
  }
}
```

---

## 25. Get Customer Details
**Endpoint:** `GET /customers/{cust_id}`

**Description:** Get detailed customer profile and order history

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/customers/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "cust_id": 1,
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com",
      "profile_picture": null,
      "created_at": "2025-11-20 10:00:00"
    },
    "stats": {
      "total_orders": 5,
      "total_spent": 1650.00,
      "average_order_value": 330.00,
      "last_order_date": "2025-11-30 14:30:00"
    },
    "addresses": [
      {
        "cust_address_id": 1,
        "label": "Home",
        "address_line": "123 Main Street, Apartment 4B",
        "city": "Bangalore",
        "pincode": "560038",
        "is_default": 1
      }
    ],
    "orders": [
      {
        "order_id": 1002,
        "order_number": "TS-2025-0002",
        "order_status": "delivered",
        "total_amount": 530.00,
        "created_at": "2025-11-30 14:30:00"
      }
    ]
  }
}
```

---

## 26. Block/Unblock Customer
**Endpoint:** `PUT /customers/{cust_id}/status`

**Description:** Block or unblock a customer

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/customers/1/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Customer status updated",
  "data": {
    "cust_id": 1,
    "name": "John Doe",
    "status": "active"
  }
}
```

---

## 27. Get App Settings
**Endpoint:** `GET /app-settings`

**Description:** Get app configuration settings

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Params:**
```
store_id=1
```

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/app-settings?store_id=1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "app_config_id": 1,
    "store_id": 1,
    "app_name": "Thangaiah Sweets",
    "sub_title": "Your sweet treats delivered fresh",
    "logo_url": "https://t3.ftcdn.net/jpg/00/56/72/42/240_F_56724249_jyGbtnZh4k9kBE5KtcfnPuSTEhU4mCxM.jpg",
    "primary_color": "F59E0B",
    "secondary_color": "cd0a7b",
    "min_order_amount": 100.00,
    "platform_fee": 10.00,
    "is_cod_enabled": 1,
    "is_online_payment_enabled": 0,
    "maintenance_mode": 0,
    "created_at": "2025-11-30 12:09:11"
  }
}
```

---

## 28. Update App Settings
**Endpoint:** `PUT /app-settings`

**Description:** Update app configuration

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/app-settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "app_name": "Thangaiah Sweets Updated",
    "sub_title": "Fresh sweet treats delivered to your doorstep",
    "primary_color": "F59E0B",
    "secondary_color": "cd0a7b",
    "min_order_amount": 100.00,
    "platform_fee": 10.00,
    "is_cod_enabled": 1,
    "is_online_payment_enabled": 1
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "App settings updated successfully",
  "data": {
    "app_config_id": 1,
    "app_name": "Thangaiah Sweets Updated",
    "updated_at": "2025-11-30 16:00:00"
  }
}
```

---

## 29. Toggle Maintenance Mode
**Endpoint:** `PUT /app-settings/maintenance-mode`

**Description:** Enable or disable app maintenance mode

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/app-settings/maintenance-mode \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "maintenance_mode": 1,
    "maintenance_message": "We are updating our system. Please try again later."
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Maintenance mode updated",
  "data": {
    "maintenance_mode": 1,
    "maintenance_message": "We are updating our system. Please try again later."
  }
}
```

---

## 30. Send Push Notification
**Endpoint:** `POST /notifications/send`

**Description:** Send push notification to users

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/notifications/send \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "notification_type": "promotional",
    "target_audience": "all|new_users|frequent_customers",
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
    "sent_at": "2025-11-30 16:30:00"
  }
}
```

---

## 31. Get Notification History
**Endpoint:** `GET /notifications`

**Description:** Get notification history

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Params:**
```
store_id=1
page=1
limit=10
```

**Request:**
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
      "recipients_count": 120,
      "sent_at": "2025-11-30 16:30:00"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10
  }
}
```

---

## 32. Manage Staff/Users
**Endpoint:** `GET /users`

**Description:** Get all staff users for store

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Params:**
```
store_id=1
role=admin|staff|delivery
page=1
limit=10
```

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?store_id=1&role=admin&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 100,
      "user_name": "Admin",
      "email": "admin@thangaiah.com",
      "phone": "9876543210",
      "role": "admin",
      "status": "active",
      "created_at": "2025-11-20 10:00:00"
    },
    {
      "user_id": 101,
      "user_name": "Staff Member",
      "email": "staff@thangaiah.com",
      "phone": "9876543211",
      "role": "staff",
      "status": "active",
      "created_at": "2025-11-25 11:00:00"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

---

## 33. Create Staff User
**Endpoint:** `POST /users`

**Description:** Add new staff member

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "user_name": "New Staff",
    "email": "newstaff@thangaiah.com",
    "phone": "9876543212",
    "password": "password@123",
    "role": "staff"
  }'
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Staff user created successfully",
  "data": {
    "user_id": 102,
    "user_name": "New Staff",
    "email": "newstaff@thangaiah.com",
    "role": "staff",
    "created_at": "2025-11-30 16:00:00"
  }
}
```

---

## 34. Update Staff User
**Endpoint:** `PUT /users/{user_id}`

**Description:** Update staff user details

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/102 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Updated Staff",
    "email": "updated@thangaiah.com",
    "role": "staff",
    "status": "active"
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user_id": 102,
    "user_name": "Updated Staff",
    "email": "updated@thangaiah.com",
    "updated_at": "2025-11-30 16:30:00"
  }
}
```

---

## 35. Delete Staff User
**Endpoint:** `DELETE /users/{user_id}`

**Description:** Delete/deactivate staff user

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/users/102 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 36. Get Reports
**Endpoint:** `GET /reports`

**Description:** Generate business reports

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Query Params:**
```
store_id=1
branch_id=1
report_type=sales|orders|customers|products
date_from=2025-11-01
date_to=2025-11-30
```

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/reports?store_id=1&branch_id=1&report_type=sales&date_from=2025-11-01&date_to=2025-11-30" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "report_type": "sales",
    "period": "2025-11-01 to 2025-11-30",
    "summary": {
      "total_orders": 245,
      "total_revenue": 45000.00,
      "average_order_value": 183.67,
      "total_customers": 120,
      "total_items_sold": 485
    },
    "daily_breakdown": [
      {
        "date": "2025-11-30",
        "orders": 12,
        "revenue": 3500.00,
        "customers": 10
      }
    ],
    "top_products": [
      {
        "product_name": "Rasgulla",
        "quantity_sold": 85,
        "revenue": 12750.00
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid input data",
  "errors": {
    "email": "Email already exists"
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
  "message": "Resource not found",
  "code": "NOT_FOUND"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Resource already exists",
  "code": "CONFLICT"
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

---

## Rate Limiting
- Rate limit: 200 requests per minute per admin
- Headers returned:
  - `X-RateLimit-Limit`: 200
  - `X-RateLimit-Remaining`: 195
  - `X-RateLimit-Reset`: 1700000000

---

## Authentication
All endpoints require Bearer token authentication via Authorization header. Tokens expire in 24 hours. Use refresh token to get new access token.

**Refresh Token Endpoint:**
```
POST /auth/refresh-token
```

**Request:**
```json
{
  "refresh_token": "{refresh_token}"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "auth_token": "{new_auth_token}"
  }
}
```