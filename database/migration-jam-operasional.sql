-- ============================================================
-- Jam Operasional Perpustakaan (per hari)
-- Disimpan sebagai JSON pada tabel pengaturan, key 'jam_operasional'.
-- Hanya petugas yang boleh mengganti lewat aplikasi.
-- Format JSON: { <hari>: { "buka": "HH:MM", "tutup": "HH:MM" }, ... }
-- Hari yang libur tidak memiliki kunci (contoh: 'minggu' tidak disertakan).
-- Jalankan di Supabase Dashboard -> SQL Editor (sekali saja).
-- ============================================================

INSERT INTO public.pengaturan (key, value, deskripsi) VALUES
  ('jam_operasional',
   '{"senin":{"buka":"08:00","tutup":"16:00"},"selasa":{"buka":"08:00","tutup":"16:00"},"rabu":{"buka":"08:00","tutup":"16:00"},"kamis":{"buka":"08:00","tutup":"16:00"},"jumat":{"buka":"08:00","tutup":"16:00"},"sabtu":{"buka":"08:00","tutup":"12:00"}}',
   'Jam operasional perpustakaan per hari (senin-sabtu, minggu libur)')
ON CONFLICT (key) DO NOTHING;