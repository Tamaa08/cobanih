-- ============================================================
-- MIGRASI PERPUSTAKAAN SMA N 1 SLEMAN
-- A) Perbaikan upload sampul buku (cover) ke Supabase Storage
-- Error: "new row violates row-level security policy"
-- B) Kolom baru "kualitas" (kondisi fisik buku)
-- Jalankan SEKALI di Supabase Dashboard -> SQL Editor.
-- ============================================================

-- 0) Kolom "kualitas" buku: Baru / Baik / Cukup / Rusak
ALTER TABLE public.buku ADD COLUMN IF NOT EXISTS kualitas VARCHAR(20);
UPDATE public.buku SET kualitas = 'Baik' WHERE kualitas IS NULL;

-- 1) Buat bucket "covers" (publik, dapat diakses anon utk baca gambar)
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2) Bucket-level policies: izinkan anon/authenticated membaca & membuat bucket
DROP POLICY IF EXISTS "covers_bucket_select" ON storage.buckets;
CREATE POLICY "covers_bucket_select"
ON storage.buckets FOR SELECT
USING (true);

DROP POLICY IF EXISTS "covers_bucket_insert" ON storage.buckets;
CREATE POLICY "covers_bucket_insert"
ON storage.buckets FOR INSERT
WITH CHECK (true);

-- 3) Object-level: siapa pun boleh MEMBACA cover (untuk ditampilkan)
DROP POLICY IF EXISTS "covers_public_read" ON storage.objects;
CREATE POLICY "covers_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

-- 4) Object-level: siapa pun boleh UPLOAD (INSERT) ke folder covers/
DROP POLICY IF EXISTS "covers_public_insert" ON storage.objects;
CREATE POLICY "covers_public_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'covers');

-- 5) Object-level: siapa pun boleh UPDATE (mengganti/upsert) cover
DROP POLICY IF EXISTS "covers_public_update" ON storage.objects;
CREATE POLICY "covers_public_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'covers');

-- 6) Object-level: izinkan menghapus cover (saat update/hapus buku)
DROP POLICY IF EXISTS "covers_public_delete" ON storage.objects;
CREATE POLICY "covers_public_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'covers');
