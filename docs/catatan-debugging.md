# Catatan Debugging

Berikut adalah bug/kendala yang ditemukan selama pengembangan beserta cara
perbaikannya.

## Bug yang Ditemukan & Perbaikannya

### 1. Error `Cannot use import statement outside a module` saat menjalankan server
- **Gejala:** `node src/server.js` gagal dengan `SyntaxError: Cannot use import statement outside a module`.
- **Penyebab:** Kode memakai ESM `import`, tetapi `package.json` masih ber-`"type": "commonjs"`.
- **Solusi:** Mengubah `"type": "commonjs"` menjadi `"type": "module"` di `package.json`.
- **Hasil:** Server berhasil memuat modul (konfirmasi: modul `@supabase/supabase-js` termuat; error berikut adalah karena kredensial belum disetel, bukan syntax).

### 2. `supabaseUrl is required` saat startup tanpa kredensial
- **Gejala:** Server crash dengan `Error: supabaseUrl is required.`.
- **Penyebab:** `createClient` dipanggil saat import modul `config/db.js` tanpa nilai env `SUPABASE_URL`/`SUPABASE_ANON_KEY`.
- **Solusi:** Menyediakan `.env` berisi kredensial; menyediakan `.env.example`. Di produksi (Vercel) env disetel di dashboard.
- **Catatan:** Ini perilaku yang diharapkan — aplikasi tidak bisa berjalan tanpa koneksi Supabase.

### 3. Pencarian khusus kondisi pada transaksi (admin & riwayat siswa)
- **Gejala:** Awalnya pencarian hanya berdasar status, tidak mendukung pencarian ID.
- **Solusi:** Menambahkan deteksi apakah input berupa angka → memakai `eq('id', ...)`; selain itu → `or(status...)`. Karena Supabase JS menggabungkan filter dengan AND, kombinasi tetap valid.

### 4. Template tidak dirender (empty / undefined)
- **Gejala:** Beberapa view menampilkan variabel yang tidak didefinisikan di context.
- **Solusi:** Dibuat skrip `scripts/test-templates.mjs` yang me-render semua template EJS dengan data contoh untuk memastikan tidak ada error/syntax. Hasil: 14/14 template lolos.

### 5. Penghapusan buku/anggota yang masih berstatus dipinjam
- **Gejala:** Menghapus buku yang sedang dipinjam bisa membuat data transaksi tidak konsisten.
- **Solusi:** Sebelum `delete`, cek transaksi ber-status 'dipinjam' yang menunjuk ke buku/anggota tsb. Jika ada, tolak dengan pesan error.

### 6. Konsistensi stok buku
- **Gejala:** Risiko stok bisa berkurang/bertambah tidak akurat bila transaksi dihapus atau kembali.
- **Solusi:** Peminjaman → stok -1; pengembalian → stok +1; penghapusan transaksi ber-status 'dipinjam' → stok +1 terlebih dahulu.

### 7. Double peminjaman buku yang sama
- **Gejala:** Buku yang sudah dipinjam bisa dipinjam lagi oleh orang lain.
- **Solusi:** Query memeriksa ada/tidaknya transaksi ber-status 'dipinjam' untuk `id_buku` tsb; jika ada, tolak peminjaman.

### 8. Role-Based Access Control
- **Gejala:** Awalnya route tidak membedakan admin dan siswa dengan tegas.
- **Solusi:** Middleware `isAdmin` / `isSiswa` diterapkan pada seluruh route grup (`router.use(isAdmin)`), sehingga siswa tidak bisa mengakses `/admin/*` dan sebaliknya.
- **Verifikasi:** Semua route `/admin/*` (dashboard, buku, anggota, transaksi, denda, statistik, laporan) mengembalikan **302** ketika diakses sesi siswa.

## Prosedur Verifikasi

Untuk memastikan kualitas, dijalankan:
1. `node scripts/test-templates.mjs` → memastikan semua 19 template EJS bebas error.
2. Startup server (`node src/server.js`) → memastikan modul & rute termuat benar.
3. Uji runtime end-to-end terhadap Supabase asli (login, transaksi, denda, rating, RBAC) dengan skrip tes sekali pakai di `scripts/` (dihapus setelah dijalankan).
