-- ============================================================
-- Perpustakaan Sekolah Digital - Skema Database (PostgreSQL)
-- Untuk platform Supabase
-- Jalankan di SQL Editor Supabase
-- ============================================================

-- Ekstensi gen_random_uuid (bila belum ada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Tabel : users (autentikasi & role)
-- role : 'admin' atau 'siswa'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'siswa')),
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
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- ============================================================
-- SEED DATA (contoh)
-- Password default:
--   admin  -> admin123
--   budi   -> budi123
-- Hashes di bawah adalah bcrypt (10 rounds) dari password tersebut.
-- ============================================================

-- 1) Buat User Admin
INSERT INTO users (username, password_hash, role, nama)
VALUES ('admin', '$2b$10$Z8g/jwzTwk7kErMY82Z/VOphQs22VU1LA3mfTIJOhYymo2O/GLTp.', 'admin', 'Administrator')
ON CONFLICT (username) DO NOTHING;

-- 2) Buat User Siswa (buddi)
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
INSERT INTO buku (judul, penulis, penerbit, tahun_terbit, kategori, stok, lokasi) VALUES
  ('Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 2005, 'Fiksi', 5, 'Rak A-1'),
  ('Bumi Manusia', 'Pramoedya Ananta Toer', 'Hasta Mitra', 1980, 'Fiksi', 3, 'Rak A-2'),
  ('Filosofi Teras', 'Henry Manampiring', 'Kompas', 2018, 'Nonfiksi', 4, 'Rak B-1'),
  ('Atomic Habits', 'James Clear', 'Avery', 2018, 'Pengembangan Diri', 2, 'Rak B-2'),
  ('Negeri 5 Menara', 'Ahmad Fuadi', 'Gramedia', 2009, 'Fiksi', 6, 'Rak A-3'),
  ('Sang Pemimpi', 'Andrea Hirata', 'Bentang Pustaka', 2006, 'Fiksi', 4, 'Rak A-1'),
  ('Matematika Informatika', 'Rinaldi Munir', 'Informatika', 2016, 'Teknologi', 2, 'Rak C-1'),
  ('Pemrograman Web', 'Budi Raharjo', 'Informatika', 2020, 'Teknologi', 3, 'Rak C-2');
