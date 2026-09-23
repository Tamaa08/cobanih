-- ============================================================
-- Perbaikan: nilai status "menunggu_kembali" (15 karakter) tidak
-- muat di kolom status VARCHAR(15) pada tabel transaksi.
-- Diperluas menjadi VARCHAR(25) agar proses pengembalian siswa
-- (status menunggu_kembali) tidak gagal.
-- Jalankan di Supabase Dashboard -> SQL Editor (sekali saja).
-- ============================================================

ALTER TABLE public.transaksi ALTER COLUMN status TYPE VARCHAR(25);

-- Pastikan constraint mengizinkan semua status yang dipakai aplikasi.
ALTER TABLE public.transaksi DROP CONSTRAINT IF EXISTS transaksi_status_check;
ALTER TABLE public.transaksi
  ADD CONSTRAINT transaksi_status_check
  CHECK (status IN ('pending', 'dipinjam', 'dikembalikan', 'terlambat', 'ditolak', 'menunggu_kembali'));