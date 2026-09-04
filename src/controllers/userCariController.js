import { supabase } from '../config/db.js';

export async function showKatalog(req, res) {
  const search = req.query.search || '';
  const kategori = req.query.kategori || '';
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    let query = supabase.from('buku').select('*').order('judul', { ascending: true });

    if (search) {
      query = query.or(`judul.ilike.%${search}%,kategori.ilike.%${search}%,penulis.ilike.%${search}%,isbn.ilike.%${search}%`);
    }
    if (kategori) {
      query = query.eq('kategori', kategori);
    }

    const { data: buku, error: err } = await query;
    if (err) throw err;

    const { data: katRows } = await supabase.from('buku').select('kategori');
    const kategoriList = [...new Set((katRows || []).map((k) => k.kategori))].sort();

    const { data: anggota } = await supabase
      .from('anggota')
      .select('*')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    const { data: dipinjam, error: err2 } = await supabase
      .from('transaksi')
      .select('id_buku, id_anggota')
      .eq('status', 'dipinjam');
    if (err2) throw err2;

    const pinjamIds = new Set(
      (dipinjam || []).filter((t) => t.id_anggota === anggota?.id).map((t) => t.id_buku)
    );

    res.render('user/katalog', { buku, pinjamIds, search, kategori, kategoriList, message, error, title: 'Katalog Buku' });
  } catch (e) {
    res.render('user/katalog', {
      buku: [],
      pinjamIds: new Set(),
      search,
      kategori,
      kategoriList: [],
      message: null,
      error: e.message,
      title: 'Katalog Buku',
    });
  }
}

export async function showBukuDetail(req, res) {
  const { id } = req.params;
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    const { data: buku, error: err } = await supabase.from('buku').select('*').eq('id', id).single();
    if (err || !buku) {
      req.session.error = 'Buku tidak ditemukan';
      return res.redirect('/user/katalog');
    }

    const { data: anggota } = await supabase
      .from('anggota')
      .select('*')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    let myRating = null;
    let myKomentar = null;
    let canRate = false;
    let daftarRating = [];
    if (anggota) {
      const { data: rating } = await supabase
        .from('rating')
        .select('nilai, komentar')
        .eq('id_buku', id)
        .eq('id_anggota', anggota.id)
        .maybeSingle();
      myRating = rating ? rating.nilai : null;
      myKomentar = rating ? rating.komentar : null;

      const { data: returned } = await supabase
        .from('transaksi')
        .select('id')
        .eq('id_buku', id)
        .eq('id_anggota', anggota.id)
        .eq('status', 'dikembalikan')
        .limit(1);
      canRate = returned && returned.length > 0;
    }

    const { data: ratingRows, error: ratingErr } = await supabase
      .from('rating')
      .select('*, anggota(nama)')
      .eq('id_buku', id)
      .order('created_at', { ascending: false });
    if (ratingErr) throw new Error(ratingErr.message);
    daftarRating = ratingRows || [];

    const { data: dipinjam, error: err2 } = await supabase
      .from('transaksi')
      .select('id_anggota')
      .eq('id_buku', id)
      .eq('status', 'dipinjam');

    const terpinjam = (dipinjam || []).some((t) => t.id_anggota === anggota?.id);

    res.render('user/detail', {
      buku,
      myRating,
      myKomentar,
      canRate,
      terpinjam,
      daftarRating,
      message,
      error,
      title: buku.judul,
    });
  } catch (e) {
    req.session.error = 'Gagal memuat detail buku: ' + e.message;
    res.redirect('/user/katalog');
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
