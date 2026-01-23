document.addEventListener("DOMContentLoaded", function () {
  const signoutBtn = document.getElementById('signout');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      if (confirm("Apakah Anda yakin ingin keluar?")) {
        const userId = sessionStorage.getItem('userId');
        if (userId) {
          // Simpan lastLogout ke Firestore
          await firebase.firestore().collection('user').doc(userId).update({
            lastLogout: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        // Hapus sessionStorage
        sessionStorage.clear();
        alert("Anda berhasil keluar. Klik OK untuk kembali ke halaman utama.");
        // Redirect ke index.html
        window.location.href = "index.html";
      }
    });
  }
});