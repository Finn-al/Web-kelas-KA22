import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../assets/js/firebase-config.js";
import { cloudinaryConfig } from "../assets/js/cloudinary-config.js";

const $ = (id) => document.getElementById(id);
const configured = !firebaseConfig.apiKey.startsWith("YOUR_");
const status = $("status");
let db;

function message(text, error = false) { status.textContent = text; status.className = `notice${error ? " error" : ""}`; }
function empty(container, text) { container.innerHTML = `<p class="empty">${text}</p>`; }
function resetDeadline() {
    $("deadline-form").reset(); $("deadline-id").value = ""; $("deadline-submit").textContent = "Tambah deadline"; $("deadline-cancel").hidden = true;
}

function renderDeadlines(snapshot) {
    $("deadline-count").textContent = `${snapshot.size} item`;
    const container = $("deadline-items"); container.innerHTML = "";
    if (!snapshot.size) return empty(container, "Belum ada data deadline.");
    snapshot.forEach((entry) => {
        const data = entry.data();
        container.insertAdjacentHTML("beforeend", `<article class="item"><div><strong>${data.course}${data.label ? ` · ${data.label}` : ""}</strong><small>${data.date} · ${data.time}</small></div><div class="item-actions"><button data-edit="${entry.id}" class="secondary">Edit</button><button data-delete="${entry.id}" class="danger">Hapus</button></div></article>`);
    });
}

function renderActivities(snapshot) {
    $("activity-count").textContent = `${snapshot.size} foto`;
    const container = $("activity-items"); container.innerHTML = "";
    if (!snapshot.size) return empty(container, "Belum ada foto aktivitas.");
    snapshot.forEach((entry) => {
        const data = entry.data();
        container.insertAdjacentHTML("beforeend", `<article class="activity-item"><img src="${data.imageUrl}" alt="${data.title}"><div><strong>${data.title}</strong><button data-activity-delete="${entry.id}" data-storage-path="${data.storagePath}" class="danger">Hapus foto</button></div></article>`);
    });
}

if (!configured) {
    message("Isi konfigurasi Firebase di assets/js/firebase-config.js sebelum digunakan.", true);
} else {
    const app = initializeApp(firebaseConfig); db = (await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")).getFirestore(app);
    const auth = getAuth(app);
    message(`Konfigurasi panel mengarah ke Firebase project: ${firebaseConfig.projectId}`);
    onAuthStateChanged(auth, (user) => {
        $("auth-card").hidden = Boolean(user); $("panel").hidden = !user;
        if (user) {
            message(`Terhubung sebagai ${user.email}`);
            onSnapshot(query(collection(db, "deadlines"), orderBy("date", "asc")), renderDeadlines, () => message("Gagal membaca deadline.", true));
            onSnapshot(query(collection(db, "activities"), orderBy("createdAt", "desc")), renderActivities, () => message("Gagal membaca galeri.", true));
        }
    });
    $("logout").addEventListener("click", () => signOut(auth));
    $("deadline-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = { course: $("course").value.trim(), label: $("label").value.trim(), date: $("date").value, time: $("time").value, updatedAt: serverTimestamp() };
        try {
            const id = $("deadline-id").value;
            if (id) await updateDoc(doc(db, "deadlines", id), data); else await addDoc(collection(db, "deadlines"), { ...data, createdAt: serverTimestamp() });
            resetDeadline(); message("Deadline berhasil disimpan.");
        } catch (error) { message(`Gagal menyimpan deadline: ${error.message}`, true); }
    });
    $("deadline-cancel").addEventListener("click", resetDeadline);
    $("deadline-items").addEventListener("click", async (event) => {
        const editId = event.target.dataset.edit; const deleteId = event.target.dataset.delete;
        if (editId) {
            const snapshot = await (await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")).getDoc(doc(db, "deadlines", editId)); const data = snapshot.data();
            $("deadline-id").value = editId; $("course").value = data.course; $("label").value = data.label || ""; $("date").value = data.date; $("time").value = data.time; $("deadline-submit").textContent = "Simpan perubahan"; $("deadline-cancel").hidden = false;
        }
        if (deleteId && confirm("Hapus deadline ini?")) await deleteDoc(doc(db, "deadlines", deleteId));
    });
    $("activity-form").addEventListener("submit", async (event) => {
        event.preventDefault(); const file = $("activity-file").files[0];
        if (!file || file.size > 5 * 1024 * 1024) return message("Pilih gambar maksimal 5 MB.", true);
        try {
            if (cloudinaryConfig.cloudName.startsWith("YOUR_") || cloudinaryConfig.uploadPreset.startsWith("YOUR_")) return message("Isi konfigurasi Cloudinary terlebih dahulu.", true);
            const body = new FormData(); body.append("file", file); body.append("upload_preset", cloudinaryConfig.uploadPreset); body.append("folder", "kelas-2ka22/activities");
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, { method: "POST", body });
            if (!response.ok) throw new Error("Upload Cloudinary gagal.");
            const uploaded = await response.json();
            await addDoc(collection(db, "activities"), { title: $("activity-title").value.trim(), description: $("activity-description").value.trim(), imageUrl: uploaded.secure_url, storagePath: uploaded.public_id, createdAt: serverTimestamp() });
            $("activity-form").reset(); message("Foto berhasil diunggah.");
        } catch (error) { message(`Gagal mengunggah foto: ${error.message}`, true); }
    });
    $("activity-items").addEventListener("click", async (event) => {
        const id = event.target.dataset.activityDelete; if (!id || !confirm("Hapus foto ini?")) return;
        try { await deleteDoc(doc(db, "activities", id)); message("Foto dihapus dari website utama."); } catch (error) { message(`Gagal menghapus foto: ${error.message}`, true); }
    });
}
