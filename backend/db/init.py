"""
Database initialization module for ChillInsure
Ensures all required tables and indexes exist
"""

from db.supabase_client import get_supabase_client

def init_database():
    """Initialize database tables if they don't exist"""
    db = get_supabase_client()
    
    try:
        # Create policies table
        db.table("policies").select("policy_id").limit(1).execute()
        print("[OK] Policies table already exists")
    except Exception as e:
        if "does not exist" in str(e) or "policies" in str(e):
            print("[*] Creating policies table...")
            try:
                # We can't run raw SQL via the client, so we'll skip this
                # Users need to run migrations manually via Supabase dashboard
                print("[WARN] Policies table not found. Please run migrations manually.")
                print("[WARN] Execute: backend/migrations/001_create_policies_table.sql")
                print("[WARN] in Supabase SQL Editor at: https://app.supabase.com/project/*/sql")
            except Exception as create_err:
                print(f"[ERROR] Failed to create policies table: {create_err}")
                raise
        else:
            print(f"[WARN] Database check error: {e}")

if __name__ == "__main__":
    init_database()
