import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Administrativo com Service Role Key.
 * EXCLUSIVO PARA O SERVIDOR. NUNCA EXPONHA NO CLIENT.
 * Utilizado para operações de sistema (Storage bucket setup, verificação de RBAC).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
