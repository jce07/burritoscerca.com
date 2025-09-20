// Supabase Edge Function: Check if customer is verified
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { email, customer_name } = await req.json()

    if (!email || !customer_name) {
      return new Response(
        JSON.stringify({ error: 'Missing email or customer_name' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if customer is verified
    const { data, error } = await supabaseClient
      .from('verified_customers')
      .select('id, email, customer_name, payment_date, verification_method')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: 'Customer not found or not verified' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Optional: Also check name similarity for extra security
    const nameMatch = data.customer_name.toLowerCase().includes(customer_name.toLowerCase()) ||
                     customer_name.toLowerCase().includes(data.customer_name.toLowerCase())

    return new Response(
      JSON.stringify({ 
        verified: true,
        customer: {
          email: data.email,
          name: data.customer_name,
          payment_date: data.payment_date,
          verification_method: data.verification_method
        },
        name_match: nameMatch
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})