import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const DEFAULT_ALLOWED_ORIGINS = [
  'https://bitesafe.ai',
  'https://www.bitesafe.ai',
  'https://bitesafeai.vercel.app',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

const ALLOWED_ORIGINS = ((Deno.env.get('CORS_ALLOWED_ORIGINS') || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean));
const EFFECTIVE_ALLOWED_ORIGINS = ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : DEFAULT_ALLOWED_ORIGINS;

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && EFFECTIVE_ALLOWED_ORIGINS.includes(origin)
      ? origin
      : EFFECTIVE_ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (origin && !EFFECTIVE_ALLOWED_ORIGINS.includes(origin)) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const corsHeaders = getCorsHeaders(origin);
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Server not configured' }),
      { status: 500, headers: jsonHeaders },
    );
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing access token' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes?.user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const userId = userRes.user.id;

  // Cascade deletes on profiles/meals/glucose_readings/passkey_credentials
  // are configured via ON DELETE CASCADE on user_id columns, so deleting
  // the auth user removes all owned data.
  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
  if (deleteErr) {
    console.error('Failed to delete user:', deleteErr);
    return new Response(
      JSON.stringify({ error: 'Failed to delete account' }),
      { status: 500, headers: jsonHeaders },
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: jsonHeaders,
  });
});
