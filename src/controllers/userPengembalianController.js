import { supabase } from '../config/db.js';
import { buatDendaTelat } from '../utils/fungsiDenda.js';

export async function showPengembalian(req, res) {
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    const { data: anggota } = await supabase
      .from('anggota')
      .select('*')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    let myPinjam = [];
    if (anggota) {
      const { data } = await supabase
        .from('transaksi')
        .select('*, buku(judul, penulis)')
        .eq('id_anggota', anggota.id)
        .eq('status', 'dipinjam')
        .order('tanggal_pinjam', { ascending: false });
      myPinjam = data || [];
    }

    res.render('user/pengembalian', {
      myPinjam,
      message,
      error,
      title: 'Pengembalian Buku',
    });
  } catch (e) {
    res.render('user/pengembalian', {
      myPinjam: [],
      message: null,
      error: e.message,
      title: 'Pengembalian Buku',
    });
  }
}

export async function processPengembalian(req, res) {
  const { id } = req.params;
  try {
    const { data: anggota } = await supabase
      .from('anggota')
      .select('*')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    const { data: trx } = await supabase
      .from('transaksi')
      .select('*')
      .eq('id', id)
      .single();

    if (!trx) {
      req.session.error = 'Transaksi tidak ditemukan';
      return res.redirect('/user/pengembalian');
    }

    if (trx.id_anggota !== anggota.id) {
      req.session.error = 'Anda tidak berhak memproses transaksi ini';
      return res.redirect('/user/pengembalian');
    }

    if (trx.status !== 'dipinjam') {
      req.session.error = 'Buku ini sudah dikembalikan';
      return res.redirect('/user/pengembalian');
    }

    const { error: err } = await supabase
      .from('transaksi')
      .update({ status: 'dikembalikan', tanggal_kembali_aktual: new Date().toISOString() })
      .eq('id', id);

    if (err) throw err;

    const { data: buku } = await supabase.from('buku').select('stok').eq('id', trx.id_buku).single();
    await supabase.from('buku').update({ stok: buku.stok + 1 }).eq('id', trx.id_buku);

    try {
      const denda = await buatDendaTelat(trx);
      req.session.message = denda
        ? 'Buku berhasil dikembalikan, namun Anda terkena denda keterlambatan'
        : 'Buku berhasil dikembalikan';
    } catch {
      req.session.message = 'Buku berhasil dikembalikan';
    }
  } catch (e) {
    req.session.error = 'Gagal mengembalikan buku: ' + e.message;
  }
  res.redirect('/user/pengembalian');
}
