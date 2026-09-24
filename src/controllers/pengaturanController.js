import { supabase } from '../config/db.js';
import { getJamOperasional } from '../utils/jamOperasional.js';

const DESKRIPSI_JAM = {
  jam_buka: 'Jam buka perpustakaan (format HH:MM)',
  jam_tutup: 'Jam tutup perpustakaan (format HH:MM)',
  hari_operasional: 'Hari layanan perpustakaan',
};

export async function showPengaturan(req, res) {
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  let dendaPerHari = 10000;
  let tableReady = true;
  let jamOperasional = { jamBuka: '08:00', jamTutup: '16:00', hariOperasional: 'Senin - Jumat' };
  try {
    const { data } = await supabase
      .from('pengaturan')
      .select('key, value')
      .in('key', ['denda_per_hari', 'jam_buka', 'jam_tutup', 'hari_operasional']);
    for (const row of data || []) {
      if (row.key === 'denda_per_hari' && row.value) dendaPerHari = parseInt(row.value) || dendaPerHari;
      else if (row.key === 'jam_buka' && row.value) jamOperasional.jamBuka = row.value;
      else if (row.key === 'jam_tutup' && row.value) jamOperasional.jamTutup = row.value;
      else if (row.key === 'hari_operasional' && row.value) jamOperasional.hariOperasional = row.value;
    }
  } catch (e) {
    if (/schema cache|could not find the table/i.test(e.message || '')) {
      tableReady = false;
    } else {
      return res.render('admin/pengaturan', {
        dendaPerHari,
        jamOperasional,
        tableReady,
        message,
        error: e.message,
        title: 'Pengaturan',
      });
    }
  }

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

export async function updateJamOperasional(req, res) {
  const isPetugas = req.session.user && req.session.user.role === 'petugas';
  if (!isPetugas) {
    req.session.error = 'Hanya petugas perpustakaan yang dapat mengubah jam operasional';
    return res.redirect('/admin/pengaturan');
  }

  const format = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const jamBuka = String(req.body.jam_buka || '').trim();
  const jamTutup = String(req.body.jam_tutup || '').trim();
  const hariOperasional = String(req.body.hari_operasional || '').trim();

  if (!format.test(jamBuka) || !format.test(jamTutup)) {
    req.session.error = 'Jam operasional harus dalam format HH:MM, contoh 08:00 sampai 16:00';
    return res.redirect('/admin/pengaturan');
  }
  if (!hariOperasional) {
    req.session.error = 'Hari operasional tidak boleh kosong';
    return res.redirect('/admin/pengaturan');
  }

  try {
    const rows = [
      { key: 'jam_buka', value: jamBuka, deskripsi: DESKRIPSI_JAM.jam_buka, updated_at: new Date().toISOString() },
      { key: 'jam_tutup', value: jamTutup, deskripsi: DESKRIPSI_JAM.jam_tutup, updated_at: new Date().toISOString() },
      { key: 'hari_operasional', value: hariOperasional, deskripsi: DESKRIPSI_JAM.hari_operasional, updated_at: new Date().toISOString() },
    ];
    const { error: err } = await supabase.from('pengaturan').upsert(rows, { onConflict: 'key' });
    if (err) {
      throw new Error(err.message);
    }
    req.session.message = 'Jam operasional berhasil diperbarui menjadi ' + hariOperasional + ' · ' + jamBuka + ' - ' + jamTutup + ' WIB';
  } catch (e) {
    req.session.error = 'Gagal memperbarui jam operasional: ' + e.message;
  }
  res.redirect('/admin/pengaturan');
}