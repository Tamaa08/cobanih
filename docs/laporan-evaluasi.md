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
- ✅ Dokumentasi lengkap: ERD, deskripsi program, dokumentasi fungsi, catatan debugging.

### Hasil Uji

- **Template EJS:** 18/18 template berhasil dirender (skrip `scripts/test-templates.mjs`).
- **Modul/server:** Termuat tanpa syntax error (koneksi DB bergantung kredensial Supabase).

## Kendala

1. **MySQL tidak tersedia** di environment; diganti **Supabase (PostgreSQL)**
   atas permintaan user karena ingin di-deploy ke Vercel.
2. **Testing runtime penuh** (login, CRUD, transaksi) membutuhkan kredensial
   Supabase yang nyata — belum ada di environment, sehingga verifikasi dilakukan
   lewat render template dan review logika controller secara manual.

## Rekomendasi Pengembangan Lanjutan

1. **Testing otomatis end-to-end** sekali kredensial Supabase tersedia
   (mis. memakai Supabase Local / container) untuk menyetujui alur lengkap.
2. **Denda keterlambatan** — hitung otomatis denda bila melewati tanggal jatuh tempo.
3. **Notifikasi** pengingat tenggat pengembalian (email/WhatsApp).
4. **Riwayat lengkap & laporan** — ekspor statistik peminjaman per periode.
5. **Upload cover buku** (stored di Supabase Storage) untuk tampilan katalog lebih menarik.
6. **Halaman profil** untuk siswa mengubah data diri/password.
7. **Manajemen admin multi-user** dan pemisahan hak akses lebih granular.
8. **Moderasi rating** — halaman admin untuk melihat/menghapus rating yang tidak wajar.

## Kesimpulan

Aplikasi sudah memenuhi keseluruhan kebutuhan fungsional uji kompetensi RPL.
Seluruh fitur inti (autentikasi berperan, CRUD, transaksi peminjaman/pengembalian,
dan pencarian) telah tersedia dengan basis data ber-relasi dan akses berbasis peran.
Tinggal dihubungkan ke Supabase via environment variables lalu di-deploy ke Vercel.
