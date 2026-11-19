import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const form = document.querySelector("#login-form");
const notice = form.querySelector(".auth-notice");
const submitButton = form.querySelector('[type="submit"]');
const params = new URLSearchParams(window.location.search);
const redirectToAdmin = params.get("redirect") !== "home";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

if (redirectToAdmin) {
    document.querySelector("#login-description").textContent = "Masuk dengan email dan password akun pengelola.";
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    notice.hidden = false;
    notice.textContent = "Sedang memverifikasi akun...";
    submitButton.disabled = true;

    try {
        await signInWithEmailAndPassword(
            auth,
            document.querySelector("#login-email").value.trim(),
            document.querySelector("#login-password").value
        );
        window.location.assign(redirectToAdmin ? "admin/" : "index.html");
    } catch (error) {
        notice.textContent = error.code === "auth/invalid-credential"
            ? "Email atau password tidak sesuai. Periksa kembali atau gunakan Lupa password."
            : `Login gagal (${error.code || "error"}). Silakan coba lagi.`;
        submitButton.disabled = false;
    }
});
