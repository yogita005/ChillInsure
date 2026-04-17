-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
  policy_id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  week_end TIMESTAMP WITH TIME ZONE NOT NULL,
  coverage_per_day INTEGER NOT NULL,
  weekly_premium NUMERIC(10, 2) NOT NULL,
  premium_breakdown JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expired, cancelled, claimed
  zone VARCHAR(255),
  pincode VARCHAR(20),
  gigscore_at_creation INTEGER,
  is_first_policy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_coverage CHECK (coverage_per_day > 0),
  CONSTRAINT valid_premium CHECK (weekly_premium >= 0),
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'cancelled', 'claimed'))
);

-- Create indexes for faster queries
CREATE INDEX idx_policies_uid ON policies(uid);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_week_start ON policies(week_start);
CREATE INDEX idx_policies_uid_status ON policies(uid, status);

-- Enable RLS (Row Level Security)
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own policies
CREATE POLICY "Users can view their own policies"
  ON policies FOR SELECT
  USING (uid = auth.uid());

CREATE POLICY "Users can insert their own policies"
  ON policies FOR INSERT
  WITH CHECK (uid = auth.uid());

CREATE POLICY "Users can update their own policies"
  ON policies FOR UPDATE
  USING (uid = auth.uid())
  WITH CHECK (uid = auth.uid());
