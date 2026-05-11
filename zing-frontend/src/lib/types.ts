/* ──────────────────────────────────────────────────────
   TypeScript interfaces for the Zing Healthy Eats API.
   ────────────────────────────────────────────────────── */

export interface User {
  id: number;
  username: string;
  email: string;
  address: string | null;
  profile_picture: string;
  is_admin: boolean;
  is_driver: boolean;
  saved_phone: string | null;
  is_verified: boolean;
  orders_count?: number;
  last_order_date?: string | null;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  image: string;
  price: number;
  quantity: number;
  category_id: number | null;
  category_name: string | null;
  is_peoples_choice: boolean;
  date_added: string | null;
  images: string[];
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product | null;
  subtotal: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  quantity: number;
  product_title: string;
  product_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  user_id: number;
  created_at: string | null;
  phone_number: string | null;
  mpesa_receipt_number: string | null;
  paystack_reference: string | null;
  status: string;
  driver_id: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_type?: string;
  delivery_address?: string | null;
  delivery_fee?: number;
  items: OrderItem[];
  total: number;
}

export interface CarouselImage {
  id: number;
  image_filename: string;
  created_at: string | null;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon_class: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  image_filename: string;
}

export interface AboutData {
  our_story: string;
  hero_image: string;
  team_members: TeamMember[];
}

export interface SiteSettings {
  [key: string]: string;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FeaturedProducts {
  latest: Product[];
  top_selling: Product[];
}

export interface CartData {
  items: CartItem[];
  total: number;
  count: number;
}

export interface PeoplesChoice {
  title: string;
  products: Product[];
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}
