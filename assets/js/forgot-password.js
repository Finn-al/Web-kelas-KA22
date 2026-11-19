import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const form = document.querySelector("#reset-form");
const notice = document.querySelector("#reset-notice");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    notice.hidden = false;
    notice.textContent = "Mengirim link reset...";

    try {
        await sendPasswordResetEmail(auth, document.querySelector("#reset-email").value.trim());
        notice.textContent = "Jika email terdaftar, link reset akan dikirim. Periksa inbox dan folder spam.";
    } catch (error) {
        notice.textContent = `Gagal mengirim link reset (${error.code || "error"}). Periksa alamat email dan coba lagi.`;
    }
});
