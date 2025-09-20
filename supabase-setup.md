# BurritosCerca Supabase Setup Guide

## Database Schema

### 1. verified_customers table
```sql
CREATE TABLE verified_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  payhip_order_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_method TEXT DEFAULT 'webhook', -- 'webhook', 'manual', 'admin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX idx_verified_customers_email ON verified_customers(email);
CREATE INDEX idx_verified_customers_active ON verified_customers(is_active);
```

### 2. vendors table (replace localStorage)
```sql
CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL REFERENCES verified_customers(email),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  menu_items JSONB DEFAULT '[]',
  specialties TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 4.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for search performance
CREATE INDEX idx_vendors_customer_email ON vendors(customer_email);
CREATE INDEX idx_vendors_active ON vendors(is_active);
CREATE INDEX idx_vendors_specialties ON vendors USING GIN(specialties);
```

### 3. Row Level Security Policies
```sql
-- Enable RLS
ALTER TABLE verified_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Allow public read access for verification
CREATE POLICY "Allow verification lookup" ON verified_customers 
FOR SELECT USING (true);

-- Only service role can insert verified customers (from webhooks)
CREATE POLICY "Allow webhook insert" ON verified_customers 
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Allow public read access to active vendors
CREATE POLICY "Allow public vendor read" ON vendors 
FOR SELECT USING (is_active = true);

-- Only verified customers can insert their own vendors
CREATE POLICY "Allow verified vendor insert" ON vendors 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM verified_customers 
    WHERE email = customer_email AND is_active = true
  )
);
```

## Next Steps:
1. Run these SQL commands in your Supabase SQL Editor
2. Set up Edge Functions for webhook handling
3. Create verification page for manual fallback
4. Update app.js to use Supabase instead of localStorage