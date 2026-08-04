// Dashboard.js - Agent Management Logic with Preview & Edit Listing Capability
let currentUser = null;
let currentListingsData = [];

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadAgentListings();
  setupFormHandler();
  setupEditFormHandler();
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
  document.getElementById('agentEmail').innerText = currentUser.email;

  // Check if user is SuperAdmin (Strictly huzaimrosli@gmail.com and biztreat2017@gmail.com)
  const isSuperAdmin = ['huzaimrosli@gmail.com', 'biztreat2017@gmail.com'].includes((currentUser.email || '').toLowerCase());

  if (isSuperAdmin) {
    const mainAdminCard = document.getElementById('superadminMainCard');
    if (mainAdminCard) {
      mainAdminCard.style.display = 'block';
      loadAgentApprovals();
      loadActivityLogs();
    }
  }

  document.getElementById('btnLogout').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  });
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
      const emptyMsg = `Belum ada listing. Sila tambah di borang di atas/sebelah.`;
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">${emptyMsg}</td></tr>`;
      if (mobileContainer) mobileContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">${emptyMsg}</div>`;
      return;
    }

    // 1. Render Desktop Table Rows
    if (tbody) {
      tbody.innerHTML = data.map(item => {
        const formattedPrice = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(item.asking_price);
        const thumb = (item.images && item.images.length > 0) ? item.images[0] : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';

        return `
          <tr onclick="openEditModal('${item.id}')" style="cursor: pointer;" title="Click to Preview & Edit">
            <td style="padding: 0.65rem 0.5rem;">
              <img src="${thumb}" style="width: 54px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);" onerror="this.src='https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'" />
            </td>
            <td style="padding: 0.65rem 0.5rem;">
              <strong style="color: var(--text-main); font-size: 0.88rem; display: block; line-height: 1.25;">${item.title}</strong>
              <span style="font-size: 0.76rem; color: var(--text-muted); display: block; margin-top: 0.15rem;">${item.location} • ${item.property_type}</span>
            </td>
            <td style="padding: 0.65rem 0.5rem; color: var(--cem-red); font-weight: 800; font-size: 0.88rem; white-space: nowrap;">${formattedPrice}</td>
            <td style="padding: 0.65rem 0.5rem;">
              <span style="background: rgba(16,185,129,0.12); color: #059669; padding: 0.25rem 0.55rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; white-space: nowrap;">
                ${item.status}
              </span>
            </td>
            <td style="padding: 0.65rem 0.5rem; text-align: center;">
              <button onclick="event.stopPropagation(); deleteListing('${item.id}')" title="Delete Listing" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; width: 34px; height: 34px; border-radius: 6px; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;">
                🗑️
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 2. Render Sleek Mobile App Cards (Top Right: Delete Icon | Bottom Right: Green Badge)
    if (mobileContainer) {
      mobileContainer.innerHTML = data.map(item => {
        const formattedPrice = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(item.asking_price);
        const thumb = (item.images && item.images.length > 0) ? item.images[0] : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';

        return `
          <div class="inv-card-item" onclick="openEditModal('${item.id}')" title="Click to Preview & Edit">
            <img src="${thumb}" class="inv-card-thumb" onerror="this.src='https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'" />
            
            <div class="inv-card-details">
              <div class="inv-card-title">${item.title}</div>
              <div class="inv-card-sub">📍 ${item.location} • ${item.property_type}</div>
              <div class="inv-card-price">${formattedPrice}</div>
            </div>

            <!-- Right Column Stack: Trash Icon on Top, Green Badge on Bottom -->
            <div class="inv-card-right-actions">
              <button onclick="event.stopPropagation(); deleteListing('${item.id}')" class="inv-card-delete" title="Delete Listing">🗑️</button>
              <span class="inv-card-badge">${item.status}</span>
            </div>
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

  document.getElementById('editId').value = item.id;
  document.getElementById('editTitle').value = item.title || '';
  document.getElementById('editPrice').value = item.asking_price || '';
  document.getElementById('editStatus').value = item.status || 'Available';
  document.getElementById('editListingType').value = item.listing_type || 'For Rent';
  document.getElementById('editPropertyType').value = item.property_type || 'Detached Factory';

  const rawZoning = item.zoning || '';
  let tenureVal = 'Freehold';
  if (rawZoning.includes('Freehold')) tenureVal = 'Freehold';
  else if (rawZoning.includes('Leasehold Extension')) tenureVal = 'Leasehold Extension';
  else if (rawZoning.includes('Leasehold')) tenureVal = 'Leasehold';

  if (document.getElementById('editTenure')) {
    document.getElementById('editTenure').value = tenureVal;
  }

  document.getElementById('editPower').value = item.power_supply_amp || '';
  document.getElementById('editCeiling').value = item.ceiling_height_ft || '';
  document.getElementById('editLocation').value = item.location || '';
  document.getElementById('editDescription').value = item.description || '';

  renderEditImagesPreview();

  document.getElementById('editModal').classList.add('active');
}

function renderEditImagesPreview() {
  const imagesContainer = document.getElementById('editPreviewImages');
  if (!imagesContainer) return;

  if (currentEditImages && currentEditImages.length > 0) {
    imagesContainer.innerHTML = currentEditImages.map((img, idx) => `
      <div style="position: relative; display: inline-block; flex-shrink: 0;">
        <img src="${img}" style="height: 110px; width: 130px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border);" />
        <button type="button" onclick="removeEditImage(${idx})" title="Remove photo" style="position: absolute; top: 4px; right: 4px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: transform 0.15s;">✕</button>
      </div>
    `).join('');
  } else {
    imagesContainer.innerHTML = '<span style="font-size: 0.82rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">No existing property photos. Upload new photos below.</span>';
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
    const tenure = document.getElementById('editTenure') ? document.getElementById('editTenure').value : 'Freehold';
    const power_supply_amp = document.getElementById('editPower').value;
    const ceiling_height_ft = document.getElementById('editCeiling').value;
    const location = document.getElementById('editLocation').value;
    const description = document.getElementById('editDescription').value;

    const newFilesInput = document.getElementById('editNewImagesInput');
    const newFiles = newFilesInput ? newFilesInput.files : null;

    alertBox.style.display = 'block';
    alertBox.style.background = '#fef3c7';
    alertBox.style.color = '#b45309';
    alertBox.innerText = 'Updating listing & processing photos...';

    let finalImages = [...currentEditImages];

    if (newFiles && newFiles.length > 0) {
      alertBox.innerText = 'Compressing & uploading new photos to Supabase...';
      for (let i = 0; i < newFiles.length; i++) {
        let rawFile = newFiles[i];
        const fileToUpload = await compressImage(rawFile);
        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabaseClient
          .storage
          .from('listing-images')
          .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: false });

        if (uploadErr) {
          console.error('Image upload error:', uploadErr);
          alertBox.style.background = '#fee2e2';
          alertBox.style.color = '#dc2626';
          alertBox.innerText = `Ralat muat naik gambar: ${uploadErr.message}`;
          return;
        }

        const { data: publicUrlData } = supabaseClient
          .storage
          .from('listing-images')
          .getPublicUrl(filePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          finalImages.push(publicUrlData.publicUrl);
        }
      }
    }

    const { error } = await supabaseClient
      .from('listings')
      .update({
        title,
        asking_price,
        status,
        listing_type,
        property_type,
        zoning: tenure,
        power_supply_amp,
        ceiling_height_ft,
        location,
        description,
        images: finalImages
      })
      .eq('id', id);

    if (error) {
      alertBox.style.background = '#fee2e2';
      alertBox.style.color = '#dc2626';
      alertBox.innerText = 'Failed to update: ' + error.message;
    } else {
      alertBox.style.background = '#d1fae5';
      alertBox.style.color = '#047857';
      alertBox.innerText = 'Listing updated successfully!';
      logActivity('EDIT_LISTING', `Mengemaskini listing: "${title}" (Status: ${status}, Harga: RM ${asking_price})`, id);
      setTimeout(() => {
        closeEditModal();
        loadAgentListings();
      }, 600);
    }
  });
}

// Setup Add Form Handler
function setupFormHandler() {
  const form = document.getElementById('addListingForm');
  const alertBox = document.getElementById('formAlert');

  function showAlert(msg, isError = true) {
    alertBox.style.display = 'block';
    alertBox.style.background = isError ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    alertBox.style.color = isError ? '#f43f5e' : '#10b981';
    alertBox.style.border = `1px solid ${isError ? '#f43f5e' : '#10b981'}`;
    alertBox.innerText = msg;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const listing_type = document.getElementById('listing_type').value;
    const property_type = document.getElementById('property_type').value;
    const tenure = document.getElementById('tenure') ? document.getElementById('tenure').value : 'Freehold';
    const asking_price = parseFloat(document.getElementById('asking_price').value);
    const power_supply_amp = document.getElementById('power_supply_amp').value;
    const ceiling_height_ft = document.getElementById('ceiling_height_ft').value;
    const floor_loading_kn = document.getElementById('floor_loading_kn').value;
    const zoning = document.getElementById('zoning').value;
    const fullZoning = `${tenure} | ${zoning}`;
    const built_up_sqft = parseFloat(document.getElementById('built_up_sqft').value) || null;
    const land_area_sqft = parseFloat(document.getElementById('land_area_sqft').value) || null;
    const location = document.getElementById('location').value;
    const agent_phone = document.getElementById('agent_phone').value;
    const description = document.getElementById('description').value;

    const filesInput = document.getElementById('imagesInput');
    const files = filesInput.files;

    showAlert('Mengecilkan & memuat naik gambar ke Supabase Storage...', false);

    const imageUrls = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        let rawFile = files[i];
        const fileToUpload = await compressImage(rawFile);

        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabaseClient
          .storage
          .from('listing-images')
          .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: false });

        if (uploadErr) {
          console.error('Image upload error:', uploadErr);
          showAlert(`Ralat muat naik gambar: ${uploadErr.message}`, true);
          return;
        }

        const { data: publicUrlData } = supabaseClient
          .storage
          .from('listing-images')
          .getPublicUrl(filePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          imageUrls.push(publicUrlData.publicUrl);
        }
      }
    }

    const { data: insertedData, error: insertErr } = await supabaseClient
      .from('listings')
      .insert([{
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
      }]);

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
      const paths = item.images.map(url => {
        const parts = url.split('/storage/v1/object/public/listing-images/');
        return parts.length > 1 ? parts[1] : null;
      }).filter(Boolean);

      if (paths.length > 0) {
        console.log('Deleting storage files:', paths);
        await supabaseClient.storage.from('listing-images').remove(paths);
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

  container.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">⏳ Memuat senarai pendaftaran ejen dari Supabase...</span>';

  try {
    const { data: profiles, error } = await supabaseClient
      .from('agent_profiles')
      .select('*')
      .order('registered_at', { ascending: false });

    if (error) {
      console.warn('agent_profiles query warning:', error.message);
      container.innerHTML = `<span style="color: #dc2626; font-size: 0.85rem;">Ralat memuat senarai ejen: ${error.message}. Sila pastikan jadual 'agent_profiles' wujud di Supabase SQL Editor.</span>`;
      return;
    }

    if (!profiles || profiles.length === 0) {
      container.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">Tiada pendaftaran ejen baharu dijumpai.</span>';
      return;
    }

    const html = `
      <div style="overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 8px; border: 1px solid var(--border); background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; min-width: 680px;">
          <thead>
            <tr style="background: #f8fafc; color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border);">
              <th style="padding: 0.85rem 1rem; white-space: nowrap;">NAMA EJEN</th>
              <th style="padding: 0.85rem 1rem; white-space: nowrap;">NO. WHATSAPP</th>
              <th style="padding: 0.85rem 1rem; white-space: nowrap;">REN NO</th>
              <th style="padding: 0.85rem 1rem;">EMEL</th>
              <th style="padding: 0.85rem 1rem; white-space: nowrap;">STATUS</th>
              <th style="padding: 0.85rem 1rem; text-align: center; white-space: nowrap;">TINDAKAN APPROVAL</th>
            </tr>
          </thead>
          <tbody>
            ${profiles.map(u => {
              const name = u.full_name || 'Ejen Registered';
              const wa = u.whatsapp_number || '-';
              const ren = u.ren_number || '-';
              const status = u.status || 'Pending';

              let badgeBg = '#d1fae5'; let badgeColor = '#047857'; let badgeBorder = '#a7f3d0';
              if (status === 'Pending') { badgeBg = '#fef3c7'; badgeColor = '#b45309'; badgeBorder = '#fde68a'; }
              if (status === 'Rejected') { badgeBg = '#fee2e2'; badgeColor = '#dc2626'; badgeBorder = '#fca5a5'; }

              const cleanWa = wa.replace(/[^0-9]/g, '');

              return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 0.85rem 1rem; font-weight: 700; color: var(--cem-navy); min-width: 160px;">${name}</td>
                  <td style="padding: 0.85rem 1rem; font-weight: 600; white-space: nowrap;">
                    <a href="https://wa.me/${cleanWa.startsWith('60') ? cleanWa : '60' + cleanWa}" target="_blank" style="color: #16a34a; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; background: #f0fdf4; padding: 0.3rem 0.65rem; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 0.82rem;">
                      💬 ${wa}
                    </a>
                  </td>
                  <td style="padding: 0.85rem 1rem; color: var(--text-muted); font-weight: 600; white-space: nowrap;">
                    <span style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.78rem;">${ren}</span>
                  </td>
                  <td style="padding: 0.85rem 1rem; color: var(--text-main); font-weight: 500;">${u.email}</td>
                  <td style="padding: 0.85rem 1rem; white-space: nowrap;">
                    <span style="padding: 0.3rem 0.7rem; border-radius: 20px; font-weight: 800; font-size: 0.75rem; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; display: inline-flex; align-items: center; gap: 0.25rem;">
                      ${status === 'Pending' ? '⏳' : status === 'Approved' ? '✅' : '❌'} ${status}
                    </span>
                  </td>
                  <td style="padding: 0.85rem 1rem; text-align: center; white-space: nowrap;">
                    <div style="display: inline-flex; gap: 0.35rem; align-items: center;">
                      ${status === 'Pending' ? `
                        <button type="button" onclick="approveAgent('${u.id}', '${u.email}')" style="padding: 0.45rem 0.85rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer; box-shadow: 0 1px 3px rgba(16,185,129,0.3); display: inline-flex; align-items: center; gap: 0.25rem;">✅ Approve</button>
                        <button type="button" onclick="rejectAgent('${u.id}', '${u.email}')" style="padding: 0.45rem 0.85rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer; box-shadow: 0 1px 3px rgba(239,68,68,0.3); display: inline-flex; align-items: center; gap: 0.25rem;">❌ Reject</button>
                      ` : `
                        <span style="color: var(--text-muted); font-size: 0.78rem; font-weight: 600; background: #f8fafc; padding: 0.3rem 0.6rem; border-radius: 4px; border: 1px solid #e2e8f0;">Active / ${status}</span>
                      `}
                      <button type="button" onclick="deleteAgentProfile('${u.id}', '${u.email}')" title="Memadam profil ejen dari sistem" style="padding: 0.45rem 0.6rem; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;" aria-label="Padam">🗑️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  } catch (err) {
    console.error('loadAgentApprovals error:', err);
    container.innerHTML = `<span style="color: #dc2626; font-size: 0.85rem;">Ralat: ${err.message}</span>`;
  }
}

async function approveAgent(userId, email) {
  if (!confirm(`Adakah anda pasti mahu LULUSKAN akaun ejen (${email})?`)) return;

  try {
    const { error } = await supabaseClient
      .from('agent_profiles')
      .update({ status: 'Approved' })
      .eq('id', userId);

    if (error) {
      alert('Gagal meluluskan: ' + error.message);
    } else {
      alert(`🎉 Akaun ejen (${email}) TELAH DILULUSKAN! Ejen kini boleh log masuk ke Dashboard.`);
      await logActivity('APPROVE_AGENT', `Meluluskan pendaftaran akaun ejen (${email})`, userId);
      loadAgentApprovals();
      loadActivityLogs();
    }
  } catch (err) {
    console.error('approveAgent error:', err);
    alert('Ralat: ' + err.message);
  }
}

async function rejectAgent(userId, email) {
  if (!confirm(`Adakah anda pasti mahu TOLAK pendaftaran akaun ejen (${email})?`)) return;

  try {
    const { error } = await supabaseClient
      .from('agent_profiles')
      .update({ status: 'Rejected' })
      .eq('id', userId);

    if (error) {
      alert('Gagal menolak: ' + error.message);
    } else {
      alert(`Permohonan ejen (${email}) TELAH DITOLAK.`);
      await logActivity('REJECT_AGENT', `Menolak pendaftaran akaun ejen (${email})`, userId);
      loadAgentApprovals();
      loadActivityLogs();
    }
  } catch (err) {
    console.error('rejectAgent error:', err);
    alert('Ralat: ' + err.message);
  }
}

async function deleteAgentProfile(userId, email) {
  if (!confirm(`Adakah anda pasti mahu MEMADAM PROFIL EJEN (${email}) daripada sistem?`)) return;

  try {
    const { data, error } = await supabaseClient
      .from('agent_profiles')
      .delete()
      .ilike('email', email)
      .select();

    if (error) {
      alert('Gagal memadam profil ejen: ' + error.message);
    } else {
      alert(`Profil ejen (${email}) TELAH DIPADAM daripada sistem.`);
      await logActivity('DELETE_AGENT', `Memadam pendaftaran akaun ejen (${email})`, userId);
      loadAgentApprovals();
      loadActivityLogs();
    }
  } catch (err) {
    console.error('deleteAgentProfile error:', err);
    alert('Ralat: ' + err.message);
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

    logsBtn.style.background = '#f1f5f9';
    logsBtn.style.color = 'var(--text-main)';
    logsBtn.style.border = '1px solid var(--border-strong)';

    approvalsContent.style.display = 'block';
    logsContent.style.display = 'none';

    if (refreshApprovals) refreshApprovals.style.display = 'inline-block';
    if (refreshLogs) refreshLogs.style.display = 'none';
  } else {
    logsBtn.style.background = 'var(--cem-navy)';
    logsBtn.style.color = 'white';
    logsBtn.style.border = 'none';

    approvalsBtn.style.background = '#f1f5f9';
    approvalsBtn.style.color = 'var(--text-main)';
    approvalsBtn.style.border = '1px solid var(--border-strong)';

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

  container.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">⏳ Memuatkan log aktiviti...</span>';

  try {
    const { data: logs, error } = await supabaseClient
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('activity_logs query error:', error.message);
      container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.82rem;">Belum ada log aktiviti direkodkan setakat ini. Sila pastikan jadual 'activity_logs' telah dicipta di Supabase SQL Editor.</span>`;
      return;
    }

    if (!logs || logs.length === 0) {
      container.innerHTML = '<span style="font-size: 0.82rem; color: var(--text-muted);">Tiada log aktiviti direkodkan setakat ini.</span>';
      return;
    }

    const html = `
      <div style="overflow-x: auto; max-height: 340px; overflow-y: auto; -webkit-overflow-scrolling: touch; border-radius: 8px; border: 1px solid var(--border); background: white; box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.83rem; text-align: left; min-width: 620px;">
          <thead style="position: sticky; top: 0; z-index: 10;">
            <tr style="background: #f8fafc; color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border);">
              <th style="padding: 0.8rem 0.9rem; white-space: nowrap; background: #f8fafc;">MASA &amp; TARIKH</th>
              <th style="padding: 0.8rem 0.9rem; white-space: nowrap; background: #f8fafc;">EJEN / PENGENDALI</th>
              <th style="padding: 0.8rem 0.9rem; white-space: nowrap; background: #f8fafc;">JENIS TINDAKAN</th>
              <th style="padding: 0.8rem 0.9rem; background: #f8fafc;">BUTIRAN AKTIVITI</th>
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

    container.innerHTML = html;
  } catch (err) {
    console.error('loadActivityLogs error:', err);
  }
}
