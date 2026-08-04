import urllib.request
import json
import uuid
import time

supabase_url = "https://csrzhidtzqxfbapsenhu.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTM3OTYsImV4cCI6MjEwMTA2OTc5Nn0.NnHFURbQTvsdgGbm1d_PC-hkOgQFQIHKTMQaS2n44SU"

timestamp = int(time.time())
test_email = f"ahmad.agent{timestamp}@corporateestate.com.my"
test_name = "Ahmad Syahmi (Senior Industrial Negotiator)"
test_wa = "019 876 5432"
test_ren = "REN 54321"
new_uuid = str(uuid.uuid4())

profile_url = f"{supabase_url}/rest/v1/agent_profiles"
profile_headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

profile_body = [{
    "id": new_uuid,
    "full_name": test_name,
    "whatsapp_number": test_wa,
    "ren_number": test_ren,
    "email": test_email,
    "status": "Pending",
    "registered_at": "2026-08-04T12:51:00Z"
}]

req = urllib.request.Request(profile_url, data=json.dumps(profile_body).encode("utf-8"), headers=profile_headers, method="POST")

try:
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        print(f"SUCCESS: Created Test Agent Profile in agent_profiles table!")
        print(f"ID: {new_uuid}")
        print(f"Name: {test_name}")
        print(f"Email: {test_email}")
        print(f"Status: Pending")
except Exception as e:
    print(f"Error inserting into agent_profiles: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
