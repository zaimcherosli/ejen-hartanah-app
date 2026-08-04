// login.js - Supabase Authentication Handler for Agent Portal with SuperAdmin Approval Enforcement
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const alertBox = document.getElementById('loginAlert');

  function showAlert(msg, isError = true) {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    alertBox.style.background = isError ? '#fee2e2' : '#d1fae5';
    alertBox.style.color = isError ? '#dc2626' : '#047857';
    alertBox.style.border = `1px solid ${isError ? '#fca5a5' : '#6ee7b7'}`;
    alertBox.innerHTML = msg;
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!email || !password) {
        showAlert('Sila isi emel dan kata laluan.', true);
        return;
      }

      showAlert('⏳ Semakan log masuk ejen ke Supabase...', false);

      try {
        // Sign In with Supabase Auth
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          console.warn('Sign-in error:', error.message);
          if (error.message.includes('Invalid login credentials')) {
            showAlert('Ralat Log Masuk: Kata laluan atau emel tidak tepat. Belum ada akaun? <a href="register.html" style="font-weight:bold; color:#dc2626;">Daftar Di Sini</a>.', true);
          } else {
            showAlert('Gagal Log Masuk: ' + error.message, true);
          }
          return;
        }

        if (data && data.user) {
          let status = 'Approved';

          try {
            const { data: profile } = await supabaseClient
              .from('agent_profiles')
              .select('status')
              .ilike('email', email)
              .maybeSingle();

            if (profile && profile.status) {
              status = profile.status;
            } else {
              const metadata = data.user.user_metadata || {};
              status = metadata.status || 'Approved';
            }
          } catch (pErr) {
            const metadata = data.user.user_metadata || {};
            status = metadata.status || 'Approved';
          }

          if (status === 'Pending') {
            await supabaseClient.auth.signOut();
            showAlert(`
              ⚠️ <strong>Akaun Belum Diluluskan!</strong><br>
              Akaun ejen anda (<strong>${email}</strong>) masih dalam proses semakan <strong>Pending Approval</strong>.<br>
              Sila maklumkan kepada <strong>SuperAdmin</strong> untuk kelulusan akaun anda.
            `, true);
            return;
          }

          if (status === 'Rejected') {
            await supabaseClient.auth.signOut();
            showAlert(`
              ❌ <strong>Pendaftaran Tidak Diluluskan</strong><br>
              Permohonan akaun ejen bagi emel ini tidak diluluskan. Sila hubungi IT Admin.
            `, true);
            return;
          }

          // Approved / Active User -> Proceed to Dashboard
          showAlert('✅ Log masuk berjaya! Mengalih ke Dashboard...', false);
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 600);
        }
      } catch (err) {
        console.error('Login system error:', err);
        showAlert('Ralat Sistem: ' + err.message, true);
      }
    });
  }
});
