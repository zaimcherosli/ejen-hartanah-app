/**
 * Corporate Estate Malaysia - Blog & Knowledge Hub Engine (v1.9.0)
 */

const WHATSAPP_ICON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:5px;"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>`;

const FALLBACK_ARTICLES = [
  {
    id: "art-1",
    title: "Panduan Memilih Kilang & Gudang di Selangor: 5 Spesifikasi Kritikal Yang Wajib Disemak",
    slug: "panduan-memilih-kilang-gudang-di-selangor-5-spesifikasi-kritikal",
    category: "Panduan Industri",
    cover_image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Sebelum membeli atau menyewa kilang di kawasan industri seperti Shah Alam, Bukit Jelutong, atau Telok Gong, pastikan anda menyemak 5 aspek kritikal ini untuk mengelakkan kerugian operasi.",
    content: "<h2>Pengenalan</h2><p>Memilih hartanah industri seperti kilang berkembar (Semi-D Factory), kilang sesebuah (Detached Factory), atau gudang logistik bukan sekadar melihat pada keluasan Built-up (kps) dan harga semata-mata. Banyak syarikat korporat berdepan kos tambahan ratusan ribu ringgit selepas membeli hartanah kerana spesifikasi bangunan tidak menepati keperluan jentera atau lesen pihak berkuasa tempatan (PBT).</p><h3>1. Bekalan Kuasa Elektrik (Power Supply - Ampere)</h3><p>Ini adalah spesifikasi nombor satu bagi sektor pembuatan dan pergudangan moden. Kilang standard biasanya dibekalkan dengan 100 Amp hingga 200 Amp (3 Fasa). Namun, jika anda mengendalikan mesin suntikan plastik, pemprosesan makanan, atau bilik sejuk (cold room), anda mungkin memerlukan 300 Amp sehingga 1,000 Amp ke atas. Kos menaik taraf pencawang elektrik (substation) TNB boleh memakan belanja tinggi jika tidak dirancang awal.</p><h3>2. Ketinggian Siling (Ceiling Height / Eaves Height)</h3><p>Ketinggian aras siling menentukan kapasiti susunan rak (high-racking pallet storage) dan pengudaraan haba. Untuk gudang logistik moden, ketinggian minimum yang disyorkan ialah 30 kaki (9 meter) sehingga 40 kaki bagi membolehkan forklift beroperasi secara optimum.</p><h3>3. Beban Lantai (Floor Loading Capacity)</h3><p>Lantai kilang mestilah mampu menampung berat mesin berat dan trak kontena. Kapasiti standard yang baik ialah antara <strong>20 kN/m² hingga 30 kN/m²</strong> (kira-kira 2 hingga 3 tan per meter persegi) dengan kemasan <em>heavy-duty concrete floor hardener</em>.</p><h3>4. Zon Perindustrian (Industrial Zoning: Ringan vs Sederhana vs Berat)</h3><p>Pastikan kategori zon menepati aktiviti perniagaan anda. PBT seperti MBSA, MBPJ, dan MPK mengklasifikasikan zon kepada Light Industry, Medium Industry, dan Heavy Industry. Membina operasi kimia atau logam di kawasan industri ringan boleh menyebabkan lesen perniagaan ditolak.</p><h3>5. Akses Jalan & Ruang Memunggah (Loading Bay & Road Frontage)</h3><p>Pastikan jalan masuk hadapan mempunyai kelebaran sekurang-kurangnya 66 kaki bagi memudahkan treler 40-kaki keluar masuk tanpa mengganggu lalu lintas awam.</p><hr><h3>Perlukan Konsultasi Hartanah Industri?</h3><p>Pasukan <strong>Corporate Estate Malaysia</strong> sedia membantu anda mencari kilang dan gudang yang memenuhi piawaian operasi syarikat anda di seluruh Selangor dan Lembah Klang.</p>",
    author_name: "WanAzemi",
    author_role: "Real Estate Negotiator (PEA 3949)",
    reading_time: "5 min read",
    status: "Published",
    views_count: 148,
    created_at: "2026-08-20T08:00:00Z"
  },
  {
    id: "art-2",
    title: "Perbezaan Freehold vs Leasehold Untuk Hartanah Komersial & Industri di Malaysia",
    slug: "perbezaan-freehold-vs-leasehold-hartanah-komersial-industri",
    category: "Tips Komersial",
    cover_image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Ketahui kelebihan dan impak jangka panjang status pegangan tanah terhadap nilai kecairan (liquidity), pinjaman bank, dan kelulusan pelaburan korporat anda.",
    content: "<h2>Pengenalan</h2><p>Salah satu soalan paling kerap ditanya oleh pelabur korporat dan pembeli premis perniagaan ialah: <em>"Adakah hartanah pegangan pajakan (Leasehold) berbaloi untuk pelaburan kilang atau shoplot berbanding Pegangan Bebas (Freehold)?"</em></p><h3>1. Pemilikan dan Tempoh Masa</h3><p><strong>Freehold (Pegangan Bebas):</strong> Pemilik memegang hak milik selama-lamanya tanpa had masa. Nilai hartanah cenderung meningkat secara konsisten dan proses pindah milik biasanya lebih pantas kerana tidak memerlukan kebenaran Pihak Berkuasa Negeri (State Consent) bagi kebanyakan kes.</p><p><strong>Leasehold (Pegangan Pajakan):</strong> Tanah dipajak daripada kerajaan negeri untuk tempoh tertentu, lazimnya 99 tahun atau 60 tahun untuk zon industri tertentu. Apabila baki tempoh berkurang (contohnya bawah 30 tahun), pemilik boleh memohon penyambungan pajakan (Lease Extension) dengan membayar premium kepada Pejabat Tanah.</p><h3>2. Pembiayaan Bank (Commercial Loan Approval)</h3><p>Bank tempatan dan antarabangsa amat terbuka membiayai hartanah Leasehold selagi baki tempoh pajakan melebihi 30 hingga 50 tahun. Untuk hartanah industri di kawasan prime seperti Seksyen 51A Petaling Jaya atau Glenmarie, banyak kilang berstatus Leasehold mencatatkan kadar sewaan dan kenaikan nilai modal yang sangat tinggi.</p><h3>3. Kadar Pulangan Sewa (Rental Yield)</h3><p>Dari sudut pulangan sewaan (Rental Yield), penyewa korporat tidak mengambil kira sama ada kilang tersebut Freehold atau Leasehold—mereka hanya menilai lokasi strategik, akses lebuh raya, dan fasiliti bangunan. Oleh itu, hartanah Leasehold sering kali memberikan pulangan sewaan (yield %) yang lebih tinggi kerana harga belian masukannya yang lebih kompetitif.</p><hr><h3>Kesimpulan</h3><p>Pilihan terbaik bergantung pada objektif syarikat anda sama ada untuk operasi jangka masa panjang turun-temurun atau untuk memaksimumkan pulangan tunai tahunan.</p>",
    author_name: "WanAzemi",
    author_role: "Real Estate Negotiator (PEA 3949)",
    reading_time: "4 min read",
    status: "Published",
    views_count: 112,
    created_at: "2026-08-18T08:00:00Z"
  },
  {
    id: "art-3",
    title: "Cara Menilai Potensi Tanah Pembangunan (Development Land) di Kawasan Pinggir Bandar",
    slug: "cara-menilai-potensi-tanah-pembangunan-pinggir-bandar",
    category: "Pelaburan Tanah",
    cover_image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Langkah strategik menyemak status zon, akses rizab jalan, bekalan utiliti, dan kebolehlaksanaan tukar syarat tanah untuk memaksimumkan keuntungan pembangunan.",
    content: "<h2>Pengenalan</h2><p>Membeli tanah berkeluasan besar (antara 2 ekar hingga 50 ekar) di kawasan pesat membangun seperti Sepang, Dengkil, Kuala Langat, atau Sungai Buloh menawarkan potensi pulangan berlipat ganda untuk pemaju dan syarikat korporat.</p><h3>1. Semakan Pelan Struktur & Rancangan Tempatan (Local Plan / RTD)</h3><p>Sebelum meletakkan sebarang deposit, pastikan anda menyemak Rancangan Tempatan Daerah di Pejabat Perancang Bandar. Tanah pertanian yang berada di dalam zon guna tanah komersial atau kediaman mempunyai potensi tinggi untuk diluluskan permohonan Tukar Syarat (Section 124 NLC) dan Pecah Sempadan (Subdivision).</p><h3>2. Hak Akses Rizab Jalan Awam (Right of Way)</h3><p>Tanah yang tidak mempunyai rizab jalan awam yang diwartakan (landlocked) akan menghadapi kesukaran semasa memohon Kebenaran Merancang (KM). Pastikan tapak mempunyai frontage jalan utama sekurang-kurangnya jalan negeri atau jalan persekutuan.</p><h3>3. Ketersediaan Infrastruktur & Utiliti Utama</h3><p>Jarak sambungan ke punca bekalan elektrik utama (TNB Transmission Line), bekalan air paip utama (Air Selangor), dan sistem perparitan/pembetungan memainkan peranan penting dalam mengira kos pembangunan kasar (Gross Development Cost).</p><hr><h3>Mencari Tanah Pembangunan di Selangor?</h3><p>Hubungi <strong>Corporate Estate Malaysia</strong> untuk senarai eksklusif tanah pembangunan komersial, perumahan, dan zon perindustrian utama.</p>",
    author_name: "WanAzemi",
    author_role: "Real Estate Negotiator (PEA 3949)",
    reading_time: "6 min read",
    status: "Published",
    views_count: 95,
    created_at: "2026-08-15T08:00:00Z"
  }
];

let allArticles = [];
let activeCategory = 'ALL';
let currentSearchTerm = '';

// Helper: Format Date
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Extract Slug from URL
function getRequestedSlug() {
  const path = window.location.pathname;
  if (path.startsWith('/blog/') && path.length > 6) {
    const raw = path.substring(6);
    return decodeURIComponent(raw.replace(/\/+$/, ''));
  }
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('slug') || null;
}

// Fetch Articles from Supabase
async function fetchArticles() {
  try {
    if (typeof supabaseClient !== 'undefined') {
      const { data, error } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('status', 'Published')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        allArticles = data;
        return;
      }
    }
  } catch (err) {
    console.warn('Supabase fetch error, using fallback articles:', err);
  }
  allArticles = FALLBACK_ARTICLES;
}

// Render Blog Archive View
function renderBlogArchive() {
  const archiveView = document.getElementById('blogArchiveView');
  const readerView = document.getElementById('blogReaderView');
  const grid = document.getElementById('blogGrid');
  const emptyState = document.getElementById('blogEmptyState');

  if (archiveView) archiveView.style.display = 'block';
  if (readerView) readerView.style.display = 'none';

  let filtered = allArticles;

  if (activeCategory !== 'ALL') {
    filtered = filtered.filter(a => (a.category || '').toLowerCase() === activeCategory.toLowerCase());
  }

  if (currentSearchTerm.trim()) {
    const q = currentSearchTerm.toLowerCase();
    filtered = filtered.filter(a => 
      (a.title || '').toLowerCase().includes(q) ||
      (a.excerpt || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    if (grid) grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  if (grid) {
    grid.innerHTML = filtered.map(item => {
      const articleUrl = `/blog/${encodeURIComponent(item.slug)}`;
      const coverImg = item.cover_image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';
      const readTime = item.reading_time || '4 min read';
      const dateStr = formatDate(item.created_at);

      return `
        <a href="${articleUrl}" class="blog-card" onclick="handleArticleClick(event, '${item.slug}')">
          <div class="blog-card-img-wrap">
            <img src="${coverImg}" alt="${item.title}" class="blog-card-img" loading="lazy">
            <span class="blog-card-cat">${item.category || 'PANDUAN'}</span>
          </div>
          <div class="blog-card-body">
            <div class="blog-card-meta">
              <span>📅 ${dateStr}</span>
              <span>•</span>
              <span>⏱️ ${readTime}</span>
            </div>
            <h3 class="blog-card-title">${item.title}</h3>
            <p class="blog-card-excerpt">${item.excerpt || ''}</p>
            <div class="blog-card-footer">
              <span>BACA ARTIKEL PENUH</span>
              <span>→</span>
            </div>
          </div>
        </a>
      `;
    }).join('');
  }
}

// Render Single Article Reader View
function renderSingleArticle(slug) {
  const archiveView = document.getElementById('blogArchiveView');
  const readerView = document.getElementById('blogReaderView');
  const container = document.getElementById('articleContentContainer');

  const article = allArticles.find(a => a.slug === slug);
  if (!article) {
    renderBlogArchive();
    return;
  }

  if (archiveView) archiveView.style.display = 'none';
  if (readerView) readerView.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update Page Title & Meta for SEO
  document.title = `${article.title} | Corporate Estate Malaysia`;

  const coverImg = article.cover_image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';
  const dateStr = formatDate(article.created_at);
  const readTime = article.reading_time || '4 min read';
  const author = article.author_name || 'WanAzemi';
  const authorRole = article.author_role || 'Real Estate Negotiator (PEA 3949)';

  const currentUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(article.title);
  const waShareUrl = `https://wa.me/?text=${shareTitle}%20${currentUrl}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`;

  const waConsultUrl = `https://wa.me/60173569452?text=${encodeURIComponent('Hello WanAzemi, saya baru membaca artikel: "' + article.title + '". Boleh saya dapatkan khidmat nasihat hartanah korporat?')}`;

  if (container) {
    container.innerHTML = `
      <div class="article-breadcrumb">
        <a href="/blog.html" onclick="backToArchive(event)">← Kembali ke Blog & Panduan</a>
        <span>/</span>
        <span style="color: var(--cem-red); font-weight: 700;">${article.category}</span>
      </div>

      <h1 class="article-title">${article.title}</h1>

      <div class="article-author-bar">
        <img src="/agent-wanazemi.png" alt="${author}" class="author-avatar" onerror="this.src='/logo.png'">
        <div class="author-info">
          <span class="author-name">${author}</span>
          <span class="author-meta">${authorRole} • ${dateStr} • ⏱️ ${readTime}</span>
        </div>
      </div>

      <img src="${coverImg}" alt="${article.title}" class="article-cover">

      <div class="article-body">
        ${article.content}
      </div>

      <!-- Lead Capture CTA Box -->
      <div class="article-cta-box">
        <h3 style="color: white; margin-bottom: 0.5rem;">Mencari Hartanah Industri, Komersial atau Tanah di Selangor?</h3>
        <p style="color: #cbd5e1; margin-bottom: 1.25rem;">Pasukan pakar Corporate Estate Malaysia sedia membantu anda mencari premis perniagaan yang tepat dengan spesifikasi teknikal lengkap.</p>
        <a href="${waConsultUrl}" target="_blank" class="btn-primary" style="background: #25d366; color: white; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.75rem; border-radius: 50px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 15px rgba(37,211,102,0.35);">
          ${WHATSAPP_ICON_SVG} Dapatkan Khidmat Nasihat Percuma
        </a>
      </div>

      <!-- Social Share Bar -->
      <div class="article-share-bar">
        <span style="font-weight: 800; font-size: 0.9rem; color: var(--cem-navy);">Kongsi Artikel Ini:</span>
        <a href="${waShareUrl}" target="_blank" class="share-btn" style="background: #25d366;">${WHATSAPP_ICON_SVG} WhatsApp</a>
        <a href="${linkedinShareUrl}" target="_blank" class="share-btn" style="background: #0077b5;">LinkedIn</a>
        <a href="${fbShareUrl}" target="_blank" class="share-btn" style="background: #1877f2;">Facebook</a>
        <button onclick="copyArticleLink()" class="share-btn" style="background: var(--cem-navy);">📋 Salin Pautan</button>
      </div>
    `;
  }

  // Increment views count in Supabase asynchronously
  if (typeof supabaseClient !== 'undefined' && article.id && !article.id.startsWith('art-')) {
    supabaseClient.rpc('increment_article_views', { article_id: article.id }).catch(() => {});
  }
}

// Navigation & Routing Handlers
window.handleArticleClick = function(e, slug) {
  if (e) e.preventDefault();
  window.history.pushState({ slug }, '', `/blog/${encodeURIComponent(slug)}`);
  renderSingleArticle(slug);
};

window.backToArchive = function(e) {
  if (e) e.preventDefault();
  window.history.pushState({}, '', '/blog.html');
  document.title = 'Blog & Panduan Hartanah Industri | Corporate Estate Malaysia';
  renderBlogArchive();
};

window.copyArticleLink = function() {
  navigator.clipboard.writeText(window.location.href);
  alert('Pautan artikel telah disalin ke clipboard! 📋');
};

// Setup Category & Search Filter Handlers
function setupBlogControls() {
  const searchInput = document.getElementById('blogSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      renderBlogArchive();
    });
  }

  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-cat') || 'ALL';
      renderBlogArchive();
    });
  });

  window.addEventListener('popstate', () => {
    const slug = getRequestedSlug();
    if (slug) {
      renderSingleArticle(slug);
    } else {
      renderBlogArchive();
    }
  });
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  setupBlogControls();
  await fetchArticles();

  const slug = getRequestedSlug();
  if (slug) {
    renderSingleArticle(slug);
  } else {
    renderBlogArchive();
  }
});
