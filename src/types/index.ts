import { ReactNode } from "react";

// Next.js page with layout type
export type NextPageWithLayout<P = {}, IP = P> = React.FC<P> & {
  getLayout?: (page: ReactNode) => ReactNode;
};

// User types
export interface User {
  user_id: number;
  user_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  branch_id?: number;
  branch_name?: string;
  created_at: string;
  last_login_at?: string;
  permissions: string[];
}

export interface AdminUser {
  user_id: number;
  name: string;
  email: string;
  store_id: number;
  role: string;
  permissions: string[];
  status: string;
  phone: string;
  created_at: string;
  store_name: string;
  branch_id?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    auth_token: string;
    refresh_token: string;
    admin: AdminUser;
  };
}

// Store types
export interface Store {
  store_id: number;
  store_name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  total_branches: number;
  total_customers: number;
  total_revenue: number;
  is_active: number;
  created_at: string;
}

export interface CreateStoreRequest {
  store_name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
}

// Branch types
export interface Branch {
  branch_id: number;
  branch_name: string;
  branch_code?: string;
  branch_email?: string;
  address: string;
  address_line1?: string;
  address_line2?: string;
  city: string;
  state?: string;
  country?: string;
  pincode: string;
  phone: string;
  latitude: number;
  longitude: number;
  total_orders: number;
  total_revenue: number;
  is_active: number;
  created_at: string;
  store_id: number;
  surge_fee: number;
  delivery_charge: number;

  // Manager information
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;

  // Additional properties that might be used in the form
  [key: string]: any; // This allows for any additional properties that might be needed
}

export interface CreateBranchRequest {
  store_id: number;
  branch_name: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  latitude: number;
  longitude: number;
  delivery_charge: number;
  surge_fee: number;
}

// Category types
export interface Category {
  category_id: number;
  category_name: string;
  category_image: string;
  description: string;
  total_products: number;
  is_active: number;
  sort_order: number;
  created_at: string;

  // Additional properties for display
  store_id?: number;
  store_name?: string;
  branch_id?: number;
  branch_name?: string;

  // Allow for any additional properties that might come from the API
  [key: string]: any;
}

export interface CreateCategoryRequest {
  store_id: number;
  branch_id: number;
  category_name: string;
  category_image: string;
  description: string;
  sort_order: number;
}

// Product types
export interface Product {
  product_id: number;
  product_name: string;
  product_description: string;
  product_image: string;
  category_id: number;
  category_name: string;
  base_price: number;
  uom_id?: number;
  uom_name?: string;
  total_stock: number;
  total_sold: number;
  is_active: number;
  branch_id?: number;
  branch_name?: string;
  created_at: string;
  serves_count?: number;
  is_vegetarian?: number;
  is_bestseller?: number;
}

export interface CreateProductRequest {
  store_id: number;
  branch_id: number;
  category_id: number;
  product_name: string;
  product_description: string;
  product_image: string;
  base_price: number;
  uom_id?: number;
  serves_count?: number;
  is_vegetarian?: number;
  is_bestseller?: number;
}

export interface Uom {
  uom_id: number;
  uom_name: string;
}

// Product Variant types
export interface ProductVariant {
  variant_id: number;
  product_id: number;
  product_name?: string;
  variant_name: string;
  variant_price: number;
  uom_id?: number;
  uom_name?: string;
  variant_description?: string;
  sku?: string;
  barcode?: string;
  stock: number;
  is_active: number;
  variant_image?: string;
  attribute_values?: any;
  created_at: string;
  updated_at?: string;
}

export interface CreateProductVariantRequest {
  variant_name: string;
  variant_price: number;
  stock: number;
}

// Order types
export interface OrderItem {
  item_id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  variant_id?: number;
  variant_name?: string;
  quantity: number;
  price: number;
  total: number;
  total_price?: number; // Alias for total
  unit_price?: number; // Alias for price
  notes?: string;
  created_at: string;
}

export interface Review {
  review_id: number;
  order_id: number;
  rating: number;
  review_text: string;
  is_approved: number; // 0 = pending, 1 = approved, 2 = rejected
  admin_response?: string | null;
  review_created_at?: string;
  created_at?: string;
}

export interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  branch_address?: string;
  branch_phone?: string;
  customer_phone: string;
  customer_email?: string;
  branch_id: number;
  branch_name: string;
  order_status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  payment_method: string;
  payment_status: "pending" | "completed" | "failed";
  payment_reference?: string | null;
  delivery_address: string;
  delivery_landmark?: string;
  delivery_notes?: string;
  subtotal: number;
  delivery_charge?: number;
  is_free_delivery?: boolean;
  free_delivery_reason?: string | null;
  discount_amount?: number;
  coupon_id?: number;
  coupon_code?: string;
  coupon_type?: string;
  platform_fee: number;
  total_amount: number;
  items_count: number;
  items?: OrderItem[];
  review?: Review | null;
  created_at: string;
}

// Coupon types
export interface Coupon {
  coupon_id: number;
  store_id: number;
  branch_id: number | null;
  branch_name?: string;
  coupon_code: string;
  coupon_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit_per_user: number;
  total_usage_limit: number | null;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponRequest {
  store_id: number;
  branch_id?: number | null;
  coupon_code: string;
  coupon_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit_per_user?: number;
  total_usage_limit?: number | null;
  start_date: string;
  end_date: string;
  is_active?: number;
}

export interface OrderDetail {
  order_id: number;
  order_number: string;
  customer: {
    cust_id: number;
    name: string;
    phone: string;
    email: string;
  };
  branch_id: number;
  branch_name: string;
  order_status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  payment_method: string;
  payment_status: "pending" | "completed" | "failed";
  items: Array<{
    product_name: string;
    variant_name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  delivery_address: string;
  delivery_notes: string;
  subtotal: number;
  delivery_charge: number;
  platform_fee: number;
  total_amount: number;
  status_timeline: Array<{
    status: string;
    timestamp: string;
  }>;
  created_at: string;
}

// Customer types
export interface Customer {
  cust_id: number;
  name: string;
  customer_name?: string; // Alias for name, used in some places
  phone: string;
  email: string;
  total_orders: number;
  total_spent: number;
  profile_picture: string | null;
  created_at: string;

  // Additional contact information
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  // Allow for any additional properties that might come from the API
  [key: string]: any;
}

// App Settings types
export interface StoreFeatures {
  push_notifications_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  coupon_codes_enabled: boolean;
  app_settings_enabled: boolean;
  add_options_enabled: boolean;
  customers_enabled: boolean;
  employees_enabled: boolean;
  home_config_enabled: boolean;
  reports_enabled: boolean;
  max_categories: number | null;
  max_products: number | null;
  max_variants: number | null;
}

export interface AppSettings {
  app_config_id: number;
  store_id: number;
  app_name: string;
  sub_title: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  min_order_amount: number;
  platform_fee: number;
  is_cod_enabled: number;
  is_online_payment_enabled: number;
  maintenance_mode: number;
  created_at: string;
}

export interface StoreSettings {
  store_id: number;
  store_name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  min_order_amount: number;
  cod_enabled: boolean;
  online_payment_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
}

// Pagination types
export interface Pagination {
  total: number;
  page: number;
  limit: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
}

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  status?: string;
  order_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface DashboardSummary {
  summary: {
    total_orders: number;
    total_revenue: number;
    total_customers: number;
    active_branches: number;
    total_products: number;
    total_sms_sent: number;
    total_notifications_sent: number;
    total_otp_sent: number;
  };
  today_metrics: {
    orders_today: number;
    revenue_today: number;
    pending_orders: number;
    confirmed_orders: number;
    preparing_orders: number;
    ready_orders: number;
    out_for_delivery: number;
    completed_orders: number;
    cancelled_orders: number;
  };
  top_products: Array<{
    product_id: number;
    product_name: string;
    total_sold: number;
    revenue: number;
    product_image?: string;
  }>;
  revenue_chart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  recent_orders?: Array<{
    order_id: number;
    customer_name: string;
    customer_email?: string;
    order_date: string;
    total_amount: number;
    status: string;
    payment_method?: string;
  }>;
}

// Inventory types
export interface InventoryItem {
  inventory_id: number;
  variant_id: number;
  variant_name: string;
  variant_price: number;
  variant_active: boolean;
  product_id: number;
  product_name: string;
  product_description?: string;
  product_image?: string;
  product_active: boolean;
  category_id?: number;
  category_name?: string;
  branch_id: number;
  branch_name: string;
  stock: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  created_at: string;
  updated_at: string;
}

export interface InventoryStatistics {
  total_items: number;
  total_stock: number;
  out_of_stock_count: number;
  low_stock_count: number;
  in_stock_count: number;
}

export interface LowStockAlert {
  inventory_id: number;
  variant_id: number;
  variant_name: string;
  product_id: number;
  product_name: string;
  category_name?: string;
  branch_id: number;
  branch_name: string;
  stock: number;
  threshold: number;
}

export interface OutOfStockItem {
  inventory_id: number;
  variant_id: number;
  variant_name: string;
  product_id: number;
  product_name: string;
  category_name?: string;
  branch_id: number;
  branch_name: string;
  stock: number;
}

export interface BulkStockUpdate {
  inventory_id: number;
  stock: number;
}

// Bulk Operations types
export interface BulkProductUpdate {
  product_id: number;
  variant_id?: number;
  updates: {
    base_price?: number;
    is_active?: boolean;
    variant_price?: number;
    variant_active?: boolean;
    stock?: number;
    branch_id?: number;
  };
}

export interface BulkCategoryAssignment {
  product_ids: number[];
  category_id: number;
}

export interface BulkOrderStatusUpdate {
  order_ids: number[];
  order_status: string;
}

export interface BulkOperationResult {
  updated?: Array<{
    product_id: number;
    variant_id?: number;
    success: boolean;
  }>;
  imported?: Array<{ row: number; product_name: string; success: boolean }>;
  errors: Array<{
    product_id?: number;
    variant_id?: number;
    order_id?: number;
    row?: number;
    error: string;
  }>;
  total: number;
  success_count: number;
  error_count: number;
}

// Refund types
export interface RefundRequest {
  refund_id: number;
  order_id: number;
  user_id: number;
  cust_id?: string;
  store_id: number;
  branch_id: number;
  refund_type: "full" | "partial";
  refund_amount: number;
  original_amount: number;
  refund_reason: string;
  refund_description?: string;
  refund_status:
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "completed"
    | "failed";
  payment_method: "cod" | "online" | "upi";
  refund_method: "original" | "bank_transfer" | "wallet" | "store_credit";
  refund_reference?: string;
  admin_notes?: string;
  customer_notes?: string;
  processed_by?: number;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  order_number?: string;
  order_total?: number;
  order_status?: string;
  payment_status?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  txn_id?: string;
  payment_log_status?: string;
  history?: RefundHistory[];
}

export interface RefundHistory {
  history_id: number;
  refund_id: number;
  status: string;
  action: string;
  notes?: string;
  performed_by?: number;
  performed_by_name?: string;
  created_at: string;
}

export interface RefundStatistics {
  total_refunds: number;
  pending_count: number;
  approved_count: number;
  processing_count: number;
  completed_count: number;
  rejected_count: number;
  failed_count: number;
  total_refunded_amount: number;
  total_requested_amount: number;
}

// Return types
export interface ReturnRequest {
  return_id: number;
  order_id: number;
  user_id: number;
  cust_id?: string;
  store_id: number;
  branch_id: number;
  return_type: "full" | "partial";
  return_reason: string;
  return_description?: string;
  return_status:
    | "pending"
    | "approved"
    | "rejected"
    | "picked_up"
    | "received"
    | "processing_refund"
    | "completed"
    | "cancelled";
  pickup_address?: string;
  pickup_scheduled_at?: string;
  pickup_completed_at?: string;
  received_at?: string;
  refund_id?: number;
  admin_notes?: string;
  customer_notes?: string;
  processed_by?: number;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  order_number?: string;
  order_total?: number;
  order_status?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  items?: ReturnItem[];
  history?: ReturnHistory[];
}

export interface ReturnItem {
  return_item_id: number;
  return_id: number;
  order_item_id: number;
  quantity: number;
  refund_amount: number;
  return_reason?: string;
  item_condition: "unopened" | "opened" | "damaged" | "defective";
  product_name?: string;
  variant_name?: string;
  original_quantity?: number;
  unit_price?: number;
  total_price?: number;
}

export interface ReturnHistory {
  history_id: number;
  return_id: number;
  status: string;
  action: string;
  notes?: string;
  performed_by?: number;
  performed_by_name?: string;
  created_at: string;
}

export interface ReturnStatistics {
  total_returns: number;
  pending_count: number;
  approved_count: number;
  picked_up_count: number;
  received_count: number;
  completed_count: number;
  rejected_count: number;
  cancelled_count: number;
}
