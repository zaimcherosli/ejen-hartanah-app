// register.js - Agent Registration Handler with SuperAdmin Approval Workflow & REN Photo Upload
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const alertBox = document.getElementById('registerAlert');
  const renPhotoInput = document.getElementById('renPhotoInput');
  const renPhotoPreview = document.getElementById('renPhotoPreview');
  const renPhotoPlaceholderIcon = document.getElementById('renPhotoPlaceholderIcon');
  const btnSubmit = document.getElementById('btnSubmitRegister');

  function showAlert(msg, isError = true) {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    alertBox.style.background = isError ? '#fee2e2' : '#d1fae5';
    alertBox.style.color = isError ? '#dc2626' : '#047857';
    alertBox.style.border = `1px solid ${isError ? '#fca5a5' : '#6ee7b7'}`;
    alertBox.style.textAlign = 'center';
    alertBox.innerHTML = msg;
  }

  // Live REN Photo Preview
  if (renPhotoInput) {
    renPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (renPhotoPreview) {
            renPhotoPreview.src = ev.target.result;
            renPhotoPreview.style.display = 'block';
          }
          if (renPhotoPlaceholderIcon) {
            renPhotoPlaceholderIcon.style.display = 'none';
          }
        };
        reader.readAsDataURL(file);
      } else {
        if (renPhotoPreview) renPhotoPreview.style.display = 'none';
        if (renPhotoPlaceholderIcon) renPhotoPlaceholderIcon.style.display = 'block';
      }
    });
  }

  // Helper: Client-side Image Compression
  function compressAgentPhoto(file, maxWidth = 800, maxHeight = 800, quality = 0.85) {
    return new Promise((resolve) => {
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
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
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

  // Helper: Upload Photo to Cloudflare R2 Edge Function with Supabase Storage Fallback
  async function uploadAgentPhoto(fileToUpload, fileName) {
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload, fileName);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-upload-purpose': 'agent-registration'
        },
        body: formData
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) {
          return json.url;
        }
      }
    } catch (err) {
      console.warn('R2 registration upload failed, trying fallback...', err);
    }

    // Fallback to Supabase Storage if R2 is unavailable
    try {
      if (typeof supabaseClient !== 'undefined' && supabaseClient.storage) {
        const filePath = `agents/${fileName}`;
        const { data, error } = await supabaseClient
          .storage
          .from('listing-images')
          .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const { data: pubData } = supabaseClient
            .storage
            .from('listing-images')
            .getPublicUrl(filePath);
          return pubData ? pubData.publicUrl : null;
        }
      }
    } catch (storageErr) {
      console.warn('Supabase Storage fallback error:', storageErr);
    }

    return null;
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('fullName').value.trim();
      const whatsapp = document.getElementById('whatsappNumber').value.trim();
      const renNumber = document.getElementById('renNumber').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!fullName || !whatsapp || !renNumber || !email || !password) {
        showAlert('Sila isi semua maklumat pendaftaran wajib.', true);
        return;
      }

      if (password.length < 6) {
        showAlert('Kata laluan mestilah sekurang-kurangnya 6 aksara.', true);
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Memproses Pendaftaran...';
      }

      showAlert('Menghantar pendaftaran ejen ke sistem...', false);

      try {
        let photoUrl = '';
        const photoFile = renPhotoInput && renPhotoInput.files && renPhotoInput.files[0];

        if (photoFile) {
          showAlert('Memuat naik foto REN ejen ke pelayan...', false);
          const compressed = await compressAgentPhoto(photoFile);
          const safeName = `ren_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
          const uploadedUrl = await uploadAgentPhoto(compressed, safeName);
          if (uploadedUrl) {
            photoUrl = uploadedUrl;
          }
        }

        showAlert('Mendaftarkan akaun ejen di sistem keselamatan...', false);

        // Register user with user_metadata stored in Supabase Auth
        const { data, error } = await supabaseClient.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: fullName,
              whatsapp_number: whatsapp,
              ren_number: renNumber,
              photo_url: photoUrl,
              avatar_url: photoUrl,
              status: 'Pending', // Pending | Approved | Rejected
              role: 'agent',
              registered_at: new Date().toISOString()
            }
          }
        });

        if (error) {
          console.error('SignUp error:', error);
          if (error.message.includes('already registered')) {
            showAlert('Emel ini telah terdaftar. Sila <a href="login.html" style="font-weight:bold; color:#047857;">Log Masuk</a> atau hubungi Admin.', true);
          } else {
            showAlert('Ralat Pendaftaran: ' + error.message, true);
          }
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'HANTAR PENDAFTARAN EJEN';
          }
          return;
        }

        if (data && data.user) {
          // Insert/Upsert into agent_profiles table for SuperAdmin approval list
          try {
            await supabaseClient.from('agent_profiles').upsert([{
              id: data.user.id,
              full_name: fullName,
              whatsapp_number: whatsapp,
              ren_number: renNumber,
              photo_url: photoUrl,
              avatar_url: photoUrl,
              email: email,
              status: 'Pending',
              registered_at: new Date().toISOString()
            }], { onConflict: 'email' });
          } catch (profileErr) {
            console.warn('Profile table insert warning:', profileErr);
          }

          showAlert(`
            <div style="text-align: center; padding: 0.25rem 0;">
              <div style="font-size: 1.05rem; font-weight: 800; margin-bottom: 0.4rem;">Pendaftaran Berjaya Dihantar!</div>
              <div style="margin-bottom: 0.35rem;">Akaun ejen anda (<strong>${email}</strong>) kini berstatus <strong>Pending Approval</strong>.</div>
              <div style="margin-bottom: 0.85rem; line-height: 1.5;">Sila maklumkan kepada <strong>SuperAdmin</strong> untuk kelulusan akaun anda sebelum anda boleh log masuk.</div>
              <a href="login.html" class="btn-show-listings" style="display: inline-block; padding: 0.65rem 1.25rem; height: auto; text-decoration: none; border-radius: 6px; font-weight: 700;">KEMBALI KE HALAMAN LOG MASUK</a>
            </div>
          `, false);
          registerForm.reset();
          if (renPhotoPreview) renPhotoPreview.style.display = 'none';
          if (renPhotoPlaceholderIcon) renPhotoPlaceholderIcon.style.display = 'block';
        }
      } catch (err) {
        console.error('Registration error:', err);
        showAlert('Ralat Sistem: ' + err.message, true);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerText = 'HANTAR PENDAFTARAN EJEN';
        }
      }
    });
  }
});
