-- ============================================================
-- MIGRASI: Denda Keterlambatan & Buku Rusak/Hilang
-- Jalankan di SQL Editor Supabase (Dashboard → SQL Editor)
-- Aman dijalankan berulang kali (idempotent).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.denda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_transaksi UUID NOT NULL REFERENCES public.transaksi(id) ON DELETE CASCADE,
    id_anggota UUID NOT NULL REFERENCES public.anggota(id) ON DELETE CASCADE,
    id_buku UUID NOT NULL REFERENCES public.buku(id) ON DELETE CASCADE,
    jenis VARCHAR(15) NOT NULL CHECK (jenis IN ('telat', 'rusak_hilang')),
    jumlah BIGINT NOT NULL CHECK (jumlah >= 0),
    hari_keterlambatan INTEGER DEFAULT 0,
    status VARCHAR(15) NOT NULL DEFAULT 'belum_bayar' CHECK (status IN ('belum_bayar', 'lunas')),
    metode VARCHAR(15),
    tanggal_bayar TIMESTAMPTZ,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_denda_anggota ON public.denda(id_anggota);
CREATE INDEX IF NOT EXISTS idx_denda_status ON public.denda(status);