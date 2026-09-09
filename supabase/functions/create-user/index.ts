import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Verify caller is an authenticated Admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )
  if (callerError || !caller) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'Admin') {
    return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), { status: 403, headers: corsHeaders })
  }

  // Create the auth user
  const { email, password, nome, role, entidades } = await req.json()

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders })
  }

  // Insert profile — email lives in auth.users, NOT in profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({ id: authData.user.id, nome, role, entidades: entidades ?? [] })

  if (profileError) {
    // Roll back the auth user to avoid an orphan record
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ id: authData.user.id, email }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
