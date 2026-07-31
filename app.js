// App.js - Public Portal Logic
let allListings = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchListings();
  setupFilterListeners();
});

// Fetch listings from Supabase
async function fetchListings() {
  const container = document.getElementById('listingsContainer');
  try {
    if (!supabaseClient) {
      container.innerHTML = '<div class="empty-state">Sila pastikan Supabase Config ditetapkan dengan betul.</div>';
      return;
    }

    const { data, error } = await supabaseClient
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      container.innerHTML = `<div class="empty-state">Gagal memuatkan listing: ${error.message}</div>`;
      return;
    }

    allListings = data || [];
    renderListings(allListings);
  } catch (err) {
    console.error('Unexpected error:', err);
    container.innerHTML = '<div class="empty-state">Ralat tidak dijangka berlaku.</div>';
  }
}

// Render property listing cards
function renderListings(listings) {
  const container = document.getElementById('listingsContainer');
  document.getElementById('totalCount').innerText = listings.length;

  if (listings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Tiada Listing Dijumpai</h3>
        <p>Cuba tukar penapis carian anda atau daftar listing baharu di Portal Ejen.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = listings.map(item => {
    const formattedPrice = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(item.asking_price);
    const mainImg = (item.images && item.images.length > 0) 
      ? item.images[0] 
      : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';

    const phone = item.agent_phone || '60123456789';
    const waText = encodeURIComponent(`Helo, saya berminat dengan listing industrial anda:\n*${item.title}*\nHarga: ${formattedPrice}\nLokasi: ${item.location}\nSila kongsi maklumat lanjut.`);
    const waUrl = `https://wa.me/${phone}?text=${waText}`;

    return `
      <div class="property-card">
        <div class="card-img-wrap">
          <img src="${mainImg}" alt="${item.title}" class="card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'">
          <span class="badge-tag">${item.property_type} (${item.listing_type})</span>
          <span class="badge-status">${item.status}</span>
        </div>
        <div class="card-body">
          <div class="card-price">${formattedPrice}</div>
          <h3 class="card-title">${item.title}</h3>
          <div class="card-location">📍 ${item.location}</div>
          
          <div class="spec-grid">
            <div class="spec-item">
              <span class="label">Power Supply</span>
              <span class="val">${item.power_supply_amp || '-'}</span>
            </div>
            <div class="spec-item">
              <span class="label">Ceiling Height</span>
              <span class="val">${item.ceiling_height_ft || '-'}</span>
            </div>
            <div class="spec-item">
              <span class="label">Floor Loading</span>
              <span class="val">${item.floor_loading_kn || '-'}</span>
            </div>
            <div class="spec-item">
              <span class="label">Zon Industri</span>
              <span class="val">${item.zoning || '-'}</span>
            </div>
          </div>

          <div class="card-actions">
            <a href="${waUrl}" target="_blank" class="btn-whatsapp">
              💬 WhatsApp Ejen
            </a>
            <button onclick="openModal('${item.id}')" class="btn-detail">Lihat Spec</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Setup Filters
function setupFilterListeners() {
  const cat = document.getElementById('filterCategory');
  const type = document.getElementById('filterType');
  const listingType = document.getElementById('filterListingType');
  const zoning = document.getElementById('filterZoning');
  const keyword = document.getElementById('searchKeyword');

  const applyFilters = () => {
    let filtered = [...allListings];

    if (cat.value) filtered = filtered.filter(x => x.category === cat.value);
    if (type.value) filtered = filtered.filter(x => x.property_type === type.value);
    if (listingType.value) filtered = filtered.filter(x => x.listing_type === listingType.value);
    if (zoning.value) filtered = filtered.filter(x => x.zoning === zoning.value);
    if (keyword.value) {
      const q = keyword.value.toLowerCase();
      filtered = filtered.filter(x => 
        (x.title && x.title.toLowerCase().includes(q)) || 
        (x.location && x.location.toLowerCase().includes(q)) ||
        (x.description && x.description.toLowerCase().includes(q))
      );
    }

    renderListings(filtered);
  };

  cat.addEventListener('change', applyFilters);
  type.addEventListener('change', applyFilters);
  listingType.addEventListener('change', applyFilters);
  zoning.addEventListener('change', applyFilters);
  keyword.addEventListener('input', applyFilters);
}

// Open Detail View Modal
function openModal(id) {
  const item = allListings.find(x => x.id === id);
  if (!item) return;

  const formattedPrice = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(item.asking_price);
  const modalBody = document.getElementById('modalBody');

  const phone = item.agent_phone || '60123456789';
  const waText = encodeURIComponent(`Helo, saya berminat dengan listing industrial anda:\n*${item.title}*\nHarga: ${formattedPrice}\nLokasi: ${item.location}`);
  const waUrl = `https://wa.me/${phone}?text=${waText}`;

  let imagesHtml = '';
  if (item.images && item.images.length > 0) {
    imagesHtml = `
      <div style="display: flex; gap: 0.5rem; overflow-x: auto; margin-bottom: 1.5rem; padding-bottom: 0.5rem;">
        ${item.images.map(img => `<img src="${img}" style="height: 180px; border-radius: 8px; object-fit: cover;" />`).join('')}
      </div>
    `;
  }

  modalBody.innerHTML = `
    <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${item.title}</h2>
    <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-amber); margin-bottom: 1rem;">${formattedPrice} (${item.listing_type})</div>
    
    ${imagesHtml}

    <div class="spec-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 1.5rem;">
      <div class="spec-item"><span class="label">Kategori</span><span class="val">${item.category}</span></div>
      <div class="spec-item"><span class="label">Jenis Hartanah</span><span class="val">${item.property_type}</span></div>
      <div class="spec-item"><span class="label">Status</span><span class="val">${item.status}</span></div>
      <div class="spec-item"><span class="label">Power Supply</span><span class="val">${item.power_supply_amp || '-'}</span></div>
      <div class="spec-item"><span class="label">Ceiling Height</span><span class="val">${item.ceiling_height_ft || '-'}</span></div>
      <div class="spec-item"><span class="label">Floor Loading</span><span class="val">${item.floor_loading_kn || '-'}</span></div>
      <div class="spec-item"><span class="label">Zon Industri</span><span class="val">${item.zoning || '-'}</span></div>
      <div class="spec-item"><span class="label">Built-up Size</span><span class="val">${item.built_up_sqft ? item.built_up_sqft + ' sqft' : '-'}</span></div>
      <div class="spec-item"><span class="label">Land Area</span><span class="val">${item.land_area_sqft ? item.land_area_sqft + ' sqft' : '-'}</span></div>
    </div>

    <h4 style="margin-bottom: 0.5rem; font-size: 1rem;">Keterangan & Spesifikasi Penuh:</h4>
    <p style="color: var(--text-muted); font-size: 0.95rem; white-space: pre-line; margin-bottom: 1.5rem;">${item.description || 'Tiada keterangan tambahan.'}</p>

    <div style="display: flex; gap: 1rem;">
      <a href="${waUrl}" target="_blank" class="btn-whatsapp" style="padding: 0.8rem;">
        💬 Hubungi Ejen di WhatsApp
      </a>
    </div>
  `;

  document.getElementById('detailModal').classList.add('active');
}

function closeModal() {
  document.getElementById('detailModal').classList.remove('active');
}
