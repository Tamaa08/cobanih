import { supabase } from '../config/db.js';

export async function showBantuan(req, res) {
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;
  const userId = req.session.user ? req.session.user.id : null;

  try {
    const { data: tiket, error: err } = await supabase
      .from('bantuan')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (err && err.message && !err.message.includes('could not find the table')) throw err;

    res.render('user/bantuan', {
      tiket: tiket || [],
      message,
      error,
      title: 'Bantuan & Customer Service',
    });
  } catch (e) {
    res.render('user/bantuan', {
      tiket: [],
      message,
      error: e.message,
      title: 'Bantuan & Customer Service',
    });
  }
}

export async function kirimBantuan(req, res) {
  const { subjek, pesan } = req.body;
  const userId = req.session.user ? req.session.user.id : null;

  if (!subjek || !subjek.trim() || !pesan || !pesan.trim()) {
    req.session.error = 'Subjek dan isi pesan wajib diisi';
    return res.redirect('/user/bantuan');
  }

  try {
    const { error: err } = await supabase.from('bantuan').insert([
      {
        user_id: userId,
        subjek: subjek.trim(),
        pesan: pesan.trim(),
        status: 'menunggu',
      },
    ]);
    if (err) throw err;
    req.session.message = 'Pertanyaan Anda berhasil dikirim. Admin akan segera membalas.';
  } catch (e) {
    req.session.error = 'Gagal mengirim bantuan: ' + e.message;
  }
  res.redirect('/user/bantuan');
}