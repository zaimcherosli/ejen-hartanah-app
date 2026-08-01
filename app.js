// App.js - Public Portal Logic with Ultra-Clean Query URLs (?kilang-sesebuah-2-tingkat-modern-i-park)
let allListings = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchListings();
  setupFilterListeners();
});

// Helper: Convert Title to Clean Human-Friendly URL Slug
function createSlug(title) {
  if (!title) return '';
  return title.toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper: Copy Ultra-Clean WhatsApp Share Link to Clipboard
function copyShareLink(id, title) {
  const slug = createSlug(title);
  const shareUrl = `${window.location.origin}/listings.html?${encodeURIComponent(slug)}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`🔗 Pautan WhatsApp ringkas untuk "${title}" telah berjaya disalin!\n\n${shareUrl}\n\nAnda boleh paste terus di WhatsApp.`);
    }).catch(err => {
      fallbackCopyText(shareUrl);
    });
  } else {
    fallbackCopyText(shareUrl);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
  alert(`🔗 Pautan listing telah disalin!\n\n${text}`);
}

// Fetch listings from Supabase
async function fetchListings() {
  const container = document.getElementById('listingsContainer');
  try {
    if (!supabaseClient) {
      if (container) container.innerHTML = '<div class="empty-state">Please ensure Supabase configuration is set up properly.</div>';
      return;
    }

    const { data, error } = await supabaseClient
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      if (container) container.innerHTML = `<div class="empty-state">Failed to load property listings: ${error.message}</div>`;
      return;
    }

    allListings = data || [];
    renderListings(allListings);

    // ⚡ Auto-open listing modal if URL has query parameter (?kilang-xxx or ?slug=xxx or ?id=xxx)
    checkUrlQueryParams();

  } catch (err) {
    console.error('Unexpected error:', err);
    if (container) container.innerHTML = '<div class="empty-state">An unexpected error occurred.</div>';
  }
}

// Check URL Query Parameters for Auto-Opening Deep Links
function checkUrlQueryParams() {
  if (allListings.length === 0) return;

  const urlParams = new URLSearchParams(window.location.search);
  const targetSlug = urlParams.get('slug');
  const targetId = urlParams.get('id');

  // Extract raw query string without '?'
  const rawSearch = window.location.search.substring(1).replace(/^slug=|^id=/, '');

  if (targetSlug) {
    const match = allListings.find(x => createSlug(x.title) === targetSlug.toLowerCase());
    if (match) openModal(match.id, false);
  } else if (targetId) {
    const match = allListings.find(x => x.id === targetId);
    if (match) openModal(match.id, false);
  } else if (rawSearch) {
    const cleanSearch = decodeURIComponent(rawSearch.toLowerCase());
    const match = allListings.find(x => createSlug(x.title) === cleanSearch || x.id === cleanSearch);
    if (match) openModal(match.id, false);
  }
}

// Render property listing cards
function renderListings(listings) {
  const container = document.getElementById('listingsContainer');
  const totalCountEl = document.getElementById('totalCount');
  if (totalCountEl) totalCountEl.innerText = listings.length;

  if (!container) return;

  if (listings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Property Listings Found</h3>
        <p>Try adjusting your search filters or browse other industrial areas.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = listings.map(item => {
    const formattedPrice = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(item.asking_price);
    const mainImg = (item.images && item.images.length > 0) 
      ? item.images[0] 
      : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';

    const slug = createSlug(item.title);
    const shareUrl = `${window.location.origin}/listings.html?${encodeURIComponent(slug)}`;

    const phone = item.agent_phone || '60108118559';
    const waText = encodeURIComponent(`Hello Corporate Estate Malaysia, I am interested in your listing:\n*${item.title}*\nAsking Price: ${formattedPrice}\nLocation: ${item.location}\nPautan: ${shareUrl}`);
    const waUrl = `https://wa.me/${phone}?text=${waText}`;

    const safeTitle = item.title.replace(/'/g, "\\'");

    return `
      <div class="property-card">
        <div class="card-img-wrap" onclick="openModal('${item.id}')" style="cursor: pointer;">
          <img src="${mainImg}" alt="${item.title}" class="card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'">
          <span class="badge-tag">${item.property_type} (${item.listing_type})</span>
          <span class="badge-status">${item.status}</span>
        </div>
        <div class="card-body">
          <div class="card-price">${formattedPrice}</div>
          <h3 class="card-title" onclick="openModal('${item.id}')" style="cursor: pointer;">${item.title}</h3>
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
              <span class="label">Industrial Zone</span>
              <span class="val">${item.zoning || '-'}</span>
            </div>
          </div>

          <div class="card-actions">
            <a href="${waUrl}" target="_blank" class="btn-whatsapp">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg> WhatsApp
            </a>
            <button onclick="copyShareLink('${item.id}', '${safeTitle}')" class="btn-detail" title="Copy Direct URL Link" style="padding: 0.65rem 0.65rem;">🔗 Share</button>
            <button onclick="openModal('${item.id}')" class="btn-detail">Details</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Setup Filters for State, Area, Type, Transaction, Zoning & Keyword
function setupFilterListeners() {
  const state = document.getElementById('filterState');
  const area = document.getElementById('filterArea');
  const type = document.getElementById('filterType');
  const listingType = document.getElementById('filterListingType');
  const zoning = document.getElementById('filterZoning');
  const keyword = document.getElementById('searchKeyword');

  const applyFilters = () => {
    let filtered = [...allListings];

    if (state && state.value) {
      filtered = filtered.filter(x => x.location && x.location.toLowerCase().includes(state.value.toLowerCase()));
    }
    if (area && area.value) {
      filtered = filtered.filter(x => x.location && x.location.toLowerCase().includes(area.value.toLowerCase()));
    }
    if (type && type.value) {
      filtered = filtered.filter(x => x.property_type === type.value);
    }
    if (listingType && listingType.value) {
      filtered = filtered.filter(x => x.listing_type === listingType.value);
    }
    if (zoning && zoning.value) {
      filtered = filtered.filter(x => x.zoning === zoning.value);
    }
    if (keyword && keyword.value) {
      const q = keyword.value.toLowerCase();
      filtered = filtered.filter(x => 
        (x.title && x.title.toLowerCase().includes(q)) || 
        (x.location && x.location.toLowerCase().includes(q)) ||
        (x.description && x.description.toLowerCase().includes(q))
      );
    }

    renderListings(filtered);
  };

  if (state) state.addEventListener('change', applyFilters);
  if (area) area.addEventListener('change', applyFilters);
  if (type) type.addEventListener('change', applyFilters);
  if (listingType) listingType.addEventListener('change', applyFilters);
  if (zoning) zoning.addEventListener('change', applyFilters);
  if (keyword) keyword.addEventListener('input', applyFilters);
}

// Open Detail View Modal & Update Browser URL dynamically to Clean Query (?kilang-xxx)
function openModal(id, updateHistory = true) {
  const item = allListings.find(x => x.id === id);
  if (!item) return;

  const formattedPrice = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(item.asking_price);
  const modalBody = document.getElementById('modalBody');

  const phone = item.agent_phone || '60108118559';
  const slug = createSlug(item.title);
  const shareUrl = `${window.location.origin}/listings.html?${encodeURIComponent(slug)}`;
  const waText = encodeURIComponent(`Hello Corporate Estate Malaysia, I am interested in your property listing:\n*${item.title}*\nAsking Price: ${formattedPrice}\nLocation: ${item.location}\nPautan: ${shareUrl}`);
  const waUrl = `https://wa.me/${phone}?text=${waText}`;

  let imagesHtml = '';
  if (item.images && item.images.length > 0) {
    imagesHtml = `
      <div style="display: flex; gap: 0.5rem; overflow-x: auto; margin-bottom: 1.5rem; padding-bottom: 0.5rem;">
        ${item.images.map(img => `<img src="${img}" style="height: 180px; border-radius: 8px; object-fit: cover;" />`).join('')}
      </div>
    `;
  }

  const safeTitle = item.title.replace(/'/g, "\\'");

  if (modalBody) {
    modalBody.innerHTML = `
      <h2 style="font-size: 1.4rem; margin-bottom: 0.35rem; color: var(--text-main); line-height: 1.25;">${item.title}</h2>
      <div style="font-size: 1.35rem; font-weight: 900; color: var(--cem-red); margin-bottom: 1rem;">${formattedPrice} (${item.listing_type})</div>
      
      ${imagesHtml}

      <div class="spec-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 1.5rem;">
        <div class="spec-item"><span class="label">Category</span><span class="val">${item.category || 'Industrial'}</span></div>
        <div class="spec-item"><span class="label">Property Type</span><span class="val">${item.property_type}</span></div>
        <div class="spec-item"><span class="label">Status</span><span class="val">${item.status}</span></div>
        <div class="spec-item"><span class="label">Power Supply</span><span class="val">${item.power_supply_amp || '-'}</span></div>
        <div class="spec-item"><span class="label">Ceiling Height</span><span class="val">${item.ceiling_height_ft || '-'}</span></div>
        <div class="spec-item"><span class="label">Floor Loading</span><span class="val">${item.floor_loading_kn || '-'}</span></div>
        <div class="spec-item"><span class="label">Industrial Zone</span><span class="val">${item.zoning || '-'}</span></div>
        <div class="spec-item"><span class="label">Built-up Size</span><span class="val">${item.built_up_sqft ? item.built_up_sqft + ' sqft' : '-'}</span></div>
        <div class="spec-item"><span class="label">Land Area</span><span class="val">${item.land_area_sqft ? item.land_area_sqft + ' sqft' : '-'}</span></div>
      </div>

      <h4 style="margin-bottom: 0.5rem; font-size: 1rem; color: var(--text-main);">Full Description & Specifications:</h4>
      <p style="color: var(--text-muted); font-size: 0.95rem; white-space: pre-line; margin-bottom: 1.5rem;">${item.description || 'No additional description provided.'}</p>

      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <a href="${waUrl}" target="_blank" class="btn-whatsapp" style="padding: 0.8rem 1.25rem;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg> Contact Agent on WhatsApp
        </a>
        <button onclick="copyShareLink('${item.id}', '${safeTitle}')" class="btn-detail" style="padding: 0.8rem 1.25rem; font-weight: 800; background: var(--bg-subtle);">
          🔗 Copy Direct Share Link
        </button>
      </div>
    `;
  }

  // ⚡ Dynamically update URL in browser bar to Ultra-Clean Query (?kilang-xxx) without page reload
  if (updateHistory && history.pushState) {
    const newUrl = `${window.location.protocol}//${window.location.host}/listings.html?${encodeURIComponent(slug)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }

  const detailModal = document.getElementById('detailModal');
  if (detailModal) detailModal.classList.add('active');
}

function closeModal() {
  const detailModal = document.getElementById('detailModal');
  if (detailModal) detailModal.classList.remove('active');
  
  // ⚡ Reset URL back to clean listings portal URL
  if (history.pushState) {
    const cleanUrl = `${window.location.protocol}//${window.location.host}/listings.html`;
    window.history.pushState({ path: cleanUrl }, '', cleanUrl);
  }
}
