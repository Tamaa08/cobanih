import { supabase } from '../config/db.js';

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
        tableReady,
        message,
        error: e.message,
        title: 'Pengaturan',
      });
    }
  }

  res.render('admin/pengaturan', {
    dendaPerHari,
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