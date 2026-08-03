// register.js - Agent Registration Handler with SuperAdmin Approval Workflow
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const alertBox = document.getElementById('registerAlert');

  function showAlert(msg, isError = true) {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    alertBox.style.background = isError ? '#fee2e2' : '#d1fae5';
    alertBox.style.color = isError ? '#dc2626' : '#047857';
    alertBox.style.border = `1px solid ${isError ? '#fca5a5' : '#6ee7b7'}`;
    alertBox.innerHTML = msg;
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
        showAlert('Sila isi semua maklumat pendaftaran.', true);
        return;
      }

      if (password.length < 6) {
        showAlert('Kata laluan mestilah sekurang-kurangnya 6 aksara.', true);
        return;
      }

      showAlert('⏳ Menghantar pendaftaran ejen ke sistem Supabase...', false);

      try {
        // Register user with user_metadata stored in Supabase Auth
        const { data, error } = await supabaseClient.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: fullName,
              whatsapp_number: whatsapp,
              ren_number: renNumber,
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
          return;
        }

        if (data && data.user) {
          showAlert(`
            🎉 <strong>Pendaftaran Berjaya Dihantar!</strong><br>
            Akaun ejen anda (<strong>${email}</strong>) kini berstatus <strong>Pending Approval</strong>.<br>
            Sila maklumkan kepada <strong>SuperAdmin</strong> untuk kelulusan akaun anda sebelum anda boleh log masuk.<br><br>
            <a href="login.html" class="btn-show-listings" style="display:inline-block; padding:0.5rem 1rem; height:auto; text-decoration:none; margin-top:0.5rem;">Kembali ke Halaman Log Masuk</a>
          `, false);
          registerForm.reset();
        }
      } catch (err) {
        console.error('Registration error:', err);
        showAlert('Ralat Sistem: ' + err.message, true);
      }
    });
  }
});
