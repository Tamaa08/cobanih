-- ============================================================
-- FITUR BANTUAN (User kirim tiket -> Admin/Petugas jawab)
-- Jalankan di Supabase Dashboard -> SQL Editor (sekali saja).
-- ============================================================

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

-- Izinkan baris baru (user mengirim) tanpa exposed anon auth session
ALTER TABLE public.bantuan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bantuan_all ON public.bantuan;
CREATE POLICY bantuan_all ON public.bantuan
  FOR ALL
  USING (true)
  WITH CHECK (true);
