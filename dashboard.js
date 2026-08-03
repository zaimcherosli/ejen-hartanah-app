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

  // Check if user is SuperAdmin
  const meta = currentUser.user_metadata || {};
  const isSuperAdmin = meta.role === 'superadmin' || 
                      meta.status === 'Approved' ||
                      ['multiple.revenue@gmail.com', 'huzaimrosli@gmail.com', 'biztreat2017@gmail.com'].includes(currentUser.email);

  if (isSuperAdmin) {
    const adminSection = document.getElementById('superadminApprovalSection');
    if (adminSection) {
      adminSection.style.display = 'block';
      loadAgentApprovals();
    }
  }

  document.getElementById('btnLogout').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  });
}

// Helper: Compress Image client-side using HTML5 Canvas (Reduces 5MB to ~180KB)
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    if (file.size <= 300 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
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
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          console.log(`Compressed ${file.name}: ${Math.round(file.size/1024)}KB -> ${Math.round(compressedFile.size/1024)}KB`);
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
    const asking_price = parseFloat(document.getElementById('asking_price').value);
    const power_supply_amp = document.getElementById('power_supply_amp').value;
    const ceiling_height_ft = document.getElementById('ceiling_height_ft').value;
    const floor_loading_kn = document.getElementById('floor_loading_kn').value;
    const zoning = document.getElementById('zoning').value;
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
        zoning,
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
      .select('images')
      .eq('id', id)
      .single();

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
    const { data: { users }, error } = await supabaseClient.auth.admin.listUsers();
    if (error) {
      container.innerHTML = `<span style="color: #dc2626; font-size: 0.85rem;">Ralat memuat senarai ejen: ${error.message}</span>`;
      return;
    }

    if (!users || users.length === 0) {
      container.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">Tiada pendaftaran ejen dijumpai.</span>';
      return;
    }

    const html = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; background: white; border-radius: 6px; overflow: hidden; border: 1px solid var(--border);">
          <thead>
            <tr style="background: #f8fafc; text-align: left; color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em;">
              <th style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--border);">NAMA EJEN</th>
              <th style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--border);">NO. WHATSAPP</th>
              <th style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--border);">REN NO</th>
              <th style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--border);">EMEL</th>
              <th style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--border);">STATUS</th>
              <th style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--border); text-align: center;">TINDAKAN APPROVAL</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              const meta = u.user_metadata || {};
              const name = meta.full_name || 'Ejen Registered';
              const wa = meta.whatsapp_number || '-';
              const ren = meta.ren_number || '-';
              const status = meta.status || 'Approved';

              let badgeBg = '#d1fae5'; let badgeColor = '#047857';
              if (status === 'Pending') { badgeBg = '#fef3c7'; badgeColor = '#b45309'; }
              if (status === 'Rejected') { badgeBg = '#fee2e2'; badgeColor = '#dc2626'; }

              const cleanWa = wa.replace(/[^0-9]/g, '');

              return `
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding: 0.75rem 0.85rem; font-weight: 700; color: var(--cem-navy);">${name}</td>
                  <td style="padding: 0.75rem 0.85rem; font-weight: 600;">
                    <a href="https://wa.me/${cleanWa.startsWith('60') ? cleanWa : '60' + cleanWa}" target="_blank" style="color: #25d366; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem;">
                      💬 ${wa}
                    </a>
                  </td>
                  <td style="padding: 0.75rem 0.85rem; color: var(--text-muted); font-weight: 600;">${ren}</td>
                  <td style="padding: 0.75rem 0.85rem;">${u.email}</td>
                  <td style="padding: 0.75rem 0.85rem;">
                    <span style="padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 800; font-size: 0.75rem; background: ${badgeBg}; color: ${badgeColor}; display: inline-block;">${status}</span>
                  </td>
                  <td style="padding: 0.75rem 0.85rem; text-align: center;">
                    ${status === 'Pending' ? `
                      <button onclick="approveAgent('${u.id}', '${u.email}')" style="padding: 0.4rem 0.8rem; background: #10b981; color: white; border: none; border-radius: 4px; font-weight: 700; font-size: 0.78rem; cursor: pointer; margin-right: 0.35rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">✅ Approve</button>
                      <button onclick="rejectAgent('${u.id}', '${u.email}')" style="padding: 0.4rem 0.8rem; background: #ef4444; color: white; border: none; border-radius: 4px; font-weight: 700; font-size: 0.78rem; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">❌ Reject</button>
                    ` : `
                      <span style="color: var(--text-light); font-size: 0.78rem; font-weight: 600;">Active / ${status}</span>
                    `}
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
    const { data: { user }, error: getErr } = await supabaseClient.auth.admin.getUserById(userId);
    if (getErr || !user) return alert('Ralat mendapatkan data ejen: ' + (getErr ? getErr.message : 'User not found'));

    const meta = user.user_metadata || {};
    const { error } = await supabaseClient.auth.admin.updateUserById(userId, {
      user_metadata: { ...meta, status: 'Approved' }
    });

    if (error) {
      alert('Gagal meluluskan: ' + error.message);
    } else {
      alert(`🎉 Akaun ejen (${email}) TELAH DILULUSKAN! Ejen kini boleh log masuk ke Dashboard.`);
      loadAgentApprovals();
    }
  } catch (err) {
    console.error('approveAgent error:', err);
    alert('Ralat: ' + err.message);
  }
}

async function rejectAgent(userId, email) {
  if (!confirm(`Adakah anda pasti mahu TOLAK pendaftaran akaun ejen (${email})?`)) return;

  try {
    const { data: { user }, error: getErr } = await supabaseClient.auth.admin.getUserById(userId);
    if (getErr || !user) return alert('Ralat mendapatkan data ejen');

    const meta = user.user_metadata || {};
    const { error } = await supabaseClient.auth.admin.updateUserById(userId, {
      user_metadata: { ...meta, status: 'Rejected' }
    });

    if (error) {
      alert('Gagal menolak: ' + error.message);
    } else {
      alert(`Permohonan ejen (${email}) TELAH DITOLAK.`);
      loadAgentApprovals();
    }
  } catch (err) {
    console.error('rejectAgent error:', err);
    alert('Ralat: ' + err.message);
  }
}
