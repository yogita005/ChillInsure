from supabase import create_client, Client
from core.config import SUPABASE_URL, SUPABASE_KEY

_client: Client = None


def get_supabase_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client
