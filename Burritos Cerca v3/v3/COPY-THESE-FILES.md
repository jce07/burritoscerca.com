# Copy These 4 Files to Your Git Repository

## File 1: netlify/functions/webhook-handler.js

```javascript
// This is the updated "Secretary" code for your Netlify Function.
// It is now fully consistent with modern ES6 module syntax for better reliability.

// =========================================================================
// STEP 1: Dependencies and Setup
// =========================================================================

// Use ES6 import syntax to bring in the Supabase client library.
import { createClient } from '@supabase/supabase-js';

// Use ES6 import for the crypto library, which is built into the Netlify/Node.js environment.
import crypto from 'crypto';

// The main function that Netlify will execute when it receives a request.
// We use the ES6 'export const handler' syntax.
export const handler = async (event) => {
    // We only want to process messages sent with the POST method.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    // =========================================================================
    // STEP 2: Security Check - Verify the Webhook Signature
    // =========================================================================

    // This step ensures the message is actually from Payhip and not someone else.
    // Kiro needs to get this secret from the Payhip Developer settings.
    const PAYHIP_WEBHOOK_SECRET = process.env.PAYHIP_WEBHOOK_SECRET;

    try {
        const payload = event.body;
        const signature = event.headers['x-payhip-signature'];

        // If there's no signature, we immediately reject the request.
        if (!signature) {
            return {
                statusCode: 401,
                body: 'Unauthorized - Missing Signature'
            };
        }

        // We use the secret key to verify that the message payload matches the signature.
        // This is the digital "stamp" of authenticity.
        const hmac = crypto.createHmac('sha256', PAYHIP_WEBHOOK_SECRET);
        hmac.update(payload);
        const expectedSignature = hmac.digest('hex');

        // If the signatures don't match, something is wrong. We reject the request.
        if (signature !== expectedSignature) {
            return {
                statusCode: 403,
                body: 'Forbidden - Invalid Signature'
            };
        }
    } catch (error) {
        console.error('Signature verification failed:', error);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }

    // =========================================================================
    // STEP 3: Connect to Supabase and Process the Purchase
    // =========================================================================

    // Kiro needs to get these keys from your Supabase Project Settings (under "API").
    // The "Service Role Key" is needed because we are creating a user from a backend function.
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        // Initialize the Supabase client with the Service Role Key for backend access.
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Parse the data sent from Payhip.
        const payhipData = JSON.parse(event.body);

        // The key piece of information we need is the customer's email.
        const customerEmail = payhipData.customer_email;

        if (!customerEmail) {
            return {
                statusCode: 400,
                body: 'Bad Request - Missing customer_email in payload.'
            };
        }

        // Now, we tell Supabase to create the new user account.
        // The `redirectTo` parameter is important. It sends the user to a specific
        // page on your app after they click the secure link in the email.
        const { error } = await supabase.auth.admin.inviteUserByEmail(customerEmail, {
            redirectTo: 'https://burritoscerca.com/set-password' // Adjust this URL as needed
        });

        if (error) {
            // If there's an error (e.g., the user already exists), we log it but still
            // return a success code to Payhip to prevent it from retrying.
            console.error('Supabase user creation error:', error.message);
            return {
                statusCode: 200, // Return OK to Payhip
                body: `User creation failed but webhook processed: ${error.message}`
            };
        }

        // If everything worked perfectly, we tell Payhip that we received the message and
        // the job is done.
        return {
            statusCode: 200,
            body: `Webhook received and user invited successfully: ${customerEmail}`
        };

    } catch (error) {
        // If anything unexpected goes wrong, we log the error.
        console.error('Unexpected error processing webhook:', error);
        return {
            statusCode: 500,
            body: `Internal Server Error: ${error.message}`
        };
    }
};
```

## File 2: package.json

```json
{
  "name": "payhip-supabase-webhook",
  "version": "3.0.0",
  "description": "Netlify function to handle Payhip webhooks and create Supabase users",
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## File 3: netlify.toml

```toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/webhook"
  to = "/.netlify/functions/webhook-handler"
  status = 200
```

## File 4: README.md

```markdown
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
```

---

## Instructions:
1. Copy each code block above
2. Create the files in your Git repository with the exact folder structure shown
3. Upload to GitHub, then connect to Netlify