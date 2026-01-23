// import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.18.0/dist/tf.min.js';

// Fungsi utama: prediksi stok minimum per barang
async function predictMinimumStock(userId) {
  // Ambil data transaksi 30 hari terakhir dari koleksi transaksi saja
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  const transaksiSnap = await firebase.firestore()
    .collection('user').doc(userId)
    .collection('transaksi')
    .where('waktu', '>=', start)
    .get();

  // Ambil modal dan sisa modal terbaru
  let modalTerbaru = 0;
  let sisaModalTerbaru = 0;
  const modalSnap = await firebase.firestore()
    .collection('user').doc(userId)
    .collection('modal')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();
  if (!modalSnap.empty) {
    const data = modalSnap.docs[0].data();
    modalTerbaru = Number(data.nominal || 0);
    sisaModalTerbaru = Number(data.sisaModal || 0);
  }

  // Rekap penjualan harian per barang (hanya dari transaksi, tidak dari stok barang)
  const penjualanPerBarang = {};
  transaksiSnap.forEach(doc => {
    const t = doc.data();
    if (!t.barang || !t.waktu) return;
    const tanggal = t.waktu.seconds
      ? new Date(t.waktu.seconds * 1000).toISOString().slice(0, 10)
      : new Date(t.waktu).toISOString().slice(0, 10);
    t.barang.forEach(b => {
      if (!penjualanPerBarang[b.nama]) penjualanPerBarang[b.nama] = {};
      penjualanPerBarang[b.nama][tanggal] = (penjualanPerBarang[b.nama][tanggal] || 0) + (b.qty || 0);
    });
  });

  // Prediksi stok minimum per barang dengan regresi linier TensorFlow.js
  const stokMinimum = {};
  for (const namaBarang in penjualanPerBarang) {
    const dataHarian = penjualanPerBarang[namaBarang];
    // Siapkan data X (hari ke-n) dan Y (qty terjual)
    const tanggalArr = Object.keys(dataHarian).sort();
    const X = tanggalArr.map((_, i) => i);
    const Y = tanggalArr.map(tgl => dataHarian[tgl]);

    // Jika data kurang dari 2 hari, gunakan rata-rata saja
    if (X.length < 2) {
      const avg = Y.length ? Y.reduce((a, b) => a + b, 0) / Y.length : 0;
      stokMinimum[namaBarang] = Math.ceil(avg * 7 * 1.1); // prediksi 7 hari + buffer 10%
      continue;
    }

    // Buat model regresi linier
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

    // Latih model
    const xs = tf.tensor2d(X, [X.length, 1]);
    const ys = tf.tensor2d(Y, [Y.length, 1]);
    await model.fit(xs, ys, { epochs: 100, verbose: 0 });

    // Prediksi kebutuhan stok 7 hari ke depan (atau 1 minggu)
    const predX = tf.tensor2d([
      [X.length], [X.length + 1], [X.length + 2], [X.length + 3], [X.length + 4], [X.length + 5], [X.length + 6]
    ]);
    const predY = model.predict(predX).dataSync();
    const predTotal = predY.reduce((a, b) => a + Math.max(0, b), 0);

    // Ambil harga beli barang (jika ingin lebih presisi, ambil dari koleksi barang)
    let hargaBeli = 0;
    try {
      const barangSnap = await firebase.firestore()
        .collection('user').doc(userId)
        .collection('barang')
        .where('nama', '==', namaBarang)
        .limit(1)
        .get();
      if (!barangSnap.empty) {
        const barangData = barangSnap.docs[0].data();
        hargaBeli = Number(barangData.harga) || 0;
      }
    } catch (e) {}

    // Hitung total biaya prediksi stok
    const totalBiaya = hargaBeli * Math.ceil(predTotal * 1.1);

    // Jika total biaya melebihi sisa modal, batasi stok minimum agar tidak melebihi kemampuan modal
    if (hargaBeli > 0 && sisaModalTerbaru > 0 && totalBiaya > sisaModalTerbaru) {
      stokMinimum[namaBarang] = Math.floor(sisaModalTerbaru / hargaBeli);
    } else {
      stokMinimum[namaBarang] = Math.ceil(predTotal * 1.1);
    }
  }

  return stokMinimum; // { namaBarang: stokMinimum, ... }
}

// Contoh penggunaan:
// const userId = sessionStorage.getItem('userId');
// predictMinimumStock(userId).then(result => {
//   console.log('Stok minimum rekomendasi:', result);
//   // Tampilkan notifikasi jika stok barang < stokMinimum
// });

export { predictMinimumStock };