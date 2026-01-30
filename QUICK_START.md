# ⚡ QUICK START - COPY & PASTE

## 🔑 STEP 1: Generate SSH Key (Copy paste ini di PowerShell)

```powershell
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"
```

Press Enter 3 times (no passphrase)

---

## 📋 STEP 2: Get Your Public Key

```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub
```

**Copy the output** (entire key starting with ssh-rsa)

---

## 🌐 STEP 3: Add Key to GitHub

1. Go to: https://github.com/settings/ssh/new
2. Title: `My Computer`
3. Key type: `Authentication Key`
4. **Paste** your public key from Step 2
5. Click **"Add SSH key"**

---

## 🔗 STEP 4: Update Git Remote (Copy paste)

```powershell
cd "c:\Users\Lenovo\Documents\Berkas Kuliah\KASEP PROJECT\backend"
git remote set-url origin git@github.com:Yori-Miya/Kasep.git
```

---

## ✔️ STEP 5: Test SSH Connection

```powershell
ssh -T git@github.com
```

**You should see:**
```
Hi Yori-Miya! You've successfully authenticated, but GitHub does not provide shell access.
```

If you see this ✅ - **YOU'RE GOOD TO GO!**

---

## 🚀 STEP 6: Push to GitHub (This triggers CI/CD!)

```powershell
cd "c:\Users\Lenovo\Documents\Berkas Kuliah\KASEP PROJECT\backend"
git push -u origin main
```

**Expected output:**
```
Enumerating objects: XX, done.
...
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✅ **If you see this - SUCCESS! CI/CD is now activated!**

---

## 📊 STEP 7: Watch GitHub Actions (Takes 2-3 minutes)

Go to: https://github.com/Yori-Miya/Kasep/actions

You'll see:
- ⏳ Workflow running...
- ✅ All steps complete (green checkmark)

Steps:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Lint
5. Build
6. Deploy to Firebase

---

## 🎉 STEP 8: Verify Live Deployment

Visit: https://kasep-project.web.app

You should see your KASEP app live! 🎊

---

## 📝 ALL COMMANDS AT ONCE

If you want to copy-paste everything:

```powershell
# Generate SSH
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"
# Press Enter 3 times when prompted

# Show public key (copy this)
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub

# (PASTE key to GitHub at: https://github.com/settings/ssh/new)

# Navigate to project
cd "c:\Users\Lenovo\Documents\Berkas Kuliah\KASEP PROJECT\backend"

# Update git remote
git remote set-url origin git@github.com:Yori-Miya/Kasep.git

# Test connection
ssh -T git@github.com

# Push to GitHub (TRIGGERS CI/CD!)
git push -u origin main

# Check status
git branch -vv
```

---

## 🎯 THAT'S IT!

Your CI/CD pipeline is now active:

```
┌─────────────────────────────────────────┐
│ Every time you push to main:            │
│                                         │
│ 1. GitHub Actions runs automatically   │
│ 2. Builds your code (npm run build)    │
│ 3. Deploys to Firebase Hosting         │
│ 4. Live at: https://kasep-project.web.app
│                                         │
│ ⏱️ Takes ~2-3 minutes                   │
│ 🔄 Fully automated!                     │
└─────────────────────────────────────────┘
```

---

## ❌ IF SOMETHING GOES WRONG

### Error: SSH key not found
```powershell
# Verify SSH key exists
Test-Path $env:USERPROFILE\.ssh\id_rsa
# Should return: True
```

### Error: Permission denied
- Make sure you added SSH key to GitHub
- Check: https://github.com/settings/ssh
- Key should be listed there

### Error: Workflow failed
- Check logs: https://github.com/Yori-Miya/Kasep/actions
- Click the failed workflow
- Expand failed step to see error details
- Common: Wrong secret name or Firebase project ID

### Error: Can't access https://kasep-project.web.app
- Wait for workflow to complete (check Actions page)
- Make sure deployment shows "Success"
- Clear browser cache and try again
- Check Firebase console: https://console.firebase.google.com

---

## 📞 NEED HELP?

**Read detailed guides:**
- [CI_CD_GUIDE.md](CI_CD_GUIDE.md) - Complete setup guide
- [GIT_PERMISSION_FIX.md](GIT_PERMISSION_FIX.md) - Git auth issues
- [CI_CD_NEXT_STEPS.md](CI_CD_NEXT_STEPS.md) - Detailed next steps

**Resources:**
- GitHub SSH Docs: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
- GitHub Actions: https://docs.github.com/en/actions
- Firebase Hosting: https://firebase.google.com/docs/hosting

---

## ✅ PROGRESS TRACKING

- [ ] SSH key generated
- [ ] Public key added to GitHub
- [ ] Git remote updated to SSH
- [ ] SSH connection tested (ssh -T git@github.com)
- [ ] Push to GitHub successful (git push -u origin main)
- [ ] GitHub Actions workflow triggered
- [ ] All workflow steps completed (green ✅)
- [ ] Live app accessible at https://kasep-project.web.app
- [ ] CI/CD fully automated and working!

---

**🎉 CONGRATULATIONS! Your CI/CD is live!**

From now on, every push to `main` will automatically:
1. Build your code
2. Deploy to Firebase Hosting
3. Live at https://kasep-project.web.app

No manual steps needed! 🚀
