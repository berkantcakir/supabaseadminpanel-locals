export interface Product {
  id: string;
  name: string;
  image_url: string | null;
  stock: number;
  discount_percentage: number | null;
  price: number;
  category_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_visible: boolean;
  sort_order: number;
  category_sort_order: number | null;
  description: string | null;
  market_id: string | null;
  grammage: number | null;
  is_on_campaign: boolean;
  barcode: string | null;
}

export interface Category {
  id: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
  sort_order: number | null;
  parent_id: string | null;
  image_url: string | null;
  market_id: string | null;
  is_visible: boolean | null;
  is_campaign: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: "admin" | "customer" | "slave" | "market_admin" | null;
  created_at: string | null;
  updated_at: string | null;
}


