// Netlify Function: Auto-verify customers via Payhip → Zapier webhook
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    console.log('🔥 Webhook received from Zapier/Payhip')

    // Initialize Supabase client
    const supabase = createClient(
      'https://ojshbaedxjapfrkmfcfq.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const webhookData = JSON.parse(event.body)
    console.log('📦 Webhook data:', webhookData)

    // Extract data from Zapier webhook (Payhip fields)
    const {
      email,
      customer_name,
      order_id,
      product_id,
      sale_date,
      amount,
      currency
    } = webhookData

    // Validate this is for BurritosCerca product
    if (product_id && product_id !== 'f0xFv') {
      console.log('❌ Wrong product ID:', product_id)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'OK - Different product' })
      }
    }

    // Validate required fields
    if (!email || !customer_name) {
      console.error('❌ Missing required fields:', { email, customer_name })
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: email, customer_name' })
      }
    }

    // Auto-verify customer (no manual approval needed!)
    const { data, error } = await supabase
      .from('verified_customers')
      .upsert({
        email: email.toLowerCase().trim(),
        customer_name: customer_name.trim(),
        payhip_order_id: order_id || null,
        payment_date: sale_date || new Date().toISOString(),
        verification_method: 'webhook',
        is_active: true  // ✅ AUTOMATICALLY ACTIVE!
      }, {
        onConflict: 'email'
      })
      .select()

    if (error) {
      console.error('💥 Database error:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to verify customer' })
      }
    }

    console.log('✅ Customer auto-verified:', data[0])

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Customer automatically verified and activated!',
        customer: data[0]
      })
    }

  } catch (error) {
    console.error('💥 Function error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}