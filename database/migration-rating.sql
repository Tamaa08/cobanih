-- ============================================================
-- MIGRASI: Sampul Buku + Rating & Deskripsi Buku
-- Jalankan di SQL Editor Supabase (Dashboard → SQL Editor)
-- Aman dijalankan berulang kali (idempotent).
-- ============================================================

-- 1) Kolom sampul + rating/deskripsi di tabel buku
ALTER TABLE public.buku ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.buku ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.buku ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.buku ADD COLUMN IF NOT EXISTS deskripsi TEXT;

-- 2) Tabel rating (satu anggota menilai satu buku maksimal sekali)
CREATE TABLE IF NOT EXISTS public.rating (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_buku UUID NOT NULL REFERENCES public.buku(id) ON DELETE CASCADE,
    id_anggota UUID NOT NULL REFERENCES public.anggota(id) ON DELETE CASCADE,
    nilai INTEGER NOT NULL CHECK (nilai BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_buku, id_anggota)
);

CREATE INDEX IF NOT EXISTS idx_rating_buku ON public.rating(id_buku);
CREATE INDEX IF NOT EXISTS idx_rating_anggota ON public.rating(id_anggota);

-- 3) Isi deskripsi & rating awal untuk buku seed yang sudah ada
UPDATE public.buku SET deskripsi = 'Novel ikonik yang menceritakan perjuangan sejumlah anak Belitung dalam mengejar pendidikan di SD Muhammadiyah yang sederhana. Intinya: semangat, persahabatan, dan tekad melawan keterbatasan demi meraih mimpi.', rating = 4.8, rating_count = 12 WHERE judul = 'Laskar Pelangi';
UPDATE public.buku SET deskripsi = 'Novel sejarah kolonial tentang Minke, pemuda pribumi terdidik di era Hindia Belanda. Intinya: kritik terhadap kolonialisme, diskriminasi rasial, dan pencarian jati diri bangsa.', rating = 4.7, rating_count = 9 WHERE judul = 'Bumi Manusia';
UPDATE public.buku SET deskripsi = 'Buku praktis tentang filsafat Stoisisme yang relevan untuk kehidupan modern. Intinya: mengendalikan apa yang bisa dikendalikan, menjaga ketenangan batin, dan tidak larut dalam hal di luar kendali.', rating = 4.6, rating_count = 8 WHERE judul = 'Filosofi Teras';
UPDATE public.buku SET deskripsi = 'Buku pengembangan diri tentang kekuatan kebiasaan kecil. Intinya: perubahan besar datang dari perbaikan 1% setiap hari secara konsisten, bukan dari tujuan besar yang instan.', rating = 4.7, rating_count = 10 WHERE judul = 'Atomic Habits';
UPDATE public.buku SET deskripsi = 'Kisah enam sahabat santri di Pondok Madani yang masing-masing bermimpi menaklukkan dunia. Intinya: semangat pantang menyerah dengan prinsip "Man Jadda Wajada" (siapa yang bersungguh-sungguh pasti berhasil).', rating = 4.6, rating_count = 7 WHERE judul = 'Negeri 5 Menara';
UPDATE public.buku SET deskripsi = 'Sekuel Laskar Pelangi tentang Ikal, Arai, dan Jimbron yang bermimpi besar dari Belitung untuk melanjutkan pendidikan sampai ke luar negeri. Intinya: keberanian bermimpi besar dan setia kawan.', rating = 4.5, rating_count = 6 WHERE judul = 'Sang Pemimpi';
UPDATE public.buku SET deskripsi = 'Buku teks matematika diskrit untuk mahasiswa informatika. Intinya: dasar-dasar logika, himpunan, relasi, graf, dan kombinatorik sebagai fondasi berpikir komputasional.', rating = 4.3, rating_count = 5 WHERE judul = 'Matematika Informatika';
UPDATE public.buku SET deskripsi = 'Buku pemrograman web praktis untuk pemula. Intinya: langkah demi langkah membangun aplikasi web dinamis dari dasar, mulai dari HTML, CSS, PHP, hingga MySQL.', rating = 4.4, rating_count = 6 WHERE judul = 'Pemrograman Web';

-- 4) RPC untuk auto-migrasi dall aplikasi saat server start (sampul)
CREATE OR REPLACE FUNCTION public.add_cover_url_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE public.buku ADD COLUMN IF NOT EXISTS cover_url TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_covers_bucket()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'covers'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('covers', 'covers', true);
  END IF;
END;
$$;