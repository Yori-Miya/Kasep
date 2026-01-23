// // Ambil uid user saat ini dari sessionStorage (atau dari query string jika perlu)
let userId = sessionStorage.getItem('userId');
// Jika ingin fallback ke query string:
// const params = new URLSearchParams(window.location.search);
// let userId = params.get('uid') || sessionStorage.getItem('userId');

if (userId) {
  // Ambil data user dan tampilkan secara realtime di halaman akun
  firebase.firestore().collection('user').doc(userId)
    .onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        // Tampilkan foto profil pada semua elemen dengan class .photoProfile
        document.querySelectorAll('.photoProfile').forEach(img => {
          img.src = data.photoURL || "./assets/image/blank profile.png";
        });
        // Tampilkan nama pada semua elemen dengan class .fullname
        document.querySelectorAll('.fullname').forEach(el => {
          el.textContent = data.name || data.nama || '';
        });
        document.querySelectorAll('.displayLogo').forEach(img => {
          img.src = data.logoToko || "./assets/image/blank logo.png";
        });
      }
    });

  // --- Notifikasi stok minimum ---
  document.querySelectorAll('.notif').forEach(notifSvg => {
    // Cek barang yang stoknya kurang dari prediksi
    firebase.firestore().collection('user').doc(userId).collection('barang')
      .onSnapshot(snapshot => {
        let lowStockItems = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (
            typeof data.prediksiStok === 'number' &&
            typeof data.stok === 'number' &&
            data.stok < data.prediksiStok
          ) {
            lowStockItems.push({
              nama: data.nama || '(Tanpa Nama)',
              stok: data.stok,
              prediksiStok: data.prediksiStok
            });
          }
        });

        // Ubah warna stroke svg jika ada barang yang perlu ditambah stok
        if (lowStockItems.length > 0) {
          notifSvg.style.stroke = "#ef4444"; // merah tailwind
          // Tambahkan dot merah di pojok kanan atas
          if (!notifSvg.parentElement.querySelector('.notif-dot')) {
            const dot = document.createElement('span');
            dot.className = 'notif-dot absolute top-0 right-0 block w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white';
            notifSvg.parentElement.style.position = 'relative';
            notifSvg.parentElement.appendChild(dot);
          }
        } else {
          notifSvg.style.stroke = "";
          const dot = notifSvg.parentElement.querySelector('.notif-dot');
          if (dot) dot.remove();
        }

        // Event klik untuk pop up
        notifSvg.onclick = function (e) {
          e.stopPropagation();
          if (lowStockItems.length === 0) return;

          // Cek jika sudah ada popup, tampilkan ulang saja
          let popup = document.getElementById('notif-popup');
          if (!popup) {
            popup = document.createElement('div');
            popup.id = 'notif-popup';
            popup.className = 'fixed z-50 top-4 right-4 w-72 bg-white rounded-lg shadow-lg border p-4 text-left';
            popup.style.maxHeight = '60vh';
            popup.style.overflowY = 'auto';
            popup.innerHTML = `
              <div class="flex items-center justify-between mb-2">
                <h2 class="text-base font-bold text-red-600">Stok Menipis</h2>
                <button id="notif-popup-close" class="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
              </div>
              <ul class="mb-3 text-sm">
                ${lowStockItems.map(item =>
                  `<li class="mb-2">• <span class="font-semibold">${item.nama}</span> (Stok: <span class="text-red-600">${item.stok}</span> / Min: ${item.prediksiStok})</li>`
                ).join('')}
              </ul>
              ${window.location.pathname.includes('manajemen.html') ? '' : `<button id="notif-popup-btn" class="bg-cyan-500 text-white px-3 py-1 rounded font-semibold w-full text-sm">Ke Manajemen Barang</button>`}
            `;
            document.body.appendChild(popup);
          } else {
            popup.style.display = 'block';
            popup.querySelector('ul').innerHTML = lowStockItems.map(item =>
              `<li class="mb-2">• <span class="font-semibold">${item.nama}</span> (Stok: <span class="text-red-600">${item.stok}</span> / Min: ${item.prediksiStok})</li>`
            ).join('');
          }

          // Tombol close
          popup.querySelector('#notif-popup-close').onclick = function () {
            popup.style.display = 'none';
          };

          // Jika bukan di manajemen.html, tombol redirect
          const btn = popup.querySelector('#notif-popup-btn');
          if (btn) {
            btn.onclick = function () {
              window.location.href = "manajemen.html";
            };
          }

          // Klik di luar popup tidak menutup seluruh halaman
          document.addEventListener('mousedown', function handler(ev) {
            if (popup && !popup.contains(ev.target) && ev.target !== notifSvg) {
              popup.style.display = 'none';
              document.removeEventListener('mousedown', handler);
            }
          });
        };
      });
  });
}