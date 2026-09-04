import { supabase } from '../config/db.js';

function isMissingTable(err) {
  return !!err && (/schema cache|could not find the table/i.test(err.message || ''));
}

export async function showBantuan(req, res) {
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;
  const userId = req.session.user ? req.session.user.id : null;

  let tiket = [];
  let tableReady = true;
  try {
    const { data, error: err } = await supabase
      .from('bantuan')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (err && !isMissingTable(err)) throw err;
    if (isMissingTable(err)) tableReady = false;
    else tiket = data || [];
  } catch (e) {
    // Jika tabel belum dibuat, tampilkan pesan ramah alih-alih error mentah.
    if (!isMissingTable(e)) {
      return res.render('user/bantuan', {
        tiket: [],
        tableReady,
        message,
        error: e.message,
        title: 'Bantuan & Customer Service',
      });
    }
    tableReady = false;
  }

  res.render('user/bantuan', {
    tiket,
    tableReady,
    message,
    error,
    title: 'Bantuan & Customer Service',
  });
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
    if (err) {
      if (isMissingTable(err)) {
        req.session.error = 'Fitur bantuan sedang disiapkan. Silakan hubungi petugas langsung.';
        return res.redirect('/user/bantuan');
      }
      throw err;
    }
    req.session.message = 'Pertanyaan Anda berhasil dikirim. Admin akan segera membalas.';
  } catch (e) {
    req.session.error = 'Gagal mengirim bantuan: ' + e.message;
  }
  res.redirect('/user/bantuan');
}