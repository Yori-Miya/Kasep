// let userId = "DEVELOPER_TEST_UID";
// Simpan transaksiId ke variabel global agar bisa diakses di fungsi export
let transaksiIdGlobal = null;

firebase.auth().onAuthStateChanged(user => {
  // if (user) userId = user.uid;
  const urlParams = new URLSearchParams(window.location.search);
  const transaksiId = urlParams.get('id');
  transaksiIdGlobal = transaksiId; // <-- simpan ke variabel global
  if (!transaksiId) {
    alert('ID transaksi tidak ditemukan!');
    return;
  }

  // Ambil data toko (logo, nama, no telp) secara realtime
  firebase.firestore().collection('user').doc(userId)
  .onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      // Logo toko
      const logoDiv = document.querySelector('.tokoLogo');
      logoDiv.innerHTML = data.logoToko
        ? `<img src="${data.logoToko}" alt="Logo Toko" class="w-full h-full object-contain rounded" />`
        : '';
      // Nama toko
      document.getElementById('toko-nama').textContent = data.namaToko || 'Nama Toko';
      document.getElementById('toko-phone').textContent = data.phone || '+62';
    }
  });

  db.collection('user').doc(userId).collection('transaksi').doc(transaksiId).get().then(doc => {
    if (!doc.exists) {
      alert('Data transaksi tidak ditemukan!');
      return;
    }
    const data = doc.data();
    // Isi field struk
    document.querySelector('.space-y-1').innerHTML = `
      <p>Kode Struk: <span class="float-right">${data.nomorStruk || '-'}</span></p>
      <p>Tanggal: <span class="float-right">${data.waktu ? new Date(data.waktu.seconds ? data.waktu.seconds * 1000 : data.waktu).toLocaleDateString('id-ID') : '-'}</span></p>
      <p>Waktu: <span class="float-right">${data.waktu ? new Date(data.waktu.seconds ? data.waktu.seconds * 1000 : data.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span></p>
      <p>Kasir: <span class="float-right">${data.kasir || '-'}</span></p>
      <p>Nama Pelanggan: <span class="float-right">${data.customer || '-'}</span></p>
    `;
    // Tabel barang
    const tbody = data.barang.map(b => `
      <tr>
        <td>${b.nama}</td>
        <td>${b.harga.toLocaleString('id-ID')}</td>
        <td>${b.qty}</td>
        <td>${(b.harga * b.qty).toLocaleString('id-ID')}</td>
      </tr>
    `).join('');
    document.querySelector('table tbody').innerHTML = tbody;
    // Ringkasan
    const subtotal = data.barang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const totalDiskon = Math.round(subtotal * ((data.diskon || 0) / 100));
    document.querySelectorAll('.text-xs.space-y-1')[0].innerHTML = `
      <p class="flex justify-between">
        <span>Subtotal:</span> <span>${subtotal.toLocaleString('id-ID')}</span>
      </p>
      <p class="flex justify-between">
        <span>Diskon:</span> <span>${data.diskon || 0}%</span>
      </p>
      <p class="flex justify-between">
        <span>Total Diskon:</span> <span>${totalDiskon.toLocaleString('id-ID')}</span>
      </p>
    `;
    document.querySelectorAll('.text-xs.space-y-1')[1].innerHTML = `
      <p class="flex justify-between">
        <span>Pajak (PPN):</span> <span>${(data.ppn || 0).toLocaleString('id-ID')}</span>
      </p>
      <p class="flex justify-between font-semibold">
        <span>Total:</span> <span>${(data.totalHarga || 0).toLocaleString('id-ID')}</span>
      </p>
      <p class="flex justify-between">
        <span>Pembayaran:</span> <span>${(data.bayar || 0).toLocaleString('id-ID')}</span>
      </p>
      <p class="flex justify-between">
        <span>Kembalian:</span> <span>${(data.kembalian || 0).toLocaleString('id-ID')}</span>
      </p>
    `;
  });
});

// Fungsi export PDF (pastikan logo toko sudah termuat sebelum export)
function exportStrukPDF() {
  const struk = document.getElementById('struk');
  const logoImg = struk.querySelector('.tokoLogo img');
  // Jika logo ada dan belum selesai dimuat, tunggu dulu
  if (logoImg && !logoImg.complete) {
    logoImg.onload = exportStrukPDF;
    return;
  }
  html2canvas(struk, {
    useCORS: true, // agar gambar logo dari url bisa ikut di-capture
    allowTaint: true,
    backgroundColor: null
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new window.jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [struk.offsetWidth, struk.offsetHeight]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, struk.offsetWidth, struk.offsetHeight);
    // Gunakan id transaksi pada nama file
    const fileName = transaksiIdGlobal ? `struk-transaksi-${transaksiIdGlobal}.pdf` : 'struk-transaksi.pdf';
    pdf.save(fileName);
  });
}

// Tombol export manual
document.getElementById('btn-export').addEventListener('click', exportStrukPDF);