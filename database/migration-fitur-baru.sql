-- ============================================================
-- FITUR BARU dari repo jajalke (ditambah tanpa mengubah struktur)
-- Jalankan di Supabase Dashboard -> SQL Editor (sekali saja).
-- Isi: 1) bantuan  2) ulasan komentar  3) pengaturan denda
--      4) status persetujuan transaksi  5) denda_bayar + pembayaran_denda
-- ============================================================

-- ------------------------------------------------------------
-- 1) TABEL BANTUAN (user kirim -> admin jawab)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bantuan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subjek VARCHAR(200) NOT NULL,
    pesan TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'menunggu'
        CHECK (status IN ('menunggu', 'dibalas', 'selesai')),
    jawaban TEXT,
    dijawab_oleh UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bantuan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bantuan_all ON public.bantuan;
CREATE POLICY bantuan_all ON public.bantuan
  FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 2) KOMENTAR/ULASAN TEKS pada tabel rating
--    (rating sudah ada; hanya menambah kolom komentar)
-- ------------------------------------------------------------
ALTER TABLE public.rating ADD COLUMN IF NOT EXISTS komentar TEXT;

-- ------------------------------------------------------------
-- 3) TABEL PENGATURAN (tarif denda per hari, dst.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pengaturan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    deskripsi TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.pengaturan (key, value, deskripsi)
VALUES ('denda_per_hari', '10000', 'Tarif denda keterlambatan pengembalian buku per hari (Rupiah)')
ON CONFLICT (key) DO NOTHING;
ALTER TABLE public.pengaturan DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 4) STATUS PERSETUJUAN PINJAM/KEMBALI
--    (transaksi yang sudah ada tetap valid dgn status lama)
-- ------------------------------------------------------------
ALTER TABLE public.transaksi
  DROP CONSTRAINT IF EXISTS transaksi_status_check;
ALTER TABLE public.transaksi
  ADD CONSTRAINT transaksi_status_check
  CHECK (status IN ('pending', 'dipinjam', 'dikembalikan', 'terlambat', 'ditolak', 'menunggu_kembali'));

-- ------------------------------------------------------------
-- 5) DANDA BAYAR + RIWAYAT PEMBAYARAN (QRIS demo)
-- ------------------------------------------------------------
ALTER TABLE public.transaksi ADD COLUMN IF NOT EXISTS denda_bayar INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.pembayaran_denda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transaksi_id UUID NOT NULL REFERENCES public.transaksi(id) ON DELETE CASCADE,
    jumlah INTEGER NOT NULL CHECK (jumlah >= 0),
    metode TEXT NOT NULL DEFAULT 'qris' CHECK (metode IN ('qris')),
    status TEXT NOT NULL DEFAULT 'sukses' CHECK (status IN ('sukses')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.pembayaran_denda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pembayaran_denda_all ON public.pembayaran_denda;
CREATE POLICY pembayaran_denda_all ON public.pembayaran_denda
  FOR ALL USING (true) WITH CHECK (true);

UPDATE public.transaksi t
SET denda_bayar = COALESCE((
  SELECT SUM(p.jumlah) FROM public.pembayaran_denda p WHERE p.transaksi_id = t.id
), 0);