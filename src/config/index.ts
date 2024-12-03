// API Configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production, use relative path since API is served from same domain
  : 'http://localhost:8080/api';  // In development, use localhost

// Supabase Configuration
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Payment Configuration
export const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';
