import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL_RAW = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Extract the real project ref for consistent session storage
const PROJECT_REF = SUPABASE_URL_RAW
  ? SUPABASE_URL_RAW.replace('https://', '').split('.')[0]
  : 'bitesafe';
const AUTH_STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

// In development, proxy Supabase through the Vite dev server to avoid
// Cursor's built-in browser sandbox blocking external requests.
const isDev = import.meta.env.DEV;
const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
const SUPABASE_URL = isDev ? `${origin}/supabase-proxy` : SUPABASE_URL_RAW;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: AUTH_STORAGE_KEY,
  }
});