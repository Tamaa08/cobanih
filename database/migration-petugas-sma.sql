-- ============================================================
-- Migrasi: Role Petugas + Branding SMA N 1 Sleman
-- 1) Kolom isbn di tabel buku (pencarian ISBN)
-- 2) Role 'petugas' pada tabel users
-- 3) Password admin -> smasleman1
-- 4) Akun petugas1 -> petugassma1 (role petugas)
-- Jalankan di SQL Editor Supabase (sekali saja).
-- ============================================================

-- 1) ISBN untuk pencarian & detail buku
ALTER TABLE public.buku ADD COLUMN IF NOT EXISTS isbn VARCHAR(30);

-- 2) Izinkan role 'petugas' (drop + re-add constraint)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'petugas', 'siswa'));

-- 3) Ubah password admin menjadi smasleman1
UPDATE public.users
SET password_hash = '$2a$10$3SWKMUib4aPGhEKKXDHdf.aHleUTYYnAVkeNRg0Cyd5Xyb6qsNF.m'
WHERE username = 'admin';

-- 4) Buat / perbarui akun petugas (petugas1 / petugassma1)
INSERT INTO public.users (username, password_hash, role, nama)
VALUES
  ('petugas1', '$2a$10$N3sUDDBZ6z1cYO4GRcLTXeOzrfZoUKO4rIY5jql3OvsUPDdd36LJC', 'petugas', 'Petugas Perpustakaan')
ON CONFLICT (username) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      nama = EXCLUDED.nama;

-- 5) ISBN contoh untuk buku yang sudah ada (opsional, aman diidempotensikan)
UPDATE public.buku SET isbn = '978-979-3062-92-1'  WHERE judul = 'Laskar Pelangi' AND isbn IS NULL;
UPDATE public.buku SET isbn = '978-979-4071-77-5'  WHERE judul = 'Bumi Manusia' AND isbn IS NULL;
UPDATE public.buku SET isbn = '978-602-291-882-6'  WHERE judul = 'Filosofi Teras' AND isbn IS NULL;
UPDATE public.buku SET isbn = '978-602-291-885-7'  WHERE judul = 'Atomic Habits' AND isbn IS NULL;
UPDATE public.buku SET isbn = '978-979-2234-39-2'  WHERE judul = 'Negeri 5 Menara' AND isbn IS NULL;
UPDATE public.buku SET isbn = '978-979-2232-42-0'  WHERE judul = 'Sang Pemimpi' AND isbn IS NULL;
UPDATE public.buku SET isbn = '978-602-8759-74-2'  WHERE judul = 'Matematika Informatika' AND isbn IS NULL;
UPDATE public.buku SET isbn = '978-602-8758-45-5'  WHERE judul = 'Pemrograman Web' AND isbn IS NULL;