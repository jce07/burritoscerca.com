// Netlify Function: Check if customer is verified
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
    // Initialize Supabase client
    const supabase = createClient(
      'https://ojshbaedxjapfrkmfcfq.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { email } = JSON.parse(event.body)

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      }
    }

    // Check if customer is verified
    const { data, error } = await supabase
      .from('verified_customers')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          verified: false,
          message: 'Customer not found or not verified'
        })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        verified: true,
        customer: {
          email: data.email,
          name: data.customer_name,
          payment_date: data.payment_date,
          verification_method: data.verification_method
        }
      })
    }

  } catch (error) {
    console.error('Check verification error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
