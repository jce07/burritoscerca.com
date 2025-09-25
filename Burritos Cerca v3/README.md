# Payhip to Supabase Webhook Handler v3

This Netlify function handles Payhip purchase webhooks and automatically creates Supabase user accounts.

## Files Structure

```
v3/
├── netlify/
│   └── functions/
│       └── webhook-handler.js    # Main webhook handler
├── package.json                  # Dependencies
├── netlify.toml                 # Netlify configuration
└── README.md                    # This file
```

## Setup Instructions

1. **Deploy to Netlify:**
   - Upload the entire `v3` folder to your Netlify site
   - Or connect your Git repository containing this code

2. **Set Environment Variables in Netlify:**
   - `PAYHIP_WEBHOOK_SECRET` - Get this from Payhip Developer settings
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

3. **Configure Payhip Webhook:**
   - URL: `https://your-netlify-site.netlify.app/api/webhook`
   - Method: POST
   - Events: Purchase completed

## Features

- ✅ Secure signature verification
- ✅ ES6 module syntax
- ✅ Proper error handling
- ✅ Automatic user invitation via Supabase
- ✅ Redirect to password setup page

## Security

The function verifies webhook signatures to ensure requests are genuinely from Payhip, preventing unauthorized access.