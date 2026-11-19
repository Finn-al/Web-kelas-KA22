# Web Kelas 2KA22

Website utama berada di root, sedangkan panel pengelola terpisah di [admin/](admin/).

## Setup Firebase

1. Buat project Firebase, aktifkan Firestore dan Authentication Email/Password.
2. Salin konfigurasi Web App ke `assets/js/firebase-config.js`.
3. Buat akun pengelola pada Firebase Authentication, lalu gunakan akun itu di panel.
4. Buat akun Cloudinary gratis, buat **unsigned upload preset**, lalu isi `assets/js/cloudinary-config.js`.
5. Jalankan melalui web server lokal (contoh: Live Server), bukan `file://`.

Login dari `login.html` memakai email/password Firebase dan setelah berhasil langsung membuka panel pengelola. Halaman `/admin/` juga menyediakan tautan menuju login utama.

Koleksi Firestore:

- `deadlines`: `course`, `label`, `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `createdAt`, `updatedAt`.
- `activities`: `title`, `description`, `imageUrl`, `storagePath` (Cloudinary public ID), `createdAt`.
- `team`: profil pengurus dengan `name`, `role`, `description`, `buttonText`, `order`, `featured`, `imageUrl`, `imagePublicId`.
- `aspirations`: masukan publik dengan `name`, `email`, `message`, `createdAt`. Panel menampilkan dan dapat menghapus pesan.

Struktur kelas selalu berisi tiga profil tetap: PA, ketua kelas, dan sekretaris. Panel hanya mengubah foto, nama, serta deskripsi; jabatan dan susunan kartu tidak dapat ditambah atau dihapus. Saat panel dibuka, profil awal yang belum ada akan ditambahkan tanpa menimpa nama, deskripsi, atau foto yang sudah tersimpan. Foto profil dan foto aktivitas diunggah ke Cloudinary; penghapusan foto dari panel menghapus metadata Firestore, sedangkan penghapusan file Cloudinary permanen memerlukan server-side API.

Atur dan publish Firestore Rules berikut agar pengunjung dapat mengirim aspirasi, sementara hanya pengguna yang login dapat membacanya atau mengelola konten:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /deadlines/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /activities/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /team/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /aspirations/{id} {
      allow create: if request.resource.data.keys().hasOnly(['name', 'email', 'message', 'createdAt'])
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 100
        && request.resource.data.email is string
        && request.resource.data.email.size() <= 150
        && request.resource.data.message is string
        && request.resource.data.message.size() > 0
        && request.resource.data.message.size() <= 2000
        && request.resource.data.createdAt == request.time;
      allow read, delete: if request.auth != null;
      allow update: if false;
    }
  }
}
```
