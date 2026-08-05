// App.js - Public Portal Logic with Enterprise /listings/title-slug URL Routing
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

// Helper: Copy Enterprise /listings/slug WhatsApp Share Link to Clipboard
function copyShareLink(id, title) {
  const slug = createSlug(title);
  const shareUrl = `${window.location.origin}/listings/${encodeURIComponent(slug)}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`🔗 Pautan WhatsApp rasmi untuk "${title}" telah berjaya disalin!\n\n${shareUrl}\n\nAnda boleh paste terus di WhatsApp.`);
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

    // ⚡ Auto-open listing modal if URL is /listings/nama-hartanah
    checkUrlPathForListing();

  } catch (err) {
    console.error('Unexpected error:', err);
    if (container) container.innerHTML = '<div class="empty-state">An unexpected error occurred.</div>';
  }
}

// Check URL Path /listings/slug for Auto-Opening Deep Links
function checkUrlPathForListing() {
  if (allListings.length === 0) return;

  const currentPath = decodeURIComponent(window.location.pathname);

  // 1. Check /listings/title-slug
  if (currentPath.includes('/listings/')) {
    const parts = currentPath.split('/listings/');
    if (parts.length > 1 && parts[1]) {
      const slugFromPath = parts[1].replace(/\/+$/, '').toLowerCase();
      const match = allListings.find(x => createSlug(x.title) === slugFromPath || x.id === slugFromPath);
      if (match) {
        openModal(match.id, false);
        return;
      }
    }
  }

  // 2. Backward compatibility for ?slug=xxx or ?id=xxx query params
  const urlParams = new URLSearchParams(window.location.search);
  const targetSlug = urlParams.get('slug');
  const targetId = urlParams.get('id');
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
    const shareUrl = `${window.location.origin}/listings/${encodeURIComponent(slug)}`;

    const phone = item.agent_phone || '60173569452';
    const waText = encodeURIComponent(`Hello Corporate Estate Malaysia, I am interested in your listing:\n*${item.title}*\nAsking Price: ${formattedPrice}\nLocation: ${item.location}\nPautan: ${shareUrl}`);
    const waUrl = `https://wa.me/${phone}?text=${waText}`;

    const safeTitle = item.title.replace(/'/g, "\\'");

    // Extract Tenure & Zoning
    const rawZoning = item.zoning || '';
    let tenureVal = 'Freehold';
    let zoneVal = rawZoning;
    if (rawZoning.includes('|')) {
      const parts = rawZoning.split('|');
      tenureVal = parts[0].trim();
      zoneVal = parts[1].trim();
    } else if (['Freehold', 'Leasehold', 'Leasehold Extension'].includes(rawZoning)) {
      tenureVal = rawZoning;
      zoneVal = '-';
    }

    const isSale = (item.listing_type || '').toLowerCase().includes('sale');
    const badgeTypeClass = isSale ? 'badge-sale' : 'badge-rent';

    return `
      <div class="property-card">
        <div class="card-img-wrap" onclick="openModal('${item.id}')" style="cursor: pointer;">
          <img src="${mainImg}" alt="${item.title}" class="card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'">
          <span class="badge-tag ${badgeTypeClass}">${item.property_type} (${item.listing_type})</span>
          <span class="badge-status">${item.status}</span>
        </div>
        <div class="card-body">
          <div class="card-price">${formattedPrice}</div>
          <h3 class="card-title" onclick="openModal('${item.id}')" style="cursor: pointer;">${item.title}</h3>
          <div class="card-location">📍 ${item.location} • <strong style="color: var(--cem-navy);">${tenureVal}</strong></div>
          
          <div class="spec-grid">
            <div class="spec-item">
              <span class="label">Land Tenure</span>
              <span class="val" style="color: var(--cem-navy); font-weight: 800;">${tenureVal}</span>
            </div>
            <div class="spec-item">
              <span class="label">Power Supply</span>
              <span class="val">${item.power_supply_amp || '-'}</span>
            </div>
            <div class="spec-item">
              <span class="label">Ceiling Height</span>
              <span class="val">${item.ceiling_height_ft || '-'}</span>
            </div>
            <div class="spec-item">
              <span class="label">Zone / Details</span>
              <span class="val">${zoneVal || '-'}</span>
            </div>
          </div>

          <div class="card-actions">
            <a href="${waUrl}" target="_blank" class="btn-whatsapp">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg> WhatsApp
            </a>
            <button onclick="openModal('${item.id}')" class="btn-detail" style="flex: 1;">View Details</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Setup Filters for State, Area/Keyword Text Search, Type, Transaction, Tenure
function setupFilterListeners() {
  const state = document.getElementById('filterState');
  const area = document.getElementById('filterArea');
  const type = document.getElementById('filterType');
  const listingType = document.getElementById('filterListingType');
  const tenure = document.getElementById('filterTenure');
  const zoning = document.getElementById('filterZoning');
  const keyword = document.getElementById('searchKeyword');

  // Pre-fill filters from URL Query String if present (e.g. ?area=Shah+Alam or ?q=Shah+Alam)
  const urlParams = new URLSearchParams(window.location.search);
  const paramState = urlParams.get('state');
  const paramListingType = urlParams.get('listingType');
  const paramType = urlParams.get('type');
  const paramArea = urlParams.get('area') || urlParams.get('q') || urlParams.get('search');

  if (state && paramState) state.value = paramState;
  if (listingType && paramListingType) listingType.value = paramListingType;
  if (type && paramType) type.value = paramType;
  if (area && paramArea) area.value = paramArea;
  if (keyword && paramArea) keyword.value = paramArea;

  const applyFilters = () => {
    let filtered = [...allListings];

    if (state && state.value) {
      filtered = filtered.filter(x => x.location && x.location.toLowerCase().includes(state.value.toLowerCase()));
    }

    // Real-time Text Search for Area / Keyword
    const searchText = (area && area.value ? area.value : (keyword && keyword.value ? keyword.value : '')).toLowerCase().trim();
    if (searchText) {
      filtered = filtered.filter(x => 
        (x.title && x.title.toLowerCase().includes(searchText)) || 
        (x.location && x.location.toLowerCase().includes(searchText)) ||
        (x.description && x.description.toLowerCase().includes(searchText)) ||
        (x.property_type && x.property_type.toLowerCase().includes(searchText))
      );
    }

    if (type && type.value) {
      filtered = filtered.filter(x => x.property_type === type.value);
    }
    if (listingType && listingType.value) {
      filtered = filtered.filter(x => x.listing_type === listingType.value);
    }
    if (tenure && tenure.value) {
      filtered = filtered.filter(x => x.zoning && x.zoning.toLowerCase().includes(tenure.value.toLowerCase()));
    }
    if (zoning && zoning.value) {
      filtered = filtered.filter(x => x.zoning && x.zoning.toLowerCase().includes(zoning.value.toLowerCase()));
    }

    renderListings(filtered);
  };

  if (state) state.addEventListener('change', applyFilters);
  if (area) {
    area.addEventListener('input', applyFilters);
    area.addEventListener('change', applyFilters);
  }
  if (type) type.addEventListener('change', applyFilters);
  if (listingType) listingType.addEventListener('change', applyFilters);
  if (tenure) tenure.addEventListener('change', applyFilters);
  if (zoning) zoning.addEventListener('change', applyFilters);
  if (keyword) {
    keyword.addEventListener('input', applyFilters);
    keyword.addEventListener('change', applyFilters);
  }

  // Initial Filter Trigger if URL params exist
  if (paramState || paramListingType || paramType || paramArea) {
    applyFilters();
  }
}

// Open Detail View Modal & Update Browser URL dynamically to /listings/title-slug
function openModal(id, updateHistory = true) {
  const item = allListings.find(x => x.id === id);
  if (!item) return;

  const formattedPrice = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(item.asking_price);
  const modalBody = document.getElementById('modalBody');

  const phone = item.agent_phone || '60173569452';
  const slug = createSlug(item.title);
  const shareUrl = `${window.location.origin}/listings/${encodeURIComponent(slug)}`;
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

  const rawZoning = item.zoning || '';
  let tenureVal = 'Freehold';
  let zoneVal = rawZoning;
  if (rawZoning.includes('|')) {
    const parts = rawZoning.split('|');
    tenureVal = parts[0].trim();
    zoneVal = parts[1].trim();
  } else if (['Freehold', 'Leasehold', 'Leasehold Extension'].includes(rawZoning)) {
    tenureVal = rawZoning;
    zoneVal = '-';
  }

  if (modalBody) {
    modalBody.innerHTML = `
      <h2 style="font-size: 1.4rem; margin-bottom: 0.35rem; color: var(--text-main); line-height: 1.25;">${item.title}</h2>
      <div style="font-size: 1.35rem; font-weight: 900; color: var(--cem-red); margin-bottom: 1rem;">${formattedPrice} (${item.listing_type})</div>
      
      ${imagesHtml}

      <div class="spec-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 1.5rem;">
        <div class="spec-item"><span class="label">Category</span><span class="val">${item.category || 'Industrial'}</span></div>
        <div class="spec-item"><span class="label">Property Type</span><span class="val">${item.property_type}</span></div>
        <div class="spec-item"><span class="label">Land Tenure</span><span class="val" style="color: var(--cem-navy); font-weight: 800;">${tenureVal}</span></div>
        <div class="spec-item"><span class="label">Power Supply</span><span class="val">${item.power_supply_amp || '-'}</span></div>
        <div class="spec-item"><span class="label">Ceiling Height</span><span class="val">${item.ceiling_height_ft || '-'}</span></div>
        <div class="spec-item"><span class="label">Floor Loading</span><span class="val">${item.floor_loading_kn || '-'}</span></div>
        <div class="spec-item"><span class="label">Zone / Details</span><span class="val">${zoneVal || '-'}</span></div>
        <div class="spec-item"><span class="label">Built-up Size</span><span class="val">${item.built_up_sqft ? item.built_up_sqft + ' sqft' : '-'}</span></div>
        <div class="spec-item"><span class="label">Land Area</span><span class="val">${item.land_area_sqft ? item.land_area_sqft + ' sqft' : '-'}</span></div>
      </div>

      <h4 style="margin-bottom: 0.5rem; font-size: 1rem; color: var(--text-main);">Full Description & Specifications:</h4>
      <p style="color: var(--text-muted); font-size: 0.95rem; white-space: pre-line; margin-bottom: 1.5rem;">${item.description || 'No additional description provided.'}</p>

      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <a href="${waUrl}" target="_blank" class="btn-whatsapp" style="padding: 0.8rem 1.25rem; flex: 1; min-width: 200px; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg> Contact Agent on WhatsApp
        </a>
      </div>
      <button onclick="copyShareLink('${item.id}', '${safeTitle}')" class="btn-detail" style="padding: 0.7rem 1rem; font-weight: 700; background: var(--bg-subtle); width: 100%; margin-top: 0.5rem; text-align: center;">
        🔗 Copy Direct Share Link
      </button>
    `;
  }

  // ⚡ Dynamically update URL in browser bar to Enterprise Clean URL (/listings/kilang-xxx) without page reload
  if (updateHistory && history.pushState) {
    const newUrl = `${window.location.origin}/listings/${encodeURIComponent(slug)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }

  const detailModal = document.getElementById('detailModal');
  if (detailModal) detailModal.classList.add('active');
}

function closeModal() {
  const detailModal = document.getElementById('detailModal');
  if (detailModal) detailModal.classList.remove('active');
  
  // ⚡ Reset URL back to clean listings portal URL (/listings.html)
  if (history.pushState) {
    const cleanUrl = `${window.location.origin}/listings.html`;
    window.history.pushState({ path: cleanUrl }, '', cleanUrl);
  }
}
