# Web Kelas 2KA22

Website utama berada di root, sedangkan panel pengelola terpisah di [admin/](admin/).

## Setup Firebase

1. Buat project Firebase, aktifkan Firestore dan Authentication Email/Password.
2. Salin konfigurasi Web App ke `assets/js/firebase-config.js`.
3. Buat akun pengelola pada Firebase Authentication, lalu gunakan akun itu di panel.
4. Buat akun Cloudinary gratis, buat **unsigned upload preset**, lalu isi `assets/js/cloudinary-config.js`.
5. Jalankan melalui web server lokal (contoh: Live Server), bukan `file://`.

Login dari `login.html` memakai email/password Firebase. Untuk membuka panel, masuk melalui `admin/` lalu gunakan tautan login; sesudah autentikasi berhasil, pengguna akan diarahkan kembali ke panel.

Koleksi Firestore:

- `deadlines`: `course`, `label`, `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `createdAt`, `updatedAt`.
- `activities`: `title`, `description`, `imageUrl`, `storagePath` (Cloudinary public ID), `createdAt`.

Panel memakai listener `onSnapshot`, sehingga perubahan deadline dan foto diteruskan ke website utama tanpa refresh. Foto dihapus dari galeri Firestore; penghapusan file Cloudinary permanen memerlukan server-side API karena Cloudinary tidak mengizinkan secret key di browser. Terapkan Firebase Security Rules yang membatasi penulisan hanya untuk pengguna yang sudah login.
