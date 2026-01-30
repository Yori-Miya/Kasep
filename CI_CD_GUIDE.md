# 🚀 CI/CD SETUP GUIDE - KASEP PROJECT

**Status:** Ready to Deploy  
**Date:** 30 Januari 2026

---

## ✅ CHECKLIST SETUP CI/CD

### 1. GitHub Repository Configuration
```bash
# Check repository status
git status
# Output: On branch main, nothing to commit, working tree clean ✓

# Check remote
git remote -v
# Output: Should show origin pointing to your GitHub repo
```

### 2. GitHub Secrets Setup ✅

**Secret Name:** `FIREBASE_SERVICE_ACCOUNT_KASEP_PROJECT`

**How to create:**

#### Option A: Via GitHub Web UI (Recommended)
1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
2. Click "New repository secret"
3. Name: `FIREBASE_SERVICE_ACCOUNT_KASEP_PROJECT`
4. Value: Paste Firebase service account JSON (below)
5. Click "Add secret"

#### Option B: Get Firebase Service Account Key

```bash
# Step 1: Login to Firebase
firebase login

# Step 2: Check your project
firebase projects:list

# Step 3: Get service account key
# Go to: https://console.firebase.google.com/project/kasep-project/settings/serviceaccounts/adminsdk
# Click "Generate New Private Key"
# Copy the entire JSON content
```

**Service Account JSON Structure:**
```json
{
  "type": "service_account",
  "project_id": "kasep-project",
  "private_key_id": "...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@kasep-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 3. Workflow Files ✅

**Existing files:**
- `.github/workflows/firebase-hosting-merge.yml` - Deploy to production
- `.github/workflows/firebase-hosting-pull-request.yml` - Preview deployment

**Trigger:**
- Production: Push to `main` branch
- Preview: Pull Request to `main` branch

---

## 📋 WORKFLOW DETAILS

### Build & Deploy Pipeline

```
┌─────────────────────────────────────────────────────────┐
│ Event: Git Push / Pull Request                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Step 1: Checkout code                                   │
│ - uses: actions/checkout@v4                             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Step 2: Setup Node.js 20                                │
│ - uses: actions/setup-node@v4                           │
│ - Cache: npm                                             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Step 3: Install dependencies                            │
│ - npm ci (clean install)                                │
│ - Installs: firebase-tools, tailwindcss                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Step 4: Lint code                                       │
│ - npm run lint                                           │
│ - continue-on-error: true (non-blocking)                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Step 5: Build project                                   │
│ - npm run build                                          │
│ - Generates CSS from Tailwind                           │
│ - continue-on-error: false (MUST succeed)               │
└────────────────────┬────────────────────────────────────┘
                     │
    ┌────────────────┴────────────────┐
    │                                 │
┌───▼──────────────────┐    ┌────────▼───────────────┐
│ Push to main?        │    │ Pull Request?          │
└───┬──────────────────┘    └────────┬───────────────┘
    │                                │
    YES                              YES
    │                                │
┌───▼──────────────────┐    ┌────────▼───────────────┐
│ Deploy to PRODUCTION │    │ Deploy to PREVIEW      │
│ (live channel)       │    │ (preview channel)      │
│ firebase-hosting...  │    │ firebase-hosting...    │
│ channelId: live      │    │ (no channelId)         │
└──────────────────────┘    └────────────────────────┘
```

---

## 🔧 TROUBLESHOOTING

### Issue 1: Git Push Failed (exit code 1)

**Possible causes:**
- Git credentials not configured
- Remote branch mismatch
- File conflicts

**Solutions:**

```bash
# Check git config
git config --list | grep user
# Should show: user.name=xxx, user.email=xxx

# If not set, configure:
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Check remote
git remote -v
# Should show: origin pointing to your GitHub repo

# If remote wrong, fix it:
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Force update (if needed)
git fetch origin
git branch -u origin/main main

# Try push again
git push origin main
```

### Issue 2: Build Fails on GitHub Actions

**Error:** "npm run build" failed

**Solution:**

```bash
# Test build locally first
npm install
npm run build

# Check output
echo $? # Should be 0 (success)

# If fails locally, check:
# 1. frontend/src/assets/css/input.css exists
# 2. frontend/build-css.js is executable
# 3. No syntax errors in JS files
```

### Issue 3: Firebase Deploy Failed

**Error:** "FIREBASE_SERVICE_ACCOUNT_KASEP_PROJECT not found"

**Solution:**

1. Verify secret exists:
   - Go to: Settings > Secrets and variables > Actions
   - Check if `FIREBASE_SERVICE_ACCOUNT_KASEP_PROJECT` is listed
   
2. Verify secret format (must be valid JSON):
   ```bash
   # Test locally
   firebase login:ci
   # Copy token and save
   ```

3. If secret wrong, delete and recreate:
   - Settings > Secrets > Delete secret
   - Create new with correct JSON

### Issue 4: Project ID Mismatch

**Error:** "Project 'kasep-project' not found"

**Solution:**

```bash
# Get correct project ID
firebase projects:list
# Should show: kasep-project (or your actual project ID)

# Update workflow files if needed:
# In .github/workflows/*.yml
# Change: projectId: kasep-project
# To: projectId: YOUR_ACTUAL_PROJECT_ID
```

---

## 🚀 TESTING CI/CD

### Test 1: Trigger Workflow with Git Push

```bash
# Make a small change (e.g., update README)
echo "# CI/CD is working!" >> README.md

# Commit and push
git add .
git commit -m "test: trigger CI/CD workflow"
git push origin main

# Watch workflow on GitHub:
# https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

### Test 2: Verify Deployment

After successful workflow:

1. Check GitHub Actions:
   - Go to: Actions tab
   - Should see green ✓ status

2. Check Firebase Hosting:
   - Go to: https://console.firebase.google.com
   - Project: kasep-project
   - Hosting > Deployments
   - Should see latest deployment with green status

3. Check Live URL:
   - Should be: https://kasep-project.web.app
   - Or: https://kasep-project.firebaseapp.com

---

## 📊 WORKFLOW STATUS PAGE

**GitHub Actions URL:**
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

**What you'll see:**
- Workflow name: "Deploy to Firebase Hosting on merge"
- Status: ✅ Success or ❌ Failed
- Duration: Usually 2-3 minutes
- Logs: Click to see detailed output

**Firebase Hosting Status:**
```
https://console.firebase.google.com/project/kasep-project/hosting/deployments
```

---

## 🎯 NEXT DEPLOYMENT

### To deploy your changes:

```bash
# 1. Make changes to your code
# ... edit files ...

# 2. Test locally (optional)
npm install
npm run build

# 3. Commit changes
git add .
git commit -m "feature: your description here"

# 4. Push to main (triggers CI/CD)
git push origin main

# 5. Wait for workflow to complete (~2-3 minutes)
# Watch at: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

# 6. Verify deployment
# Check: https://kasep-project.web.app
```

---

## 📝 ENVIRONMENT INFO

**Current Project:**
- Name: kasep-pos
- Version: 0.1.0
- Build: `npm run build` ✓
- Lint: `npm run lint` ✓
- Deploy: `firebase deploy` ✓

**Dependencies:**
- Node.js: >=18.0.0
- npm: >=9.0.0
- firebase-tools: ^15.5.1
- tailwindcss: ^4.1.11

**Frontend:**
- Framework: Vanilla HTML + JavaScript
- CSS: Tailwind CSS
- Deployment: Firebase Hosting (`frontend/src` folder)

---

## ✅ READY FOR PRODUCTION

All systems are configured and ready:
- ✅ GitHub Actions workflows
- ✅ Build pipeline
- ✅ Firebase deployment
- ✅ Environment variables
- ✅ CI/CD automation

**Status:** 🟢 **PRODUCTION READY**

---

## 📞 SUPPORT

If you encounter issues:

1. **Check workflow logs:**
   - GitHub Actions > Latest workflow > See logs

2. **Check build locally:**
   ```bash
   npm install && npm run build
   ```

3. **Check Firebase:**
   - firebase.json configuration
   - Public folder path: frontend/src
   - Project ID: kasep-project

4. **Common fixes:**
   - Clear npm cache: `npm cache clean --force`
   - Reinstall: `npm install`
   - Check file permissions: `chmod +x frontend/build-css.js`
