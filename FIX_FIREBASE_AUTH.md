# 🔧 FIX FIREBASE AUTHENTICATION ERROR

## MASALAH
GitHub Actions deployment gagal dengan error:
```
Failed to authenticate, have you run firebase login?
error:1E08010C:DECODER routines::unsupported
```

**Root Cause:** Secret `FIREBASE_SERVICE_ACCOUNT_KASEP_PROJECT` tidak valid

---

## SOLUSI CEPAT (3 Langkah)

### STEP 1: Generate Service Account Key Baru

**URL:** https://console.firebase.google.com/project/kasep-project/settings/serviceaccounts/adminsdk

1. Click "Generate New Private Key"
2. Download file JSON (auto-download)
3. Open file JSON dengan text editor
4. Copy **SELURUH CONTENT** (dari `{` ke `}`)

### STEP 2: Update Secret di GitHub

**URL:** https://github.com/Yori-Miya/Kasep/settings/secrets/actions

1. Click secret: `FIREBASE_SERVICE_ACCOUNT_KASEP_PROJECT`
2. Click "Update"
3. Paste JSON content dari Step 1
4. Click "Update secret"

**PENTING:**
- Paste SELURUH JSON
- Jangan ada extra spaces
- Ensure JSON valid (buka dengan https://jsonlint.com jika ragu)

### STEP 3: Trigger Workflow

```bash
cd "c:\Users\Lenovo\Documents\Berkas Kuliah\KASEP PROJECT\backend"
git commit --allow-empty -m "chore: retrigger deployment with updated Firebase credentials"
git push origin main
```

**Atau:**
- Go to: https://github.com/Yori-Miya/Kasep/actions
- Click latest failed workflow
- Click "Re-run" → "Re-run failed jobs"

---

## CARA CEK JSON VALID

```bash
# Paste JSON content ke file temp
# Open dengan notepad dan check:
# - Starts with: {
# - Ends with: }
# - No extra characters
# - All quotes properly closed

# Atau gunakan online validator:
https://jsonlint.com/
```

---

## EXPECTED RESULT SETELAH FIX

```
✅ Workflow runs successfully
✅ All steps show green checkmark
✅ Deploy step completes
✅ App live at: https://kasep-project.web.app
```

---

**Waktu:** ~5 menit untuk fix
**Difficulty:** Easy
**Do Now:** Go to Firebase console & generate new key!
