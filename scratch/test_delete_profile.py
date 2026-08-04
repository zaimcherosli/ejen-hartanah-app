import urllib.request
import json

supabase_url = "https://csrzhidtzqxfbapsenhu.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTM3OTYsImV4cCI6MjEwMTA2OTc5Nn0.NnHFURbQTvsdgGbm1d_PC-hkOgQFQIHKTMQaS2n44SU"

email = "ahmad.agent1785819113@corporateestate.com.my"

# Delete by email from agent_profiles
profile_url = f"{supabase_url}/rest/v1/agent_profiles?email=eq.{email}"
profile_headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}",
    "Prefer": "return=representation"
}

req = urllib.request.Request(profile_url, headers=profile_headers, method="DELETE")

try:
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        print(f"DELETE RESULT: {res_data}")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
