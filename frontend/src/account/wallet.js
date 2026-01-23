 // let userId = "DEVELOPER_TEST_UID";
      let currentModal = null; // Untuk menyimpan modal terakhir

      // Format input modal saat user mengetik (misal: 1500000 -> 1.500.000)
      const modalInput = document.getElementById('modalInput');
      modalInput.addEventListener('input', function(e) {
        // Ambil hanya angka
        let value = this.value.replace(/\D/g, '');
        // Batasi maksimal 10 digit
        if (value.length > 10) value = value.slice(0, 10);
        if (!value) {
          this.value = '';
          return;
        }
        // Format angka dengan titik ribuan
        this.value = Number(value).toLocaleString('id-ID');
      });

      // Ambil modal terakhir secara realtime dan update displayModal dikurangi total pengeluaran barang
      async function updateDisplayModal() {
        // Ambil modal terakhir
        let modalNominal = 0;
        const modalSnap = await firebase.firestore().collection('user').doc(userId).collection('modal')
          .orderBy('timestamp', 'desc').limit(1).get();
        if (!modalSnap.empty && modalSnap.docs[0].data().nominal) {
          modalNominal = Number(modalSnap.docs[0].data().nominal);
        }

        // Hitung total pengeluaran barang (harga dasar * stok semua barang)
        let totalPengeluaran = 0;
        const barangSnap = await firebase.firestore().collection('user').doc(userId).collection('barang').get();
        barangSnap.forEach(doc => {
          const data = doc.data();
          const harga = Number(data.harga) || 0;
          const stok = Number(data.stok) || 0;
          totalPengeluaran += harga * stok;
        });

        // Update display
        const display = document.getElementById('displayModal');
        const sisaModal = modalNominal - totalPengeluaran;
        display.textContent = "Rp." + (sisaModal > 0 ? sisaModal : 0).toLocaleString('id-ID');
      }

      // Jalankan updateDisplayModal() secara realtime jika ada perubahan modal atau barang
      firebase.firestore().collection('user').doc(userId).collection('modal')
        .orderBy('timestamp', 'desc').limit(1)
        .onSnapshot(updateDisplayModal);

      firebase.firestore().collection('user').doc(userId).collection('barang')
        .onSnapshot(updateDisplayModal);

      // Fungsi untuk menghitung total modal barang (harga dasar * stok semua barang)
      async function getTotalBarangModal() {
        const snapshot = await firebase.firestore().collection('user').doc(userId).collection('barang').get();
        let total = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          const harga = Number(data.harga) || 0;
          const stok = Number(data.stok) || 0;
          total += harga * stok;
        });
        return total;
      }

      // Saat submit, cek kondisi sebelum simpan
      document.querySelector('button.w-full.bg-cyan-500').onclick = async function() {
        const rawValue = document.getElementById('modalInput').value.replace(/\./g, '').replace(/,/g, '');
        if (!rawValue) {
          window.location.href = "account.html";
          return;
        }
        const nominal = parseInt(rawValue, 10);
        if (isNaN(nominal) || nominal < 0) {
          alert("Masukkan nominal modal yang valid!");
          return;
        }

        // Hitung total harga dasar seluruh barang
        const totalBarangModal = await getTotalBarangModal();
        if (nominal < totalBarangModal) {
          alert("Modal tidak boleh lebih kecil dari total harga dasar seluruh barang!\nTotal harga dasar barang: Rp " + totalBarangModal.toLocaleString('id-ID'));
          return;
        }

        // Jika nominal sama dengan modal saat ini, langsung redirect tanpa simpan
        if (currentModal !== null && nominal === currentModal) {
          window.location.href = "account.html";
          return;
        }
        // Buat id dokumen dengan full timestamp (milidetik)
        const docId = Date.now().toString();
        await firebase.firestore().collection('user').doc(userId).collection('modal').doc(docId)
          .set({
            nominal: nominal,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        alert("Modal berhasil disimpan!");
        window.location.href = "account.html";
      };

      // Tampilkan riwayat modal, dikelompokkan per tanggal
      firebase.firestore().collection('user').doc(userId).collection('modal')
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
          const historyList = document.getElementById('modalHistoryList');
          historyList.innerHTML = '';
          const items = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.nominal || !data.timestamp) return;
            const dateObj = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp.seconds * 1000);
            const tanggal = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
            items.push({
              tanggal,
              nominal: data.nominal,
              waktu: dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            });
          });

          // Kelompokkan per tanggal
          const grouped = {};
          items.forEach(item => {
            if (!grouped[item.tanggal]) grouped[item.tanggal] = [];
            grouped[item.tanggal].push(item);
          });

          // Render ke DOM
          Object.keys(grouped).sort((a, b) => {
            // Urutkan terbaru ke atas
            const [dA, mA, yA] = a.split('-').map(Number);
            const [dB, mB, yB] = b.split('-').map(Number);
            return new Date(yB, mB - 1, dB) - new Date(yA, mA - 1, dA);
          }).forEach(tanggal => {
            const group = grouped[tanggal];
            const groupDiv = document.createElement('div');
            groupDiv.className = "bg-gray-50 rounded p-2";
            groupDiv.innerHTML = `<div class="font-semibold text-gray-700 mb-1">${tanggal}</div>` +
              group.map(item =>
                `<div class="flex justify-between text-sm">
                  <span>Rp.${Number(item.nominal).toLocaleString('id-ID')}</span>
                  <span class="text-gray-500">${item.waktu}</span>
                </div>`
              ).join('');
            historyList.appendChild(groupDiv);
          });

          if (items.length === 0) {
            historyList.innerHTML = '<div class="text-gray-400 text-sm">Belum ada riwayat modal.</div>';
          }
        });

        // Tampilkan riwayat pengeluaran barang secara mendetail di bawah riwayat modal
        async function renderPengeluaranHistory() {
          const historyList = document.getElementById('pengeluaranHistoryList');
          historyList.innerHTML = '';

          // Ambil semua barang
          const snapshot = await firebase.firestore().collection('user').doc(userId).collection('barang').get();
          const items = [];
          let totalPengeluaran = 0;
          snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.nama) return;
            const harga = Number(data.harga) || 0;
            const stok = Number(data.stok) || 0;
            const total = harga * stok;
            totalPengeluaran += total;
            items.push({
              nama: data.nama,
              harga,
              stok, 
              total
            });
          });

          // Render daftar barang terlebih dahulu
          if (items.length === 0) {
            historyList.innerHTML = '<div class="text-gray-400 text-sm">Belum ada pengeluaran barang.</div>';
          } else {
            items.forEach(item => {
              const div = document.createElement('div');
              div.className = "bg-gray-50 rounded p-2 mb-2";
              div.innerHTML = `
                <div class="font-semibold text-gray-700 mb-1">${item.nama}</div>
                <div class="flex justify-between text-sm">
                  <span>Harga Dasar: Rp.${item.harga.toLocaleString('id-ID')}</span>
                  <span>Stok: ${item.stok}</span>
                  <span class="font-semibold text-cyan-700">Total: Rp.${item.total.toLocaleString('id-ID')}</span>
                </div>
              `;
              historyList.appendChild(div);
            });
          }

          // Setelah semua barang dirender, baru render total pengeluaran & sisa modal
          let modalNominal = 0;
          const modalSnap = await firebase.firestore().collection('user').doc(userId).collection('modal')
            .orderBy('timestamp', 'desc').limit(1).get();
          if (!modalSnap.empty && modalSnap.docs[0].data().nominal) {
            modalNominal = Number(modalSnap.docs[0].data().nominal);
          }

          const totalDiv = document.createElement('div');
          totalDiv.className = "mt-4 p-3 rounded bg-cyan-50 border border-cyan-200";
          totalDiv.innerHTML = `
            <div class="font-semibold text-cyan-700 mb-1">Total Pengeluaran Barang: Rp.${totalPengeluaran.toLocaleString('id-ID')}</div>
            <div class="text-gray-700">Sisa Modal Setelah Pengeluaran: <span class="font-bold text-cyan-700">Rp.${(modalNominal - totalPengeluaran > 0 ? modalNominal - totalPengeluaran : 0).toLocaleString('id-ID')}</span></div>
          `;
          historyList.appendChild(totalDiv);

          // Hapus duplikasi total pengeluaran jika ada lebih dari satu
          const totalDivs = document.querySelectorAll('.mt-4.p-3.rounded.bg-cyan-50.border.border-cyan-200');
          if (totalDivs.length > 1) {
            // Hapus semua kecuali yang terakhir
            for (let i = 0; i < totalDivs.length - 1; i++) {
              totalDivs[i].parentNode.removeChild(totalDivs[i]);
            }
          }
        }

        // Pastikan elemen pengeluaranHistory sudah ada sebelum renderPengeluaranHistory dijalankan
        if (!document.getElementById('pengeluaranHistory')) {
          const pengeluaranDiv = document.createElement('div');
          pengeluaranDiv.id = "pengeluaranHistory";
          pengeluaranDiv.className = "mt-8";
          pengeluaranDiv.innerHTML = `
            <h3 class="font-bold mb-2 text-cyan-700">Riwayat Pengeluaran Barang</h3>
            <div id="pengeluaranHistoryList" class="space-y-2"></div>
          `;
          document.getElementById('modalHistory').after(pengeluaranDiv);
        }

        // Panggil saat halaman load dan setiap ada perubahan barang
        renderPengeluaranHistory();
        firebase.firestore().collection('user').doc(userId).collection('barang')
          .onSnapshot(renderPengeluaranHistory);

        // Fungsi untuk update modal terbaru di database setelah dikurangi total pengeluaran barang
        async function updateModalAfterPengeluaran() {
          // Ambil modal terbaru
          const modalRef = firebase.firestore().collection('user').doc(userId).collection('modal')
            .orderBy('timestamp', 'desc').limit(1);
          const modalSnap = await modalRef.get();
          if (modalSnap.empty) return;

          const modalDoc = modalSnap.docs[0];
          const modalId = modalDoc.id;
          const modalData = modalDoc.data();
          const modalNominal = Number(modalData.nominal) || 0;

          // Hitung total pengeluaran barang
          const barangSnap = await firebase.firestore().collection('user').doc(userId).collection('barang').get();
          let totalPengeluaran = 0;
          barangSnap.forEach(doc => {
            const data = doc.data();
            const harga = Number(data.harga) || 0;
            const stok = Number(data.stok) || 0;
            totalPengeluaran += harga * stok;
          });

          // Update field sisaModal dan totalPengeluaranBarang pada modal terbaru
          const sisaModal = modalNominal - totalPengeluaran;
          await firebase.firestore().collection('user').doc(userId).collection('modal').doc(modalId)
            .update({
              sisaModal: sisaModal > 0 ? sisaModal : 0,
              totalPengeluaranBarang: totalPengeluaran // <-- Tambahkan field ini
            });
        }

        // Jalankan updateModalAfterPengeluaran secara realtime jika ada perubahan modal atau barang
        firebase.firestore().collection('user').doc(userId).collection('modal')
          .orderBy('timestamp', 'desc').limit(1)
          .onSnapshot(updateModalAfterPengeluaran);

        firebase.firestore().collection('user').doc(userId).collection('barang')
          .onSnapshot(updateModalAfterPengeluaran);