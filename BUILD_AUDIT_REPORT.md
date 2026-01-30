# 🔍 BUILD AUDIT REPORT - Analisis Kesiapan CI/CD

**Date:** 30 Januari 2026  
**Project:** KASEP POS System  
**Status:** ⚠️ **PERLU PERBAIKAN SEBELUM CI/CD**

---

## 📊 RINGKASAN MASALAH

| Kategori | Status | Keparahan | Jumlah |
|----------|--------|-----------|--------|
| **Konfigurasi Struktur** | ❌ | KRITIS | 3 |
| **Dependencies** | ⚠️ | SEDANG | 2 |
| **Build Script** | ❌ | KRITIS | 1 |
| **ES Modules** | ⚠️ | SEDANG | 2 |

---

## 🚨 MASALAH KRITIS (Harus Diperbaiki)

### 1. **KONFLIK ARSITEKTUR PROYEK** ❌
**Status:** KRITIS - Build akan GAGAL

**Masalah:**
- Root `package.json` menggunakan **Next.js** (React framework)
- File `next.config.ts` dikonfigurasi untuk Next.js
- Tapi `firebase.json` menunjuk ke `frontend/src` dengan file `.html` statis
- `frontend/src` berisi HTML vanilla + JavaScript native (BUKAN React)

**Penyebab Konflik:**
```
Root folder structure:
├── next.config.ts          ← Next.js config
├── tsconfig.json           ← TypeScript config untuk Next.js
├── package.json            ← Next.js dependencies
└── firebase.json
    └── public: "frontend/src"  ← Menunjuk ke HTML statis
```

**Solusi:**
Pilih salah satu:

**Option A: Gunakan HTML Vanilla (RECOMMENDED)**
- Hapus Next.js dari root
- Buat `package.json` baru untuk build Tailwind CSS
- Gunakan `frontend/` sebagai root deploy

**Option B: Migrasi ke Next.js**
- Konversi semua `.html` menjadi Next.js pages
- Gunakan React components
- Update `firebase.json` ke folder Next.js build output

**Saat ini saya merekomendasikan: Option A** (sesuai dengan native JavaScript)

---

### 2. **BUILD SCRIPT TIDAK SESUAI** ❌
**Status:** KRITIS - CI/CD akan GAGAL

**Masalah Saat Ini:**
```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",        ← ❌ Ini untuk Next.js, bukan HTML vanilla
  "start": "next start",
  "lint": "next lint"
}
```

**Mengapa Gagal:**
- `npm run build` menjalankan Next.js builder
- Tapi `firebase.json` expect static HTML files
- Mismatch antara build output dan deploy folder

**Solusi:**
Ganti dengan script yang sesuai untuk HTML vanilla:
```json
{
  "scripts": {
    "build": "tailwindcss -i ./frontend/src/assets/css/input.css -o ./frontend/src/assets/css/output.css",
    "dev": "npm run build",
    "lint": "echo 'Linting HTML & JS files...'"
  }
}
```

---

### 3. **ES MODULES TANPA BUNDLER** ⚠️
**Status:** SEDANG - Bisa menyebabkan runtime error

**Masalah:**
File `manage.js` menggunakan ES6 imports:
```javascript
import { predictMinimumStock } from '../models/TensorFlow.js';
```

**Isu:**
- Browser tidak mendukung relative path imports tanpa bundler
- Harus di-load sebagai `<script type="module">` di HTML
- CORS issues jika file lokal

**File yang Berpotensi Masalah:**
- `frontend/src/services/manage.js` - menggunakan `import`
- `frontend/src/models/TensorFlow.js` - commented imports

**Solusi:**
Gunakan salah satu:

**Option 1: Simple Script Tags (Recommended)**
```html
<script src="./models/TensorFlow.js"></script>
<script src="./services/manage.js"></script>
```

**Option 2: Module Script (jika harus pakai import)**
```html
<script type="module" src="./services/manage.js"></script>
```

---

## ⚠️ MASALAH SEDANG

### 4. **Frontend package.json Tidak Lengkap**
**File:** `frontend/package.json`

**Masalah:**
```json
{
  "dependencies": {
    "@tailwindcss/cli": "^4.1.11",
    "tailwindcss": "^4.1.11"
  }
}
```

- Hanya ada dependencies, tidak ada `scripts`
- Tidak ada build command
- Tidak ada di-ignore di root `.npmignore`

**Solusi:**
```json
{
  "name": "kasep-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "tailwindcss -i ./src/assets/css/input.css -o ./src/assets/css/output.css",
    "dev": "npm run build"
  },
  "devDependencies": {
    "tailwindcss": "^4.1.11"
  }
}
```

---

### 5. **CSS Output Tidak di-Track**
**Masalah:**
File `frontend/src/assets/css/output.css` mungkin di-generate locally tapi tidak di-commit

**Solusi:**
- Pastikan `output.css` ada di repository
- Atau tambahkan ke `.gitignore` dan generate di CI/CD

---

### 6. **Missing Tailwind Config**
**Masalah:**
Tidak ada `tailwind.config.js` di folder manapun

**Solusi:**
Buat file `frontend/tailwind.config.js`:
```javascript
export default {
  content: [
    './src/**/*.{html,js}',
    './src/**/*.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

## ✅ YANG SUDAH BENAR

| Aspek | Status | Keterangan |
|-------|--------|-----------|
| **Firebase.json** | ✅ | Config sudah benar |
| **Rewrite Rules** | ✅ | SPA routing sudah setup |
| **Cache Headers** | ✅ | Strategy sudah optimal |
| **HTML Files** | ✅ | Struktur folder sudah rapi |
| **CI_CD_SETUP.md** | ✅ | Documentation lengkap |

---

## 🛠️ LANGKAH PERBAIKAN (PRIORITY ORDER)

### Phase 1: Bersihkan Arsitektur (WAJIB)
- [ ] 1. Hapus dependensi Next.js dari root `package.json`
- [ ] 2. Buat `tailwind.config.js` di root folder
- [ ] 3. Update root `package.json` dengan script yang tepat
- [ ] 4. Hapus `next.config.ts` atau ubah nama `.unused`
- [ ] 5. Update `tsconfig.json` (hapus Next.js specific config)

### Phase 2: Fix Modules (PENTING)
- [ ] 6. Review semua `.js` files untuk penggunaan `import/export`
- [ ] 7. Gunakan IIFE atau module pattern jika perlu
- [ ] 8. Update HTML untuk load scripts dengan benar

### Phase 3: Build Pipeline (SEDANG)
- [ ] 9. Test `npm run build` di lokal
- [ ] 10. Pastikan output CSS di-generate dengan benar
- [ ] 11. Commit semua file ke git

### Phase 4: CI/CD Ready (AKHIR)
- [ ] 12. Setup GitHub Actions workflow
- [ ] 13. Test deployment ke Firebase
- [ ] 14. Dokumentasikan process

---

## 📋 FILE-FILE YANG PERLU DIUBAH

```
✏️ Root Files:
├── package.json                 ← REWRITE
├── tsconfig.json                ← REVIEW & SIMPLIFY
├── next.config.ts               ← HAPUS atau ubah ke .unused
└── eslint.config.mjs            ← OPTIONAL - standardize

📁 Frontend:
├── frontend/package.json         ← UPDATE
├── frontend/tailwind.config.js   ← CREATE (BARU)
├── frontend/src/**/*.js          ← AUDIT imports
└── frontend/src/**/*.html        ← VERIFY script tags
```

---

## 🔧 REKOMENDASI STRUKTUR FINAL

```
backend/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/
│   │   │   ├── css/
│   │   │   │   ├── input.css
│   │   │   │   └── output.css (generated)
│   │   │   └── image/
│   │   ├── *.html (main pages)
│   │   ├── config/
│   │   └── services/
│   ├── package.json             ← build Tailwind
│   └── tailwind.config.js       ← Tailwind config
│
├── package.json                 ← Root orchestration
├── firebase.json                ← Keep as is ✅
├── .github/
│   └── workflows/
│       ├── firebase-hosting-merge.yml
│       └── firebase-hosting-pull-request.yml
└── CI_CD_SETUP.md              ← Update dengan perbaikan
```

---

## ⚡ QUICK START COMMANDS (Setelah perbaikan)

```bash
# Install dependencies
npm install
cd frontend && npm install

# Test build
npm run build
npm run dev

# Deploy locally
firebase serve

# Deploy ke production
firebase deploy
```

---

## ✋ NEXT STEP

**Tunggu instruksi untuk:**
1. Apakah ingin saya perbaiki file-file tersebut?
2. Atau preferensi opsi architecture (Option A vs B)?
3. Atau bantuan setup file-file baru?

**Rekomendasi:** Lanjutkan dengan Phase 1 terlebih dahulu untuk bersihkan arsitektur.
