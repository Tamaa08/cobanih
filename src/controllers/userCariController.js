import { supabase } from '../config/db.js';

export async function showKatalog(req, res) {
  const search = req.query.search || '';
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    let query = supabase.from('buku').select('*').order('judul', { ascending: true });

    if (search) {
      query = query.or(`judul.ilike.%${search}%,kategori.ilike.%${search}%,penulis.ilike.%${search}%`);
    }

    const { data: buku, error: err } = await query;
    if (err) throw err;

    const { data: dipinjam, error: err2 } = await supabase
      .from('transaksi')
      .select('id_buku')
      .eq('status', 'dipinjam');
    if (err2) throw err2;

    const pinjamIds = new Set((dipinjam || []).map((t) => t.id_buku));

    res.render('user/katalog', { buku, pinjamIds, search, message, error, title: 'Katalog Buku' });
  } catch (e) {
    res.render('user/katalog', {
      buku: [],
      pinjamIds: new Set(),
      search,
      message: null,
      error: e.message,
      title: 'Katalog Buku',
    });
  }
}

export async function showRiwayat(req, res) {
  const search = req.query.search || '';
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

    let trx = [];
    if (anggota) {
      let query = supabase
        .from('transaksi')
        .select('*, buku(judul, penulis)')
        .eq('id_anggota', anggota.id)
        .order('tanggal_pinjam', { ascending: false });

      if (search) {
        const idSearch = parseInt(search);
        if (!isNaN(idSearch)) query = query.eq('id', idSearch);
        query = query.or(`status.ilike.%${search}%`);
      }

      const { data } = await query;
      trx = data || [];
    }

    res.render('user/riwayat', { trx, search, message, error, title: 'Riwayat Transaksi' });
  } catch (e) {
    res.render('user/riwayat', {
      trx: [],
      search,
      message: null,
      error: e.message,
      title: 'Riwayat Transaksi',
    });
  }
}
