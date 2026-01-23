document.addEventListener("DOMContentLoaded", function () {
  const userId = sessionStorage.getItem('userId');
  if (!userId) return;

  // --- Hash function (SHA-256) ---
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- Nama Toko realtime & logo (kode sebelumnya tetap) ---
  const namaTokoInput = document.querySelector('input[placeholder="qwertyuio"]');
  let namaTokoDb = "";
  firebase.firestore().collection('user').doc(userId)
    .onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (data.namaToko) {
          namaTokoInput.value = data.namaToko;
          namaTokoDb = data.namaToko;
        }
        // Tampilkan logo toko jika ada
        document.querySelectorAll('.displayLogo img').forEach(img => {
          img.src = data.logoToko || "./assets/image/logo.png";
        });

        // Hapus DOM keamanan jika loginMethod adalah "G"
        if (data.loginMethod === "G") {
          document.querySelectorAll('.secure').forEach(el => el.remove());
        }
      }
    });

  // --- Pesan alert dengan DOM ---
  function showDomAlert(message, color = "red") {
    let domAlert = document.getElementById('domAlert');
    if (!domAlert) {
      domAlert = document.createElement('div');
      domAlert.id = 'domAlert';
      domAlert.className = `text-${color}-500 text-center font-semibold mt-2 mb-2`;
      // Tempel di atas tombol Simpan
      const simpanBtn = document.querySelector('button.bg-cyan-500');
      simpanBtn.parentNode.insertBefore(domAlert, simpanBtn);
    }
    domAlert.textContent = message;
    domAlert.style.display = "block";
    setTimeout(() => {
      domAlert.style.display = "none";
    }, 3000);
  }

  // Simpan Nama Toko dan Password saat tombol Simpan diklik
  document.querySelector('button.bg-cyan-500').addEventListener('click', async function(e) {
    e.preventDefault();
    // --- Ganti Password ---
    const recendPwInput = document.querySelector('.recend_pw');
    const newPwInput = document.querySelector('.new_pw');
    const confirmPwInput = document.querySelector('.confirm_pw');
    let pwError = document.getElementById('pwError');
    if (!pwError) {
      pwError = document.createElement('div');
      pwError.id = 'pwError';
      pwError.className = 'text-red-500 text-sm mt-1 mb-0';
      recendPwInput.parentNode.insertBefore(pwError, recendPwInput.nextSibling);
    }

    if (recendPwInput.value || newPwInput.value || confirmPwInput.value) {
      pwError.textContent = "";
      if (!recendPwInput.value || !newPwInput.value || !confirmPwInput.value) {
        pwError.textContent = "Semua kolom password harus diisi!";
        return;
      }
      if (newPwInput.value !== confirmPwInput.value) {
        pwError.textContent = "Password baru dan konfirmasi tidak sama!";
        return;
      }
      const userDoc = await firebase.firestore().collection('user').doc(userId).get();
      if (!userDoc.exists) {
        pwError.textContent = "User tidak ditemukan!";
        return;
      }
      const userData = userDoc.data();
      const oldHash = userData.password || "";
      const inputOldHash = await hashPassword(recendPwInput.value);

      if (inputOldHash !== oldHash) {
        pwError.textContent = "Password lama salah!";
        return;
      }

      const newHash = await hashPassword(newPwInput.value);
      await firebase.firestore().collection('user').doc(userId).update({
        password: newHash
      });

      pwError.textContent = "";
      showDomAlert("Password berhasil diubah!", "green");
      recendPwInput.value = "";
      newPwInput.value = "";
      confirmPwInput.value = "";
    }

    // Simpan Nama Toko hanya jika berbeda dengan database
    const namaToko = namaTokoInput.value.trim();
    if (namaToko !== namaTokoDb) {
      await firebase.firestore().collection('user').doc(userId).set({
        namaToko: namaToko
      }, { merge: true });
      showDomAlert("Nama toko berhasil disimpan!", "green");
    }

    // Setelah proses simpan selesai, redirect ke account.html
    window.location.href = "account.html";
  });

  // --- Upload Logo Toko ---
  document.getElementById('upload_logo').addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const storageRef = firebase.storage().ref(`logoToko/${userId}`);
      await storageRef.put(file);
      const url = await storageRef.getDownloadURL();
      await firebase.firestore().collection('user').doc(userId).set({
        logoToko: url
      }, { merge: true });
      document.querySelectorAll('.displayLogo img').forEach(img => {
        img.src = url;
      });
      showDomAlert("Logo toko berhasil diupload!", "green");
    };
    input.click();
  });

  // --- Hapus Logo Toko ---
  document.getElementById('clear_logo').addEventListener('click', async function() {
    await firebase.firestore().collection('user').doc(userId).update({
      logoToko: firebase.firestore.FieldValue.delete()
    });
    try {
      await firebase.storage().ref(`logoToko/${userId}`).delete();
    } catch (e) {}
    document.querySelectorAll('.displayLogo img').forEach(img => {
      img.src = "./assets/image/logo.png";
    });
    showDomAlert("Logo toko berhasil dihapus!", "green");
  });

  // --- Reset Password Redirect ---
  document.querySelectorAll('.reset_pw').forEach(el => {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = `reset-password.html?uid=${userId}`;
    });
  });
});