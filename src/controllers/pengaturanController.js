import { supabase } from '../config/db.js';
import { getJamOperasional, DAFTAR_HARI } from '../utils/jamOperasional.js';

const DESKRIPSI = 'Jam operasional perpustakaan per hari (senin-sabtu, minggu libur)';

export async function showPengaturan(req, res) {
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  let dendaPerHari = 10000;
  let tableReady = true;
  try {
    const { data } = await supabase
      .from('pengaturan')
      .select('value')
      .eq('key', 'denda_per_hari')
      .maybeSingle();
    if (data && data.value) dendaPerHari = parseInt(data.value) || dendaPerHari;
  } catch (e) {
    if (/schema cache|could not find the table/i.test(e.message || '')) {
      tableReady = false;
    } else {
      return res.render('admin/pengaturan', {
        dendaPerHari,
        jamOperasional: { rows: [], tableReady: false },
        tableReady,
        message,
        error: e.message,
        title: 'Pengaturan',
      });
    }
  }

  const jamOperasional = await getJamOperasional();

  res.render('admin/pengaturan', {
    dendaPerHari,
    jamOperasional,
    tableReady,
    message,
    error,
    title: 'Pengaturan',
  });
}

export async function updatePengaturan(req, res) {
  const dendaPerHari = parseInt(req.body.denda_per_hari);

  if (!Number.isFinite(dendaPerHari) || dendaPerHari < 0 || dendaPerHari > 5000000) {
    req.session.error = 'Tarif denda per hari harus antara Rp 0 sampai Rp 5.000.000';
    return res.redirect('/admin/pengaturan');
  }

  try {
    const { error: err } = await supabase
      .from('pengaturan')
      .upsert(
        {
          key: 'denda_per_hari',
          value: String(dendaPerHari),
          deskripsi: 'Tarif denda keterlambatan pengembalian buku per hari (Rupiah)',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    if (err) {
      throw new Error(err.message);
    }
    req.session.message = 'Tarif denda berhasil diperbarui menjadi Rp ' + dendaPerHari.toLocaleString('id-ID') + ' / hari';
  } catch (e) {
    req.session.error = 'Gagal memperbarui pengaturan: ' + e.message;
  }
  res.redirect('/admin/pengaturan');
}

function validHHMM(v) {
  return /^\d{2}:\d{2}$/.test(v) && (() => {
    const [h, m] = v.split(':').map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  })();
}

export async function updateJamOperasional(req, res) {
  const isPetugas = req.session.user && req.session.user.role === 'petugas';
  if (!isPetugas) {
    req.session.error = 'Hanya petugas perpustakaan yang dapat mengubah jam operasional';
    return res.redirect('/admin/pengaturan');
  }

  const clean = {};
  for (const { key, label } of DAFTAR_HARI) {
    if (req.body[key + '_libur']) continue; // libur -> tidak disimpan
    const buka = String(req.body[key + '_buka'] || '').trim();
    const tutup = String(req.body[key + '_tutup'] || '').trim();
    if (!validHHMM(buka) || !validHHMM(tutup)) {
      req.session.error = `Format jam untuk ${label} tidak valid. Gunakan HH:MM.`;
      return res.redirect('/admin/pengaturan');
    }
    if (buka >= tutup) {
      req.session.error = `Jam tutup untuk ${label} harus setelah jam buka. Atau centang 'Libur' jika perpustakaan tidak buka hari itu.`;
      return res.redirect('/admin/pengaturan');
    }
    clean[key] = { buka, tutup };
  }

  if (Object.keys(clean).length === 0) {
    req.session.error = 'Minimal satu hari operasional harus diisi (jangan centang Libur semua).';
    return res.redirect('/admin/pengaturan');
  }

  try {
    const { error: err } = await supabase
      .from('pengaturan')
      .upsert(
        {
          key: 'jam_operasional',
          value: JSON.stringify(clean),
          deskripsi: DESKRIPSI,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    if (err) {
      throw new Error(err.message);
    }
    req.session.message = 'Jam operasional berhasil diperbarui.';
  } catch (e) {
    req.session.error = 'Gagal memperbarui jam operasional: ' + e.message;
  }
  res.redirect('/admin/pengaturan');
}