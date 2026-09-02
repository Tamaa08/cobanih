# Deskripsi Program

## Tujuan

Aplikasi **Perpustakaan Sekolah Digital** (berbasis web) bertujuan memudahkan
siswa dan admin sekolah dalam mengelola proses **peminjaman dan pendataan buku**
secara terstruktur dan digital. Aplikasi menggantikan pencatatan manual (buku
besar/pustaka fisik) dengan sistem digital yang meliputi manajemen data buku,
keanggotaan siswa, transaksi peminjaman, dan pengembalian buku.

## Fitur Utama

1. **Autentikasi (Login)** — dua peran: **Admin** dan **Siswa/User**.
2. **Registrasi Anggota (Daftar)** — calon siswa dapat membuat akun sendiri.
3. **Dashboard terpisah** untuk Admin dan Siswa.
4. **CRUD Data Buku** (khusus Admin) — tambah, lihat, ubah, hapus.
5. **CRUD Kelola Anggota** (khusus Admin).
6. **CRUD Transaksi** (Peminjaman / Pengembalian).
7. **Pencarian** (buku, anggota, transaksi) tersedia di kedua sisi.
8. **Role-Based Access Control** — siswa TIDAK dapat mengakses menu admin.

## Alur Sistem (Flowmap)

### Admin
```
Login (admin) → Dashboard Admin
  → Kelola Data Buku (CRUD) ─┐
  → Transaksi (CRUD)         ├─→ kembali ke menu (loop) → Logout
  → Kelola Anggota (CRUD)   ─┘
```

### Siswa/User
```
Belum anggota? → Daftar Anggota → Login
Sudah anggota? → Login → Dashboard Siswa
  → Peminjaman Buku ─┐
  → Pengembalian     ├─→ kembali ke menu (loop) → Logout
```

## Cara Kerja Umum

1. **Halaman Login** menerima `username` & `password`. Sistem memverifikasi
   kredensial terhadap tabel `users`, mencocokkan hash `bcrypt`. Jika cocok,
   sesi dibuat (`express-session`) dengan data user termasuk `role`.
2. Berdasarkan `role`, sistem mengarahkan ke **Dashboard Admin** atau
   **Dashboard Siswa**.
3. Semua route `/admin/*` dilindungi middleware `isAdmin`; route `/user/*`
   dilindungi `isSiswa`. User yang tidak berhak akan dilempar kembali ke login.
4. Halaman admin menyediakan form CRUD:
   - **Buku:** judul, penulis, penerbit, tahun terbit, kategori, stok, lokasi.
   - **Anggota:** nama, kelas, NIS, username, password.
   - **Transaksi:** membuat peminjaman (pilih anggota + buku) & menandai
     pengembalian.
5. Halaman siswa menyediakan:
   - **Katalog & Peminjaman:** melihat buku tersedia, klik "Pinjam".
   - **Pengembalian:** melihat buku yang sedang dipinjam, klik "Kembalikan".
   - **Riwayat:** menampilkan riwayat transaksi pribadi.
6. **Validasi bisnis:**
   - Menolak peminjaman bila stok habis / buku sedang dipinjam orang lain.
   - Menolak penghapusan buku/anggota yang masih memiliki peminjaman aktif.
   - Setiap peminjaman mengurangi stok; pengembalian menambah stok.

## Endpoint / Route Ringkas

| Method | Route | Fungsi | Akses |
|---|---|---|---|
| GET | `/login` | Halaman login | Publik |
| POST | `/login` | Proses login | Publik |
| GET | `/register` | Halaman daftar anggota | Publik |
| POST | `/register` | Proses pendaftaran | Publik |
| POST | `/logout` | Keluar sesi | Auth |
| GET | `/admin/dashboard` | Dashboard admin | Admin |
| GET/POST | `/admin/buku` | Lihat / tambah buku | Admin |
| GET/POST | `/admin/buku/:id/edit` | Form / proses edit buku | Admin |
| POST | `/admin/buku/:id/delete` | Hapus buku | Admin |
| GET/POST | `/admin/anggota` | Lihat / tambah anggota | Admin |
| GET/POST | `/admin/anggota/:id/edit` | Edit anggota | Admin |
| POST | `/admin/anggota/:id/delete` | Hapus anggota | Admin |
| GET | `/admin/transaksi` | Daftar transaksi | Admin |
| POST | `/admin/transaksi/peminjaman` | Buat peminjaman | Admin |
| POST | `/admin/transaksi/:id/kembalikan` | Proses pengembalian | Admin |
| POST | `/admin/transaksi/:id/delete` | Hapus transaksi | Admin |
| GET | `/admin/laporan` | Halaman form laporan | Admin |
| GET | `/admin/laporan/pdf` | Generate/download PDF laporan | Admin |
| GET | `/user/dashboard` | Dashboard siswa | Siswa |
| GET | `/user/katalog` | Katalog + pencarian buku | Siswa |
| GET/POST | `/user/peminjaman` | Lihat / pinjam buku | Siswa |
| GET | `/user/pengembalian` | Daftar buku dipinjam | Siswa |
| POST | `/user/pengembalian/:id` | Proses pengembalian | Siswa |
| GET | `/user/riwayat` | Riwayat transaksi pribadi | Siswa |
