// Fallback userId untuk development/testing
// let userId = "DEVELOPER_TEST_UID";

firebase.auth().onAuthStateChanged(user => {
  // if (user) userId = user.uid;

  // --- Seluruh kode transaksi di dalam sini ---
  const produkModalBody = document.querySelector('.space-y-6');
  const keranjang = [];

  function renderKeranjang() {
    const keranjangDiv = document.getElementById('keranjang-barang');
    if (!keranjang.length) {
      keranjangDiv.innerHTML = '<div class="text-gray-400 text-sm">Belum ada barang dipilih.</div>';
      updateOtomatisTransaksi();
      return;
    }
    keranjangDiv.innerHTML = `
      <table class="w-full text-sm border mb-2">
        <thead>
          <tr class="bg-gray-100">
            <th class="border px-2 py-1">Nama</th>
            <th class="border px-2 py-1">Harga</th>
            <th class="border px-2 py-1">Qty</th>
            <th class="border px-2 py-1">Subtotal</th>
            <th class="border px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          ${keranjang.map((item, i) => `
            <tr>
              <td class="border px-2 py-1">${item.nama}</td>
              <td class="border px-2 py-1">Rp ${item.harga}</td>
              <td class="border px-2 py-1">${item.qty}</td>
              <td class="border px-2 py-1">Rp ${item.harga * item.qty}</td>
              <td class="border px-2 py-1">
                <button onclick="hapusKeranjang(${i})" class="text-red-500">✖</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    updateOtomatisTransaksi();
  }
  window.hapusKeranjang = function(idx) {
    keranjang.splice(idx, 1);
    renderKeranjang();
  }

  function renderProdukModal() {
    db.collection('user').doc(userId).collection('barang').onSnapshot(snapshot => {
      produkModalBody.innerHTML = '';
      const kategoriMap = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        const kategori = data.kategori || 'Lainnya';
        if (!kategoriMap[kategori]) kategoriMap[kategori] = [];
        kategoriMap[kategori].push({ id: doc.id, data, stok: data.stok || 0 });
      });

      Object.keys(kategoriMap).forEach(kategori => {
        const kategoriDiv = document.createElement('div');
        kategoriDiv.innerHTML = `
          <h3 class="font-bold mb-2">${kategori}</h3>
          <hr class="my-4 border-zinc-400" />
          <div class="grid grid-cols-5 gap-4"></div>
        `;
        const grid = kategoriDiv.querySelector('.grid');
        kategoriMap[kategori].forEach(item => {
          const data = item.data;
          const stok = item.stok;
          const produkDiv = document.createElement('div');
          produkDiv.className = 'flex flex-col items-center text-center cursor-pointer';
          produkDiv.innerHTML = `
            <div class="w-20 h-20 bg-gray-200 border overflow-hidden">
              ${data.gambar ? `<img src="${data.gambar}" class="object-contain w-full h-full" />` : ''}
            </div>
            <p class="text-sm mt-2 font-medium">${data.nama}</p>
            <div class="flex items-center rounded-md mt-1">
              <button class="px-2 py-1 bg-cyan-500 text-white rounded minus">−</button>
              <span class="px-2 py-1 text-sm qty">1</span>
              <button class="px-2 py-1 bg-cyan-500 text-white rounded plus">＋</button>
            </div>
            <div class="text-xs text-gray-500 mt-1">Stok: ${stok}</div>
          `;
          let qty = 1;
          produkDiv.querySelector('.minus').onclick = (e) => {
            e.stopPropagation();
            if (qty > 1) qty--;
            produkDiv.querySelector('.qty').textContent = qty;
          };
          produkDiv.querySelector('.plus').onclick = (e) => {
            e.stopPropagation();
            if (qty < stok) {
              qty++;
              produkDiv.querySelector('.qty').textContent = qty;
            } else {
              alert('Qty tidak boleh melebihi stok!');
            }
          };
          produkDiv.onclick = () => {
            const idx = keranjang.findIndex(b => b.id === item.id);
            let totalQty = qty;
            if (idx !== -1) {
              totalQty = keranjang[idx].qty + qty;
            }
            if (totalQty > stok) {
              alert('Qty total tidak boleh melebihi stok!');
              return;
            }
            if (idx !== -1) {
              keranjang[idx].qty += qty;
            } else {
              keranjang.push({
                id: item.id,
                nama: data.nama,
                harga: data.jual || data.harga || 0,
                qty: qty,
                gambar: data.gambar || ''
              });
            }
            renderKeranjang();
          };
          grid.appendChild(produkDiv);
        });
        produkModalBody.appendChild(kategoriDiv);
      });
    });
  }

  // Checklist: isi form transaksi dengan barang pertama (atau total harga, dsb)
  document.querySelectorAll('.checklist').forEach(btn => {
    btn.onclick = function() {
      // Jika ingin isi input Nama Barang dengan list nama barang
      const namaBarangInput = document.querySelector('input[placeholder="Nama Barang"]') ||
        document.querySelector('label:contains("Nama Barang") + div input');
      if (namaBarangInput) {
        namaBarangInput.value = keranjang.map(b => `${b.nama} x${b.qty}`).join(', ');
      }
      // Harga Barang: total harga semua barang
      const hargaBarangInput = document.querySelector('input[placeholder="Harga Barang"]') ||
        document.querySelector('label:contains("Harga Barang") + input');
      if (hargaBarangInput) {
        hargaBarangInput.value = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
      }
      // Gambar produk: tampilkan gambar barang pertama
      const gambarDiv = document.querySelector('.h-24.w-full.bg-gray-200');
      if (gambarDiv && keranjang.length > 0) {
        gambarDiv.innerHTML = keranjang[0].gambar
          ? `<img src="${keranjang[0].gambar}" class="object-contain w-full h-full" />`
          : '[Gambar Produk]';
      }
      hideModal();
    }
  });

  // Tambahkan event pada tombol "Cetak Struk"
  document.querySelector('a[href="./struk.html"]').addEventListener('click', function(e) {
    e.preventDefault();
    // Ambil id transaksi dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const transaksiId = urlParams.get('id');
    if (transaksiId) {
      // Redirect ke struk.html dengan id transaksi
      window.location.href = `./struk.html?id=${transaksiId}`;
    } else {
      alert('Transaksi belum disimpan!');
    }
  });

  document.getElementById('btn-simpan').addEventListener('click', async function(e) {
    e.preventDefault();
    updateOtomatisTransaksi();

    const namaCustomer = document.querySelectorAll('input[type="text"].w-full.border.rounded.px-3.py-1.bg-gray-100')[0]?.value || '';
    const diskon = parseFloat(document.querySelectorAll('input[type="number"].w-full.border.rounded.px-3.py-1.bg-gray-100')[0]?.value) || 0;
    const ppn = parseFloat(document.querySelectorAll('input[type="text"].w-full.border.rounded.px-3.py-1')[3]?.value) ||
                parseFloat(document.querySelectorAll('input[type="text"].w-full.border.rounded.px-3.py-1')[3]?.placeholder) || 0;
    const totalHarga = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const bayar = parseFloat(document.querySelectorAll('input[type="text"].w-full.border.rounded.px-3.py-1.bg-gray-100')[2]?.value) || 0;
    const kembalian = bayar - totalHarga;

    // Ambil userId dari sessionStorage
    const userId = sessionStorage.getItem('userId');
    let kasir = userId.nama; // Default nama kasir
    if (userId) {
      // Ambil nama user dari Firestore
      const userDoc = await firebase.firestore().collection('user').doc(userId).get();
      if (userDoc.exists) {
        kasir = userDoc.data().name || userDoc.data().nama || "Kasir";
      }
    }

    if (keranjang.length === 0) {
      alert('Keranjang kosong!');
      return;
    }

    if (kembalian < 0) {
      alert('Pembayaran kurang! Tidak boleh ada hutang. Silakan masukkan nominal bayar yang cukup.');
      return;
    }

    // Algoritma nomor struk
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const tanggalStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
    const waktuStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const msStr = now.getMilliseconds().toString().padStart(3, '0');
    const nomorStruk = `TRX${tanggalStr}${waktuStr}${msStr}`;

    const transaksi = {
      nomorStruk,
      customer: namaCustomer,
      diskon: diskon,
      ppn: ppn,
      barang: keranjang.map(b => ({
        id: b.id,
        nama: b.nama,
        harga: b.harga,
        qty: b.qty,
        subtotal: b.harga * b.qty,
        gambar: b.gambar || ''
      })),
      totalHarga: totalHarga,
      bayar: bayar,
      kembalian: kembalian,
      waktu: now,
      kasir: kasir // gunakan nama user login
    };

    // Ambil id transaksi dari URL jika ada
    const urlParams = new URLSearchParams(window.location.search);
    const transaksiId = urlParams.get('id');

    try {
      if (transaksiId) {
        // Jika ada id transaksi, update dokumen yang sudah ada
        await db.collection('user').doc(userId).collection('transaksi').doc(transaksiId).set(transaksi, { merge: true });
        // Kurangi stok barang sesuai qty pada transaksi
        await kurangiStokBarangSetelahTransaksi(keranjang);
        alert('Transaksi berhasil diperbarui!');
        renderKeranjang();
        // Tidak perlu redirect, tetap di halaman ini
      } else {
        // Jika tidak ada id, buat transaksi baru
        const docRef = await db.collection('user').doc(userId).collection('transaksi').add(transaksi);
        // Kurangi stok barang sesuai qty pada transaksi
        await kurangiStokBarangSetelahTransaksi(keranjang);
        alert('Transaksi berhasil disimpan!');
        keranjang.length = 0;
        renderKeranjang();
        // Redirect ke transaksi.html?id=<idTransaksi>
        window.location.href = `./transaksi.html?id=${docRef.id}`;
      }
    } catch (err) {
      alert('Gagal menyimpan transaksi: ' + err.message);
    }
  });

  async function kurangiStokBarangSetelahTransaksi(keranjang) {
  const batch = db.batch();
  for (const item of keranjang) {
    const barangRef = db.collection('user').doc(userId).collection('barang').doc(item.id);
    const barangDoc = await barangRef.get();
    if (barangDoc.exists) {
      const stokLama = Number(barangDoc.data().stok) || 0;
      const stokBaru = stokLama - (Number(item.qty) || 0);
      batch.update(barangRef, { stok: stokBaru >= 0 ? stokBaru : 0 });
    }
  }
  await batch.commit();
}

  function updateOtomatisTransaksi() {
    // Ambil elemen input
    const diskonInput = document.querySelectorAll('input[type="number"].w-full.border.rounded.px-3.py-1.bg-gray-100')[0];
    const totalHargaInput = document.querySelectorAll('input[type="text"].w-full.border.rounded.px-3.py-1')[2];
    const ppnInput = document.querySelectorAll('input[type="text"].w-full.border.rounded.px-3.py-1')[3];
    const bayarInput = document.querySelectorAll('input[type="text"].w-full.border.rounded.px-3.py-1.bg-gray-100')[2];
    const kembalianInput = document.querySelectorAll('input[type="text"].w-full.border.rounded.px-3.py-1.bg-gray-100')[3];

    // Hitung total harga sebelum diskon
    const totalSebelumDiskon = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);

    // Ambil diskon persen
    const diskonPersen = parseFloat(diskonInput?.value) || 0;
    // Hitung total diskon
    const totalDiskon = Math.round(totalSebelumDiskon * (diskonPersen / 100));
    // Hitung harga setelah diskon
    const hargaSetelahDiskon = totalSebelumDiskon - totalDiskon;
    // Hitung PPN 11%
    const ppn = Math.round(hargaSetelahDiskon * 0.11);
    // Hitung total harga akhir
    const totalHarga = hargaSetelahDiskon + ppn;
    // Ambil bayar
    const bayar = parseFloat(bayarInput?.value) || 0;
    // Hitung kembalian
    const kembalian = bayar - totalHarga;

    // Tampilkan hasil ke input (readonly)
    if (totalHargaInput) totalHargaInput.placeholder = totalHarga;
    if (ppnInput) ppnInput.placeholder = ppn;
    if (kembalianInput) kembalianInput.placeholder = kembalian >= 0 ? kembalian : 0;
  }

  // Event listener agar update otomatis saat input berubah
  document.addEventListener('DOMContentLoaded', () => {
    // Diskon
    const diskonInput = document.querySelectorAll('input[type="number"].w-full.border.rounded.px-3.py-1.bg-gray-100')[0];
    if (diskonInput) diskonInput.addEventListener('input', updateOtomatisTransaksi);

    // Bayar
    const bayarInput = document.querySelectorAll('input[type="text"].w-full.border.rounded.px-3.py-1.bg-gray-100')[2];
    if (bayarInput) bayarInput.addEventListener('input', updateOtomatisTransaksi);
  });

  // Pastikan renderKeranjang() memanggil updateOtomatisTransaksi()
  function renderKeranjang() {
    const keranjangDiv = document.getElementById('keranjang-barang');
    if (!keranjang.length) {
      keranjangDiv.innerHTML = '<div class="text-gray-400 text-sm">Belum ada barang dipilih.</div>';
      updateOtomatisTransaksi();
      return;
    }
    keranjangDiv.innerHTML = `
      <table class="w-full text-sm border mb-2">
        <thead>
          <tr class="bg-gray-100">
            <th class="border px-2 py-1">Nama</th>
            <th class="border px-2 py-1">Harga</th>
            <th class="border px-2 py-1">Qty</th>
            <th class="border px-2 py-1">Subtotal</th>
            <th class="border px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          ${keranjang.map((item, i) => `
            <tr>
              <td class="border px-2 py-1">${item.nama}</td>
              <td class="border px-2 py-1">Rp ${item.harga}</td>
              <td class="border px-2 py-1">${item.qty}</td>
              <td class="border px-2 py-1">Rp ${item.harga * item.qty}</td>
              <td class="border px-2 py-1">
                <button onclick="hapusKeranjang(${i})" class="text-red-500">✖</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    updateOtomatisTransaksi();
  }

  // Panggil saat halaman dimuat
  renderProdukModal();
  renderKeranjang();

  // Ambil parameter id dari URL
const urlParams = new URLSearchParams(window.location.search);
const transaksiId = urlParams.get('id');

if (transaksiId) {
  // Ambil data transaksi dari Firestore
  db.collection('user').doc(userId).collection('transaksi').doc(transaksiId).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      // Tampilkan header struk
      document.querySelector('.flex.justify-between.text-sm.mb-4').innerHTML = `
        <div>
          <p>Nomor Struk: ${data.nomorStruk || '-'}</p>
          <p>Kasir: ${data.kasir || '-'}</p>
        </div>
        <div>
          <p>Tanggal: ${data.waktu ? new Date(data.waktu.seconds ? data.waktu.seconds * 1000 : data.waktu).toLocaleDateString('id-ID') : '-'}</p>
          <p>Waktu: ${data.waktu ? new Date(data.waktu.seconds ? data.waktu.seconds * 1000 : data.waktu).toLocaleTimeString('id-ID') : '-'}</p>
        </div>
      `;
      // Isi form
      const inputs = document.querySelectorAll('input');
      // Nama customer
      inputs[0].value = data.customer || '';
      // Nama barang
      inputs[1].value = data.barang.map(b => `${b.nama} x${b.qty}`).join(', ');
      // Diskon
      inputs[2].value = data.diskon || ''; // <-- Tambahkan pengisian diskon di sini
      // Total harga
      inputs[3].value = data.totalHarga || '';
      // PPN (jika ada)
      // Bayar
      inputs[5].value = data.bayar || '';
      // Kembalian
      inputs[6].value = data.kembalian || '';

      // Render keranjang
      keranjang.length = 0;
      data.barang.forEach(b => keranjang.push(b));
      renderKeranjang();
    }
  });
}
});