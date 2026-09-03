-- ============================================================
-- Perpustakaan Sekolah Digital - Skema Database (PostgreSQL)
-- Untuk platform Supabase
-- Jalankan di SQL Editor Supabase
-- ============================================================

-- Ekstensi gen_random_uuid (bila belum ada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Tabel : users (autentikasi & role)
-- role : 'admin', 'petugas', atau 'siswa'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'petugas', 'siswa')),
    nama VARCHAR(100),
    kelas VARCHAR(20),
    nis VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Tabel : anggota (profil siswa; relasi 1-1 ke users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anggota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nama VARCHAR(100) NOT NULL,
    kelas VARCHAR(20) NOT NULL,
    nis VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(10) DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Tabel : buku
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buku (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul VARCHAR(200) NOT NULL,
    penulis VARCHAR(150) NOT NULL,
    penerbit VARCHAR(150),
    tahun_terbit INTEGER,
    kategori VARCHAR(100) NOT NULL,
    stok INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
    lokasi VARCHAR(50),
    cover_url TEXT,
    rating DOUBLE PRECISION NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    kualitas VARCHAR(20),
    deskripsi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kolom ISBN (untuk pencarian buku berdasarkan ISBN)
ALTER TABLE buku ADD COLUMN IF NOT EXISTS isbn VARCHAR(30);

-- ------------------------------------------------------------
-- Tabel : rating (penilaian buku oleh anggota)
-- Satu anggota hanya boleh menilai buku yang sama satu kali.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rating (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_buku UUID NOT NULL REFERENCES buku(id) ON DELETE CASCADE,
    id_anggota UUID NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
    nilai INTEGER NOT NULL CHECK (nilai BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_buku, id_anggota)
);

-- ------------------------------------------------------------
-- Tabel : transaksi (peminjaman & pengembalian buku)
-- status : 'dipinjam' atau 'dikembalikan'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_anggota UUID NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
    id_buku UUID NOT NULL REFERENCES buku(id) ON DELETE CASCADE,
    tanggal_pinjam TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tanggal_kembali TIMESTAMPTZ NOT NULL,
    tanggal_kembali_aktual TIMESTAMPTZ,
    status VARCHAR(15) NOT NULL DEFAULT 'dipinjam' CHECK (status IN ('dipinjam', 'dikembalikan')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk mempercepat pencarian
CREATE INDEX IF NOT EXISTS idx_buku_judul ON buku(lower(judul));
CREATE INDEX IF NOT EXISTS idx_buku_kategori ON buku(lower(kategori));
CREATE INDEX IF NOT EXISTS idx_anggota_nama ON anggota(lower(nama));
CREATE INDEX IF NOT EXISTS idx_anggota_nis ON anggota(nis);
CREATE INDEX IF NOT EXISTS idx_transaksi_status ON transaksi(status);
CREATE INDEX IF NOT EXISTS idx_transaksi_anggota ON transaksi(id_anggota);

-- Kolom cover_url (untuk buku yang tabelnya sudah ada sebelum fitur sampul)
ALTER TABLE buku ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Kolom rating & deskripsi (untuk tabel buku yang sudah ada)
ALTER TABLE buku ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE buku ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE buku ADD COLUMN IF NOT EXISTS deskripsi TEXT;

-- Indeks rating
CREATE INDEX IF NOT EXISTS idx_rating_buku ON rating(id_buku);
CREATE INDEX IF NOT EXISTS idx_rating_anggota ON rating(id_anggota);

-- RPC untuk menambah kolom cover_url dari aplikasi (auto-migrasi)
CREATE OR REPLACE FUNCTION public.add_cover_url_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE public.buku ADD COLUMN IF NOT EXISTS cover_url TEXT;
END;
$$;

-- RPC untuk membuat bucket 'covers' dari aplikasi (auto-provision storage)
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

-- ------------------------------------------------------------
-- Tabel : denda (keterlambatan & buku rusak/hilang)
-- jenis  : 'telat' | 'rusak_hilang'
-- status : 'belum_bayar' | 'lunas'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS denda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_transaksi UUID NOT NULL REFERENCES transaksi(id) ON DELETE CASCADE,
    id_anggota UUID NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
    id_buku UUID NOT NULL REFERENCES buku(id) ON DELETE CASCADE,
    jenis VARCHAR(15) NOT NULL CHECK (jenis IN ('telat', 'rusak_hilang')),
    jumlah BIGINT NOT NULL CHECK (jumlah >= 0),
    hari_keterlambatan INTEGER DEFAULT 0,
    status VARCHAR(15) NOT NULL DEFAULT 'belum_bayar' CHECK (status IN ('belum_bayar', 'lunas')),
    metode VARCHAR(15),
    tanggal_bayar TIMESTAMPTZ,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_denda_anggota ON denda(id_anggota);
CREATE INDEX IF NOT EXISTS idx_denda_status ON denda(status);

-- ============================================================
-- Password default:
--   admin1  -> smasleman1
--   petugas1 -> petugassma1
--   budi    -> budi123
-- Hashes di bawah adalah bcrypt (10 rounds) dari password tersebut.
-- ============================================================

-- 1) Buat User Admin (username: admin1)
INSERT INTO users (username, password_hash, role, nama)
VALUES ('admin1', '$2a$10$3SWKMUib4aPGhEKKXDHdf.aHleUTYYnAVkeNRg0Cyd5Xyb6qsNF.m', 'admin', 'Administrator')
ON CONFLICT (username) DO NOTHING;

-- 2) Buat User Petugas
INSERT INTO users (username, password_hash, role, nama)
VALUES ('petugas1', '$2a$10$N3sUDDBZ6z1cYO4GRcLTXeOzrfZoUKO4rIY5jql3OvsUPDdd36LJC', 'petugas', 'Petugas Perpustakaan')
ON CONFLICT (username) DO NOTHING;

-- 3) Buat User Siswa (budi)
INSERT INTO users (username, password_hash, role, nama, kelas, nis)
VALUES ('budi', '$2b$10$hjHfs0zWQYuvBYER19McjuZnVnFhsoUiEkwxrvEjn2zf7Jud10Wom', 'siswa', 'Budi Santoso', 'XI RPL 1', '20230001')
ON CONFLICT (username) DO NOTHING;

-- Siswa tambahan, hanya di tabel anggota (login dibuat via admin/registrasi)
INSERT INTO anggota (user_id, nama, kelas, nis)
SELECT u.id, 'Budi Santoso', 'XI RPL 1', '20230001'
FROM users u WHERE u.username = 'budi'
ON CONFLICT (nis) DO NOTHING;

INSERT INTO anggota (user_id, nama, kelas, nis)
VALUES (NULL, 'Siti Aminah', 'XI RPL 1', '20230002')
ON CONFLICT (nis) DO NOTHING;

INSERT INTO anggota (user_id, nama, kelas, nis)
VALUES (NULL, 'Andi Wijaya', 'X RPL 2', '20230003')
ON CONFLICT (nis) DO NOTHING;

-- 3) Data contoh buku
INSERT INTO buku (judul, penulis, penerbit, tahun_terbit, kategori, stok, lokasi, rating, rating_count, deskripsi, isbn) VALUES
  ('Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 2005, 'Fiksi', 5, 'Rak A-1', 4.8, 12, 'Novel ikonik yang menceritakan perjuangan sejumlah anak Belitung dalam mengejar pendidikan di SD Muhammadiyah yang sederhana. Intinya: semangat, persahabatan, dan tekad melawan keterbatasan demi meraih mimpi.', '978-979-3062-92-1'),
  ('Bumi Manusia', 'Pramoedya Ananta Toer', 'Hasta Mitra', 1980, 'Fiksi', 3, 'Rak A-2', 4.7, 9, 'Novel sejarah kolonial tentang Minke, pemuda pribumi terdidik di era Hindia Belanda. Intinya: kritik terhadap kolonialisme, diskriminasi rasial, dan pencarian jati diri bangsa.', '978-979-9731-23-4'),
  ('Filosofi Teras', 'Henry Manampiring', 'Kompas', 2018, 'Nonfiksi', 4, 'Rak B-1', 4.6, 8, 'Buku praktis tentang filsafat Stoisisme yang relevan untuk kehidupan modern. Intinya: mengendalikan apa yang bisa dikendalikan, menjaga ketenangan batin, dan tidak larut dalam hal di luar kendali.', '978-602-412-518-9'),
  ('Atomic Habits', 'James Clear', 'Avery', 2018, 'Pengembangan Diri', 2, 'Rak B-2', 4.7, 10, 'Buku pengembangan diri tentang kekuatan kebiasaan kecil. Intinya: perubahan besar datang dari perbaikan 1% setiap hari secara konsisten, bukan dari tujuan besar yang instan.', '978-073-521-129-2'),
  ('Negeri 5 Menara', 'Ahmad Fuadi', 'Gramedia', 2009, 'Fiksi', 6, 'Rak A-3', 4.6, 7, 'Kisah enam sahabat santri di Pondok Madani yang masing-masing bermimpi menaklukkan dunia. Intinya: semangat pantang menyerah dengan prinsip "Man Jadda Wajada" (siapa yang bersungguh-sungguh pasti berhasil).', '978-979-2232-79-8'),
  ('Sang Pemimpi', 'Andrea Hirata', 'Bentang Pustaka', 2006, 'Fiksi', 4, 'Rak A-1', 4.5, 6, 'Sekuel Laskar Pelangi tentang Ikal, Arai, dan Jimbron yang bermimpi besar dari Belitung untuk melanjutkan pendidikan sampai ke luar negeri. Intinya: keberanian bermimpi besar dan setia kawan.', '978-979-3062-94-5'),
  ('Matematika Informatika', 'Rinaldi Munir', 'Informatika', 2016, 'Teknologi', 2, 'Rak C-1', 4.3, 5, 'Buku teks matematika diskrit untuk mahasiswa informatika. Intinya: dasar-dasar logika, himpunan, relasi, graf, dan kombinatorik sebagai fondasi berpikir komputasional.', '978-602-8758-63-5'),
  ('Pemrograman Web', 'Budi Raharjo', 'Informatika', 2020, 'Teknologi', 3, 'Rak C-2', 4.4, 6, 'Buku pemrograman web praktis untuk pemula. Intinya: langkah demi langkah membangun aplikasi web dinamis dari dasar, mulai dari HTML, CSS, PHP, hingga MySQL.', '978-602-8758-64-2');

-- Update untuk buku yang sudah ada di database lama (setelah migrasi kolom rating/deskripsi)
UPDATE buku SET deskripsi = 'Novel ikonik yang menceritakan perjuangan sejumlah anak Belitung dalam mengejar pendidikan di SD Muhammadiyah yang sederhana. Intinya: semangat, persahabatan, dan tekad melawan keterbatasan demi meraih mimpi.', rating = 4.8, rating_count = 12, kualitas = 'Baik' WHERE judul = 'Laskar Pelangi';
UPDATE buku SET deskripsi = 'Novel sejarah kolonial tentang Minke, pemuda pribumi terdidik di era Hindia Belanda. Intinya: kritik terhadap kolonialisme, diskriminasi rasial, dan pencarian jati diri bangsa.', rating = 4.7, rating_count = 9 WHERE judul = 'Bumi Manusia';
UPDATE buku SET deskripsi = 'Buku praktis tentang filsafat Stoisisme yang relevan untuk kehidupan modern. Intinya: mengendalikan apa yang bisa dikendalikan, menjaga ketenangan batin, dan tidak larut dalam hal di luar kendali.', rating = 4.6, rating_count = 8 WHERE judul = 'Filosofi Teras';
UPDATE buku SET deskripsi = 'Buku pengembangan diri tentang kekuatan kebiasaan kecil. Intinya: perubahan besar datang dari perbaikan 1% setiap hari secara konsisten, bukan dari tujuan besar yang instan.', rating = 4.7, rating_count = 10 WHERE judul = 'Atomic Habits';
UPDATE buku SET deskripsi = 'Kisah enam sahabat santri di Pondok Madani yang masing-masing bermimpi menaklukkan dunia. Intinya: semangat pantang menyerah dengan prinsip "Man Jadda Wajada" (siapa yang bersungguh-sungguh pasti berhasil).', rating = 4.6, rating_count = 7 WHERE judul = 'Negeri 5 Menara';
UPDATE buku SET deskripsi = 'Sekuel Laskar Pelangi tentang Ikal, Arai, dan Jimbron yang bermimpi besar dari Belitung untuk melanjutkan pendidikan sampai ke luar negeri. Intinya: keberanian bermimpi besar dan setia kawan.', rating = 4.5, rating_count = 6 WHERE judul = 'Sang Pemimpi';
UPDATE buku SET deskripsi = 'Buku teks matematika diskrit untuk mahasiswa informatika. Intinya: dasar-dasar logika, himpunan, relasi, graf, dan kombinatorik sebagai fondasi berpikir komputasional.', rating = 4.3, rating_count = 5 WHERE judul = 'Matematika Informatika';
UPDATE buku SET deskripsi = 'Buku pemrograman web praktis untuk pemula. Intinya: langkah demi langkah membangun aplikasi web dinamis dari dasar, mulai dari HTML, CSS, PHP, hingga MySQL.', rating = 4.4, rating_count = 6 WHERE judul = 'Pemrograman Web';

-- Set kualitas (kondisi) untuk semua buku contoh
UPDATE buku SET kualitas = 'Baik'
WHERE judul IN ('Laskar Pelangi','Bumi Manusia','Filosofi Teras','Atomic Habits','Negeri 5 Menara','Sang Pemimpi','Matematika Informatika','Pemrograman Web');
