// let userId = "DEVELOPER_TEST_UID";
    let selectedFile = null;

    // Trigger input file saat klik "Choose Photo"
    document.getElementById('upload_pfp').onclick = function() {
      document.getElementById('input_pfp').click();
    };

    // Preview dan validasi file
    document.getElementById('input_pfp').onchange = function(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB!");
        e.target.value = "";
        return;
      }
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = function(ev) {
        document.querySelector('.w-24.h-24').src = ev.target.result;
      };
      reader.readAsDataURL(file);
    };

    // Hapus foto profile (kembali ke default)
    document.getElementById('clear_pfp').onclick = function() {
      selectedFile = null;
      document.querySelector('.w-24.h-24').src = "./assets/image/profile.png";
      document.getElementById('input_pfp').value = "";
    };

    // Simpan perubahan profile (upload foto ke Firebase Storage)
    document.getElementById('saveButton').onclick = async function(e) {
      e.preventDefault();
      const fullName = document.getElementById('fullName').value;
      const email = document.getElementById('email').value;
      let phoneNumber = document.getElementById('phoneNumber').value.trim();

      // Ubah format 08xxx menjadi +628xxx sebelum simpan ke database
      if (phoneNumber.startsWith("0")) {
        phoneNumber = "+62" + phoneNumber.slice(1);
      } else if (phoneNumber.startsWith("+62")) {
        // Sudah benar, tidak perlu diubah
      } else if (phoneNumber.startsWith("62")) {
        phoneNumber = "+" + phoneNumber;
      }

      // Upload foto jika ada perubahan
      let photoURL = document.querySelector('.w-24.h-24').src;
      if (selectedFile) {
        const storageRef = firebase.storage().ref(`profile/${userId}`);
        await storageRef.put(selectedFile);
        photoURL = await storageRef.getDownloadURL();
      }

      // Simpan data ke Firestore (atau update user profile)
      await firebase.firestore().collection('user').doc(userId).set({
        name: fullName,
        email: email,
        phone: phoneNumber,
        photoURL: photoURL
      }, { merge: true });

      alert("Profil berhasil diperbarui!");
      // Redirect ke account.html setelah simpan
      window.location.href = "account.html";
    };

    // Hapus akun
    document.getElementById('delete_account').onclick = async function(e) {
      e.preventDefault();
      if (!confirm("Apakah Anda yakin ingin menghapus akun ini? Semua data Anda akan hilang!")) return;

      // Hapus semua subcollection (misal: transaksi, barang, modal, dll)
      const userRef = firebase.firestore().collection('user').doc(userId);
      const subcollections = ['transaksi', 'barang', 'modal']; // tambahkan jika ada subcollection lain

      for (const sub of subcollections) {
        const snap = await userRef.collection(sub).get();
        const batch = firebase.firestore().batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Hapus dokumen user
      await userRef.delete();

      // Hapus sessionStorage dan redirect ke login
      sessionStorage.clear();
      window.location.href = "login.html";
    };

    // Ambil data user dan tampilkan pada form secara realtime
    firebase.firestore().collection('user').doc(userId)
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          document.getElementById('fullName').value = data.name || '';
          document.getElementById('email').value = data.email || '';
          document.getElementById('phoneNumber').value = data.phone || data.phoneNumber || '';
          document.getElementById('profilePhoto').src = data.photoURL || "./assets/image/profile.png";
        }
      });