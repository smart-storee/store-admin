# SaaS Store Admin Portal

A comprehensive admin portal for managing multi-branch store operations, products, orders, customers, and more.

## Table of Contents

- [Features](#features)
- [Role-Based Access Control](#role-based-access-control)
- [Screen Access Matrix](#screen-access-matrix)
- [Permission System](#permission-system)
- [Feature Flags](#feature-flags)
- [Database Tables](#database-tables)
- [Getting Started](#getting-started)
- [Technology Stack](#technology-stack)

## Features

### Core Features

1. **Dashboard**

   - Real-time metrics and analytics
   - Today's summary (orders, revenue, customers)
   - Revenue charts and trends
   - Top products performance
   - Recent orders overview

2. **Branches Management**

   - Create, edit, and manage store branches
   - Branch-specific settings (delivery charges, surge fees)
   - Manager assignment per branch
   - Branch performance metrics

3. **Product Management**

   - **Categories**: Organize products into categories
   - **Products**: Create and manage products with images, descriptions, pricing
   - **Product Variants**: Manage different sizes, options, and variants
   - Stock management
   - Best seller flags
   - Vegetarian/non-vegetarian tags

4. **Orders Management**

   - View all orders with filtering and search
   - Order details with timeline
   - Order status management (pending, confirmed, preparing, ready, out for delivery, delivered, cancelled)
   - Payment status tracking
   - Order editing capabilities

5. **Coupons Management**

   - Create percentage or fixed discount coupons
   - Set usage limits (per user and total)
   - Date range management
   - Branch-specific or store-wide coupons
   - Usage tracking and analytics

6. **Customers Management**

   - Customer database with contact information
   - Order history per customer
   - Total spent tracking
   - Customer profile management

7. **Users/Employees Management**

   - Create and manage admin users
   - Role assignment (owner, manager)
   - Permission-based access control
   - User status management

8. **Notifications**

   - Push notification management
   - Notification history
   - Bulk notification sending

9. **Communication Logs**

   - SMS, Email, WhatsApp communication history
   - OTP tracking
   - Communication analytics

10. **Home Configuration**

    - App branding (logo, colors, name)
    - Home screen customization
    - App settings management

11. **Reports**

    - Sales reports
    - Revenue analytics
    - Order reports
    - Export capabilities (PDF)

12. **Settings**

    - Store configuration
    - Payment settings (COD, online payment)
    - Maintenance mode
    - Platform fee configuration
    - Minimum order amount

13. **API Logs** (Developer)

    - API request/response logging
    - Error tracking
    - Performance monitoring

14. **Billing**
    - Subscription management
    - Billing status tracking
    - Payment history

## Role-Based Access Control

### Roles

1. **Owner**

   - Full access to all features (subject to permissions)
   - Can manage all branches
   - Can create and manage other users
   - Access to billing and reports

2. **Manager**
   - Limited access based on assigned permissions
   - Typically branch-specific access
   - Cannot manage other users (unless granted permission)

### Access Control Mechanism

The system uses a three-tier access control:

1. **Role-based**: Checks user role (owner/manager)
2. **Permission-based**: Checks specific permissions assigned to user
3. **Feature-based**: Checks if feature is enabled for the store

All three checks must pass for access to be granted.

## Screen Access Matrix

| Screen/Page           | Route                         | Required Permission                    | Required Role  | Feature Flag                 | Notes                                   |
| --------------------- | ----------------------------- | -------------------------------------- | -------------- | ---------------------------- | --------------------------------------- |
| Dashboard             | `/dashboard`                  | `view_dashboard`                       | owner, manager | -                            | Overview of store metrics               |
| Branches List         | `/branches`                   | `manage_branches`                      | owner, manager | `branches_enabled`           | View all branches                       |
| Branch Detail         | `/branches/[id]`              | `manage_branches`                      | owner, manager | `branches_enabled`           | View branch details                     |
| Create Branch         | `/branches/new`               | `manage_branches`                      | owner, manager | `branches_enabled`           | Create new branch                       |
| Edit Branch           | `/branches/[id]/edit`         | `manage_branches`                      | owner, manager | `branches_enabled`           | Edit branch                             |
| Business Setup Flow   | `/business-setup-flow`        | `manage_categories`, `manage_products` | owner, manager | `categories_enabled`         | Quick setup for categories and products |
| Categories List       | `/categories`                 | `manage_categories`                    | owner, manager | `categories_enabled`         | View all categories                     |
| Category Detail       | `/categories/[id]`            | `manage_categories`                    | owner, manager | `categories_enabled`         | View category details                   |
| Create Category       | `/categories/new`             | `manage_categories`                    | owner, manager | `categories_enabled`         | Create new category                     |
| Edit Category         | `/categories/[id]/edit`       | `manage_categories`                    | owner, manager | `categories_enabled`         | Edit category                           |
| Products List         | `/products`                   | `manage_products`                      | owner, manager | `products_enabled`           | View all products                       |
| Product Detail        | `/products/[id]`              | `manage_products`                      | owner, manager | `products_enabled`           | View product details                    |
| Create Product        | `/products/new`               | `manage_products`                      | owner, manager | `products_enabled`           | Create new product                      |
| Edit Product          | `/products/[id]/edit`         | `manage_products`                      | owner, manager | `products_enabled`           | Edit product                            |
| Product Variants List | `/product-variants`           | `manage_products`                      | owner, manager | `products_enabled`           | View all variants                       |
| Variant Detail        | `/product-variants/[id]`      | `manage_products`                      | owner, manager | `products_enabled`           | View variant details                    |
| Create Variant        | `/product-variants/new`       | `manage_products`                      | owner, manager | `products_enabled`           | Create new variant                      |
| Edit Variant          | `/product-variants/[id]/edit` | `manage_products`                      | owner, manager | `products_enabled`           | Edit variant                            |
| Orders List           | `/orders`                     | `manage_orders`                        | owner, manager | `orders_enabled`             | View all orders                         |
| Order Detail          | `/orders/[id]`                | -                                      | `owner`        | `orders_enabled`             | View order details (owner only)         |
| Edit Order            | `/orders/[id]/edit`           | `manage_orders`                        | owner, manager | `orders_enabled`             | Edit order status                       |
| Coupons List          | `/coupons`                    | `manage_coupon`                        | owner, manager | `coupon_codes_enabled`       | View all coupons                        |
| Create Coupon         | `/coupons/new`                | -                                      | `owner`        | `coupon_codes_enabled`       | Create coupon (owner only)              |
| Coupon Detail         | `/coupons/[id]`               | `manage_coupon`                        | owner, manager | `coupon_codes_enabled`       | View coupon details                     |
| Edit Coupon           | `/coupons/[id]/edit`          | `manage_coupon`                        | owner, manager | `coupon_codes_enabled`       | Edit coupon                             |
| Coupon Usage          | `/coupons/[id]/usage`         | -                                      | `owner`        | `coupon_codes_enabled`       | View usage analytics (owner only)       |
| Customers List        | `/customers`                  | `manage_customers`                     | owner, manager | `customers_enabled`          | View all customers                      |
| Customer Detail       | `/customers/[id]`             | `manage_customers`                     | owner, manager | `customers_enabled`          | View customer details                   |
| Users List            | `/users`                      | `manage_users`                         | owner, manager | `employees_enabled`          | View all users                          |
| User Detail           | `/users/[id]`                 | `manage_users`                         | owner, manager | `employees_enabled`          | View user details                       |
| Create User           | `/users/new`                  | `manage_users`                         | owner, manager | `employees_enabled`          | Create new user                         |
| Edit User             | `/users/[id]/edit`            | `manage_users`                         | owner, manager | `employees_enabled`          | Edit user                               |
| Notifications         | `/notifications`              | `manage_notifications`                 | owner, manager | `notifications_enabled`      | Manage notifications                    |
| Communication Logs    | `/communication-logs`         | `view_reports`                         | owner, manager | `communication_logs_enabled` | View communication history              |
| Home Config           | `/home-config`                | `app_settings`                         | owner, manager | `home_config_enabled`        | Configure home screen                   |
| Reports               | `/reports`                    | `view_reports`                         | owner, manager | `reports_enabled`            | View analytics and reports              |
| Settings              | `/settings`                   | `app_settings`                         | owner, manager | `app_settings_enabled`       | Store settings                          |
| API Logs              | `/api-logs`                   | `view_dashboard`                       | owner, manager | -                            | Developer tool for API debugging        |
| Billing               | `/billing`                    | `view_reports`                         | owner, manager | `billings_enabled`           | Billing and subscription                |

## Permission System

### Available Permissions

Permissions are stored in the `permissions` table and assigned to users through role-permission mapping.

| Permission Code        | Permission Name      | Description                                |
| ---------------------- | -------------------- | ------------------------------------------ |
| `view_dashboard`       | View Dashboard       | Access to dashboard overview               |
| `manage_branches`      | Manage Branches      | Create, edit, delete branches              |
| `manage_categories`    | Manage Categories    | Create, edit, delete categories            |
| `manage_products`      | Manage Products      | Create, edit, delete products and variants |
| `manage_orders`        | Manage Orders        | View and manage orders                     |
| `manage_coupon`        | Manage Coupons       | Create, edit, delete coupons               |
| `manage_customers`     | Manage Customers     | View and manage customer data              |
| `manage_users`         | Manage Users         | Create, edit, delete admin users           |
| `manage_notifications` | Manage Notifications | Send and manage notifications              |
| `view_reports`         | View Reports         | Access to reports and analytics            |
| `app_settings`         | App Settings         | Configure app and store settings           |

### Permission Assignment

- Permissions are assigned to roles (owner/manager)
- Users inherit permissions from their role
- Permissions can be customized per user (stored in `admin_users` table)
- Permissions are checked via API: `/permissions` and `/admin-permissions/{admin_id}`

## Feature Flags

Feature flags control which features are available for a store. They are stored in the `stores` table and checked before rendering features.

| Feature Flag                 | Description                      | Default |
| ---------------------------- | -------------------------------- | ------- |
| `branches_enabled`           | Enable branch management         | false   |
| `categories_enabled`         | Enable category management       | false   |
| `products_enabled`           | Enable product management        | false   |
| `orders_enabled`             | Enable order management          | false   |
| `notifications_enabled`      | Enable notification system       | false   |
| `communication_logs_enabled` | Enable communication logs        | false   |
| `billings_enabled`           | Enable billing features          | false   |
| `customers_enabled`          | Enable customer management       | false   |
| `employees_enabled`          | Enable user/employee management  | false   |
| `reports_enabled`            | Enable reports and analytics     | false   |
| `home_config_enabled`        | Enable home screen configuration | false   |
| `coupon_codes_enabled`       | Enable coupon management         | false   |
| `app_settings_enabled`       | Enable app settings              | false   |

### Feature Flag Behavior

- Features are fetched from `/stores/{store_id}` endpoint
- Features can be boolean (`true`/`false`) or integer (`1`/`0`)
- Billing status affects feature access (expired billing may disable features)
- Features are checked using `FeatureGuard` component

## Database Tables

### Core Tables

1. **stores**

   - `store_id` (PK)
   - `store_name`
   - `owner_name`, `owner_email`, `owner_phone`
   - Feature flags (branches_enabled, products_enabled, etc.)
   - `billing_status`, `billing_paid_until`
   - `created_at`, `updated_at`

2. **branches**

   - `branch_id` (PK)
   - `store_id` (FK)
   - `branch_name`, `branch_code`
   - `address`, `city`, `state`, `country`, `pincode`
   - `latitude`, `longitude`
   - `phone`, `email`
   - `delivery_charge`, `surge_fee`
   - `manager_name`, `manager_phone`, `manager_email`
   - `is_active`
   - `created_at`, `updated_at`

3. **categories**

   - `category_id` (PK)
   - `store_id` (FK)
   - `branch_id` (FK)
   - `category_name`
   - `category_image`
   - `description`
   - `sort_order`
   - `is_active`
   - `created_at`, `updated_at`

4. **products**

   - `product_id` (PK)
   - `store_id` (FK)
   - `branch_id` (FK)
   - `category_id` (FK)
   - `product_name`
   - `product_description`
   - `product_image`
   - `base_price`
   - `total_stock`, `total_sold`
   - `serves_count`
   - `is_vegetarian`, `is_bestseller`
   - `is_active`
   - `created_at`, `updated_at`

5. **product_variants**

   - `variant_id` (PK)
   - `product_id` (FK)
   - `variant_name`
   - `variant_price`
   - `variant_description`
   - `variant_image`
   - `sku`, `barcode`
   - `stock`
   - `is_active`
   - `created_at`, `updated_at`

6. **orders**

   - `order_id` (PK)
   - `order_number`
   - `store_id` (FK)
   - `branch_id` (FK)
   - `customer_id` (FK)
   - `order_status`
   - `payment_method`, `payment_status`
   - `delivery_address`, `delivery_landmark`, `delivery_notes`
   - `subtotal`, `delivery_charge`, `discount_amount`, `platform_fee`, `total_amount`
   - `coupon_id` (FK)
   - `created_at`, `updated_at`

7. **order_items**

   - `item_id` (PK)
   - `order_id` (FK)
   - `product_id` (FK)
   - `variant_id` (FK)
   - `quantity`
   - `price`, `total`
   - `notes`
   - `created_at`

8. **coupons**

   - `coupon_id` (PK)
   - `store_id` (FK)
   - `branch_id` (FK, nullable)
   - `coupon_code`
   - `coupon_type` (percentage/fixed)
   - `discount_value`
   - `min_order_amount`, `max_discount_amount`
   - `usage_limit_per_user`, `total_usage_limit`
   - `used_count`
   - `start_date`, `end_date`
   - `is_active`
   - `created_at`, `updated_at`

9. **customers**

   - `cust_id` (PK)
   - `name`, `phone`, `email`
   - `profile_picture`
   - `address`, `city`, `state`, `pincode`
   - `total_orders`, `total_spent`
   - `created_at`, `updated_at`

10. **admin_users**

    - `user_id` (PK)
    - `store_id` (FK)
    - `branch_id` (FK, nullable)
    - `name`, `email`, `phone`
    - `role` (owner/manager)
    - `status` (active/inactive)
    - `permissions` (JSON array or stored in separate table)
    - `created_at`, `last_login_at`

11. **permissions**

    - `permission_id` (PK)
    - `permission_code` (unique)
    - `permission_name`
    - `permission_description`
    - `feature_group`
    - `store_enabled`

12. **app_config**
    - `app_config_id` (PK)
    - `store_id` (FK)
    - `app_name`, `sub_title`
    - `logo_url`
    - `primary_color`, `secondary_color`
    - `min_order_amount`
    - `platform_fee`
    - `is_cod_enabled`, `is_online_payment_enabled`
    - `maintenance_mode`, `maintenance_message`
    - `created_at`, `updated_at`

### Access Control Tables

- **role_permissions** (if separate table exists)

  - Maps roles to permissions
  - `role_id`, `permission_id`

- **user_permissions** (if separate table exists)
  - Custom permissions per user
  - `user_id`, `permission_id`

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Backend API server running

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd saas-store-admin-portal
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run development server

```bash
npm run dev
```

The application will be available at `http://localhost:3002`

### Environment Variables

See `ENV_SETUP.md` for detailed environment configuration.

### Build for Production

```bash
npm run build
npm start
```

## Technology Stack

- **Framework**: Next.js 16.0.7
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React, React Icons
- **Charts**: Recharts
- **PDF Export**: jsPDF, jspdf-autotable
- **Date Handling**: date-fns
- **Utilities**: clsx, tailwind-merge

## Architecture

### Access Control Flow

1. User logs in → Receives auth token and user data (including role)
2. App loads → Fetches:
   - Available permissions from `/permissions`
   - User-specific permissions from `/admin-permissions/{admin_id}`
   - Store features from `/stores/{store_id}`
3. Navigation rendering → Filters menu items based on:
   - Feature flags (is feature enabled?)
   - User permissions (does user have required permission?)
   - User role (is role allowed?)
4. Page rendering → Each page uses:
   - `FeatureGuard` to check feature flag
   - `RoleGuard` to check role and permissions
   - `PermissionGuard` for granular permission checks

### Component Structure

- **Contexts**:

  - `AuthContext`: User authentication and session
  - `StoreContext`: Store information
  - `ThemeContext`: Dark/light mode
  - `PermissionsContext`: Permissions and features

- **Guards**:

  - `RoleGuard`: Role and permission-based access
  - `FeatureGuard`: Feature flag-based access
  - `PermissionGuard`: Granular permission checks

- **Layouts**:
  - `AdminLayout`: Main layout with sidebar navigation
  - `ProtectedRouteWrapper`: Route protection wrapper

## Notes

- All console logs are removed in production builds (configured in `next.config.ts`)
- Images are stored in `src/assets/images` (not publicly accessible)
- API calls are logged via `apiLogger` utility
- The system supports multi-branch operations with branch-specific data filtering
- Billing status affects feature availability

## Support

For API documentation, see:

- `OWNER_API_DOCUMENTATION.md` (if available)
- `src/app/(protected)/notifications/API_DOCUMENTATION.md`
