# Laporan Evaluasi Singkat

## Ringkasan Hasil

Aplikasi **Perpustakaan Sekolah Digital** telah berhasil dikembangkan sesuai
specifikasi (flowmap resmi dan matriks fitur). Seluruh alur sistem terimplementasi:

- ✅ Login dengan dua peran (Admin & Siswa) + role-based access control.
- ✅ Dashboard terpisah untuk Admin dan Siswa.
- ✅ CRUD lengkap: Buku, Anggota, dan Transaksi (Peminjaman/Pengembalian).
- ✅ Registrasi anggota (Daftar).
- ✅ Pencarian tersedia di sisi Admin (buku, anggota, transaksi) & Siswa (katalog, riwayat).
- ✅ Koneksi database (Supabase/PostgreSQL) dengan relasi & constraint yang wajar.
- ✅ Rating bintang 1–5 oleh siswa (hanya untuk buku yang sudah dikembalikan) + deskripsi/inti buku pada katalog & halaman detail.
- ✅ Denda keterlambatan (Rp 10.000/hari) & denda rusak/hilang (Rp 5.000.000) dengan pembayaran Cash/QRIS/Transfer (barcode & rekening contoh).
- ✅ Statistik & grafik peminjaman (Chart.js) khusus admin: peminjaman 7 & 14 hari, status transaksi, top 10 buku & anggota, kategori, ringkasan denda, dan tabel "Siapa yang Sedang Meminjam Buku".
- ✅ Dokumentasi lengkap: ERD, deskripsi program, dokumentasi fungsi, catatan debugging.

### Hasil Uji

- **Template EJS:** 19/19 template berhasil dirender (skrip `scripts/test-templates.mjs`).
- **Modul/server:** Termuat tanpa syntax error.
- **Uji runtime (Supabase asli):** login admin & siswa, semua halaman admin 200, grafik & tabel peminjam aktif dirender, dan siswa **diblokir (302 → login)** terhadap semua route `/admin/*` (RBAC).

## Kendala

1. **MySQL tidak tersedia** di environment; diganti **Supabase (PostgreSQL)**
   atas permintaan user karena ingin di-deploy ke Vercel.
2. **Migrasi skema** (menambah kolom/tabel baru seperti rating, sampul, denda,
   dll.) tidak bisa dijalankan dari aplikasi karena memakai anon key; dijalankan
   manual oleh user di Supabase SQL Editor.

## Rekomendasi Pengembangan Lanjutan

1. **Notifikasi** pengingat tenggat pengembalian (email/WhatsApp).
2. **Upload cover buku** (stored di Supabase Storage) untuk tampilan katalog lebih menarik.
3. **Halaman profil** untuk siswa mengubah data diri/password.
4. **Manajemen admin multi-user** dan pemisahan hak akses lebih granular.
5. **Moderasi rating** — halaman admin untuk melihat/menghapus rating yang tidak wajar.

## Kesimpulan

Aplikasi sudah memenuhi keseluruhan kebutuhan fungsional uji kompetensi RPL.
Seluruh fitur inti (autentikasi berperan, CRUD, transaksi peminjaman/pengembalian,
pencarian, rating & deskripsi, denda & pembayaran, serta statistik/grafik admin)
telah tersedia dengan basis data ber-relasi dan akses berbasis peran, dan telah
diuji end-to-end terhadap Supabase asli sebelum di-deploy ke Vercel.
