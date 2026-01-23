  // Helper hash password SHA-256
      async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      // Toggle password
      function setupToggle(toggleId, inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        toggle.addEventListener("click", () => {
          const isPassword = input.type === "password";
          input.type = isPassword ? "text" : "password";
          toggle.src = isPassword
            ? "./assets/image/buka.png"
            : "./assets/image/tutup.png";
        });
      }

      // Setup toggle password
      document.addEventListener("DOMContentLoaded", async function () {
        setupToggle("togglePassword1", "password");
        setupToggle("togglePassword2", "confirmPassword");

        // --- Ambil UID dari query string ---
        const params = new URLSearchParams(window.location.search);
        const uid = params.get("uid");
        if (!uid) {
          alert("User tidak ditemukan!");
          window.location.href = "login.html";
          return;
        }

        // --- Ambil nomor telepon user dari Firestore ---
        let phoneNumber = "";
        try {
          const userDoc = await firebase.firestore().collection('user').doc(uid).get();
          if (!userDoc.exists) throw new Error("User tidak ditemukan!");
          const userData = userDoc.data();
          phoneNumber = userData.phone || userData.phoneNumber;

          // Ubah 08xxx menjadi +62 8xxx untuk tampilan
          let displayPhone = phoneNumber;
          if (phoneNumber && phoneNumber.startsWith("08")) {
            displayPhone = "+62 " + phoneNumber.slice(1);
          }
          document.getElementById("otpNomor").textContent = displayPhone;
        } catch (err) {
          alert("User tidak ditemukan!");
          window.location.href = "login.html";
          return;
        }

        // --- Recaptcha & OTP ---
        let recaptchaVerifier, recaptchaWidgetId, confirmationResult;

        // Render recaptcha
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          'size': 'normal'
        });
        recaptchaVerifier.render().then(function (widgetId) {
          recaptchaWidgetId = widgetId;
        });

        // Kirim OTP
        document.getElementById('sendOtpBtn').onclick = async function () {
          try {
            firebase.auth().languageCode = 'id';
            confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
            document.getElementById('recaptcha-section').style.display = "none";
            document.getElementById('otp-section').style.display = "block";
            // Fokus ke input OTP pertama
            document.querySelectorAll('#otpInputs input')[0].focus();
          } catch (err) {
            alert("Gagal mengirim OTP: " + err.message);
            if (typeof grecaptcha !== "undefined" && recaptchaWidgetId !== undefined) {
              grecaptcha.reset(recaptchaWidgetId);
            }
          }
        };

        // OTP input auto move
        const otpInputs = document.querySelectorAll('#otpInputs input');
        otpInputs.forEach((input, idx) => {
          input.addEventListener('input', function () {
            if (this.value.length === 1 && idx < otpInputs.length - 1) {
              otpInputs[idx + 1].focus();
            }
          });
          input.addEventListener('keydown', function (e) {
            if (e.key === "Backspace" && !this.value && idx > 0) {
              otpInputs[idx - 1].focus();
            }
          });
        });

        // Verifikasi OTP
        document.getElementById('verifyOtpBtn').onclick = async function () {
          const otp = Array.from(otpInputs).map(i => i.value).join('');
          const otpError = document.getElementById('otpError');
          otpError.classList.add('hidden');
          if (otp.length !== 6) {
            otpError.textContent = "Kode OTP harus 6 digit";
            otpError.classList.remove('hidden');
            return;
          }
          if (!confirmationResult) {
            otpError.textContent = "Session OTP tidak ditemukan, silakan ulangi.";
            otpError.classList.remove('hidden');
            return;
          }
          try {
            await confirmationResult.confirm(otp);
            // OTP benar, lanjut ke form reset password
            document.getElementById('otp-section').style.display = "none";
            document.getElementById('resetpw-section').style.display = "block";
          } catch (err) {
            otpError.textContent = "Kode OTP salah atau sudah kadaluarsa";
            otpError.classList.remove('hidden');
          }
        };

        // --- Reset Password Form ---
        document.getElementById('resetPwForm').onsubmit = async function (e) {
          e.preventDefault();
          const pw = document.getElementById('password').value;
          const cpw = document.getElementById('confirmPassword').value;
          const pwError = document.getElementById('pwError');
          pwError.textContent = "";
          if (!pw || !cpw) {
            pwError.textContent = "Semua kolom harus diisi!";
            return;
          }
          if (pw !== cpw) {
            pwError.textContent = "Password dan konfirmasi tidak sama!";
            return;
          }
          // Hash password baru
          const newHash = await hashPassword(pw);
          await firebase.firestore().collection('user').doc(uid).update({
            password: newHash
          });
          // Sukses, redirect ke login
          window.location.href = "login.html";
        };
      });