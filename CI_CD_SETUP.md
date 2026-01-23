## CI/CD Setup dengan GitHub Actions & Firebase Hosting

Dokumentasi lengkap untuk CI/CD pipeline yang telah dikonfigurasi.

### 📋 Overview

Project ini menggunakan GitHub Actions untuk otomasi:
- **Build otomatis** pada setiap push ke branch `main`
- **Deploy otomatis** ke Firebase Hosting
- **Preview deployment** untuk setiap Pull Request
- **Linting & validation** sebelum deploy

### 🔧 Konfigurasi yang Sudah Dilakukan

#### 1. **firebase.json** ✅
```json
{
  "hosting": {
    "public": "frontend/src",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|ico|gif|jpe?g|png|svg|webp)",
        "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
      },
      {
        "source": "**/*.html",
        "headers": [{"key": "Cache-Control", "value": "public, max-age=0, must-revalidate"}]
      }
    ]
  }
}
```

**Penjelasan:**
- `public`: Folder yang di-deploy (frontend/src berisi HTML & JS)
- `rewrites`: Redirect semua route ke index.html (untuk SPA routing)
- `headers`: Caching strategy - assets immutable, HTML tidak di-cache

#### 2. **GitHub Workflows** ✅

**A. firebase-hosting-merge.yml** (Deploy ke production)
- Trigger: Push ke `main` branch
- Actions:
  - Checkout code
  - Setup Node.js 20 dengan npm cache
  - Install dependencies (`npm ci`)
  - Lint code (`npm run lint`)
  - Build project (`npm run build`)
  - Deploy ke Firebase Hosting (live channel)

**B. firebase-hosting-pull-request.yml** (Preview untuk PR)
- Trigger: Pull Request ke `main` branch
- Actions:
  - Checkout code
  - Setup Node.js 20 dengan npm cache
  - Install dependencies
  - Lint code
  - Build project
  - Deploy ke preview channel Firebase

### ⚙️ Setup yang Diperlukan di GitHub

#### 1. **Firebase Service Account Secret**

Buat secret `FIREBASE_SERVICE_ACCOUNT_KASEP_PROJECT`:

```bash
# Di terminal lokal (dengan Firebase CLI terinstall):
firebase login
firebase projects:list
firebase init hosting

# Dapatkan service account key:
# 1. Buka: https://console.firebase.google.com
# 2. Pilih project: kasep-project
# 3. Settings > Service Accounts > Generate New Private Key
# 4. Copy JSON content
```

**Add ke GitHub:**
1. Repository > Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Name: `FIREBASE_SERVICE_ACCOUNT_KASEP_PROJECT`
4. Paste JSON key
5. Click "Add secret"

#### 2. **Akses GitHub Token**
Sudah otomatis via `secrets.GITHUB_TOKEN` - tidak perlu setup manual.

### 🚀 Cara Menggunakan

#### **Deploy ke Production**
```bash
# 1. Commit changes ke feature branch
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"

# 2. Push ke GitHub
git push origin feature/new-feature

# 3. Create Pull Request di GitHub UI
# - GitHub akan automatic deploy preview
# - Bisa test di preview URL sebelum merge

# 4. Merge PR ke main
# - GitHub Actions akan automatic build & deploy
```

#### **Troubleshooting**

**Build gagal?**
```bash
# Test build lokal dulu:
npm ci
npm run lint
npm run build
```

**Deploy gagal?**
- Cek: Actions tab di GitHub > workflow logs
- Validasi: `npm run lint` dan `npm run build` jalan di lokal
- Pastikan `frontend/src` folder ada dan berisi HTML files

### 📦 Package.json Scripts yang Diperlukan

Pastikan `package.json` (root) ada scripts ini:

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",     // Required untuk build
    "lint": "...",      // Required untuk linting
    "start": "..."
  }
}
```

### 🔐 Best Practices

✅ **DO:**
- Selalu buat Pull Request sebelum merge ke main
- Review preview deployment di PR
- Gunakan meaningful commit messages
- Test lokal sebelum push

❌ **DON'T:**
- Commit `firebase-debug.log`, `.env`, atau secrets
- Direct push ke main (selalu via PR)
- Upload service account key ke git (gunakan GitHub Secrets)

### 📊 Monitoring Deployments

1. **GitHub Actions:**
   - Repository > Actions tab
   - Lihat workflow runs dan logs

2. **Firebase Console:**
   - https://console.firebase.google.com
   - Project: kasep-project
   - Hosting > Releases tab

### 🛠️ Maintenance

**Update Node.js version (jika perlu):**
Edit `.github/workflows/firebase-hosting-merge.yml` dan `firebase-hosting-pull-request.yml`:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '21'  # Update versi di sini
```

**Disable preview untuk PR (jika tidak ingin):**
Comment/delete `firebase-hosting-pull-request.yml` file.

---

**Butuh bantuan?** Cek logs di GitHub Actions atau hubungi tim development.
