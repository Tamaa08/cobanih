import { supabase } from '../config/db.js';

function isMissingTable(err) {
  return !!err && (/schema cache|could not find the table/i.test(err.message || ''));
}

export async function showBantuanAdmin(req, res) {
  const statusFilter = req.query.status || '';
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  let tiket = [];
  let tableReady = true;
  try {
    let query = supabase
      .from('bantuan')
      .select('*, pengirim:users!bantuan_user_id_fkey(nama, username), penjawab:users!bantuan_dijawab_oleh_fkey(nama, username)')
      .order('created_at', { ascending: false });

    if (statusFilter) query = query.eq('status', statusFilter);

    const { data, error: err } = await query;
    if (err && !isMissingTable(err)) throw err;
    if (isMissingTable(err)) tableReady = false;
    else tiket = data || [];
  } catch (e) {
    if (!isMissingTable(e)) {
      return res.render('admin/bantuan', {
        tiket: [],
        statusFilter,
        statusList: ['menunggu', 'dibalas', 'selesai'],
        belumBalas: 0,
        tableReady,
        message,
        error: e.message,
        title: 'Kelola Bantuan',
      });
    }
    tableReady = false;
  }

  let belumBalas = 0;
  if (tableReady) {
    const { count } = await supabase
      .from('bantuan')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'selesai');
    belumBalas = count || 0;
  }

  res.render('admin/bantuan', {
    tiket,
    statusFilter,
    statusList: ['menunggu', 'dibalas', 'selesai'],
    belumBalas,
    tableReady,
    message,
    error,
    title: 'Kelola Bantuan',
  });
}

export async function jawabBantuan(req, res) {
  const { id } = req.params;
  const { jawaban } = req.body;
  const adminId = req.session.user ? req.session.user.id : null;

  try {
    if (!jawaban || !jawaban.trim()) {
      req.session.error = 'Jawaban tidak boleh kosong';
      return res.redirect('/admin/bantuan');
    }

    const { error: err } = await supabase
      .from('bantuan')
      .update({
        jawaban: jawaban.trim(),
        status: 'dibalas',
        dijawab_oleh: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (err) {
      if (isMissingTable(err)) {
        req.session.error = 'Fitur bantuan belum aktif. Pastikan tabel bantuan sudah dibuat.';
        return res.redirect('/admin/bantuan');
      }
      throw err;
    }
    req.session.message = 'Bantuan berhasil dijawab';
  } catch (e) {
    req.session.error = 'Gagal menjawab bantuan: ' + e.message;
  }
  res.redirect('/admin/bantuan');
}

export async function tandaiSelesaiBantuan(req, res) {
  const { id } = req.params;
  try {
    const { error: err } = await supabase
      .from('bantuan')
      .update({
        status: 'selesai',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (err) throw err;
    req.session.message = 'Bantuan ditandai selesai';
  } catch (e) {
    req.session.error = 'Gagal: ' + e.message;
  }
  res.redirect('/admin/bantuan');
}