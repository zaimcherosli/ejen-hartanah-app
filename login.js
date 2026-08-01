// Login.js - Supabase Authentication Handler for Agent Portal
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const alertBox = document.getElementById('loginAlert');

  function showAlert(msg, isError = true) {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    alertBox.style.background = isError ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    alertBox.style.color = isError ? '#dc2626' : '#047857';
    alertBox.style.border = `1px solid ${isError ? '#fca5a5' : '#6ee7b7'}`;
    alertBox.innerText = msg;
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

      showAlert('Semakan log masuk ejen ke Supabase...', false);

      try {
        // 1. Try Signing In
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          console.warn('Sign-in error:', error.message);

          // 2. If invalid credentials or user not registered yet, attempt sign-up for agent setup
          if (error.message.includes('Invalid login credentials')) {
            showAlert('Mencipta akaun ejen baharu di Supabase...', false);
            
            const { data: signUpData, error: signUpErr } = await supabaseClient.auth.signUp({
              email: email,
              password: password,
            });

            if (!signUpErr && signUpData && signUpData.user) {
              showAlert('Akaun ejen berjaya didaftar & dilog masuk! Mengalih ke Dashboard...', false);
              setTimeout(() => {
                window.location.href = 'dashboard.html';
              }, 800);
              return;
            } else if (signUpErr) {
              showAlert('Ralat Log Masuk: Kata laluan tidak tepat atau akaun belum didaftar.', true);
              return;
            }
          }

          showAlert('Gagal Log Masuk: ' + error.message, true);
        } else if (data && data.session) {
          showAlert('Log masuk berjaya! Mengalih ke Dashboard...', false);
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        }
      } catch (err) {
        console.error('Login system error:', err);
        showAlert('Ralat Sistem: ' + err.message, true);
      }
    });
  }
});
