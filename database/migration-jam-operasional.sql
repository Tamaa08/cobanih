-- ============================================================
-- Jam Operasional Perpustakaan
-- Disimpan di tabel pengaturan (key/value).
-- Hanya HANYA petugas yang boleh mengganti lewat aplikasi.
-- Default: 08.00 - 16.00, Senin - Jumat.
-- Jalankan di Supabase Dashboard -> SQL Editor (sekali saja).
-- ============================================================

INSERT INTO public.pengaturan (key, value, deskripsi) VALUES
  ('jam_buka', '08:00', 'Jam buka perpustakaan (format HH:MM)'),
  ('jam_tutup', '16:00', 'Jam tutup perpustakaan (format HH:MM)'),
  ('hari_operasional', 'Senin - Jumat', 'Hari layanan perpustakaan')
ON CONFLICT (key) DO NOTHING;