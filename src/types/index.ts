import { ReactNode } from 'react';

// Next.js page with layout type
export type NextPageWithLayout<P = {}, IP = P> = React.FC<P> & {
  getLayout?: (page: ReactNode) => ReactNode;
};

// User types
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
  address: string;
  city: string;
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
  total_stock: number;
  total_sold: number;
  is_active: number;
  created_at: string;
}

export interface CreateProductRequest {
  store_id: number;
  branch_id: number;
  category_id: number;
  product_name: string;
  product_description: string;
  product_image: string;
  base_price: number;
}

// Product Variant types
export interface ProductVariant {
  variant_id: number;
  product_id: number;
  variant_name: string;
  variant_price: number;
  stock: number;
  is_active: number;
  created_at: string;
}

export interface CreateProductVariantRequest {
  variant_name: string;
  variant_price: number;
  stock: number;
}

// Order types
export interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  branch_id: number;
  branch_name: string;
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed';
  subtotal: number;
  delivery_charge: number;
  platform_fee: number;
  total_amount: number;
  items_count: number;
  created_at: string;
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
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed';
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
  phone: string;
  email: string;
  total_orders: number;
  total_spent: number;
  profile_picture: string | null;
  created_at: string;
}

// App Settings types
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

export interface DashboardSummary {
  summary: {
    total_orders: number;
    total_revenue: number;
    total_customers: number;
    active_branches: number;
    total_products: number;
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
  }>;
  revenue_chart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}