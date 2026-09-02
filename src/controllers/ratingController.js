import { supabase } from '../config/db.js';

export async function rateBook(req, res) {
  const { id_buku, nilai } = req.body;
  const ratingValue = parseInt(nilai);

  if (!id_buku || isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    req.session.error = 'Rating harus dipilih antara 1 sampai 5 bintang';
    return res.redirect(id_buku ? `/user/buku/${id_buku}` : '/user/katalog');
  }

  try {
    const { data: anggota } = await supabase
      .from('anggota')
      .select('id')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (!anggota) {
      req.session.error = 'Anda belum terdaftar sebagai anggota';
      return res.redirect('/user/katalog');
    }

    const { data: returned } = await supabase
      .from('transaksi')
      .select('id')
      .eq('id_buku', id_buku)
      .eq('id_anggota', anggota.id)
      .eq('status', 'dikembalikan')
      .limit(1);

    if (!returned || returned.length === 0) {
      req.session.error = 'Rating hanya bisa diberikan untuk buku yang sudah Anda kembalikan';
      return res.redirect(`/user/buku/${id_buku}`);
    }

    const { error: upsertErr } = await supabase
      .from('rating')
      .upsert({ id_buku, id_anggota: anggota.id, nilai: ratingValue }, { onConflict: 'id_buku,id_anggota' });

    if (upsertErr) throw new Error(upsertErr.message);

    const { data: list, error: listErr } = await supabase
      .from('rating')
      .select('nilai')
      .eq('id_buku', id_buku);

    if (listErr) throw new Error(listErr.message);

    const avg = list && list.length ? list.reduce((s, r) => s + r.nilai, 0) / list.length : 0;
    const { error: updateErr } = await supabase
      .from('buku')
      .update({ rating: Math.round(avg * 10) / 10, rating_count: list ? list.length : 0 })
      .eq('id', id_buku);

    if (updateErr) throw new Error(updateErr.message);

    req.session.message = 'Rating bintang berhasil disimpan';
  } catch (e) {
    req.session.error = 'Gagal menyimpan rating: ' + e.message;
  }
  res.redirect(`/user/buku/${id_buku}`);
}