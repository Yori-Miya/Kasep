# ⚠️ GIT PERMISSION ERROR - SOLUTION

## Problem
```
remote: Permission to Yori-Miya/Kasep.git denied to Ryfless.
fatal: unable to access 'https://github.com/Yori-Miya/Kasep.git/': The requested URL returned error: 403
```

## Cause
- Repository milik user: `Yori-Miya`
- Pushing dengan user: `Ryfless`
- User `Ryfless` tidak punya permission push ke repo `Yori-Miya/Kasep`

---

## SOLUTION OPTIONS

### Option 1: Use SSH Keys (RECOMMENDED)
SSH lebih aman daripada HTTPS credentials.

```bash
# 1. Generate SSH key (jika belum ada)
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"
# Press Enter untuk semua prompts

# 2. Verify key dibuat
cat ~/.ssh/id_rsa.pub

# 3. Add public key ke GitHub:
#    - Go to: https://github.com/settings/ssh/new
#    - Title: "My Computer"
#    - Key type: Authentication Key
#    - Paste content dari `cat ~/.ssh/id_rsa.pub`
#    - Click "Add SSH key"

# 4. Update git remote ke SSH
git remote set-url origin git@github.com:Yori-Miya/Kasep.git

# 5. Test SSH connection
ssh -T git@github.com
# Should respond: Hi Yori-Miya! You've successfully authenticated...

# 6. Now try push again
git push -u origin main
```

### Option 2: Update Git Credentials (HTTPS)

```bash
# 1. Remove current credentials
git credential reject
# Paste: https://github.com
# Press Enter twice

# 2. Configure git to use proper credentials
git config credential.useHttpPath true

# 3. Next push akan minta login
git push -u origin main
# When prompted:
# - Username: Yori-Miya (or your account with access)
# - Password: Use GitHub Personal Access Token (not password)

# 4. Generate Personal Access Token:
#    - Go to: https://github.com/settings/tokens
#    - Click "Generate new token (classic)"
#    - Select: repo, admin:repo_hook
#    - Copy token and use as password
```

### Option 3: Check Repository Access

**Verify user permissions:**

```bash
# 1. Check who owns the repo
git remote -v
# Output: git@github.com:Yori-Miya/Kasep.git

# 2. Check GitHub access:
#    - Go to: https://github.com/Yori-Miya/Kasep/settings/access
#    - Check if your current user (Yori-Miya) has push access

# 3. If you're NOT the owner:
#    - Ask repo owner (Yori-Miya) to add collaborators
#    - Or make a fork of the repo
#    - And push to your fork instead
```

---

## RECOMMENDED FIX

**Jika Anda adalah Yori-Miya:**

```bash
# 1. Setup SSH (most secure & easiest)
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"

# 2. Add public key ke GitHub SSH settings

# 3. Update remote to SSH
git remote set-url origin git@github.com:Yori-Miya/Kasep.git

# 4. Push
git push -u origin main
```

**Jika Anda adalah developer lain:**

```bash
# 1. Fork repository ke akun Anda
# 2. Clone fork Anda
git clone https://github.com/YOUR_USERNAME/Kasep.git
cd Kasep

# 3. Add upstream (original repo)
git remote add upstream https://github.com/Yori-Miya/Kasep.git

# 4. Push ke fork Anda
git push origin main

# 5. Create Pull Request ke original repo
# Go to: https://github.com/Yori-Miya/Kasep/pulls
# Click "New Pull Request"
```

---

## QUICK FIX - SSH SETUP

**Windows PowerShell:**

```powershell
# 1. Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"
# Press Enter 3 times (no passphrase)

# 2. Show public key
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub

# 3. Copy output dan paste di GitHub SSH settings
# https://github.com/settings/ssh/new

# 4. Update git remote
git remote set-url origin git@github.com:Yori-Miya/Kasep.git

# 5. Test
ssh -T git@github.com

# 6. Push
git push -u origin main
```

---

## AFTER FIXING

Once you have proper access:

```bash
# Verify connection works
ssh -T git@github.com
# Or test HTTPS with token

# Push your changes
git push -u origin main

# Check GitHub Actions
# https://github.com/Yori-Miya/Kasep/actions

# Wait for workflow to complete (~2-3 minutes)

# View deployment
# https://kasep-project.web.app
```

---

## SUPPORT

**If still having issues:**

1. **Check git config:**
   ```bash
   git config --list | grep user
   git config --list | grep remote
   ```

2. **Check GitHub account:**
   - Logged in as: Check GitHub.com top right
   - SSH keys added: https://github.com/settings/keys
   - Access to repo: https://github.com/Yori-Miya/Kasep/settings/access

3. **Reset everything:**
   ```bash
   git credential reject
   git config --unset user.name
   git config --unset user.email
   git config --global user.name "Your Name"
   git config --global user.email "your@email.com"
   ```

4. **Contact:**
   - If you're a collaborator, ask @Yori-Miya to add you
   - If you're forking, follow Option 3 above
   - Or create new SSH key and add to GitHub

---

**Next Step:** Setup SSH or update credentials, then try pushing again.
