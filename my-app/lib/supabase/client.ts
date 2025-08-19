// lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js"

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`[Supabase] Missing env var: ${name}`)
  return v
}

// Estos dos pueden usarse en el navegador (por eso van con NEXT_PUBLIC_)
const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL")
const supabaseAnonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

// Cliente para el navegador (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
