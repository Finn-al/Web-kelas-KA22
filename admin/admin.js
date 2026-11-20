import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query,
    serverTimestamp, setDoc, updateDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../assets/js/firebase-config.js";
import { cloudinaryConfig } from "../assets/js/cloudinary-config.js";

const $ = (id) => document.getElementById(id);
const configured = !firebaseConfig.apiKey.startsWith("YOUR_");
const status = $("status");
const teamDataById = new Map();
const teamProfiles = [
    {
        id: "dosen-pa", name: "Maria Y Aryati Wahyuningrum", role: "Dosen Pembimbing Akademik (PA)",
        description: "Mendampingi mahasiswa dalam proses akademik dan membantu merencanakan studi agar berjalan efektif dan terarah.",
        buttonText: "Kontak PA", order: 1, featured: false
    },
    {
        id: "ketua-kelas", name: "Alisya", role: "Ketua Kelas",
        description: "Mengkoordinasikan kegiatan kelas dan menjadi penghubung komunikasi antara dosen dan mahasiswa.",
        buttonText: "Lihat Profil", order: 2, featured: true
    },
    {
        id: "sekretaris", name: "- & -", role: "Sekretaris",
        description: "Mengelola administrasi, membantu menyiapkan rapat, serta mencatat dan mendokumentasikan informasi serta kegiatan kelas.",
        buttonText: "Detail", order: 3, featured: false
    }
];
let db;
let activeSubscriptions = [];

function message(text, error = false) { status.textContent = text; status.className = `notice${error ? " error" : ""}`; }
function empty(container, text) { container.innerHTML = `<p class="empty">${escapeHtml(text)}</p>`; }
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
function resetDeadline() {
    $("deadline-form").reset(); $("deadline-id").value = ""; $("deadline-submit").textContent = "Tambah deadline"; $("deadline-cancel").hidden = true;
}
function resetTeam() {
    $("team-form").reset(); $("team-id").value = ""; $("team-form").hidden = true;
}
function formatCreatedAt(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== "function") return "Waktu tidak tersedia";
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(timestamp.toDate());
}
function getDeadlineFields(data) {
    return {
        course: data.course || data.subject || data.mataKuliah || data.title || data.name || "",
        label: data.label || data.type || "",
        date: data.date || data.tanggal || "",
        time: data.time || data.jam || ""
    };
}
function deadlineInputDate(value) {
    if (value && typeof value.toDate === "function") return value.toDate().toISOString().slice(0, 10);
    return String(value || "").slice(0, 10);
}

function renderDeadlines(snapshot) {
    $("deadline-count").textContent = `${snapshot.size} item`;
    const syncStatus = $("deadline-sync-status");
    if (syncStatus) {
        syncStatus.className = "sync-status";
        syncStatus.textContent = snapshot.size
            ? `Terhubung ke ${firebaseConfig.projectId}: ${snapshot.size} dokumen deadline.`
            : `Terhubung ke ${firebaseConfig.projectId}, tetapi collection deadlines kosong.`;
    }
    const container = $("deadline-items"); container.innerHTML = "";
    if (!snapshot.size) return empty(container, "Belum ada data deadline.");
    const entries = snapshot.docs.slice().sort((left, right) => {
        const a = getDeadlineFields(left.data());
        const b = getDeadlineFields(right.data());
        return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
    });
    entries.forEach((entry) => {
        const data = getDeadlineFields(entry.data());
        container.insertAdjacentHTML("beforeend", `<article class="item"><div><strong>${escapeHtml(data.course || "Deadline tanpa nama")}${data.label ? ` · ${escapeHtml(data.label)}` : ""}</strong><small>${escapeHtml(data.date || "Tanggal belum diisi")} · ${escapeHtml(data.time || "Jam belum diisi")}</small></div><div class="item-actions"><button data-edit="${escapeHtml(entry.id)}" class="secondary">Edit</button><button data-delete="${escapeHtml(entry.id)}" class="danger">Hapus</button></div></article>`);
    });
}

function renderActivities(snapshot) {
    $("activity-count").textContent = `${snapshot.size} foto`;
    const container = $("activity-items"); container.innerHTML = "";
    if (!snapshot.size) return empty(container, "Belum ada foto aktivitas.");
    snapshot.forEach((entry) => {
        const data = entry.data();
        const imageUrl = safeImageUrl(data.imageUrl);
        container.insertAdjacentHTML("beforeend", `<article class="activity-item">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(data.title)}">` : ""}<div><strong>${escapeHtml(data.title)}</strong><button data-activity-delete="${escapeHtml(entry.id)}" class="danger">Hapus dari galeri</button></div></article>`);
    });
}

function renderTeam(snapshot) {
    $("team-count").textContent = "3 profil tetap";
    const container = $("team-items"); container.innerHTML = ""; teamDataById.clear();
    const records = new Map((snapshot?.docs || []).map((entry) => [entry.id, entry.data()]));
    teamProfiles.forEach((profile) => {
        const data = { ...profile, ...(records.get(profile.id) || {}) };
        teamDataById.set(profile.id, data);
        const imageUrl = safeImageUrl(data.imageUrl);
        container.insertAdjacentHTML("beforeend", `<article class="item">${imageUrl ? `<img class="team-admin-avatar" src="${escapeHtml(imageUrl)}" alt="Foto ${escapeHtml(data.name)}">` : ""}<div><strong>${escapeHtml(data.name)}</strong><small>${escapeHtml(profile.role)}</small></div><div class="item-actions"><button data-team-edit="${escapeHtml(profile.id)}" class="secondary">Ubah</button></div></article>`);
    });
}

function renderAspirations(snapshot) {
    $("aspiration-count").textContent = `${snapshot.size} pesan`;
    const container = $("aspiration-items"); container.innerHTML = "";
    if (!snapshot.size) return empty(container, "Belum ada aspirasi yang masuk.");
    snapshot.forEach((entry) => {
        const data = entry.data();
        container.insertAdjacentHTML("beforeend", `<article class="item item--aspiration"><div><strong>${escapeHtml(data.name)}</strong><small>${escapeHtml(data.email)} · ${escapeHtml(formatCreatedAt(data.createdAt))}</small><p>${escapeHtml(data.message)}</p></div><div class="item-actions"><button data-aspiration-delete="${escapeHtml(entry.id)}" class="danger">Hapus</button></div></article>`);
    });
}

async function uploadImage(file) {
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("Pilih gambar JPG, PNG, atau WEBP.");
    }
    if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 5 MB.");
    if (cloudinaryConfig.cloudName.startsWith("YOUR_") || cloudinaryConfig.uploadPreset.startsWith("YOUR_")) {
        throw new Error("Isi konfigurasi Cloudinary terlebih dahulu.");
    }

    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", cloudinaryConfig.uploadPreset);
    body.append("folder", "kelas-2ka22");
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, { method: "POST", body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Upload Cloudinary gagal.");
    return { imageUrl: result.secure_url, publicId: result.public_id };
}

async function initializeTeamDefaults() {
    const current = await getDocs(collection(db, "team"));
    const existingById = new Map(current.docs.map((entry) => [entry.id, entry]));
    const batch = writeBatch(db);
    let hasChanges = false;
    teamProfiles.forEach((profile) => {
        const existing = existingById.get(profile.id);
        if (existing) {
            const data = existing.data();
            if (data.role !== profile.role || data.buttonText !== profile.buttonText
                || data.order !== profile.order || data.featured !== profile.featured) {
                batch.update(doc(db, "team", profile.id), {
                    role: profile.role, buttonText: profile.buttonText,
                    order: profile.order, featured: profile.featured,
                    updatedAt: serverTimestamp()
                });
                hasChanges = true;
            }
            return;
        }

        const matchingRole = current.docs.find((entry) =>
            String(entry.data().role || "").trim().toLocaleLowerCase() === profile.role.toLocaleLowerCase()
        );
        const existingData = matchingRole ? matchingRole.data() : {};
        batch.set(doc(db, "team", profile.id), {
            ...profile,
            name: existingData.name || profile.name,
            description: existingData.description || profile.description,
            imageUrl: existingData.imageUrl || "",
            imagePublicId: existingData.imagePublicId || "",
            createdAt: existingData.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        hasChanges = true;
    });
    if (hasChanges) await batch.commit();
}

if (!configured) {
    message("Isi konfigurasi Firebase di assets/js/firebase-config.js sebelum digunakan.", true);
} else {
    const app = initializeApp(firebaseConfig);
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    db = getFirestore(app);
    const auth = getAuth(app);

    message(`Konfigurasi panel mengarah ke Firebase project: ${firebaseConfig.projectId}`);
    onAuthStateChanged(auth, async (user) => {
        activeSubscriptions.forEach((unsubscribe) => unsubscribe());
        activeSubscriptions = [];
        $("auth-card").hidden = Boolean(user); $("panel").hidden = !user;
        if (!user) return;

        message(`Terhubung sebagai ${user.email}`);
        renderTeam({ docs: [] });
        activeSubscriptions = [
            onSnapshot(collection(db, "deadlines"), renderDeadlines, (error) => {
                const syncStatus = $("deadline-sync-status");
                if (syncStatus) {
                    syncStatus.className = "sync-status error";
                    syncStatus.textContent = `Gagal membaca deadlines dari ${firebaseConfig.projectId}: ${error.code || error.message}. Periksa Firestore Rules.`;
                }
                message(`Gagal membaca deadline (${error.code || "error"}). Periksa Firestore Rules.`, true);
            }),
            onSnapshot(query(collection(db, "activities"), orderBy("createdAt", "desc")), renderActivities, () => message("Gagal membaca galeri. Periksa Firestore Rules.", true)),
            onSnapshot(query(collection(db, "team"), orderBy("order", "asc")), renderTeam, () => message("Gagal membaca struktur kelas. Periksa Firestore Rules.", true)),
            onSnapshot(query(collection(db, "aspirations"), orderBy("createdAt", "desc")), renderAspirations, () => message("Gagal membaca aspirasi. Periksa Firestore Rules.", true))
        ];
        initializeTeamDefaults().catch((error) => {
            message(`Gagal menyiapkan data struktur kelas: ${error.message}`, true);
        });
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
        const button = event.target.closest("button");
        if (!button) return;
        const editId = button.dataset.edit;
        const deleteId = button.dataset.delete;
        try {
            if (editId) {
                const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
                const snapshot = await getDoc(doc(db, "deadlines", editId)); const data = getDeadlineFields(snapshot.data() || {});
                $("deadline-id").value = editId; $("course").value = data.course; $("label").value = data.label; $("date").value = deadlineInputDate(data.date); $("time").value = data.time; $("deadline-submit").textContent = "Simpan perubahan"; $("deadline-cancel").hidden = false;
            }
            if (deleteId && confirm("Hapus deadline ini?")) {
                button.disabled = true;
                await deleteDoc(doc(db, "deadlines", deleteId));
                message("Deadline berhasil dihapus.");
            }
        } catch (error) {
            if (deleteId) button.disabled = false;
            const reason = error.code === "permission-denied"
                ? "Firestore menolak penghapusan. Pastikan Rules deadlines mengizinkan write untuk pengguna login."
                : error.message;
            message(`Gagal mengelola deadline (${error.code || "error"}): ${reason}`, true);
        }
    });

    $("activity-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const file = $("activity-file").files[0];
            const uploaded = await uploadImage(file);
            await addDoc(collection(db, "activities"), {
                title: $("activity-title").value.trim(),
                description: $("activity-description").value.trim(),
                imageUrl: uploaded.imageUrl, storagePath: uploaded.publicId, createdAt: serverTimestamp()
            });
            $("activity-form").reset(); message("Foto aktivitas berhasil diunggah.");
        } catch (error) { message(`Gagal mengunggah foto aktivitas: ${error.message}`, true); }
    });
    $("activity-items").addEventListener("click", async (event) => {
        const id = event.target.dataset.activityDelete; if (!id || !confirm("Hapus foto ini dari website?")) return;
        try { await deleteDoc(doc(db, "activities", id)); message("Foto dihapus dari galeri website."); } catch (error) { message(`Gagal menghapus foto: ${error.message}`, true); }
    });

    $("team-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const id = $("team-id").value;
        if (!teamProfiles.some((profile) => profile.id === id)) return message("Pilih salah satu dari tiga profil pengurus.", true);
        try {
            const previous = id ? teamDataById.get(id) : null;
            const file = $("team-file").files[0];
            const uploaded = file ? await uploadImage(file) : null;
            const data = {
                name: $("team-name").value.trim(),
                description: $("team-description").value.trim(),
                imageUrl: uploaded?.imageUrl || previous?.imageUrl || "",
                imagePublicId: uploaded?.publicId || previous?.imagePublicId || "",
                updatedAt: serverTimestamp()
            };
            const profile = teamProfiles.find((entry) => entry.id === id);
            await setDoc(doc(db, "team", id), {
                ...data,
                role: previous?.role || profile.role,
                buttonText: previous?.buttonText || profile.buttonText,
                order: previous?.order || profile.order,
                featured: previous?.featured ?? profile.featured,
                createdAt: previous?.createdAt || serverTimestamp()
            }, { merge: true });
            resetTeam(); message("Profil struktur kelas berhasil disimpan.");
        } catch (error) { message(`Gagal menyimpan profil: ${error.message}`, true); }
    });
    $("team-cancel").addEventListener("click", resetTeam);
    $("team-items").addEventListener("click", async (event) => {
        const editId = event.target.dataset.teamEdit;
        if (editId) {
            const data = teamDataById.get(editId);
            if (!data) return;
            $("team-id").value = editId; $("team-name").value = data.name || "";
            $("team-description").value = data.description || "";
            $("team-editor-role").textContent = teamProfiles.find((profile) => profile.id === editId).role;
            $("team-form").hidden = false;
        }
    });

    $("aspiration-items").addEventListener("click", async (event) => {
        const id = event.target.dataset.aspirationDelete; if (!id || !confirm("Hapus aspirasi ini?")) return;
        try { await deleteDoc(doc(db, "aspirations", id)); message("Aspirasi berhasil dihapus."); }
        catch (error) { message(`Gagal menghapus aspirasi: ${error.message}`, true); }
    });
}
