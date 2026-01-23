document.addEventListener("DOMContentLoaded", function () {
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
        setupToggle("togglePassword1", "password");
        setupToggle("togglePassword2", "confirmPassword");

        // Elemen
        const form = document.getElementById("registrationForm");
        const otpSection = document.getElementById("otp-section");
        const successSection = document.getElementById("success-section");
        const otpNomor = document.getElementById("otpNomor");
        const otpInputs = document.querySelectorAll('#otpInputs input');
        const verifyBtn = document.getElementById('verifyBtn');
        const otpError = document.getElementById('otpError');
        const gantiNomor = document.getElementById('gantiNomor');
        let confirmationResult = null;
        let pendingRegisterData = null;

        // Inisialisasi reCAPTCHA hanya sekali!
        let recaptchaVerifier;
        let recaptchaWidgetId;
        if (!window.recaptchaVerifier) {
          recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'normal'
          });
          recaptchaVerifier.render().then(function(widgetId) {
            recaptchaWidgetId = widgetId;
          });
          window.recaptchaVerifier = recaptchaVerifier;
        } else {
          recaptchaVerifier = window.recaptchaVerifier;
        }

        // Register submit  
        form.addEventListener("submit", async function (event) {
          event.preventDefault();

          // Validasi sederhana
          const emailInput = document.getElementById("email");
          const fullNameInput = document.getElementById("fullName");
          const phoneNumberInput = document.getElementById("phoneNumber");
          const passwordInput = document.getElementById("password");
          const confirmPasswordInput = document.getElementById("confirmPassword");
          const emailError = document.getElementById('emailError');
          const phoneError = document.getElementById('phoneError');
          let passError = document.getElementById("passError");
          if (!passError) {
            passError = document.createElement("div");
            passError.id = "passError";
            passError.className = "text-red-500 text-sm mt-2 mb-0";
            confirmPasswordInput.parentNode.appendChild(passError);
          }

          emailError.classList.add('hidden');
          phoneError.classList.add('hidden');
          passError.textContent = "";

          if (passwordInput.value !== confirmPasswordInput.value) {
            passError.textContent = "Password tidak sama";
            confirmPasswordInput.focus();
            return;
          }
          let valid = true;
          if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(emailInput.value)) {
            emailError.textContent = "masukan email yang valid";
            emailError.classList.remove('hidden');
            valid = false;
          }
          if (!/^[0-9]+$/.test(phoneNumberInput.value)) {
            phoneError.textContent = "Nomor HP hanya boleh angka";
            phoneError.classList.remove('hidden');
            valid = false;
          }
          if (!valid) return;

          // Format nomor telepon ke +62
          let phoneNumber = phoneNumberInput.value.trim();
          if (phoneNumber.startsWith("0")) {
            phoneNumber = "+62" + phoneNumber.slice(1);
          }

          // Set bahasa OTP (opsional)
          firebase.auth().languageCode = 'id';

          // Kirim OTP SMS
          try {
            confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
            pendingRegisterData = {
              phone: phoneNumber,
              email: emailInput.value,
              fullName: fullNameInput.value,
              password: passwordInput.value
            };
            // Tampilkan OTP section
            form.style.display = "none";
            otpSection.style.display = "block";
            otpNomor.textContent = phoneNumber;
            // Reset input OTP
            otpInputs.forEach(i => i.value = "");
            otpInputs[0].focus();
          } catch (error) {
            alert("Gagal mengirim OTP: " + error.message);
            if (typeof grecaptcha !== "undefined" && recaptchaWidgetId !== undefined) {
              grecaptcha.reset(recaptchaWidgetId);
            }
          }
        });

        // Fokus otomatis ke input berikutnya
        otpInputs.forEach((input, idx) => {
          input.addEventListener('input', function() {
            if (this.value.length === 1 && idx < otpInputs.length - 1) {
              otpInputs[idx + 1].focus();
            }
          });
          input.addEventListener('keydown', function(e) {
            if (e.key === "Backspace" && !this.value && idx > 0) {
              otpInputs[idx - 1].focus();
            }
          });
        });

        // Verifikasi OTP
        verifyBtn.onclick = async function() {
          const otp = Array.from(otpInputs).map(i => i.value).join('');
          otpError.classList.add('hidden');
          if (otp.length !== 6) {
            otpError.textContent = "Kode OTP harus 6 digit";
            otpError.classList.remove('hidden');
            return;
          }
          if (!confirmationResult) {
            otpError.textContent = "Session OTP tidak ditemukan, silakan daftar ulang.";
            otpError.classList.remove('hidden');
            return;
          }
          try {
            const result = await confirmationResult.confirm(otp);
            const user = result.user;

            // Hash password sebelum simpan ke Firestore
            async function hashPassword(password) {
              const encoder = new TextEncoder();
              const data = encoder.encode(password);
              const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }

            const hashedPassword = await hashPassword(pendingRegisterData.password);

            // Simpan data user ke Firestore
            await firebase.firestore().collection('user').doc(user.uid).set({
              nama: pendingRegisterData.fullName,
              phone: pendingRegisterData.phone,
              email: pendingRegisterData.email,
              password: hashedPassword,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Bersihkan session
            confirmationResult = null;
            pendingRegisterData = null;

            otpSection.style.display = "none";
            successSection.style.display = "block";
            // Redirect otomatis ke login.html setelah 2 detik
            setTimeout(function() {
              window.location.href = "login.html";
            }, 2000);
          } catch (err) {
            otpError.textContent = "Kode OTP salah atau sudah kadaluarsa";
            otpError.classList.remove('hidden');
          }
        };

        // Ganti nomor: reset ke form awal
        gantiNomor.onclick = function(e) {
          e.preventDefault();
          confirmationResult = null;
          pendingRegisterData = null;
          otpSection.style.display = "none";
          successSection.style.display = "none";
          form.style.display = "block";
          // Reset form
          form.reset();
        };
      });