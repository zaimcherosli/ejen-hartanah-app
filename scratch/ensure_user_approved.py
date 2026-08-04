import urllib.request
import json

supabase_url = "https://csrzhidtzqxfbapsenhu.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTM3OTYsImV4cCI6MjEwMTA2OTc5Nn0.NnHFURbQTvsdgGbm1d_PC-hkOgQFQIHKTMQaS2n44SU"

email = "zaimrosli.tvpc@gmail.com"

# Upsert zaimrosli.tvpc@gmail.com as Approved into agent_profiles
profile_url = f"{supabase_url}/rest/v1/agent_profiles"
profile_headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

profile_body = [{
    "id": "e1234567-89ab-cdef-0123-456789abcdef",
    "full_name": "Zaim Rosli",
    "whatsapp_number": "017 356 9452",
    "ren_number": "REN 12345",
    "email": email,
    "status": "Approved",
    "registered_at": "2026-08-04T12:00:00Z"
}]

req = urllib.request.Request(profile_url, data=json.dumps(profile_body).encode("utf-8"), headers=profile_headers, method="POST")

try:
    with urllib.request.urlopen(req) as resp:
        print(f"SUCCESS: Set {email} status to Approved in agent_profiles!")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
