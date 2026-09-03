import { supabase } from '../config/db.js';

export async function showBantuanAdmin(req, res) {
  const statusFilter = req.query.status || '';
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    let query = supabase
      .from('bantuan')
      .select('*, pengirim:users!bantuan_user_id_fkey(nama, username), penjawab:users!bantuan_dijawab_oleh_fkey(nama, username)')
      .order('created_at', { ascending: false });

    if (statusFilter) query = query.eq('status', statusFilter);

    const { data: tiket, error: err } = await query;
    if (err) throw err;

    // Hitung belumm-dibalas untuk badge
    const { count: belumBalas } = await supabase
      .from('bantuan')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'selesai');

    const statusList = ['menunggu', 'dibalas', 'selesai'];

    res.render('admin/bantuan', {
      tiket: tiket || [],
      statusFilter,
      statusList,
      belumBalas: belumBalas || 0,
      message,
      error,
      title: 'Kelola Bantuan',
    });
  } catch (e) {
    res.render('admin/bantuan', {
      tiket: [],
      statusFilter,
      statusList: ['menunggu', 'dibalas', 'selesai'],
      belumBalas: 0,
      message: null,
      error: e.message,
      title: 'Kelola Bantuan',
    });
  }
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

    if (err) throw err;
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