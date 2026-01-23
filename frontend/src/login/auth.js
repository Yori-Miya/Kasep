// Fungsi hash password (SHA-256, sama seperti di register)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Login dengan email & password (hash)
document.querySelector('form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    // Cari user di Firestore berdasarkan email
    const userQuery = await firebase.firestore().collection('user').where('email', '==', email).limit(1).get();
    if (userQuery.empty) {
      alert('Email tidak terdaftar!');
      return;
    }
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Bandingkan hash password
    if (userData.password !== hashedPassword) {
      alert('Password salah!');
      return;
    }

    // Update lastLogin dan loginMethod
    await firebase.firestore().collection('user').doc(userDoc.id).update({
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      loginMethod: "A"
    });

    sessionStorage.setItem('userId', userDoc.id);
    window.location.href = `manajemen.html?uid=${userDoc.id}`;
  } catch (err) {
    alert('Login gagal: ' + err.message);
  }
});

// Login Google
document.getElementById('google-login-btn').addEventListener('click', async (e) => {
  e.preventDefault();
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;
    // Simpan email, lastLogin, dan loginMethod ke Firestore
    await firebase.firestore().collection('user').doc(user.uid).set({
      email: user.email,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      loginMethod: "G"
    }, { merge: true });
    sessionStorage.setItem('userId', user.uid);
    window.location.href = `manajemen.html?uid=${user.uid}`;
  } catch (error) {
    alert("Login gagal: " + error.message);
  }
});

