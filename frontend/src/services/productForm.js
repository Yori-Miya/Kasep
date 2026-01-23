const params = new URLSearchParams(window.location.search);
const id = params.get('id');

// Fallback userId untuk development/testing
// let userId = "DEVELOPER_TEST_UID";

// Preview dan upload gambar
const gambarInput = document.getElementById('gambar');
const previewImg = document.getElementById('preview-img');
const previewText = document.getElementById('preview-text');
const gambarError = document.getElementById('gambarError');
let gambarUrl = "";

// Preview gambar saat user memilih file
gambarInput.addEventListener('change', function () {
  gambarError.classList.add('hidden');
  const file = gambarInput.files[0];
  if (!file) {
    previewImg.classList.add('hidden');
    previewText.classList.remove('hidden');
    return;
  }

  if (!file.type.startsWith('image/')) {
    gambarError.textContent = "File harus berupa gambar!";
    gambarError.classList.remove('hidden');
    gambarInput.value = "";
    previewImg.classList.add('hidden');
    previewText.classList.remove('hidden');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    gambarError.textContent = "Ukuran gambar maksimal 5MB!";
    gambarError.classList.remove('hidden');
    gambarInput.value = "";
    previewImg.classList.add('hidden');
    previewText.classList.remove('hidden');
    return;
  }

  // Preview gambar
  const reader = new FileReader();
  reader.onload = function (e) {
    previewImg.src = e.target.result;
    previewImg.classList.remove('hidden');
    previewText.classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

// Ambil sisaModal terakhir user secara realtime
let currentModal = 0;
firebase.firestore().collection('user').doc(userId).collection('modal')
  .orderBy('timestamp', 'desc').limit(1)
  .onSnapshot(snapshot => {
    if (!snapshot.empty && snapshot.docs[0].data().sisaModal !== undefined) {
      currentModal = Number(snapshot.docs[0].data().sisaModal);
    } else {
      currentModal = 0;
    }
  });

// Fungsi untuk menghitung total modal barang yang akan diinput (hanya barang yang sedang diinput)
function getBarangInputModal() {
  const hargaDasar = parseInt(document.getElementById('harga').value, 10) || 0;
  const stokBarang = parseInt(document.getElementById('stok').value, 10) || 0;
  return hargaDasar * stokBarang;
}

// Saat submit, hanya cek apakah sisaModal masih ada (lebih dari 0)
document.getElementById('form-barang').addEventListener('submit', async function (e) {
  e.preventDefault();

  const hargaDasar = parseInt(document.getElementById('harga').value, 10) || 0;
  const stokBaru = parseInt(document.getElementById('stok').value, 10) || 0;

  // Jika edit, ambil stok lama dari database
  let stokLama = 0;
  if (id) {
    const doc = await db.collection('user').doc(userId).collection('barang').doc(id).get();
    if (doc.exists) {
      stokLama = parseInt(doc.data().stok, 10) || 0;
    }
  }

  // Hanya cek sisa modal jika stok baru > stok lama (penambahan stok)
  if (stokBaru > stokLama && currentModal < hargaDasar * (stokBaru - stokLama)) {
    alert("Sisa modal sudah habis! Tidak bisa input barang baru.");
    return;
  }

  const data = {
    nama: document.getElementById('nama').value,
    kode: document.getElementById('kode').value,
    berat: document.getElementById('berat').value,
    stok: document.getElementById('stok').value,
    exp: document.getElementById('exp').value,
    harga: document.getElementById('harga').value,
    jual: document.getElementById('jual').value,
    kategori: document.getElementById('kategori').value,
    keterangan: document.getElementById('keterangan').value,
  };

  // Upload gambar jika ada file baru
  const file = gambarInput.files[0];
  if (file) {
    try {
      const storageRef = firebase.storage().ref();
      const fileRef = storageRef.child(`barang/${Date.now()}_${file.name}`);
      await fileRef.put(file);
      gambarUrl = await fileRef.getDownloadURL();
      data.gambar = gambarUrl;
    } catch (err) {
      gambarError.textContent = "Gagal upload gambar: " + err.message;
      gambarError.classList.remove('hidden');
      return;
    }
  } else if (id) {
    // Jika edit dan tidak upload gambar baru, ambil gambar lama
    const doc = await db.collection('user').doc(userId).collection('barang').doc(id).get();
    if (doc.exists && doc.data().gambar) {
      data.gambar = doc.data().gambar;
    }
  }

  try {
    if (id) {
      await db.collection('user').doc(userId).collection('barang').doc(id).update(data);
      alert('Barang berhasil diupdate!');
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('user').doc(userId).collection('barang').add(data);
      alert('Barang berhasil disimpan!');
    }
    window.location.href = 'manajemen.html';
  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
});

// Saat edit, tampilkan gambar lama jika ada
function loadBarangEdit() {
  firebase.auth().onAuthStateChanged(user => {
    // if (user) userId = user.uid;
    if (id) {
      db.collection('user').doc(userId).collection('barang').doc(id).get().then(doc => {
        if (doc.exists) {
          const data = doc.data();
          document.getElementById('nama').value = data.nama || '';
          document.getElementById('kode').value = data.kode || '';
          document.getElementById('berat').value = data.berat || '';
          document.getElementById('stok').value = data.stok || '';
          document.getElementById('exp').value = data.exp || '';
          document.getElementById('harga').value = data.harga || '';
          document.getElementById('jual').value = data.jual || '';
          document.getElementById('kategori').value = data.kategori || '';
          document.getElementById('keterangan').value = data.keterangan || '';

          // Jadikan readonly pada mode update
          document.getElementById('nama').readOnly = true;
          document.getElementById('kode').readOnly = true;
          document.getElementById('kategori').disabled = true;

          // Tampilkan gambar lama jika ada
          if (data.gambar) {
            previewImg.src = data.gambar;
            previewImg.classList.remove('hidden');
            previewText.classList.add('hidden');
          } else {
            previewImg.classList.add('hidden');
            previewText.classList.remove('hidden');
          }
        }
      });
    }
  });
}
loadBarangEdit();