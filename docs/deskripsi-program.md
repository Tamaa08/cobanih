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
4. **CRUD Data Buku** (khusus Admin) — tambah, lihat, ubah, hapus (termasuk sampul buku, deskripsi/inti buku, dan rating awal).
5. **CRUD Kelola Anggota** (khusus Admin).
6. **CRUD Transaksi** (Peminjaman / Pengembalian).
7. **Pencarian** (buku, anggota, transaksi) tersedia di kedua sisi.
8. **Role-Based Access Control** — siswa TIDAK dapat mengakses menu admin.
9. **Rating & Deskripsi Buku** — siswa dapat memberi nilai bintang 1–5 (hanya untuk buku yang sudah dikembalikan) dan melihat rating rata-rata serta ringkasan/inti buku di halaman detail/katalog.
10. **Denda** — siswa terlambat mengembalikan buku otomatis dikenakan **Rp 10.000 per hari**; buku rusak/hilang dikenakan **Rp 5.000.000** (dibuat admin). Denda muncul di akun siswa dan bisa dibayar dengan **Cash**, **QRIS**, atau **Transfer** (dengan tampilan barcode QRIS & rekening contoh).

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
   - **Buku:** judul, penulis, penerbit, tahun terbit, kategori, stok, lokasi,
     sampul buku, deskripsi/inti buku, dan rating awal.
   - **Anggota:** nama, kelas, NIS, username, password.
   - **Transaksi:** membuat peminjaman (pilih anggota + buku) & menandai
     pengembalian.
5. Halaman siswa menyediakan:
   - **Katalog & Peminjaman:** melihat buku tersedia (beserta rating bintang dan
     ringkasan deskripsi), klik "Pinjam" atau buka halaman Detail & Rating.
   - **Detail Buku:** deskripsi lengkap, rating rata-rata, form penilaian
     bintang 1–5 (hanya aktif bila buku sudah dikembalikan).
   - **Pengembalian:** melihat buku yang sedang dipinjam, klik "Kembalikan".
   - **Denda:** jika terlambat, otomatis muncul denda; siswa dapat membayar via
     Cash / QRIS / Transfer dan melihat status pembayaran.
   - **Riwayat:** menampilkan riwayat transaksi pribadi.
6. **Validasi bisnis:**
   - Menolak peminjaman bila stok habis / buku sedang dipinjam orang lain.
   - Menolak penghapusan buku/anggota yang masih memiliki peminjaman aktif.
   - Setiap peminjaman mengurangi stok; pengembalian menambah stok.
   - Pengembalian melewati jatuh tempo (7 hari) → denda otomatis
     Rp 10.000/hari; buku rusak/hilang → denda Rp 5.000.000 (oleh admin).

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
| GET | `/user/buku/:id` | Detail buku + form rating | Siswa |
| GET/POST | `/user/peminjaman` | Lihat / pinjam buku | Siswa |
| GET | `/user/pengembalian` | Daftar buku dipinjam | Siswa |
| POST | `/user/pengembalian/:id` | Proses pengembalian | Siswa |
| GET | `/user/riwayat` | Riwayat transaksi pribadi | Siswa |
| POST | `/user/rate` | Simpan rating bintang buku | Siswa |
| GET | `/user/denda` | Daftar denda siswa | Siswa |
| GET/POST | `/user/denda/:id/bayar` | Bayar denda (Cash/QRIS/Transfer) | Siswa |
| GET | `/admin/denda` | Daftar & kelola denda | Admin |
| POST | `/admin/denda` | Tambah denda rusak/hilang | Admin |
| POST | `/admin/denda/:id/lunas` | Tandai denda lunas | Admin |
