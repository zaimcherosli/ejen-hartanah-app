import urllib.request
import json
import uuid
import time

supabase_url = "https://csrzhidtzqxfbapsenhu.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTM3OTYsImV4cCI6MjEwMTA2OTc5Nn0.NnHFURbQTvsdgGbm1d_PC-hkOgQFQIHKTMQaS2n44SU"

timestamp = int(time.time())
test_email = f"ahmad.agent{timestamp}@corporateestate.com.my"
test_name = "Ahmad Syahmi (Senior Negotiator)"
test_wa = "019 876 5432"
test_ren = "REN 54321"

# 1. Sign up user via Auth API
signup_url = f"{supabase_url}/auth/v1/signup"
headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}",
    "Content-Type": "application/json"
}

body = {
    "email": test_email,
    "password": "Password123!",
    "data": {
        "full_name": test_name,
        "whatsapp_number": test_wa,
        "ren_number": test_ren,
        "status": "Pending",
        "role": "agent"
    }
}

req = urllib.request.Request(signup_url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        user_id = res_data.get("id") or (res_data.get("user") or {}).get("id")
        print(f"✅ SignUp Success: User ID = {user_id}, Email = {test_email}")

        # 2. Insert into agent_profiles table
        profile_url = f"{supabase_url}/rest/v1/agent_profiles"
        profile_headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        
        profile_body = [{
            "id": user_id or str(uuid.uuid4()),
            "full_name": test_name,
            "whatsapp_number": test_wa,
            "ren_number": test_ren,
            "email": test_email,
            "status": "Pending",
            "registered_at": "2026-08-04T12:51:00Z"
        }]

        p_req = urllib.request.Request(profile_url, data=json.dumps(profile_body).encode("utf-8"), headers=profile_headers, method="POST")
        with urllib.request.urlopen(p_req) as p_resp:
            print("✅ Successfully inserted into agent_profiles table!")

except Exception as e:
    print(f"Error creating test agent: {e}")
