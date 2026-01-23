// let userId = "DEVELOPER_TEST_UID";

    firebase.auth().onAuthStateChanged(user => {
      // if (user) userId = user.uid;

      db.collection('user').doc(userId).collection('transaksi').get().then(snapshot => {
        const transaksi = [];
        snapshot.forEach(doc => transaksi.push(doc.data()));

        // --- Ambil daftar bulan unik dari data transaksi ---
        const bulanSet = new Set();
        transaksi.forEach(t => {
          if (!t.waktu) return;
          const date = t.waktu.seconds ? new Date(t.waktu.seconds * 1000) : new Date(t.waktu);
          const bulan = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
          bulanSet.add(bulan);
        });
        const bulanArr = Array.from(bulanSet).sort((a, b) => {
          const [bulanA, tahunA] = a.split(' ');
          const [bulanB, tahunB] = b.split(' ');
          const bulanMap = {
            'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
            'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
          };
          return (parseInt(tahunA) - parseInt(tahunB)) || (bulanMap[bulanA] - bulanMap[bulanB]);
        }).reverse(); // reverse agar bulan terbaru di atas

        // --- Render option pada filter select ---
        const selectBulan = document.querySelector('select');
        selectBulan.innerHTML = `<option value="">Semua</option>` +
          bulanArr.map(b => `<option value="${b}">${b}</option>`).join('');

        // --- Ambil sisaModal terbaru dari database
        async function getSisaModalTerbaru() {
          const modalSnap = await db.collection('user').doc(userId).collection('modal')
            .orderBy('timestamp', 'desc').limit(1).get();
          if (!modalSnap.empty && modalSnap.docs[0].data().sisaModal !== undefined) {
            return Number(modalSnap.docs[0].data().sisaModal);
          }
          return 0;
        }

        // --- Ambil sisaModal bulan sebelumnya dari database
        async function getSisaModalBulan(bulanFilter) {
          // Ambil semua modal, urutkan terbaru ke terlama
          const modalSnap = await db.collection('user').doc(userId).collection('modal')
            .orderBy('timestamp', 'desc').get();
          let sisaModal = 0;
          modalSnap.forEach(doc => {
            const data = doc.data();
            if (!data.timestamp || data.sisaModal === undefined) return;
            const date = data.timestamp.seconds ? new Date(data.timestamp.seconds * 1000) : new Date(data.timestamp);
            const bulan = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
            if (bulan === bulanFilter) {
              sisaModal = Number(data.sisaModal);
              return false; // break
            }
          });
          return sisaModal;
        }

        // --- Ambil totalPengeluaranBarang terbaru dari database modal
        async function getTotalPengeluaranBarangTerbaru() {
          const modalSnap = await db.collection('user').doc(userId).collection('modal')
            .orderBy('timestamp', 'desc').limit(1).get();
          if (!modalSnap.empty && modalSnap.docs[0].data().totalPengeluaranBarang !== undefined) {
            return Number(modalSnap.docs[0].data().totalPengeluaranBarang);
          }
          return 0;
        }

        // Fungsi untuk mengambil harga dasar barang dari database
        async function getHargaDasarBarangMap() {
          const barangSnap = await db.collection('user').doc(userId).collection('barang').get();
          const hargaDasarMap = {};
          barangSnap.forEach(doc => {
            const data = doc.data();
            hargaDasarMap[data.nama] = Number(data.harga) || 0;
          });
          return hargaDasarMap;
        }

        // --- Fungsi untuk update statistik dan grafik berdasarkan bulan terpilih ---
        async function updateLaporan(bulanFilter = "") {
          let filtered = transaksi;
          if (bulanFilter) {
            filtered = transaksi.filter(t => {
              if (!t.waktu) return false;
              const date = t.waktu.seconds ? new Date(t.waktu.seconds * 1000) : new Date(t.waktu);
              const bulan = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
              return bulan === bulanFilter;
            });
          }

          // Update teks periode di id="recent_month"
          if (bulanFilter) {
            // Cari tanggal awal dan akhir di bulan tersebut
            const tanggalArr = filtered
              .map(t => t.waktu?.seconds ? new Date(t.waktu.seconds * 1000) : new Date(t.waktu))
              .sort((a, b) => a - b);
            if (tanggalArr.length > 0) {
              const tglAwal = tanggalArr[0];
              const tglAkhir = tanggalArr[tanggalArr.length - 1];
              document.getElementById('recent_month').textContent =
                `${tglAwal.getDate()}–${tglAkhir.getDate()} ${tglAkhir.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`;
            } else {
              document.getElementById('recent_month').textContent = bulanFilter;
            }
          } else {
            document.getElementById('recent_month').textContent = "Semua bulan";
          }

          // Statistik Ringkasan
          const totalTransaksi = filtered.length;
          const totalPendapatan = filtered.reduce((a, t) => a + (t.totalHarga || 0), 0);

          // Ambil harga dasar semua barang
          const hargaDasarMap = await getHargaDasarBarangMap();

          // Hitung total modal barang yang terjual saja
          let totalModalTerjual = 0;
          filtered.forEach(t => {
            (t.barang || []).forEach(b => {
              const hargaDasar = hargaDasarMap[b.nama] || 0;
              totalModalTerjual += hargaDasar * (b.qty || 0);
            });
          });

          // Keuntungan riil = Pendapatan - Modal barang terjual
          const totalKeuntungan = totalPendapatan - totalModalTerjual;

          // Ambil elemen card keuntungan
          const keuntunganCard = document.querySelectorAll('.grid .border.p-4.rounded-xl.shadow')[2];
          const keuntunganLabel = keuntunganCard.querySelector('.text-gray-600');
          const keuntunganValue = keuntunganCard.querySelector('.text-lg.font-bold');

          // Jika keuntungan minus, ubah tampilan dan label
          if (totalKeuntungan < 0) {
            keuntunganValue.textContent = "Rp. " + totalKeuntungan.toLocaleString('id-ID');
            keuntunganLabel.textContent = "Kerugian";
            keuntunganCard.classList.add('bg-red-100', 'border-red-400');
            keuntunganCard.classList.remove('bg-white');
          } else {
            keuntunganValue.textContent = "Rp. " + totalKeuntungan.toLocaleString('id-ID');
            keuntunganLabel.textContent = "Keuntungan";
            keuntunganCard.classList.remove('bg-red-100', 'border-red-400');
            keuntunganCard.classList.add('bg-white');
          }

          // Update statistik pada id terkait
          document.querySelectorAll('.text-3xl.font-extrabold')[0].textContent = totalTransaksi;
          document.querySelectorAll('.text-lg.font-bold')[0].textContent = "Rp. " + totalPendapatan.toLocaleString('id-ID');
          document.querySelectorAll('.text-lg.font-bold')[1].textContent = "Rp. " + totalKeuntungan.toLocaleString('id-ID');

          // Update statistik bulan sebelumnya (jika ada)
          let prevBulan = "";
          if (bulanFilter) {
            // Dapatkan urutan bulan dari dropdown
            const options = Array.from(document.querySelector('select').options).map(o => o.value).filter(Boolean);
            const idx = options.indexOf(bulanFilter);
            prevBulan = options[idx + 1] || "";
          }
          let filteredPrev = transaksi;
          if (prevBulan) {
            filteredPrev = transaksi.filter(t => {
              if (!t.waktu) return false;
              const date = t.waktu.seconds ? new Date(t.waktu.seconds * 1000) : new Date(t.waktu);
              const bulan = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
              return bulan === prevBulan;
            });
          } else if (bulanFilter) {
            filteredPrev = [];
          }
          document.getElementById('jumlah_sebelumnya').textContent =
            `${filteredPrev.length} Transaksi di bulan lalu`;
          const pendapatanPrev = filteredPrev.reduce((a, t) => a + (t.totalHarga || 0), 0);

          // Ambil harga dasar semua barang untuk bulan sebelumnya
          let keuntunganPrev = 0;
          if (prevBulan) {
            const hargaDasarMapPrev = await getHargaDasarBarangMap();
            let totalModalTerjualPrev = 0;
            filteredPrev.forEach(t => {
              (t.barang || []).forEach(b => {
                const hargaDasar = hargaDasarMapPrev[b.nama] || 0;
                totalModalTerjualPrev += hargaDasar * (b.qty || 0);
              });
            });
            keuntunganPrev = pendapatanPrev - totalModalTerjualPrev;
          }
          document.getElementById('pendapatan_sebelumnya').textContent =
            `Rp. ${pendapatanPrev.toLocaleString('id-ID')} Bulan Lalu`;

          // Jika keuntunganPrev minus, tetap tampilkan nilai minus dan label "Kerugian"
          if (keuntunganPrev < 0) {
            document.getElementById('keuntungan_sebelumnya').textContent =
              `Kerugian: Rp. ${keuntunganPrev.toLocaleString('id-ID')} Bulan Lalu`;
          } else {
            document.getElementById('keuntungan_sebelumnya').textContent =
              `Rp. ${keuntunganPrev.toLocaleString('id-ID')} Bulan Lalu`;
          }

          // Grafik Line: Penjualan per Bulan (tetap semua bulan)
          const penjualanPerBulan = {};
          transaksi.forEach(t => {
            if (!t.waktu) return;
            const date = t.waktu.seconds ? new Date(t.waktu.seconds * 1000) : new Date(t.waktu);
            const bulan = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
            penjualanPerBulan[bulan] = (penjualanPerBulan[bulan] || 0) + 1;
          });
          const labelsLine = Object.keys(penjualanPerBulan).sort((a, b) => {
            const [bulanA, tahunA] = a.split(' ');
            const [bulanB, tahunB] = b.split(' ');
            const bulanMap = {
              'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
              'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
            };
            return (parseInt(tahunA) - parseInt(tahunB)) || (bulanMap[bulanA] - bulanMap[bulanB]);
          });
          const dataLine = labelsLine.map(label => penjualanPerBulan[label]);
          if (window.lineChartInstance) window.lineChartInstance.destroy();
          const lineCtx = document.getElementById("lineChart").getContext("2d");
          window.lineChartInstance = new Chart(lineCtx, {
            type: "line",
            data: {
              labels: labelsLine,
              datasets: [{
                label: "Jumlah Transaksi",
                data: dataLine,
                borderColor: "#06b6d4",
                fill: false,
                tension: 0.4,
              }],
            },
            options: { responsive: true }
          });

          // Grafik Pie: Barang Terjual (berdasarkan filter)
          const barangMap = {};
          filtered.forEach(t => {
            (t.barang || []).forEach(b => {
              barangMap[b.nama] = (barangMap[b.nama] || 0) + (b.qty || 0);
            });
          });
          const labelsPie = Object.keys(barangMap);
          const dataPie = Object.values(barangMap);
          if (window.pieChartInstance) window.pieChartInstance.destroy();
          const pieCtx = document.getElementById("pieChart").getContext("2d");
          window.pieChartInstance = new Chart(pieCtx, {
            type: "pie",
            data: {
              labels: labelsPie,
              datasets: [{
                data: dataPie,
                backgroundColor: ["#67e8f9", "#06b6d4", "#0e7490", "#38bdf8", "#0ea5e9", "#0891b2"],
              }],
            },
            options: { responsive: true }
          });
        }

        // Event: saat filter bulan diubah
        selectBulan.addEventListener('change', function() {
          updateLaporan(this.value);
        });

        // Jalankan pertama kali (tanpa filter)
        updateLaporan();

        document.getElementById('btn-export-rekap').addEventListener('click', async function() {
          // Ambil bulan filter yang sedang dipilih
          const selectBulan = document.querySelector('select');
          const bulanFilter = selectBulan.value;

          // Filter data transaksi sesuai bulan
          let filtered = transaksi;
          if (bulanFilter) {
            filtered = transaksi.filter(t => {
              if (!t.waktu) return false;
              const date = t.waktu.seconds ? new Date(t.waktu.seconds * 1000) : new Date(t.waktu);
              const bulan = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
              return bulan === bulanFilter;
            });
          }

          // Ambil harga dasar semua barang
          const hargaDasarMap = await getHargaDasarBarangMap();

          // Hitung statistik ringkasan
          const totalTransaksi = filtered.length;
          const totalPendapatan = filtered.reduce((a, t) => a + (t.totalHarga || 0), 0);

          // Detail total harga transaksi per barang & total modal barang terjual per barang
          const totalHargaPerBarang = {};
          const totalModalTerjualPerBarang = {};

          filtered.forEach(t => {
            (t.barang || []).forEach(b => {
              const nama = b.nama || 'Tidak diketahui';
              const hargaDasar = hargaDasarMap[nama] || 0;
              const qty = b.qty || 0;
              const subtotal = (b.harga || 0) * qty;

              // Total harga transaksi per barang
              totalHargaPerBarang[nama] = (totalHargaPerBarang[nama] || 0) + subtotal;

              // Total modal terjual per barang
              totalModalTerjualPerBarang[nama] = (totalModalTerjualPerBarang[nama] || 0) + (hargaDasar * qty);
            });
          });

          // Total modal barang terjual (semua barang)
          const totalModalTerjual = Object.values(totalModalTerjualPerBarang).reduce((a, b) => a + b, 0);
          const totalKeuntungan = totalPendapatan - totalModalTerjual;

          // Siapkan data untuk Excel
          const judul = [
            [`Rekapan laporan penjualan pada ${bulanFilter ? bulanFilter : 'Semua Bulan'}`],
            [],
            ['Statistik Ringkasan'],
            ['Jumlah Transaksi', totalTransaksi],
            ['Pendapatan', `Rp. ${totalPendapatan.toLocaleString('id-ID')}`],
            ['Keuntungan', `Rp. ${totalKeuntungan.toLocaleString('id-ID')}`],
            [],
            ['Total Harga Transaksi per Barang:'],
            ...Object.entries(totalHargaPerBarang).map(([nama, total]) => [nama, `Rp. ${total.toLocaleString('id-ID')}`]),
            [],
            ['Total Modal Barang Terjual per Barang:'],
            ...Object.entries(totalModalTerjualPerBarang).map(([nama, total]) => [nama, `Rp. ${total.toLocaleString('id-ID')}`]),
            [],
            ['Keterangan Formula:'],
            ['Pendapatan', 'Penjumlahan seluruh totalHarga dari transaksi'],
            ['Keuntungan', 'Pendapatan - Total Modal Barang Terjual'],
            ['Total Modal Barang Terjual', 'Penjumlahan (harga dasar barang × qty terjual) dari semua transaksi'],
            ['Total Harga Transaksi per Barang', 'Penjumlahan (harga jual × qty terjual) dari semua transaksi untuk setiap barang'],
            ['Total Modal Barang Terjual per Barang', 'Penjumlahan (harga dasar × qty terjual) dari semua transaksi untuk setiap barang'],
            [],
            [
              "Tanggal", "Nomor Struk", "Kasir", "Customer", "Barang", "Qty", "Harga Satuan", "Subtotal", "Diskon", "PPN", "Total", "Bayar", "Kembalian"
            ]
          ];

          const rows = [];

          filtered.forEach(t => {
            const tanggal = t.waktu
              ? (t.waktu.seconds
                  ? new Date(t.waktu.seconds * 1000)
                  : new Date(t.waktu)
                ).toLocaleDateString('id-ID')
              : '';
            (t.barang || []).forEach(b => {
              rows.push([
                tanggal,
                t.nomorStruk || '',
                t.kasir || '',
                t.customer || '',
                b.nama || '',
                b.qty || 0,
                b.harga || 0,
                b.subtotal || 0,
                t.diskon || 0,
                t.ppn || 0,
                t.totalHarga || 0,
                t.bayar || 0,
                t.kembalian || 0
              ]);
            });
          });

          // Gabungkan judul dan data
          const allRows = [...judul, ...rows];

          // Buat worksheet dan workbook
          const ws = XLSX.utils.aoa_to_sheet(allRows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Rekapan Penjualan");

          // Nama file
          const namaFile = bulanFilter
            ? `rekapan-penjualan-${bulanFilter.replace(/\s/g, '-')}.xlsx`
            : "rekapan-penjualan-semua.xlsx";

          // Export file
          XLSX.writeFile(wb, namaFile);
        });
      });
    });