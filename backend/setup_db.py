#!/usr/bin/env python3
"""
Database setup script for ChillInsure
Creates all required tables in Supabase
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from db.supabase_client import get_supabase_client


def create_policies_table():
    """Create the policies table"""
    db = get_supabase_client()
    
    sql = """
    CREATE TABLE IF NOT EXISTS policies (
      policy_id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
      uid UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
      week_start TIMESTAMP WITH TIME ZONE NOT NULL,
      week_end TIMESTAMP WITH TIME ZONE NOT NULL,
      coverage_per_day INTEGER NOT NULL,
      weekly_premium NUMERIC(10, 2) NOT NULL,
      premium_breakdown JSONB NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      zone VARCHAR(255),
      pincode VARCHAR(20),
      gigscore_at_creation INTEGER,
      is_first_policy BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_policies_uid ON policies(uid);
    CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
    CREATE INDEX IF NOT EXISTS idx_policies_uid_status ON policies(uid, status);
    """
    
    try:
        # Try to insert and catch the error to verify table exists
        result = db.table("policies").select("policy_id").limit(1).execute()
        print("[✓] Policies table already exists")
        return True
    except Exception as e:
        print(f"[!] Policies table check: {e}")
        print("\n[*] To create the policies table manually:")
        print("    1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql")
        print("    2. Open new query")
        print("    3. Paste the contents of: migrations/001_create_policies_table.sql")
        print("    4. Click 'RUN'")
        return False


def verify_all_tables():
    """Verify all required tables exist"""
    db = get_supabase_client()
    
    tables = ["users", "otp_verifications", "gigscore"]
    
    print("\n[*] Verifying tables...")
    all_exist = True
    
    for table in tables:
        try:
            db.table(table).select("*").limit(1).execute()
            print(f"  [✓] {table}")
        except Exception as e:
            print(f"  [✗] {table}: {e}")
            all_exist = False
    
    # Check policies table
    try:
        db.table("policies").select("*").limit(1).execute()
        print(f"  [✓] policies")
    except:
        print(f"  [✗] policies (MISSING - See instructions above)")
        all_exist = False
    
    return all_exist


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("ChillInsure Database Setup")
    print("=" * 60)
    
    # Check if .env exists
    if not os.path.exists(".env"):
        print("\n[ERROR] .env file not found!")
        print("Please create .env with:")
        print("  SUPABASE_URL=...")
        print("  SUPABASE_KEY=...")
        sys.exit(1)
    
    print("\n[*] Checking database connection...")
    try:
        db = get_supabase_client()
        print("[✓] Connected to Supabase")
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        sys.exit(1)
    
    # Verify tables
    if verify_all_tables():
        print("\n[✓] All tables exist!")
        print("\nYou can now start the backend:")
        print("  cd backend && python main.py")
    else:
        print("\n[!] Some tables are missing.")
        print("\n[*] Attempting to create policies table...")
        create_policies_table()
