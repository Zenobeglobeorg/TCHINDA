import { createClient } from '@supabase/supabase-js';

let adminClient = null;

function tryDecodeJwtRole(jwt) {
  try {
    const parts = String(jwt).split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(payload, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    return parsed?.role || null;
  } catch {
    return null;
  }
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !serviceKey) return null;

  if (!adminClient) {
    const role = tryDecodeJwtRole(serviceKey);
    if (role && role !== 'service_role') {
      console.warn(
        `⚠️  SUPABASE_SERVICE_KEY n'est pas une service_role (role=${role}). ` +
          `L'upload Storage peut échouer avec RLS. Mets la "service_role key" côté Railway.`
      );
    }

    adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return adminClient;
}

