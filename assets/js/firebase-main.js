import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    collection, onSnapshot, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const isConfigured = !firebaseConfig.apiKey.startsWith("YOUR_");
const deadlineList = document.querySelector(".deadline-list");
const portfolioRow = document.querySelector("#portfolio-gallery");

function showSetupMessage(container, message) {
    if (container) container.innerHTML = `<li class="firebase-message">${message}</li>`;
}

function formatDeadline(date, time) {
    const target = new Date(`${date}T${time || "00:00"}`);
    if (Number.isNaN(target.getTime())) return `${date} ${time || ""}`.trim();
    const days = Math.ceil((target - new Date()) / 86400000);
    const relative = days < 0 ? "Sudah lewat" : days === 0 ? "Hari ini" : `${days} hari lagi`;
    return `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(target)} · ${time || "-"} · ${relative}`;
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
                `<li><span class="deadline-dot" aria-hidden="true"></span><span class="deadline-task">${data.course || "Mata kuliah"}${data.label ? ` · ${data.label}` : ""}</span><span class="deadline-time">${formatDeadline(data.date, data.time)}</span></li>`);
        });
        if (!snapshot.size) deadlineList.innerHTML = '<li class="firebase-message">Belum ada deadline terdekat.</li>';
    }, () => showSetupMessage(deadlineList, "Data deadline belum dapat dimuat."));

    onSnapshot(query(collection(db, "activities"), orderBy("createdAt", "desc")), (snapshot) => {
        portfolioRow.innerHTML = "";
        snapshot.forEach((item) => {
            const data = item.data();
            portfolioRow.insertAdjacentHTML("beforeend",
                `<div class="col-md-4"><a href="${data.imageUrl}" class="portfolio-card" target="_blank" rel="noopener"><img src="${data.imageUrl}" alt="${data.title || "Aktivitas kelas"}" class="portfolio-card-img"><span class="portfolio-card-overlay"><span class="portfolio-card-caption"><h4>${data.title || "Aktivitas kelas"}</h4><p class="font-weight-normal">${data.description || "Dokumentasi aktivitas dan kebersamaan kelas."}</p></span></span></a></div>`);
        });
        if (!snapshot.size) portfolioRow.innerHTML = '<p class="firebase-message">Belum ada foto aktivitas yang diunggah.</p>';
    }, () => {
        portfolioRow.innerHTML = '<p class="firebase-message">Galeri belum dapat dimuat.</p>';
    });
} else {
    showSetupMessage(deadlineList, "Hubungkan Firebase untuk menampilkan deadline terbaru.");
    if (portfolioRow) portfolioRow.innerHTML = '<p class="firebase-message">Hubungkan Firebase untuk menampilkan galeri aktivitas.</p>';
}
