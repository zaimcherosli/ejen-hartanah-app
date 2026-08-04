import urllib.request
import json
import uuid
import time

supabase_url = "https://csrzhidtzqxfbapsenhu.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTM3OTYsImV4cCI6MjEwMTA2OTc5Nn0.NnHFURbQTvsdgGbm1d_PC-hkOgQFQIHKTMQaS2n44SU"

timestamp = int(time.time())
test_email = f"ejen.test{timestamp}@gmail.com"
test_pass = "TestEjen123!"

# 1. Sign up user via Auth API
signup_url = f"{supabase_url}/auth/v1/signup"
headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}",
    "Content-Type": "application/json"
}

body = {
    "email": test_email,
    "password": test_pass,
    "data": {
        "full_name": "Ejen Ujian Sah",
        "whatsapp_number": "0129998888",
        "ren_number": "REN 88888",
        "status": "Approved",
        "role": "agent"
    }
}

req = urllib.request.Request(signup_url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        user_id = res_data.get("id") or (res_data.get("user") or {}).get("id")
        print(f"SUCCESS_AUTH: User ID = {user_id}, Email = {test_email}, Password = {test_pass}")

        # Insert into agent_profiles
        profile_url = f"{supabase_url}/rest/v1/agent_profiles"
        profile_headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        profile_body = [{
            "id": user_id,
            "full_name": "Ejen Ujian Sah",
            "whatsapp_number": "0129998888",
            "ren_number": "REN 88888",
            "email": test_email,
            "status": "Approved",
            "registered_at": "2026-08-04T12:57:00Z"
        }]

        p_req = urllib.request.Request(profile_url, data=json.dumps(profile_body).encode("utf-8"), headers=profile_headers, method="POST")
        with urllib.request.urlopen(p_req) as p_resp:
            print("SUCCESS_PROFILE: Created in agent_profiles table as Approved!")

except Exception as e:
    print(f"ERROR: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
