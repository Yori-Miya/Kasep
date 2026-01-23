import { predictMinimumStock } from '../models/TensorFlow.js';

const user = firebase.auth().currentUser;
// const userId = user ? user.uid : null;

const listDiv = document.getElementById('list-barang');
const searchInput = document.getElementById('search-barang');
const btnSearch = document.getElementById('btn-search');

// Fallback userId untuk development/testing
// let userId = "DEVELOPER_TEST_UID";

// Tambahkan setelah deklarasi userId dan sebelum renderBarangRealtime
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

firebase.auth().onAuthStateChanged(user => {
  // if (user) {
  //   userId = user.uid;
  // }

  // Panggil prediksi stok minimum dan simpan ke Firestore barang
  predictMinimumStock(userId).then(async (stokMinimum) => {
    // Simpan hasil prediksi ke setiap barang
    for (const namaBarang in stokMinimum) {
      // Cari dokumen barang berdasarkan nama (atau gunakan id jika tersedia)
      const barangQuery = await db.collection('user').doc(userId).collection('barang').where('nama', '==', namaBarang).get();
      barangQuery.forEach(async doc => {
        await db.collection('user').doc(userId).collection('barang').doc(doc.id).set({
          prediksiStok: stokMinimum[namaBarang]
        }, { merge: true });
      });
    }
  });

  function renderBarangRealtime(filter = "") {
    listDiv.innerHTML = '';
    db.collection('user').doc(userId).collection('barang').onSnapshot(snapshot => {
      listDiv.innerHTML = '';
      // Filter data jika ada filter
      let filteredDocs = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!filter ||
          (data.nama && data.nama.toLowerCase().includes(filter.toLowerCase())) ||
          (data.kode && data.kode.toLowerCase().includes(filter.toLowerCase()))
        ) {
          filteredDocs.push({ id: doc.id, data });
        }
      });

      if (filteredDocs.length === 0) {
        listDiv.innerHTML = '<div class="text-center text-gray-500 py-8">Barang tidak tersedia</div>';
        return;
      }

      // Kelompokkan barang berdasarkan kategori
      const kategoriMap = {};
      filteredDocs.forEach(item => {
        const kategori = item.data.kategori || 'Lainnya';
        if (!kategoriMap[kategori]) kategoriMap[kategori] = [];
        kategoriMap[kategori].push(item);
      });

      Object.keys(kategoriMap).forEach(kategori => {
        const kategoriDiv = document.createElement('div');
        kategoriDiv.className = 'mb-2 mt-6';
        kategoriDiv.innerHTML = `<h2 class="text-lg font-bold text-cyan-700 mb-2">${kategori}</h2>`;
        listDiv.appendChild(kategoriDiv);

        kategoriMap[kategori].forEach(item => {
          const data = item.data;
          // Cek stok minimum
          const stokMin = data.prediksiStok ?? 0;
          const stokNow = data.stok ?? 0;
          const isLow = stokNow <= stokMin && stokMin > 0;

          const div = document.createElement('div');
          div.className = 'flex items-center gap-4 mb-2 bg-gray-50 p-2 rounded';
          if (isLow) {
            div.classList.add('bg-red-200');
          }

          div.innerHTML = `
            <div class="w-14 h-14 bg-gray-200 border flex-shrink-0 overflow-hidden cursor-pointer kotak-gambar">
              ${data.gambar ? `<img src="${data.gambar}" alt="Gambar" class="object-contain w-full h-full" />` : ''}
            </div>
            <div class="flex-1">
              <h3 class="font-bold leading-none">${data.nama ?? '-'}</h3>
              <p class="text-sm text-gray-600">${data.kode ?? '-'}</p>
              ${isLow ? `<div class="text-red-600 text-xs font-semibold mt-1">stok sudah mau habis, segera tambahkan stok</div>` : ''}
            </div>
            <div class="flex items-center gap-1 bg-cyan-500 text-white px-2 py-1 rounded-md text-sm">
              <button class="px-1 minus">−</button>
              <span>Stok : <span class="stok">${stokNow}</span></span>
              <button class="px-1 plus">＋</button>
            </div>
            <div class="text-right text-sm">
              <p>Rp ${data.jual || data.harga || 0}</p>
            </div>
            <button class="text-red-500 text-xl hapus">✖</button>
          `;
          div.querySelector('.minus').onclick = async () => {
            let stok = (typeof data.stok === 'number' && data.stok > 0) ? data.stok - 1 : 0;
            await db.collection('user').doc(userId).collection('barang').doc(item.id).update({stok});
          };
          div.querySelector('.plus').onclick = async () => {
            const hargaDasar = Number(data.harga) || 0;
            if (currentModal < hargaDasar) {
              alert('Sisa modal tidak cukup untuk menambah stok barang ini!');
              return;
            }
            let stok = (typeof data.stok === 'number' ? data.stok : 0) + 1;
            await db.collection('user').doc(userId).collection('barang').doc(item.id).update({stok});
          };
          div.querySelector('.hapus').onclick = async () => {
            if(confirm('Hapus barang ini?')) {
              await db.collection('user').doc(userId).collection('barang').doc(item.id).delete();
            }
          };
          div.querySelector('.kotak-gambar').onclick = () => {
            window.location.href = `manajemen-barang.html?id=${item.id}`;
          };
          listDiv.appendChild(div);
        });
      });
    });
  }

  // Event klik tombol search
  btnSearch.addEventListener('click', function() {
    const keyword = searchInput.value.trim();
    renderBarangRealtime(keyword);
  });

  // Optional: tekan Enter di input juga bisa search
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnSearch.click();
    }
  });

  // Pertama kali tampilkan semua barang
  renderBarangRealtime();
});