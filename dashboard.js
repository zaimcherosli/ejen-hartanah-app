// Dashboard.js - Agent Management Logic with Auto Compression & Auto Storage Cleanup
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadAgentListings();
  setupFormHandler();
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

// Load Listing Table
async function loadAgentListings() {
  const tbody = document.getElementById('agentListingsTbody');
  try {
    const { data, error } = await supabaseClient
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="5" style="color: #f43f5e; text-align: center;">Error: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Belum ada listing. Sila tambah di borang sebelah.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(item => {
      const formattedPrice = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(item.asking_price);
      const thumb = (item.images && item.images.length > 0) ? item.images[0] : 'https://via.placeholder.com/80?text=No+Image';

      return `
        <tr>
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
            <button onclick="deleteListing('${item.id}')" title="Delete Listing" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#fca5a5'" onmouseout="this.style.background='#fee2e2'">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Load listings error:', err);
  }
}

// Setup Form Submission & Image Upload to Storage
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

    // Upload files to Supabase Storage Bucket 'listing-images' with Auto Compression
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        let rawFile = files[i];
        
        // Auto compress image client side
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

        // Get Public URL
        const { data: publicUrlData } = supabaseClient
          .storage
          .from('listing-images')
          .getPublicUrl(filePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          imageUrls.push(publicUrlData.publicUrl);
        }
      }
    }

    // Insert record to Supabase Database 'listings'
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
    // 1. Get image URLs to delete physical files from storage
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

    // 2. Delete database row
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
