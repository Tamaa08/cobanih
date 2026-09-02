# Dokumentasi Fungsi / Prosedur

Dokumentasi fungsi/endpoint penting pada aplikasi
**Perpustakaan Sekolah Digital**, dikelompokkan per modul.

---

## 1. Autentikasi

### `views` → controller `authController.js`

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showLogin` | GET `/login` | Merender halaman login. |
| `login` | POST `/login` | Menerima username & password, memverifikasi via tabel `users` dan mencocokkan `bcrypt`. Berhasil → buat sesi & redirect sesuai role. Gagal → kembali ke login dengan pesan error. |
| `logout` | POST `/logout` | Menghancurkan sesi dan mengarahkan ke `/login`. |

### `authRegisterController.js`

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showRegister` | GET `/register` | Merender form pendaftaran. |
| `register` | POST `/register` | Validasi form, cek duplikat username & NIS, hash password, buat `users` (role=siswa) + baris `anggota`. |

### `middleware/auth.js`

| Fungsi | Deskripsi |
|---|---|
| `isAuthenticated` | Memastikan ada sesi user. |
| `isAdmin` | Memastikan sesi user ber-role `admin` (perlindungan route admin). |
| `isSiswa` | Memastikan sesi user ber-role `siswa` (perlindungan route user). |

---

## 2. Admin — Data Buku (`bukuController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showBuku` | GET `/admin/buku` | Menampilkan daftar buku + pencarian (judul/kategori/penulis). |
| `createBuku` | POST `/admin/buku` | Validasi, cek duplikat judul+penulis, lalu insert buku baru. |
| `renderEditBuku` | GET `/admin/buku/:id/edit` | Merender form edit dengan data buku terpilih. |
| `updateBuku` | POST `/admin/buku/:id/edit` | Mengupdate data buku berdasarkan id. |
| `deleteBuku` | POST `/admin/buku/:id/delete` | Menghapus buku; menolak jika buku sedang dipinjam ('dipinjam'). |

---

## 3. Admin — Kelola Anggota (`anggotaController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showAnggota` | GET `/admin/anggota` | Daftar anggota + pencarian (nama/NIS/kelas). |
| `createAnggota` | POST `/admin/anggota` | Validasi, cek duplikat NIS & username, hash password, buat user + anggota. |
| `renderEditAnggota` | GET `/admin/anggota/:id/edit` | Merender form edit anggota. |
| `updateAnggota` | POST `/admin/anggota/:id/edit` | Update nama, kelas, NIS, status anggota. |
| `deleteAnggota` | POST `/admin/anggota/:id/delete` | Hapus anggota; menolak jika masih meminjam buku; menghapus user terkait. |

---

## 4. Admin — Transaksi (`transaksiController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showTransaksi` | GET `/admin/transaksi` | Daftar transaksi + pencarian (ID/status) + data buku & anggota utk form. |
| `createPeminjamanAdmin` | POST `/admin/transaksi/peminjaman` | Validasi, cek stok & status dipinjam, insert transaksi, kurangi stok buku 1. |
| `updateStatusPengembalian` | POST `/admin/transaksi/:id/kembalikan` | Ubah status jadi 'dikembalikan', catat tanggal kembali aktual, tambah stok 1, dan otomatis membuat denda keterlambatan bila melewati jatuh tempo. |
| `deleteTransaksi` | POST `/admin/transaksi/:id/delete` | Hapus transaksi; jika 'dipinjam', stok dikembalikan dulu. |

---

## 4d. Admin — Statistik & Grafik (`statistikController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showStatistik` | GET `/admin/statistik` | Render dashboard grafik: 5 grafik Chart.js (peminjaman 14 hari, status transaksi donut, top 10 buku, top 10 anggota, kategori pie), statistik denda (lunas/belum bayar), dan tabel **"Siapa yang Sedang Meminjam Buku"** (peminjam, kelas/NIS, jatuh tempo, sisa hari, penanda terlambat). |

Halaman `/admin/*` bisa diakses role **admin** atau **petugas** (`middleware/auth.js` → `isStaff`). Khusus menu **Kelola Akun** (`/admin/akun`) hanya bisa diakses **admin**; akses siswa & petugas diarahkan kembali ke dashboard.

## 4c. Admin — Denda (`adminDendaController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showDenda` | GET `/admin/denda` | Daftar seluruh denda + filter status (semua/belum bayar/lunas) + data transaksi sudah dikembalikan untuk form denda rusak/hilang. |
| `createDendaRusakHilang` | POST `/admin/denda` | Membuat denda buku rusak/hilang (default Rp 5.000.000) untuk transaksi yang sudah dikembalikan; mencegah duplikat per transaksi. |
| `markDendaLunas` | POST `/admin/denda/:id/lunas` | Menandai denda lunas (pembayaran tunai ke admin). |
| `deleteDenda` | POST `/admin/denda/:id/delete` | Menghapus catatan denda. |

---

## 4b. Admin — Laporan Peminjaman (`laporanController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showLaporan` | GET `/admin/laporan` | Merender halaman form filter laporan (tanggal & status). |
| `generateLaporanPdf` | GET `/admin/laporan/pdf` | Query transaksi sesuai filter, generate PDF via `pdfkit`, kirim sebagai file download (`application/pdf`). Memuat header, ringkasan, tabel, dan tanda tangan. |

## 5. Admin — Dashboard (`dashboardController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showDashboardAdmin` | GET `/admin/dashboard` | Statistik (buku, anggota, dipinjam, dikembalikan) + grafik peminjaman 7 hari terakhir (Chart.js) + daftar **"Sedang Dipinjam Sekarang"** (siapa peminjam, sisa hari, penanda terlambat) + transaksi terbaru. |

---

## 6. Siswa — Dashboard (`userDashboardController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showDashboardUser` | GET `/user/dashboard` | Statistik peminjaman/kembali milik siswa + riwayat singkat. |

---

## 7. Siswa — Peminjaman (`userPeminjamanController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showPeminjamanBooking` | GET `/user/peminjaman` | Daftar buku tersedia (stok>0) + pencarian, beserta status sedang dipinjam. |
| `createPeminjamanUser` | POST `/user/peminjaman` | Cek keanggotaan aktif, stok, & keunikan peminjaman; insert transaksi (jatuh tempo +7 hari), kurangi stok. |

---

## 8. Siswa — Pengembalian (`userPengembalianController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showPengembalian` | GET `/user/pengembalian` | Menampilkan buku yang sedang dipinjam oleh siswa tsb. |
| `processPengembalian` | POST `/user/pengembalian/:id` | Memverifikasi kepemilikan transaksi, ubah status jadi 'dikembalikan', tambah stok, dan otomatis membuat denda keterlambatan bila melewati jatuh tempo (Rp 10.000/hari). |

---

## 8b. Siswa — Denda & Pembayaran (`userDendaController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showDendaUser` | GET `/user/denda` | Menampilkan daftar denda milik siswa (telat & rusak/hilang) beserta status & total belum bayar. |
| `showBayarDenda` | GET `/user/denda/:id/bayar` | Halaman pembayaran: pilih metode **Cash / QRIS / Transfer**; QRIS menampilkan barcode contoh & kode QRIS, Transfer menampilkan rekening contoh. |
| `prosesBayarDenda` | POST `/user/denda/:id/bayar` | Validasi kepemilikan denda & metode, tandai `lunas`, catat metode & waktu pembayaran. |

### `utils/fungsiDenda.js`

| Fungsi | Deskripsi |
|---|---|
| `hitungHariTelat` | Menghitung selisih hari antara `tanggal_kembali_aktual` dan jatuh tempo (min 0). |
| `buatDendaTelat` | Membuat baris denda `telat` (Rp 10.000/hari) bila keterlambatan > 0 hari. |
| `formatRupiah` | Memformat angka menjadi teks Rupiah. |

---

## 9. Siswa — Katalog & Riwayat (`userCariController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `showKatalog` | GET `/user/katalog` | Katalog buku + pencarian; menampilkan rating bintang, ringkasan deskripsi, dan status "sedang dipinjam". |
| `showBukuDetail` | GET `/user/buku/:id` | Detail buku (deskripsi lengkap, rating rata-rata, stok) + status rating pribadi & hak untuk menilai (hanya jika buku sudah dikembalikan). |
| `showRiwayat` | GET `/user/riwayat` | Riwayat transaksi pribadi + pencarian (ID/status). |

---

## 9b. Siswa — Rating Buku (`ratingController.js`)

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `rateBook` | POST `/user/rate` | Validasi anggota, pastikan siswa pernah mengembalikan buku tsb, simpan/pakai ulang penilaian 1–5 bintang (upsert `id_buku`+`id_anggota`), lalu hitung ulang `rating` (rata-rata) & `rating_count` pada tabel `buku`. |

---

## 10. Server & Konfigurasi

| File | Deskripsi |
|---|---|
| `src/server.js` | Inisialisasi Express, session, static, route, error 404, listen. |
| `src/config/db.js` | Membuat client Supabase dari env `SUPABASE_URL` & `SUPABASE_ANON_KEY`. |

## Catatan Keamanan

- Semua query memakai **Supabase JS client** (`from().insert/update/delete/select`) yang
  otomatis melakukan parameterization → **terhindar dari SQL injection**.
- Password selalu di-hash **bcrypt** sebelum disimpan.
- Pencarian memakai `ilike` dengan pola yang diescape; input tidak pernah digabung
  raw ke SQL string.
