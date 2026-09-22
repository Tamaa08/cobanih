-- ============================================================
-- Kartu Identitas Anggota
-- Menambah kolom alamat & tanggal_lahir pada tabel anggota
-- untuk ditampilkan sebagai Kartu Identitas di halaman petugas.
-- Jalankan di Supabase Dashboard -> SQL Editor (sekali saja).
-- ============================================================

ALTER TABLE public.anggota ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE public.anggota ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;