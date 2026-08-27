-- SQL Table Schema for Real-Time Website Traffic & WhatsApp Inquiries Tracker
CREATE TABLE IF NOT EXISTS site_traffic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    page_path TEXT NOT NULL,
    page_title TEXT,
    target_id TEXT,
    target_title TEXT,
    referrer TEXT,
    device_type TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_traffic_event_type ON site_traffic(event_type);
CREATE INDEX IF NOT EXISTS idx_site_traffic_created_at ON site_traffic(created_at);
CREATE INDEX IF NOT EXISTS idx_site_traffic_session ON site_traffic(session_id);
CREATE INDEX IF NOT EXISTS idx_site_traffic_target_id ON site_traffic(target_id);

ALTER TABLE site_traffic ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_traffic' AND policyname = 'Allow public inserts for analytics beacons'
  ) THEN
    CREATE POLICY "Allow public inserts for analytics beacons" ON site_traffic FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_traffic' AND policyname = 'Allow service role full access to analytics'
  ) THEN
    CREATE POLICY "Allow service role full access to analytics" ON site_traffic FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
