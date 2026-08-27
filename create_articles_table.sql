-- Corporate Estate Malaysia: Articles & Blog Table Schema (v1.9.0)

CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'Panduan Industri',
    cover_image TEXT,
    excerpt TEXT,
    content TEXT NOT NULL,
    author_name TEXT DEFAULT 'WanAzemi',
    author_role TEXT DEFAULT 'Real Estate Negotiator (PEA 3949)',
    reading_time TEXT DEFAULT '4 min read',
    status TEXT NOT NULL DEFAULT 'Published',
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure agent_profiles has avatar_url and photo_url columns
ALTER TABLE IF EXISTS public.agent_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE IF EXISTS public.agent_profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;
CREATE POLICY "Public can view published articles"
ON public.articles FOR SELECT
USING (status = 'Published');

DROP POLICY IF EXISTS "Authenticated users have full access to articles" ON public.articles;
CREATE POLICY "Authenticated users have full access to articles"
ON public.articles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to articles" ON public.articles;
CREATE POLICY "Service role has full access to articles"
ON public.articles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

INSERT INTO public.articles (title, slug, category, cover_image, excerpt, content, author_name, author_role, reading_time, status, views_count)
VALUES
(
    'Panduan Memilih Kilang & Gudang di Selangor: 5 Spesifikasi Kritikal Yang Wajib Disemak',
    'panduan-memilih-kilang-gudang-di-selangor-5-spesifikasi-kritikal',
    'Panduan Industri',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    'Sebelum membeli atau menyewa kilang di kawasan industri seperti Shah Alam, Bukit Jelutong, atau Telok Gong, pastikan anda menyemak 5 aspek kritikal ini untuk mengelakkan kerugian operasi.',
    '<h2>Pengenalan</h2><p>Memilih hartanah industri seperti kilang berkembar (Semi-D Factory), kilang sesebuah (Detached Factory), atau gudang logistik bukan sekadar melihat pada keluasan Built-up (kps) dan harga semata-mata. Banyak syarikat korporat berdepan kos tambahan ratusan ribu ringgit selepas membeli hartanah kerana spesifikasi bangunan tidak menepati keperluan jentera atau lesen pihak berkuasa tempatan (PBT).</p><h3>1. Bekalan Kuasa Elektrik (Power Supply - Ampere)</h3><p>Ini adalah spesifikasi nombor satu bagi sektor pembuatan dan pergudangan moden. Kilang standard biasanya dibekalkan dengan 100 Amp hingga 200 Amp (3 Fasa). Namun, jika anda mengendalikan mesin suntikan plastik, pemprosesan makanan, atau bilik sejuk (cold room), anda mungkin memerlukan 300 Amp sehingga 1,000 Amp ke atas. Kos menaik taraf pencawang elektrik (substation) TNB boleh memakan belanja tinggi jika tidak dirancang awal.</p><h3>2. Ketinggian Siling (Ceiling Height / Eaves Height)</h3><p>Ketinggian aras siling menentukan kapasiti susunan rak (high-racking pallet storage) dan pengudaraan haba. Untuk gudang logistik moden, ketinggian minimum yang disyorkan ialah 30 kaki (9 meter) sehingga 40 kaki bagi membolehkan forklift beroperasi secara optimum.</p><h3>3. Beban Lantai (Floor Loading Capacity)</h3><p>Lantai kilang mestilah mampu menampung berat mesin berat dan trak kontena. Kapasiti standard yang baik ialah antara <strong>20 kN/m² hingga 30 kN/m²</strong> (kira-kira 2 hingga 3 tan per meter persegi) dengan kemasan <em>heavy-duty concrete floor hardener</em>.</p><h3>4. Zon Perindustrian (Industrial Zoning: Ringan vs Sederhana vs Berat)</h3><p>Pastikan kategori zon menepati aktiviti perniagaan anda. PBT seperti MBSA, MBPJ, dan MPK mengklasifikasikan zon kepada Light Industry, Medium Industry, dan Heavy Industry. Membina operasi kimia atau logam di kawasan industri ringan boleh menyebabkan lesen perniagaan ditolak.</p><h3>5. Akses Jalan & Ruang Memunggah (Loading Bay & Road Frontage)</h3><p>Pastikan jalan masuk hadapan mempunyai kelebaran sekurang-kurangnya 66 kaki bagi memudahkan treler 40-kaki keluar masuk tanpa mengganggu lalu lintas awam.</p><hr><h3>Perlukan Konsultasi Hartanah Industri?</h3><p>Pasukan <strong>Corporate Estate Malaysia</strong> sedia membantu anda mencari kilang dan gudang yang memenuhi piawaian operasi syarikat anda di seluruh Selangor dan Lembah Klang.</p>',
    'WanAzemi',
    'Real Estate Negotiator (PEA 3949)',
    '5 min read',
    'Published',
    0
),
(
    'Perbezaan Freehold vs Leasehold Untuk Hartanah Komersial & Industri di Malaysia',
    'perbezaan-freehold-vs-leasehold-hartanah-komersial-industri',
    'Tips Komersial',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'Ketahui kelebihan dan impak jangka panjang status pegangan tanah terhadap nilai kecairan (liquidity), pinjaman bank, dan kelulusan pelaburan korporat anda.',
    '<h2>Pengenalan</h2><p>Salah satu soalan paling kerap ditanya oleh pelabur korporat dan pembeli premis perniagaan ialah: <em>"Adakah hartanah pegangan pajakan (Leasehold) berbaloi untuk pelaburan kilang atau shoplot berbanding Pegangan Bebas (Freehold)?"</em></p><h3>1. Pemilikan dan Tempoh Masa</h3><p><strong>Freehold (Pegangan Bebas):</strong> Pemilik memegang hak milik selama-lamanya tanpa had masa. Nilai hartanah cenderung meningkat secara konsisten dan proses pindah milik biasanya lebih pantas kerana tidak memerlukan kebenaran Pihak Berkuasa Negeri (State Consent) bagi kebanyakan kes.</p><p><strong>Leasehold (Pegangan Pajakan):</strong> Tanah dipajak daripada kerajaan negeri untuk tempoh tertentu, lazimnya 99 tahun atau 60 tahun untuk zon industri tertentu. Apabila baki tempoh berkurang (contohnya bawah 30 tahun), pemilik boleh memohon penyambungan pajakan (Lease Extension) dengan membayar premium kepada Pejabat Tanah.</p><h3>2. Pembiayaan Bank (Commercial Loan Approval)</h3><p>Bank tempatan dan antarabangsa amat terbuka membiayai hartanah Leasehold selagi baki tempoh pajakan melebihi 30 hingga 50 tahun. Untuk hartanah industri di kawasan prime seperti Seksyen 51A Petaling Jaya atau Glenmarie, banyak kilang berstatus Leasehold mencatatkan kadar sewaan dan kenaikan nilai modal yang sangat tinggi.</p><h3>3. Kadar Pulangan Sewa (Rental Yield)</h3><p>Dari sudut pulangan sewaan (Rental Yield), penyewa korporat tidak mengambil kira sama ada kilang tersebut Freehold atau Leasehold—mereka hanya menilai lokasi strategik, akses lebuh raya, dan fasiliti bangunan. Oleh itu, hartanah Leasehold sering kali memberikan pulangan sewaan (yield %) yang lebih tinggi kerana harga belian masukannya yang lebih kompetitif.</p><hr><h3>Kesimpulan</h3><p>Pilihan terbaik bergantung pada objektif syarikat anda sama ada untuk operasi jangka masa panjang turun-temurun atau untuk memaksimumkan pulangan tunai tahunan.</p>',
    'WanAzemi',
    'Real Estate Negotiator (PEA 3949)',
    '4 min read',
    'Published',
    0
),
(
    'Cara Menilai Potensi Tanah Pembangunan (Development Land) di Kawasan Pinggir Bandar',
    'cara-menilai-potensi-tanah-pembangunan-pinggir-bandar',
    'Pelaburan Tanah',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    'Langkah strategik menyemak status zon, akses rizab jalan, bekalan utiliti, dan kebolehlaksanaan tukar syarat tanah untuk memaksimumkan keuntungan pembangunan.',
    '<h2>Pengenalan</h2><p>Membeli tanah berkeluasan besar (antara 2 ekar hingga 50 ekar) di kawasan pesat membangun seperti Sepang, Dengkil, Kuala Langat, atau Sungai Buloh menawarkan potensi pulangan berlipat ganda untuk pemaju dan syarikat korporat.</p><h3>1. Semakan Pelan Struktur & Rancangan Tempatan (Local Plan / RTD)</h3><p>Sebelum meletakkan sebarang deposit, pastikan anda menyemak Rancangan Tempatan Daerah di Pejabat Perancang Bandar. Tanah pertanian yang berada di dalam zon guna tanah komersial atau kediaman mempunyai potensi tinggi untuk diluluskan permohonan Tukar Syarat (Section 124 NLC) dan Pecah Sempadan (Subdivision).</p><h3>2. Hak Akses Rizab Jalan Awam (Right of Way)</h3><p>Tanah yang tidak mempunyai rizab jalan awam yang diwartakan (landlocked) akan menghadapi kesukaran semasa memohon Kebenaran Merancang (KM). Pastikan tapak mempunyai frontage jalan utama sekurang-kurangnya jalan negeri atau jalan persekutuan.</p><h3>3. Ketersediaan Infrastruktur & Utiliti Utama</h3><p>Jarak sambungan ke punca bekalan elektrik utama (TNB Transmission Line), bekalan air paip utama (Air Selangor), dan sistem perparitan/pembetungan memainkan peranan penting dalam mengira kos pembangunan kasar (Gross Development Cost).</p><hr><h3>Mencari Tanah Pembangunan di Selangor?</h3><p>Hubungi <strong>Corporate Estate Malaysia</strong> untuk senarai eksklusif tanah pembangunan komersial, perumahan, dan zon perindustrian utama.</p>',
    'WanAzemi',
    'Real Estate Negotiator (PEA 3949)',
    '6 min read',
    'Published',
    0
)
ON CONFLICT (slug) DO NOTHING;
