# Database Setup Instructions

## Create Policies Table

The `policies` table is required for the policy management API to work.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"  
4. Copy and paste the entire contents of `migrations/001_create_policies_table.sql`
5. Click "Run"

### Option 2: Using psql CLI

If you have PostgreSQL installed locally:

```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@[YOUR_PROJECT].supabase.co:5432/postgres" \
  -f migrations/001_create_policies_table.sql
```

Replace:
- `[YOUR_PASSWORD]` with your Supabase password
- `[YOUR_PROJECT]` with your project name (found in Supabase project settings)

### Option 3: Quick Manual Creation

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS policies (
  policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID REFERENCES users(uid) ON DELETE CASCADE,
  week_start TIMESTAMP WITH TIME ZONE,
  week_end TIMESTAMP WITH TIME ZONE,
  coverage_per_day INTEGER,
  weekly_premium NUMERIC(10, 2),
  premium_breakdown JSONB,
  status VARCHAR(50) DEFAULT 'active',
  zone VARCHAR(255),
  pincode VARCHAR(20),
  gigscore_at_creation INTEGER,
  is_first_policy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_policies_uid ON policies(uid);
CREATE INDEX idx_policies_status ON policies(status);
```

## Verify Setup

After creating the table, restart the backend:

```bash
cd backend
python main.py
```

Then test with:

```bash
curl -X GET http://localhost:3001/api/status
```

You should get:

```json
{"status": "ok", "backend": "ChillInsure v1.0"}
```

## Next Steps

Once the table is created, you can test the complete flow:

1. Register a new user
2. Verify OTP
3. Get GigScore
4. Create a policy
