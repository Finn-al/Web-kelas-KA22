import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    addDoc, collection, onSnapshot, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const isConfigured = !firebaseConfig.apiKey.startsWith("YOUR_");
const deadlineList = document.querySelector(".deadline-list");
const portfolioRow = document.querySelector("#portfolio-gallery");
const teamGallery = document.querySelector("#team-gallery");
const aspirationForm = document.querySelector("#aspiration-form");

function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function safeImageUrl(value) {
    const url = String(value || "");
    if (/^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\//i.test(url)) return url;
    if (/^\/assets\/[a-z0-9._/-]+$/i.test(url)) return url;
    return "";
}

function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function formatDeadline(date, time) {
    const target = new Date(`${date}T${time || "00:00"}`);
    if (Number.isNaN(target.getTime())) return `${date} ${time || ""}`.trim();
    const days = Math.ceil((target - new Date()) / 86400000);
    const relative = days < 0 ? "Sudah lewat" : days === 0 ? "Hari ini" : `${days} hari lagi`;
    return `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(target)} · ${time || "-"} · ${relative}`;
}

function showMessage(container, text) {
    if (container) container.innerHTML = `<li class="firebase-message">${escapeHtml(text)}</li>`;
}

if (isConfigured) {
    const app = initializeApp(firebaseConfig);
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const db = getFirestore(app);

    onSnapshot(query(collection(db, "deadlines"), orderBy("date", "asc")), (snapshot) => {
        deadlineList.innerHTML = "";
        snapshot.forEach((item) => {
            const data = item.data();
            deadlineList.insertAdjacentHTML("beforeend",
                `<li><span class="deadline-dot" aria-hidden="true"></span><span class="deadline-task">${escapeHtml(data.course || "Mata kuliah")}${data.label ? ` · ${escapeHtml(data.label)}` : ""}</span><span class="deadline-time">${escapeHtml(formatDeadline(data.date, data.time))}</span></li>`);
        });
        if (!snapshot.size) showMessage(deadlineList, "Belum ada deadline terdekat.");
    }, () => showMessage(deadlineList, "Data deadline belum dapat dimuat."));

    onSnapshot(query(collection(db, "activities"), orderBy("createdAt", "desc")), (snapshot) => {
        portfolioRow.innerHTML = "";
        snapshot.forEach((item) => {
            const data = item.data();
            const imageUrl = safeImageUrl(data.imageUrl);
            if (!imageUrl) return;
            portfolioRow.insertAdjacentHTML("beforeend",
                `<div class="col-md-4"><a href="${escapeHtml(imageUrl)}" class="portfolio-card" target="_blank" rel="noopener"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(data.title || "Aktivitas kelas")}" class="portfolio-card-img"><span class="portfolio-card-overlay"><span class="portfolio-card-caption"><h4>${escapeHtml(data.title || "Aktivitas kelas")}</h4><p class="font-weight-normal">${escapeHtml(data.description || "Dokumentasi aktivitas dan kebersamaan kelas.")}</p></span></span></a></div>`);
        });
        if (!portfolioRow.children.length) portfolioRow.innerHTML = '<p class="firebase-message">Belum ada foto aktivitas yang diunggah.</p>';
    }, () => {
        portfolioRow.innerHTML = '<p class="firebase-message">Galeri belum dapat dimuat.</p>';
    });

    onSnapshot(query(collection(db, "team"), orderBy("order", "asc")), (snapshot) => {
        teamGallery.innerHTML = "";
        snapshot.forEach((entry) => {
            const data = entry.data();
            const imageUrl = safeImageUrl(data.imageUrl);
            const avatar = imageUrl
                ? `<img src="${escapeHtml(imageUrl)}" alt="Foto ${escapeHtml(data.name)}">`
                : `<span class="team-card-avatar--initials">${escapeHtml(initials(data.name))}</span>`;
            teamGallery.insertAdjacentHTML("beforeend",
                `<article class="team-card${data.featured ? " team-card--featured" : ""}"><div class="team-card-avatar">${avatar}</div><h3 class="team-card-name">${escapeHtml(data.name || "")}</h3><p class="team-card-role">${escapeHtml(data.role || "")}</p><p class="team-card-description">${escapeHtml(data.description || "")}</p><a href="#contact" class="team-card-button">${escapeHtml(data.buttonText || "Lihat profil")}</a></article>`);
        });
        if (!snapshot.size) teamGallery.innerHTML = '<p class="firebase-message">Belum ada data struktur kelas.</p>';
    }, () => {
        teamGallery.innerHTML = '<p class="firebase-message">Struktur kelas belum dapat dimuat.</p>';
    });

    aspirationForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const status = document.querySelector("#aspiration-status");
        const submitButton = aspirationForm.querySelector('[type="submit"]');
        submitButton.disabled = true;
        status.textContent = "Mengirim aspirasi...";
        try {
            await addDoc(collection(db, "aspirations"), {
                name: document.querySelector("#aspiration-name").value.trim(),
                email: document.querySelector("#aspiration-email").value.trim(),
                message: document.querySelector("#aspiration-message").value.trim(),
                createdAt: serverTimestamp()
            });
            aspirationForm.reset();
            status.textContent = "Aspirasi berhasil dikirim. Terima kasih atas masukannya.";
        } catch (error) {
            status.textContent = `Aspirasi gagal dikirim (${error.code || "error"}). Silakan coba lagi.`;
        } finally {
            submitButton.disabled = false;
        }
    });
} else {
    showMessage(deadlineList, "Hubungkan Firebase untuk menampilkan deadline terbaru.");
    if (portfolioRow) portfolioRow.innerHTML = '<p class="firebase-message">Hubungkan Firebase untuk menampilkan galeri aktivitas.</p>';
    if (teamGallery) teamGallery.innerHTML = '<p class="firebase-message">Hubungkan Firebase untuk menampilkan struktur kelas.</p>';
}
