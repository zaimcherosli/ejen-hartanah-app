// Dashboard.js - Agent Management Logic with Preview & Edit Listing Capability
let currentUser = null;
let currentListingsData = [];

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  if (document.getElementById('inventoryContainer')) loadAgentListings();
  if (document.getElementById('addListingForm')) setupFormHandler();
  if (document.getElementById('editListingForm')) setupEditFormHandler();
});

// Check Auth state
async function checkAuth() {
  if (!supabaseClient) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = session.user;
  const agentEmailEl = document.getElementById('agentEmail');
  if (agentEmailEl) agentEmailEl.innerText = currentUser.email;

  const mobileAgentEmailEl = document.getElementById('mobileAgentEmail');
  if (mobileAgentEmailEl) mobileAgentEmailEl.innerText = currentUser.email;

  // Check if user is SuperAdmin (Strictly huzaimrosli@gmail.com and biztreat2017@gmail.com)
  const isSuperAdmin = ['huzaimrosli@gmail.com', 'biztreat2017@gmail.com'].includes((currentUser.email || '').toLowerCase());

  // Show/Hide SuperAdmin Dashboard Navigation tab
  const portalNavDashboardBtn = document.getElementById('portalNavDashboardBtn');
  if (portalNavDashboardBtn && !isSuperAdmin) {
    portalNavDashboardBtn.style.display = 'none';
  }
  const mobilePortalDashboardBtn = document.getElementById('mobilePortalDashboardBtn');
  if (mobilePortalDashboardBtn && !isSuperAdmin) {
    mobilePortalDashboardBtn.style.display = 'none';
  }

  if (isSuperAdmin) {
    const mainAdminCard = document.getElementById('superadminMainCard');
    if (mainAdminCard) {
      mainAdminCard.style.display = 'block';
      loadAgentApprovals();
      loadActivityLogs();
    }
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = 'login.html';
    });
  }
}

// Helper: Watermark & Compress Image client-side using HTML5 Canvas
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = async () => {
        // 1. Create Canvas & Calculate Resized Dimensions
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 2. Draw Original Image
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 3. Delegate Watermarking to dedicated reusable module
        if (typeof applyWatermark === 'function') {
          await applyWatermark(canvas);
        }

        // 4. Convert to Compressed JPEG Blob
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

// Load Listing Inventory for both Desktop Table & Mobile App Cards
async function loadAgentListings() {
  const tbody = document.getElementById('agentListingsTbody');
  const mobileContainer = document.getElementById('agentListingsMobileCards');

  try {
    const { data, error } = await supabaseClient
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="color: #f43f5e; text-align: center;">Error: ${error.message}</td></tr>`;
      if (mobileContainer) mobileContainer.innerHTML = `<div style="color: #f43f5e; text-align: center; padding: 1rem;">Error: ${error.message}</div>`;
      return;
    }

    currentListingsData = data || [];

    if (!data || data.length === 0) {
      const emptyMsg = `No listings found yet. Please add your first listing using the form above.`;
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">${emptyMsg}</td></tr>`;
      if (mobileContainer) mobileContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">${emptyMsg}</div>`;
      return;
    }

    // 1. Render Desktop Table Rows
    if (tbody) {
      tbody.innerHTML = data.map(item => {
        const formattedPrice = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(item.asking_price);
        const thumb = (item.images && item.images.length > 0) ? item.images[0] : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';
        const isSale = (item.listing_type || '').toLowerCase().includes('sale');
        const typeBadgeStyle = isSale 
          ? 'background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;' 
          : 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;';

        return `
          <tr onclick="openEditModal('${item.id}')" style="cursor: pointer;" title="Click to Preview & Edit">
            <td style="padding: 0.65rem 0.5rem; width: 64px; vertical-align: middle;">
              <img src="${thumb}" style="width: 54px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); flex-shrink: 0;" onerror="this.src='https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'" />
            </td>
            <td style="padding: 0.65rem 0.5rem; vertical-align: middle; max-width: 260px;">
              <strong style="color: var(--text-main); font-size: 0.85rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.35; margin-bottom: 0.2rem;">${item.title}</strong>
              <div style="display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.15rem;">
                <span style="font-size: 0.73rem; color: var(--text-muted); white-space: nowrap;">${item.location}</span>
              </div>
              <div style="margin-top: 0.2rem;">
                <span style="${typeBadgeStyle} padding: 0.12rem 0.45rem; border-radius: 4px; font-weight: 800; font-size: 0.67rem; text-transform: uppercase; display: inline-block;">${item.listing_type || 'For Rent'}</span>
              </div>
            </td>
            <td style="padding: 0.65rem 0.5rem; color: var(--cem-red); font-weight: 800; font-size: 0.88rem; white-space: nowrap; vertical-align: middle; text-align: right;">${formattedPrice}</td>
            <td style="padding: 0.65rem 0.5rem; vertical-align: middle; text-align: center;">
              <span style="background: rgba(16,185,129,0.12); color: #059669; padding: 0.25rem 0.55rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; display: inline-block;">
                ${item.status}
              </span>
            </td>
            <td style="padding: 0.65rem 0.5rem; text-align: center; vertical-align: middle;">
              <button onclick="event.stopPropagation(); deleteListing('${item.id}')" title="Delete Listing" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; width: 34px; height: 34px; border-radius: 6px; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;">
                Delete
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 2. Render Sleek Mobile App Cards
    if (mobileContainer) {
      mobileContainer.innerHTML = data.map(item => {
        const formattedPrice = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(item.asking_price);
        const thumb = (item.images && item.images.length > 0) ? item.images[0] : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';
        const isSale = (item.listing_type || '').toLowerCase().includes('sale');
        const typeBadgeStyle = isSale 
          ? 'background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;' 
          : 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;';

        return `
          <div class="inv-card-item" onclick="openEditModal('${item.id}')" title="Click to Preview & Edit">
            <img src="${thumb}" class="inv-card-thumb" onerror="this.src='https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'" />
            
            <div class="inv-card-details">
              <div class="inv-card-title">${item.title}</div>
              <div class="inv-card-sub">${item.location}</div>
              <div style="margin-top: 0.2rem;">
                <span style="${typeBadgeStyle} padding: 0.1rem 0.4rem; border-radius: 3px; font-weight: 800; font-size: 0.65rem; text-transform: uppercase; display: inline-block;">${item.listing_type || 'For Rent'}</span>
              </div>
              <div class="inv-card-price">${formattedPrice}</div>
            </div>

            <!-- Top-Right: Status Badge, Bottom-Right: Trash Icon (Level with Price) -->
            <span class="inv-card-badge">${item.status}</span>
            <button onclick="event.stopPropagation(); deleteListing('${item.id}')" class="inv-card-delete" title="Delete Listing">Delete</button>
          </div>
        `;
      }).join('');
    }

  } catch (err) {
    console.error('Load listings error:', err);
  }
}

// State for editing images
let currentEditImages = [];

// Open Edit & Preview Listing Modal
function openEditModal(id) {
  const item = currentListingsData.find(x => x.id === id);
  if (!item) return;

  currentEditImages = item.images ? [...item.images] : [];
  
  const newFileInput = document.getElementById('editNewImagesInput');
  if (newFileInput) newFileInput.value = '';

  if (document.getElementById('editId')) document.getElementById('editId').value = item.id;
  if (document.getElementById('editTitle')) document.getElementById('editTitle').value = item.title || '';
  if (document.getElementById('editCategory')) document.getElementById('editCategory').value = item.category || 'Industrial';
  if (document.getElementById('editPrice')) document.getElementById('editPrice').value = item.asking_price || '';
  if (document.getElementById('editStatus')) document.getElementById('editStatus').value = item.status || 'Available';
  if (document.getElementById('editListingType')) document.getElementById('editListingType').value = item.listing_type || 'For Rent';
  if (window.updateEditTenureVisibility) window.updateEditTenureVisibility();
  if (document.getElementById('editPropertyType')) document.getElementById('editPropertyType').value = item.property_type || 'Detached Factory';

  const rawZoning = item.zoning || '';
  let tenureVal = 'Freehold';
  if (rawZoning.includes('Freehold')) tenureVal = 'Freehold';
  else if (rawZoning.includes('Leasehold Extension')) tenureVal = 'Leasehold Extension';
  else if (rawZoning.includes('Leasehold')) tenureVal = 'Leasehold';
  else if (rawZoning.includes('Malay Reserved') || rawZoning.includes('Malay Reserve') || rawZoning.includes('Rizab Melayu')) tenureVal = 'Malay Reserved';

  if (document.getElementById('editTenure')) {
    document.getElementById('editTenure').value = tenureVal;
  }

  const cleanZoning = rawZoning
    .replace(/\[unit:acre\]|\[unit:sqft\]/gi, '')
    .replace(/Freehold \| |Leasehold Extension \| |Leasehold \| |Malay Reserved \| |Malay Reserve \| |Rizab Melayu \| /gi, '')
    .trim();
  if (document.getElementById('editZoning')) {
    document.getElementById('editZoning').value = cleanZoning || 'Industrial';
  }

  // Parse Ceiling Height & Unit
  const rawCeiling = item.ceiling_height_ft || '';
  const ceilingNum = rawCeiling.replace(/[^0-9.]/g, '');
  const ceilingUnit = rawCeiling.includes('m') && !rawCeiling.includes('ft') ? 'm' : 'ft';
  if (document.getElementById('editCeiling')) document.getElementById('editCeiling').value = ceilingNum;
  if (document.getElementById('editCeilingUnit')) document.getElementById('editCeilingUnit').value = ceilingUnit;

  // Parse Land Area & Unit dynamically
  let landUnit = 'sqft';
  if (rawZoning.includes('[unit:acre]')) {
    landUnit = 'acre';
  } else if (rawZoning.includes('[unit:sqft]')) {
    landUnit = 'sqft';
  } else if (item.description && /acre|ekar/i.test(item.description)) {
    landUnit = 'acre';
  }

  const rawLandArea = (item.land_area_sqft !== null && item.land_area_sqft !== undefined) ? item.land_area_sqft : '';
  if (document.getElementById('editLandArea')) document.getElementById('editLandArea').value = rawLandArea;
  if (document.getElementById('editLandAreaUnit')) document.getElementById('editLandAreaUnit').value = landUnit;

  if (document.getElementById('editPower')) document.getElementById('editPower').value = item.power_supply_amp || '';
  if (document.getElementById('editFloor')) document.getElementById('editFloor').value = item.floor_loading_kn || '';
  if (document.getElementById('editBuiltUp')) document.getElementById('editBuiltUp').value = item.built_up_sqft || '';
  
  // Parse City & State
  const rawLoc = item.location || '';
  let cityVal = rawLoc;
  let stateVal = 'Selangor';
  if (rawLoc.includes(',')) {
    const locParts = rawLoc.split(',');
    cityVal = locParts[0].trim();
    stateVal = locParts[1].trim();
  }
  if (document.getElementById('editLocation')) document.getElementById('editLocation').value = cityVal;
  if (document.getElementById('editState')) document.getElementById('editState').value = stateVal;

  if (document.getElementById('editAgentPhone')) document.getElementById('editAgentPhone').value = item.agent_phone || '60173790592';
  if (document.getElementById('editDescription')) document.getElementById('editDescription').value = item.description || '';
  if (document.getElementById('editYoutubeUrl')) document.getElementById('editYoutubeUrl').value = item.youtube_url || '';

  renderEditImagesPreview();

  document.getElementById('editModal').classList.add('active');
}

function renderEditImagesPreview() {
  const imagesContainer = document.getElementById('editPreviewImages');
  if (!imagesContainer) return;

  if (currentEditImages && currentEditImages.length > 0) {
    imagesContainer.innerHTML = currentEditImages.map((img, idx) => {
      const isCover = idx === 0;
      return `
        <div style="position: relative; display: inline-block; flex-shrink: 0; border: ${isCover ? '2px solid #eab308' : '1px solid var(--border)'}; border-radius: 8px; padding: 2px; background: white; margin-right: 0.5rem;">
          <img src="${img}" style="height: 110px; width: 130px; border-radius: 6px; object-fit: cover; display: block;" />
          ${isCover ? `
            <span style="position: absolute; top: 6px; left: 6px; background: #eab308; color: #000; font-size: 0.65rem; font-weight: 900; padding: 0.2rem 0.45rem; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">⭐ COVER PHOTO</span>
          ` : `
            <button type="button" onclick="setCoverImage(${idx})" title="Set as Cover Photo" style="position: absolute; bottom: 6px; left: 6px; background: rgba(10,25,47,0.85); color: #fef08a; border: 1px solid #fde047; border-radius: 4px; padding: 0.15rem 0.4rem; font-size: 0.68rem; font-weight: 800; cursor: pointer;">⭐ Set Cover</button>
          `}
          <button type="button" onclick="removeEditImage(${idx})" title="Remove photo" style="position: absolute; top: 6px; right: 6px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">✕</button>
        </div>
      `;
    }).join('');
  } else {
    imagesContainer.innerHTML = '<span style="font-size: 0.82rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">No existing property photos. Upload new photos below.</span>';
  }
}

function setCoverImage(idx) {
  if (idx > 0 && idx < currentEditImages.length) {
    const selected = currentEditImages.splice(idx, 1)[0];
    currentEditImages.unshift(selected); // Move selected image to index 0 (Cover)
    renderEditImagesPreview();
  }
}

function removeEditImage(idx) {
  if (idx >= 0 && idx < currentEditImages.length) {
    currentEditImages.splice(idx, 1);
    renderEditImagesPreview();
  }
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

// Setup Edit Form Submission handler
function setupEditFormHandler() {
  const editForm = document.getElementById('editListingForm');
  const alertBox = document.getElementById('editAlert');

  if (!editForm) return;

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const title = document.getElementById('editTitle').value;
    const asking_price = parseFloat(document.getElementById('editPrice').value);
    const status = document.getElementById('editStatus').value;
    const listing_type = document.getElementById('editListingType').value;
    const property_type = document.getElementById('editPropertyType').value;
    
    let category = document.getElementById('editCategory') ? document.getElementById('editCategory').value : '';
    if (!category) {
      if (property_type.includes('Land')) {
        if (property_type.includes('Commercial')) category = 'Commercial';
        else if (property_type.includes('Agriculture') || property_type.includes('Residential')) category = 'Land';
        else category = 'Industrial';
      } else if (property_type.includes('Commercial') || property_type.includes('Shoplot') || property_type.includes('Hotel') || property_type.includes('Office')) {
        category = 'Commercial';
      } else {
        category = 'Industrial';
      }
    }

    const tenure = document.getElementById('editTenure') ? document.getElementById('editTenure').value : '';
    const power_supply_amp = document.getElementById('editPower') ? document.getElementById('editPower').value : '';
    const floor_loading_kn = document.getElementById('editFloor') ? document.getElementById('editFloor').value : '';
    
    const ceilingVal = document.getElementById('editCeiling') ? document.getElementById('editCeiling').value.trim() : '';
    const ceilingUnit = document.getElementById('editCeilingUnit') ? document.getElementById('editCeilingUnit').value : 'ft';
    const ceiling_height_ft = ceilingVal ? `${ceilingVal} ${ceilingUnit}` : '';

    const built_up_sqft = document.getElementById('editBuiltUp') && document.getElementById('editBuiltUp').value ? parseFloat(document.getElementById('editBuiltUp').value) : null;
    const landInputVal = document.getElementById('editLandArea') && document.getElementById('editLandArea').value ? parseFloat(document.getElementById('editLandArea').value) : null;
    const landUnitVal = document.getElementById('editLandAreaUnit') ? document.getElementById('editLandAreaUnit').value : 'sqft';
    const land_area_sqft = landInputVal;

    const zoningVal = document.getElementById('editZoning') ? document.getElementById('editZoning').value : 'Industrial';
    let fullZoning = tenure ? `${tenure} | ${zoningVal}` : zoningVal;
    if (landUnitVal === 'acre') {
      fullZoning = `${fullZoning} [unit:acre]`;
    } else {
      fullZoning = `${fullZoning} [unit:sqft]`;
    }
    
    const cityInput = document.getElementById('editLocation').value.trim();
    const stateInput = document.getElementById('editState') ? document.getElementById('editState').value : 'Selangor';
    const location = cityInput.toLowerCase().includes(stateInput.toLowerCase()) ? cityInput : `${cityInput}, ${stateInput}`;

    const agent_phone = document.getElementById('editAgentPhone') ? document.getElementById('editAgentPhone').value : '60173790592';
    const description = document.getElementById('editDescription').value;
    const youtube_url = document.getElementById('editYoutubeUrl') ? document.getElementById('editYoutubeUrl').value.trim() : '';

    const newFilesInput = document.getElementById('editNewImagesInput');
    const newFiles = newFilesInput ? newFilesInput.files : null;

    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = '#fef3c7';
      alertBox.style.color = '#b45309';
      alertBox.innerText = 'Updating listing & processing photos...';
    }

    let finalImages = [...currentEditImages];

    if (newFiles && newFiles.length > 0) {
      if (alertBox) alertBox.innerText = 'Compressing & watermarking new photos...';
      for (let i = 0; i < newFiles.length; i++) {
        let rawFile = newFiles[i];
        const fileToUpload = await compressImage(rawFile);
        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        const publicUrl = await uploadImageFile(fileToUpload, fileName);
        if (publicUrl) {
          finalImages.push(publicUrl);
        }
      }
    }

    const updatePayload = {
      title,
      category,
      asking_price,
      status,
      listing_type,
      property_type,
      zoning: fullZoning,
      power_supply_amp,
      ceiling_height_ft,
      floor_loading_kn,
      built_up_sqft,
      land_area_sqft,
      location,
      agent_phone,
      description,
      images: finalImages
    };

    if (youtube_url) {
      updatePayload.youtube_url = youtube_url;
    } else {
      updatePayload.youtube_url = '';
    }

    const { data: updatedRows, error } = await supabaseClient
      .from('listings')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error || !updatedRows || updatedRows.length === 0) {
      const errMsg = error ? error.message : 'Rekod tidak ditemui atau kemaskini gagal disimpan.';
      if (alertBox) {
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#dc2626';
        alertBox.innerText = 'Failed to update: ' + errMsg;
      } else {
        alert('Failed to update: ' + errMsg);
      }
      return;
    }

    // Instantly update in-memory currentListingsData array
    if (updatedRows && updatedRows[0]) {
      const listIdx = currentListingsData.findIndex(x => String(x.id) === String(id));
      if (listIdx !== -1) {
        currentListingsData[listIdx] = updatedRows[0];
      }
    }

    if (alertBox) {
      alertBox.style.background = '#d1fae5';
      alertBox.style.color = '#047857';
      alertBox.innerText = 'Listing updated successfully!';
    }
    logActivity('EDIT_LISTING', `Updated listing: "${title}" (Status: ${status}, Price: RM ${asking_price})`, id);
    setTimeout(() => {
      closeEditModal();
      loadAgentListings();
    }, 600);
  });
}

// Setup Add Form Handler
function setupFormHandler() {
  const form = document.getElementById('addListingForm');
  const alertBox = document.getElementById('formAlert');

  function showAlert(msg, isError = true) {
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = isError ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)';
      alertBox.style.color = isError ? '#f43f5e' : '#10b981';
      alertBox.style.border = `1px solid ${isError ? '#f43f5e' : '#10b981'}`;
      alertBox.innerText = msg;
    } else {
      if (isError) alert(msg);
    }
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const listing_type = document.getElementById('listing_type').value;
    const property_type = document.getElementById('property_type').value;
    const tenure = document.getElementById('tenure') ? document.getElementById('tenure').value : '';
    const asking_price = parseFloat(document.getElementById('asking_price').value);
    const power_supply_amp = document.getElementById('power_supply_amp').value;

    const ceilingVal = document.getElementById('ceiling_height_ft').value.trim();
    const ceilingUnit = document.getElementById('ceiling_height_unit') ? document.getElementById('ceiling_height_unit').value : 'ft';
    const ceiling_height_ft = ceilingVal ? `${ceilingVal} ${ceilingUnit}` : '';

    const built_up_sqft = parseFloat(document.getElementById('built_up_sqft').value) || null;
    const landInputVal = document.getElementById('land_area_sqft') && document.getElementById('land_area_sqft').value ? parseFloat(document.getElementById('land_area_sqft').value) : null;
    const landUnitVal = document.getElementById('land_area_unit') ? document.getElementById('land_area_unit').value : 'sqft';
    const land_area_sqft = landInputVal;

    const floor_loading_kn = document.getElementById('floor_loading_kn').value;
    const zoning = document.getElementById('zoning').value;
    let fullZoning = tenure ? `${tenure} | ${zoning}` : zoning;
    if (landUnitVal === 'acre') {
      fullZoning = `${fullZoning} [unit:acre]`;
    } else {
      fullZoning = `${fullZoning} [unit:sqft]`;
    }
    
    const cityInput = document.getElementById('location').value.trim();
    const stateInput = document.getElementById('state') ? document.getElementById('state').value : 'Selangor';
    const location = cityInput.toLowerCase().includes(stateInput.toLowerCase()) ? cityInput : `${cityInput}, ${stateInput}`;

    const agent_phone = document.getElementById('agent_phone').value;
    const description = document.getElementById('description').value;
    const youtube_url = document.getElementById('youtube_url') ? document.getElementById('youtube_url').value.trim() : '';

    const filesInput = document.getElementById('listingImages') || document.getElementById('imagesInput');
    const files = filesInput ? filesInput.files : null;

    showAlert('Compressing & watermarking photos for publishing...', false);

    const imageUrls = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        let rawFile = files[i];
        const fileToUpload = await compressImage(rawFile);

        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        const publicUrl = await uploadImageFile(fileToUpload, fileName);
        if (publicUrl) {
          imageUrls.push(publicUrl);
        }
      }
    }

    const insertPayload = {
      title,
      category,
      listing_type,
      property_type,
      asking_price,
      power_supply_amp,
      ceiling_height_ft,
      floor_loading_kn,
      zoning: fullZoning,
      built_up_sqft,
      land_area_sqft,
      location,
      agent_phone,
      description,
      images: imageUrls,
      status: 'Available'
    };

    if (youtube_url) {
      insertPayload.youtube_url = youtube_url;
    }

    const { data: insertedData, error: insertErr } = await supabaseClient
      .from('listings')
      .insert([insertPayload]);

    if (insertErr) {
      console.error('Insert error:', insertErr);
      showAlert(`Gagal menyimpan listing: ${insertErr.message}`, true);
    } else {
      showAlert(' Listing & gambar berjaya disimpan!', false);
      logActivity('ADD_LISTING', `Menambah listing baharu: "${title}" (${category} - ${property_type}) pada harga RM ${asking_price}`, insertedData ? insertedData[0]?.id : null);
      form.reset();
      loadAgentListings();
    }
  });
}

// Delete Listing & its Physical Images from Storage
async function deleteListing(id) {
  if (!confirm('Adakah anda pasti mahu memadam listing ini berserta fail gambarnya?')) return;

  try {
    const { data: item } = await supabaseClient
      .from('listings')
      .select('title, images')
      .eq('id', id)
      .single();

    const titleStr = item ? (item.title || `ID ${id}`) : `ID ${id}`;

    if (item && item.images && item.images.length > 0) {
      for (const imgUrl of item.images) {
        if (imgUrl.includes('.r2.dev/')) {
          const r2FileName = imgUrl.split('.r2.dev/')[1];
          if (r2FileName) {
            try {
              await fetch(`/api/upload?file=${encodeURIComponent(r2FileName)}`, { method: 'DELETE' });
              console.log('⚡ Successfully deleted image from Cloudflare R2:', r2FileName);
            } catch (r2Err) {
              console.warn('R2 file deletion error:', r2Err);
            }
          }
        } else if (imgUrl.includes('/storage/v1/object/public/listing-images/')) {
          const path = imgUrl.split('/storage/v1/object/public/listing-images/')[1];
          if (path) {
            await supabaseClient.storage.from('listing-images').remove([path]);
          }
        }
      }
    }

    const { error } = await supabaseClient
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Gagal memadam: ' + error.message);
    } else {
      logActivity('DELETE_LISTING', `Memadam listing: "${titleStr}"`, id);
      loadAgentListings();
    }
  } catch (err) {
    console.error('Delete error:', err);
  }
}

// SuperAdmin Agent Approval Management Functions
async function loadAgentApprovals() {
  const container = document.getElementById('agentApprovalsContainer');
  if (!container) return;

  container.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">⏳ Loading registered agents list...</span>';

  try {
    const { data: profiles, error } = await supabaseClient
      .from('agent_profiles')
      .select('*')
      .order('registered_at', { ascending: false });

    if (error) {
      console.warn('agent_profiles query warning:', error.message);
      container.innerHTML = `<span style="color: #dc2626; font-size: 0.85rem;">Error loading agents list: ${error.message}.</span>`;
      return;
    }

    if (!profiles || profiles.length === 0) {
      container.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">No new agent registrations found.</span>';
      return;
    }

    const desktopHtml = `
      <div class="desktop-only-table" style="overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 8px; border: 1px solid var(--border); background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; min-width: 720px;">
          <thead>
            <tr style="background: #f8fafc; color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border);">
              <th style="padding: 0.85rem 1rem; width: 56px; text-align: center;">PHOTO</th>
              <th style="padding: 0.85rem 1rem; white-space: nowrap;">AGENT NAME</th>
              <th style="padding: 0.85rem 1rem; white-space: nowrap;">WHATSAPP NO.</th>
              <th style="padding: 0.85rem 1rem; white-space: nowrap;">REN NO.</th>
              <th style="padding: 0.85rem 1rem;">EMAIL</th>
              <th style="padding: 0.85rem 1rem; white-space: nowrap;">STATUS</th>
              <th style="padding: 0.85rem 1rem; text-align: center; white-space: nowrap;">APPROVAL ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${profiles.map(u => {
              const name = u.full_name || 'Registered Agent';
              const wa = u.whatsapp_number || '-';
              const ren = u.ren_number || '-';
              const status = u.status || 'Pending';
              const avatarUrl = u.avatar_url || u.photo_url || '/logo.png';

              let badgeBg = '#d1fae5'; let badgeColor = '#047857'; let badgeBorder = '#a7f3d0';
              if (status === 'Pending') { badgeBg = '#fef3c7'; badgeColor = '#b45309'; badgeBorder = '#fde68a'; }
              if (status === 'Rejected') { badgeBg = '#fee2e2'; badgeColor = '#dc2626'; badgeBorder = '#fca5a5'; }

              const cleanWa = wa.replace(/[^0-9]/g, '');

              return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 0.65rem 1rem; vertical-align: middle; text-align: center;">
                    <img src="${avatarUrl}" alt="${name}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 1.5px solid #cbd5e1; display: inline-block;" onerror="this.src='/logo.png'">
                  </td>
                  <td style="padding: 0.85rem 1rem; font-weight: 700; color: var(--cem-navy); min-width: 160px; vertical-align: middle;">${name}</td>
                  <td style="padding: 0.85rem 1rem; font-weight: 600; white-space: nowrap; vertical-align: middle;">
                    <a href="https://wa.me/${cleanWa.startsWith('60') ? cleanWa : '60' + cleanWa}" target="_blank" style="color: #16a34a; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; background: #f0fdf4; padding: 0.3rem 0.65rem; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 0.82rem;">
                      ${wa}
                    </a>
                  </td>
                  <td style="padding: 0.85rem 1rem; color: var(--text-muted); font-weight: 600; white-space: nowrap; vertical-align: middle;">
                    <span style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.78rem;">${ren}</span>
                  </td>
                  <td style="padding: 0.85rem 1rem; color: var(--text-main); font-weight: 500; vertical-align: middle;">${u.email}</td>
                  <td style="padding: 0.85rem 1rem; white-space: nowrap; vertical-align: middle;">
                    <span style="padding: 0.3rem 0.7rem; border-radius: 20px; font-weight: 800; font-size: 0.75rem; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; display: inline-flex; align-items: center; gap: 0.25rem;">
                      ${status}
                    </span>
                  </td>
                  <td style="padding: 0.85rem 1rem; text-align: center; white-space: nowrap; vertical-align: middle;">
                    <div style="display: inline-flex; gap: 0.35rem; align-items: center;">
                      ${status === 'Pending' ? `
                        <button type="button" onclick="approveAgent('${u.id}', '${u.email}')" style="padding: 0.45rem 0.85rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer; box-shadow: 0 1px 3px rgba(16,185,129,0.3); display: inline-flex; align-items: center; gap: 0.25rem;">Approve</button>
                        <button type="button" onclick="rejectAgent('${u.id}', '${u.email}')" style="padding: 0.45rem 0.85rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer; box-shadow: 0 1px 3px rgba(239,68,68,0.3); display: inline-flex; align-items: center; gap: 0.25rem;">Reject</button>
                      ` : `
                        <span style="color: var(--text-muted); font-size: 0.78rem; font-weight: 600; background: #f8fafc; padding: 0.3rem 0.6rem; border-radius: 4px; border: 1px solid #e2e8f0;">Active / ${status}</span>
                      `}
                      <button type="button" onclick="deleteAgentProfile('${u.id}', '${u.email}')" title="Delete agent profile from system" style="padding: 0.45rem 0.6rem; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;" aria-label="Delete">Delete</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    const mobileHtml = `
      <div class="mobile-only-cards">
        ${profiles.map(u => {
          const name = u.full_name || 'Registered Agent';
          const wa = u.whatsapp_number || '-';
          const ren = u.ren_number || '-';
          const status = u.status || 'Pending';
          const avatarUrl = u.avatar_url || u.photo_url || '/logo.png';

          let badgeBg = '#d1fae5'; let badgeColor = '#047857'; let badgeBorder = '#a7f3d0';
          if (status === 'Pending') { badgeBg = '#fef3c7'; badgeColor = '#b45309'; badgeBorder = '#fde68a'; }
          if (status === 'Rejected') { badgeBg = '#fee2e2'; badgeColor = '#dc2626'; badgeBorder = '#fca5a5'; }

          const cleanWa = wa.replace(/[^0-9]/g, '');

          return `
            <div style="background: white; border: 1px solid var(--border); border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); margin-bottom: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.65rem; flex: 1; min-width: 0;">
                  <img src="${avatarUrl}" alt="${name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1.5px solid #cbd5e1; flex-shrink: 0;" onerror="this.src='/logo.png'">
                  <div style="min-width: 0; flex: 1;">
                    <div style="font-weight: 800; color: var(--cem-navy); font-size: 0.95rem; line-height: 1.3; word-break: break-word; white-space: normal;">${name}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-top: 0.15rem; word-break: break-all;">${u.email}</div>
                  </div>
                </div>
                <span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-weight: 800; font-size: 0.72rem; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; white-space: nowrap; flex-shrink: 0;">
                  ${status}
                </span>
              </div>

              <div style="display: flex; gap: 0.4rem; margin: 0.65rem 0 0.85rem 0; align-items: center; flex-wrap: wrap;">
                <a href="https://wa.me/${cleanWa.startsWith('60') ? cleanWa : '60' + cleanWa}" target="_blank" style="color: #16a34a; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem; background: #f0fdf4; padding: 0.25rem 0.55rem; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 0.75rem; font-weight: 700;">
                  ${wa}
                </a>
                <span style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); border: 1px solid #e2e8f0;">
                  ${ren}
                </span>
              </div>

              <div style="display: flex; gap: 0.4rem; padding-top: 0.65rem; border-top: 1px solid #f1f5f9; justify-content: space-between; align-items: center;">
                ${status === 'Pending' ? `
                  <div style="display: flex; gap: 0.35rem; flex: 1;">
                    <button type="button" onclick="approveAgent('${u.id}', '${u.email}')" style="flex: 1; padding: 0.45rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer; text-align: center;">Approve</button>
                    <button type="button" onclick="rejectAgent('${u.id}', '${u.email}')" style="flex: 1; padding: 0.45rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer; text-align: center;">Reject</button>
                  </div>
                ` : `
                  <span style="color: var(--text-muted); font-size: 0.72rem; font-weight: 700; background: #f8fafc; padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid #e2e8f0;">Active / ${status}</span>
                `}
                <button type="button" onclick="deleteAgentProfile('${u.id}', '${u.email}')" title="Memadam profil ejen" style="padding: 0.35rem 0.65rem; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">Delete</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = desktopHtml + mobileHtml;
  } catch (err) {
    console.error('loadAgentApprovals error:', err);
    container.innerHTML = `<span style="color: #dc2626; font-size: 0.85rem;">Error: ${err.message}</span>`;
  }
}

async function approveAgent(userId, email) {
  if (!confirm(`Are you sure you want to APPROVE agent account (${email})?`)) return;

  try {
    const { error } = await supabaseClient
      .from('agent_profiles')
      .update({ status: 'Approved' })
      .eq('id', userId);

    if (error) {
      alert('Failed to approve: ' + error.message);
    } else {
      alert(`Agent account (${email}) HAS BEEN APPROVED! The agent can now log in to the portal.`);
      await logActivity('APPROVE_AGENT', `Approved agent account registration (${email})`, userId);
      loadAgentApprovals();
      loadActivityLogs();
    }
  } catch (err) {
    console.error('approveAgent error:', err);
    alert('Error: ' + err.message);
  }
}

async function rejectAgent(userId, email) {
  if (!confirm(`Are you sure you want to REJECT agent account registration (${email})?`)) return;

  try {
    const { error } = await supabaseClient
      .from('agent_profiles')
      .update({ status: 'Rejected' })
      .eq('id', userId);

    if (error) {
      alert('Failed to reject: ' + error.message);
    } else {
      alert(`Agent application (${email}) HAS BEEN REJECTED.`);
      await logActivity('REJECT_AGENT', `Rejected agent account registration (${email})`, userId);
      loadAgentApprovals();
      loadActivityLogs();
    }
  } catch (err) {
    console.error('rejectAgent error:', err);
    alert('Error: ' + err.message);
  }
}

async function deleteAgentProfile(userId, email) {
  if (!confirm(`Are you sure you want to DELETE AGENT PROFILE (${email}) from the system?`)) return;

  try {
    const { data, error } = await supabaseClient
      .from('agent_profiles')
      .delete()
      .ilike('email', email)
      .select();

    if (error) {
      alert('Failed to delete agent profile: ' + error.message);
    } else {
      alert(`Agent profile (${email}) HAS BEEN DELETED from the system.`);
      await logActivity('DELETE_AGENT', `Deleted agent account registration (${email})`, userId);
      loadAgentApprovals();
      loadActivityLogs();
    }
  } catch (err) {
    console.error('deleteAgentProfile error:', err);
    alert('Error: ' + err.message);
  }
}

// Helper: Log Activity to activity_logs Table
async function logActivity(actionType, details, targetId = null) {
  try {
    if (!supabaseClient || !currentUser) return;
    await supabaseClient.from('activity_logs').insert([{
      user_email: currentUser.email,
      action_type: actionType,
      details: details,
      target_id: targetId ? String(targetId) : null,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.warn('logActivity warning:', err);
  }
}

function refreshCurrentAdminTab() {
  const approvalsContent = document.getElementById('adminTabApprovalsContent');
  if (approvalsContent && approvalsContent.style.display !== 'none') {
    loadAgentApprovals();
  } else {
    loadActivityLogs();
  }
}

// SuperAdmin Executive Tab Switcher
function switchAdminTab(tab) {
  const approvalsBtn = document.getElementById('adminTabApprovalsBtn');
  const logsBtn = document.getElementById('adminTabLogsBtn');
  const approvalsContent = document.getElementById('adminTabApprovalsContent');
  const logsContent = document.getElementById('adminTabLogsContent');
  const refreshApprovals = document.getElementById('btnRefreshApprovals');
  const refreshLogs = document.getElementById('btnRefreshLogs');

  if (!approvalsBtn || !logsBtn || !approvalsContent || !logsContent) return;

  if (tab === 'approvals') {
    approvalsBtn.style.background = 'var(--cem-navy)';
    approvalsBtn.style.color = 'white';
    approvalsBtn.style.border = 'none';

    logsBtn.style.background = 'transparent';
    logsBtn.style.color = 'var(--text-main)';
    logsBtn.style.border = 'none';

    approvalsContent.style.display = 'block';
    logsContent.style.display = 'none';

    if (refreshApprovals) refreshApprovals.style.display = 'inline-block';
    if (refreshLogs) refreshLogs.style.display = 'none';
  } else {
    logsBtn.style.background = 'var(--cem-navy)';
    logsBtn.style.color = 'white';
    logsBtn.style.border = 'none';

    approvalsBtn.style.background = 'transparent';
    approvalsBtn.style.color = 'var(--text-main)';
    approvalsBtn.style.border = 'none';

    logsContent.style.display = 'block';
    approvalsContent.style.display = 'none';

    if (refreshLogs) refreshLogs.style.display = 'inline-block';
    if (refreshApprovals) refreshApprovals.style.display = 'none';

    loadActivityLogs();
  }
}

// SuperAdmin Activity Audit Logs Function
async function loadActivityLogs() {
  const container = document.getElementById('activityLogsContainer');
  if (!container) return;

  container.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">⏳ Loading activity logs...</span>';

  try {
    const { data: logs, error } = await supabaseClient
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('activity_logs query error:', error.message);
      container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.82rem;">No activity logs recorded yet. Please ensure 'activity_logs' table exists in Supabase.</span>`;
      return;
    }

    if (!logs || logs.length === 0) {
      container.innerHTML = '<span style="font-size: 0.82rem; color: var(--text-muted);">No activity logs recorded yet.</span>';
      return;
    }

    const desktopLogsHtml = `
      <div class="desktop-only-table" style="overflow-x: auto; max-height: 340px; overflow-y: auto; -webkit-overflow-scrolling: touch; border-radius: 8px; border: 1px solid var(--border); background: white; box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.83rem; text-align: left; min-width: 620px;">
          <thead style="position: sticky; top: 0; z-index: 10;">
            <tr style="background: #f8fafc; color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border);">
              <th style="padding: 0.8rem 0.9rem; white-space: nowrap; background: #f8fafc;">DATE &amp; TIME</th>
              <th style="padding: 0.8rem 0.9rem; white-space: nowrap; background: #f8fafc;">AGENT / USER</th>
              <th style="padding: 0.8rem 0.9rem; white-space: nowrap; background: #f8fafc;">ACTION TYPE</th>
              <th style="padding: 0.8rem 0.9rem; background: #f8fafc;">ACTIVITY DETAILS</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => {
              const dt = new Date(log.created_at).toLocaleString('ms-MY', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              });

              let actColor = '#2563eb'; let actBg = '#eff6ff';
              if (log.action_type === 'ADD_LISTING') { actColor = '#16a34a'; actBg = '#f0fdf4'; }
              if (log.action_type === 'EDIT_LISTING') { actColor = '#d97706'; actBg = '#fffbeb'; }
              if (log.action_type === 'DELETE_LISTING') { actColor = '#dc2626'; actBg = '#fef2f2'; }
              if (log.action_type === 'DELETE_AGENT') { actColor = '#991b1b'; actBg = '#fee2e2'; }
              if (log.action_type === 'APPROVE_AGENT') { actColor = '#059669'; actBg = '#ecfdf5'; }
              if (log.action_type === 'REJECT_AGENT') { actColor = '#dc2626'; actBg = '#fef2f2'; }

              return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 0.75rem 0.9rem; white-space: nowrap; color: var(--text-muted); font-size: 0.78rem;">${dt}</td>
                  <td style="padding: 0.75rem 0.9rem; font-weight: 700; color: var(--cem-navy); white-space: nowrap;">${log.user_email}</td>
                  <td style="padding: 0.75rem 0.9rem; white-space: nowrap;">
                    <span style="padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 800; font-size: 0.72rem; background: ${actBg}; color: ${actColor}; display: inline-block;">${log.action_type}</span>
                  </td>
                  <td style="padding: 0.75rem 0.9rem; color: var(--text-main); font-weight: 500;">${log.details}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    const mobileLogsHtml = `
      <div class="mobile-only-cards" style="max-height: 360px; overflow-y: auto; padding-right: 0.2rem;">
        ${logs.map(log => {
          const dt = new Date(log.created_at).toLocaleString('ms-MY', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          });

          let actColor = '#2563eb'; let actBg = '#eff6ff';
          if (log.action_type === 'ADD_LISTING') { actColor = '#16a34a'; actBg = '#f0fdf4'; }
          if (log.action_type === 'EDIT_LISTING') { actColor = '#d97706'; actBg = '#fffbeb'; }
          if (log.action_type === 'DELETE_LISTING') { actColor = '#dc2626'; actBg = '#fef2f2'; }
          if (log.action_type === 'DELETE_AGENT') { actColor = '#991b1b'; actBg = '#fee2e2'; }
          if (log.action_type === 'APPROVE_AGENT') { actColor = '#059669'; actBg = '#ecfdf5'; }
          if (log.action_type === 'REJECT_AGENT') { actColor = '#dc2626'; actBg = '#fef2f2'; }

          return `
            <div style="background: white; border: 1px solid var(--border); border-radius: 8px; padding: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
              <div style="margin-bottom: 0.4rem;">
                <span style="padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 800; font-size: 0.7rem; background: ${actBg}; color: ${actColor}; display: inline-block;">
                  ${log.action_type}
                </span>
              </div>
              <div style="font-weight: 700; color: var(--cem-navy); font-size: 0.82rem; margin-bottom: 0.25rem; word-break: break-word; overflow-wrap: anywhere;">${log.user_email}</div>
              <div style="font-size: 0.8rem; color: var(--text-main); line-height: 1.35; margin-bottom: 0.35rem; word-break: break-word; overflow-wrap: anywhere;">${log.details}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-align: right; border-top: 1px dashed #f1f5f9; padding-top: 0.35rem; margin-top: 0.35rem;">${dt}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = desktopLogsHtml + mobileLogsHtml;
  } catch (err) {
    console.error('loadActivityLogs error:', err);
  }
}

// Dynamic Land Tenure Visibility
function setupTenureToggles() {
  const tenureWrapper = document.getElementById('tenureWrapper');
  if (tenureWrapper) {
    tenureWrapper.style.display = 'block';
  }

  const editTenureWrapper = document.getElementById('editTenureWrapper');
  if (editTenureWrapper) {
    editTenureWrapper.style.display = 'block';
  }
}

window.updateEditTenureVisibility = function() {
  const editTenureWrapper = document.getElementById('editTenureWrapper');
  if (editTenureWrapper) {
    editTenureWrapper.style.display = 'block';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setupTenureToggles();
});

// Helper: Upload Image to Cloudflare R2 Edge Function with Supabase Storage Fallback
async function uploadImageFile(fileToUpload, fileName) {
  try {
    const formData = new FormData();
    formData.append('file', fileToUpload, fileName);

    // Retrieve active Supabase JWT Session Token
    const authHeaders = {};
    if (typeof supabaseClient !== 'undefined' && supabaseClient.auth) {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      if (sessionData && sessionData.session && sessionData.session.access_token) {
        authHeaders['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.url) {
        console.log('⚡ Successfully uploaded image to Cloudflare R2:', json.url);
        return json.url;
      }
    }
    console.warn('R2 upload endpoint response not ok, falling back to Supabase Storage...');
  } catch (err) {
    console.warn('R2 upload error, falling back to Supabase Storage:', err);
  }

  // Fallback to Supabase Storage if R2 is unavailable
  const filePath = `properties/${fileName}`;
  const { data: uploadData, error: uploadErr } = await supabaseClient
    .storage
    .from('listing-images')
    .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: false });

  if (uploadErr) {
    console.error('Supabase Storage upload error:', uploadErr);
    throw uploadErr;
  }

  const { data: publicUrlData } = supabaseClient
    .storage
    .from('listing-images')
    .getPublicUrl(filePath);

  return publicUrlData ? publicUrlData.publicUrl : null;
}


// ==========================================
// BLOG & ARTICLES MANAGEMENT ENGINE (v1.9.0)
// ==========================================

let adminArticles = [];

window.switchPortalTab = function(tabName) {
  const tabListingsBtn = document.getElementById('tabListingsBtn');
  const tabBlogBtn = document.getElementById('tabBlogBtn');
  const listingsSec = document.getElementById('portalListingsSection');
  const blogSec = document.getElementById('portalBlogSection');

  if (tabName === 'blog') {
    if (tabListingsBtn) {
      tabListingsBtn.style.background = 'white';
      tabListingsBtn.style.color = 'var(--cem-navy)';
    }
    if (tabBlogBtn) {
      tabBlogBtn.style.background = 'var(--cem-navy)';
      tabBlogBtn.style.color = 'white';
    }
    if (listingsSec) listingsSec.style.display = 'none';
    if (blogSec) blogSec.style.display = 'block';
    loadAdminArticles();
  } else {
    if (tabBlogBtn) {
      tabBlogBtn.style.background = 'white';
      tabBlogBtn.style.color = 'var(--cem-navy)';
    }
    if (tabListingsBtn) {
      tabListingsBtn.style.background = 'var(--cem-navy)';
      tabListingsBtn.style.color = 'white';
    }
    if (blogSec) blogSec.style.display = 'none';
    if (listingsSec) listingsSec.style.display = 'block';
  }
};

async function loadAdminArticles() {
  const container = document.getElementById('adminArticlesList');
  const badge = document.getElementById('articlesCountBadge');
  if (!container) return;

  container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">Loading articles...</div>';

  try {
    if (typeof supabaseClient !== 'undefined') {
      const { data, error } = await supabaseClient
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        adminArticles = data;
      }
    }
  } catch (err) {
    console.warn('Error loading admin articles:', err);
  }

  if (badge) badge.innerText = adminArticles.length;

  if (adminArticles.length === 0) {
    container.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
        <p style="font-weight: 700;">Belum ada artikel yang dicipta.</p>
        <small>Gunakan borang di sebelah kiri untuk menerbitkan panduan pertama anda.</small>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 0.85rem;">
      ${adminArticles.map(item => {
        const coverImg = item.cover_image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80';
        const isPublished = item.status === 'Published';
        const statusBadge = isPublished 
          ? '<span style="background: #dcfce7; color: #166534; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 800;">PUBLISHED</span>'
          : '<span style="background: #f1f5f9; color: #475569; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 800;">DRAFT</span>';

        return `
          <div style="display: flex; gap: 0.85rem; padding: 0.85rem; background: white; border: 1px solid var(--border); border-radius: 8px; align-items: center;">
            <img src="${coverImg}" alt="${item.title}" style="width: 70px; height: 60px; object-fit: cover; border-radius: 6px;">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                ${statusBadge}
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">${item.category}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">• ${item.views_count || 0} views</span>
              </div>
              <h4 style="font-size: 0.88rem; font-weight: 800; color: var(--cem-navy); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
            </div>
            <div style="display: flex; gap: 0.4rem;">
              <a href="/blog/${encodeURIComponent(item.slug)}" target="_blank" title="Preview" style="padding: 0.4rem 0.6rem; background: #e0f2fe; color: #0369a1; border-radius: 6px; font-size: 0.75rem; text-decoration: none; font-weight: 700;">View</a>
              <button type="button" onclick="openEditArticleModal('${item.id}')" title="Edit" style="padding: 0.4rem 0.6rem; background: #fef3c7; color: #92400e; border: none; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 700;">Edit</button>
              <button type="button" onclick="handleDeleteArticle('${item.id}')" title="Delete" style="padding: 0.4rem 0.6rem; background: #fee2e2; color: #b91c1c; border: none; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 700;">Delete</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function generateArticleSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function setupArticleHandlers() {
  loadAdminArticles();
  const addArticleForm = document.getElementById('addArticleForm');
  if (addArticleForm) {
    addArticleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('articleFormAlert');
      const submitBtn = document.getElementById('btnSaveArticle');

      if (alertBox) alertBox.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Publishing Article...';
      }

      try {
        const title = document.getElementById('articleTitle').value.trim();
        const slug = generateArticleSlug(title);
        let category = document.getElementById('articleCategory').value;
        if (category === '__CUSTOM__') {
          const customCat = (document.getElementById('articleCustomCategory')?.value || '').trim();
          if (!customCat) {
            if (alertBox) {
              alertBox.style.display = 'block';
              alertBox.style.background = '#fee2e2';
              alertBox.style.color = '#b91c1c';
              alertBox.innerText = 'Sila taip nama kategori baharu anda.';
            }
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerText = 'Publish Article';
            }
            return;
          }
          category = customCat;
        }
        const excerpt = document.getElementById('articleExcerpt').value.trim();
        const content = document.getElementById('articleContent').value.trim();
        const readingTime = document.getElementById('articleReadingTime').value.trim() || '4 min read';
        const status = document.getElementById('articleStatus').value;
        const coverFileInput = document.getElementById('articleCoverInput');

        let coverUrl = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';

        if (coverFileInput && coverFileInput.files && coverFileInput.files[0]) {
          const file = coverFileInput.files[0];
          const fileName = `article_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${file.name.split('.').pop()}`;
          const uploadedUrl = await uploadImageFile(file, fileName);
          if (uploadedUrl) coverUrl = uploadedUrl;
        }

        const newArticle = {
          title,
          slug,
          category,
          cover_image: coverUrl,
          excerpt,
          content,
          author_name: 'WanAzemi',
          author_role: 'Real Estate Negotiator (PEA 3949)',
          reading_time: readingTime,
          status,
          views_count: 0
        };

        const { data, error } = await supabaseClient
          .from('articles')
          .insert([newArticle])
          .select();

        if (error) throw error;

        if (alertBox) {
          alertBox.style.display = 'block';
          alertBox.style.background = '#dcfce7';
          alertBox.style.color = '#166534';
          alertBox.innerText = 'Artikel berjaya diterbitkan!';
        }

        addArticleForm.reset();
        const customWrap = document.getElementById('customCategoryWrapper');
        if (customWrap) customWrap.style.display = 'none';
        loadAdminArticles();

      } catch (err) {
        console.error('Save article error:', err);
        if (alertBox) {
          alertBox.style.display = 'block';
          alertBox.style.background = '#fee2e2';
          alertBox.style.color = '#b91c1c';
          alertBox.innerText = `Ralat menyimpan artikel: ${err.message || 'Sila cuba lagi'}`;
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Publish Article';
        }
      }
    });
  }

  const editArticleForm = document.getElementById('editArticleForm');
  if (editArticleForm) {
    editArticleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editArticleId').value;
      const title = document.getElementById('editArticleTitle').value.trim();
      let category = document.getElementById('editArticleCategory').value;
      if (category === '__CUSTOM__') {
        const customCat = (document.getElementById('editArticleCustomCategory')?.value || '').trim();
        if (!customCat) {
          alert('Sila taip nama kategori baharu anda.');
          return;
        }
        category = customCat;
      }
      const excerpt = document.getElementById('editArticleExcerpt').value.trim();
      const content = document.getElementById('editArticleContent').value.trim();
      const readingTime = document.getElementById('editArticleReadingTime').value.trim() || '4 min read';
      const status = document.getElementById('editArticleStatus').value;
      const coverFileInput = document.getElementById('editArticleCoverInput');

      const submitBtn = document.getElementById('btnUpdateArticle');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Updating...';
      }

      try {
        const updatePayload = {
          title,
          category,
          excerpt,
          content,
          reading_time: readingTime,
          status,
          updated_at: new Date().toISOString()
        };

        if (coverFileInput && coverFileInput.files && coverFileInput.files[0]) {
          const file = coverFileInput.files[0];
          const fileName = `article_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${file.name.split('.').pop()}`;
          const uploadedUrl = await uploadImageFile(file, fileName);
          if (uploadedUrl) updatePayload.cover_image = uploadedUrl;
        }

        const { error } = await supabaseClient
          .from('articles')
          .update(updatePayload)
          .eq('id', id);

        if (error) throw error;

        closeEditArticleModal();
        loadAdminArticles();
        alert('Artikel berjaya dikemaskini!');
      } catch (err) {
        alert(`Ralat kemaskini: ${err.message}`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Save Changes';
        }
      }
    });
  }
}

window.openEditArticleModal = function(id) {
  const article = adminArticles.find(a => a.id === id);
  if (!article) return;

  document.getElementById('editArticleId').value = article.id;
  document.getElementById('editArticleTitle').value = article.title;
  
  const catSel = document.getElementById('editArticleCategory');
  const catCustomWrap = document.getElementById('editCustomCategoryWrapper');
  const catCustomInput = document.getElementById('editArticleCustomCategory');

  const defaultOptions = ['Panduan Industri', 'Tips Komersial', 'Pelaburan Tanah', 'Laporan Pasaran'];
  if (catSel) {
    if (defaultOptions.includes(article.category)) {
      catSel.value = article.category;
      if (catCustomWrap) catCustomWrap.style.display = 'none';
      if (catCustomInput) catCustomInput.value = '';
    } else {
      catSel.value = '__CUSTOM__';
      if (catCustomWrap) catCustomWrap.style.display = 'block';
      if (catCustomInput) catCustomInput.value = article.category || '';
    }
  }

  document.getElementById('editArticleExcerpt').value = article.excerpt || '';
  document.getElementById('editArticleContent').value = article.content || '';
  document.getElementById('editArticleReadingTime').value = article.reading_time || '4 min read';
  document.getElementById('editArticleStatus').value = article.status || 'Published';

  const modal = document.getElementById('editArticleModal');
  if (modal) modal.style.display = 'flex';
};

window.closeEditArticleModal = function() {
  const modal = document.getElementById('editArticleModal');
  if (modal) modal.style.display = 'none';
};

window.handleDeleteArticle = async function(id) {
  if (!confirm('Adakah anda pasti ingin memadamkan artikel ini?')) return;
  try {
    const { error } = await supabaseClient
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    loadAdminArticles();
  } catch (err) {
    alert(`Gagal memadam artikel: ${err.message}`);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setupArticleHandlers();
});
