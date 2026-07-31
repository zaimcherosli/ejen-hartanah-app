-- Skrip Kebenaran Muat Naik Gambar ke Supabase Storage (listing-images)

CREATE POLICY "Allow public upload to listing-images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'listing-images');

CREATE POLICY "Allow public select from listing-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'listing-images');

CREATE POLICY "Allow public update to listing-images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'listing-images');

CREATE POLICY "Allow public delete to listing-images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'listing-images');
