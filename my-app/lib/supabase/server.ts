// lib/supabase/server.ts
import { createClient } from "@supabase/supabase-js"

function clean(v?: string | null) {
  if (!v) return undefined
  return v.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1")
}

function required(name: string): string {
  const val = clean(process.env[name])
  if (!val) throw new Error(`[Supabase] Missing env var: ${name}`)
  return val
}

export function createServerClient() {
  // Cliente con ANON KEY (RLS). Úsalo para lecturas o si tus policies permiten escritura.
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL")
  const anon = required("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  return createClient(supabaseUrl, anon, { auth: { persistSession: false } })
}

export function createAdminClient() {
  // Cliente con SERVICE ROLE (bypass RLS). Úsalo SOLO en servidor para inserts/updates/admin.
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRole = required("SUPABASE_SERVICE_ROLE_KEY")
  return createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })
}
