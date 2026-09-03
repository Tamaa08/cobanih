import { supabase } from '../config/db.js';

export async function showPeminjamanBooking(req, res) {
  const search = req.query.search || '';
  const kategori = req.query.kategori || '';
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

    let query = supabase
      .from('buku')
      .select('*')
      .gt('stok', 0)
      .order('judul', { ascending: true });

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

    const { data: sudahDipinjam, error: err2 } = await supabase
      .from('transaksi')
      .select('id_buku, id_anggota')
      .eq('status', 'dipinjam');

    const pinjamIds = new Set((sudahDipinjam || []).filter((t) => t.id_anggota === anggota?.id).map((t) => t.id_buku));

    res.render('user/peminjaman', {
      buku,
      pinjamIds,
      search,
      kategori,
      kategoriList,
      message,
      error,
      title: 'Peminjaman Buku',
    });
  } catch (e) {
    res.render('user/peminjaman', {
      buku: [],
      pinjamIds: new Set(),
      search,
      kategori,
      kategoriList: [],
      message: null,
      error: e.message,
      title: 'Peminjaman Buku',
    });
  }
}

export async function createPeminjamanUser(req, res) {
  const { id_buku } = req.body;
  const durasiHari = Math.floor(Number(req.body.durasi));

  if (!id_buku) {
    req.session.error = 'Buku belum dipilih';
    return res.redirect('/user/peminjaman');
  }

  if (!Number.isFinite(durasiHari) || durasiHari < 1 || durasiHari > 30) {
    req.session.error = 'Durasi peminjaman harus antara 1 sampai 30 hari';
    return res.redirect('/user/peminjaman');
  }

  try {
    const { data: anggota } = await supabase
      .from('anggota')
      .select('*')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (!anggota) {
      req.session.error = 'Anda belum terdaftar sebagai anggota';
      return res.redirect('/user/peminjaman');
    }

    if (anggota.status !== 'aktif') {
      req.session.error = 'Keanggotaan Anda sedang tidak aktif';
      return res.redirect('/user/peminjaman');
    }

    const { data: buku } = await supabase.from('buku').select('*').eq('id', id_buku).single();
    if (!buku) {
      req.session.error = 'Buku tidak ditemukan';
      return res.redirect('/user/peminjaman');
    }

    const { data: existing } = await supabase
      .from('transaksi')
      .select('id')
      .eq('id_buku', id_buku)
      .eq('id_anggota', anggota.id)
      .eq('status', 'dipinjam')
      .maybeSingle();

    if (existing) {
      req.session.error = 'Anda masih meminjam buku ini. Kembalikan dulu sebelum meminjam lagi';
      return res.redirect('/user/peminjaman');
    }

    if (buku.stok <= 0) {
      req.session.error = 'Stok buku habis';
      return res.redirect('/user/peminjaman');
    }

    const now = new Date();
    const kembali = new Date(now);
    kembali.setDate(kembali.getDate() + durasiHari);
    kembali.setHours(23, 59, 59, 999);

    const { data: trx, error: err } = await supabase
      .from('transaksi')
      .insert([
        {
          id_anggota: anggota.id,
          id_buku,
          tanggal_pinjam: now.toISOString(),
          tanggal_kembali: kembali.toISOString(),
          status: 'dipinjam',
        },
      ])
      .select()
      .single();

    if (err) throw err;

    const { error: stokErr } = await supabase
      .from('buku')
      .update({ stok: buku.stok - 1 })
      .eq('id', id_buku);

    if (stokErr) throw stokErr;

    req.session.struk = {
      idTransaksi: trx.id,
      jumlahBuku: 1,
      durasiHari,
    };
    return res.redirect('/user/struk/' + trx.id);
  } catch (e) {
    req.session.error = 'Gagal meminjam buku: ' + e.message;
  }
  res.redirect('/user/peminjaman');
}

export async function showStruk(req, res) {
  const { id } = req.params;
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

    const { data: trx } = await supabase
      .from('transaksi')
      .select('*, buku(judul, penulis, penerbit, lokasi, kategori), anggota(nama, nis, kelas)')
      .eq('id', id)
      .single();

    if (!trx || !anggota || trx.id_anggota !== anggota.id) {
      req.session.error = 'Transaksi tidak ditemukan';
      return res.redirect('/user/peminjaman');
    }

    const durasiHari = req.session.struk && req.session.struk.durasiHari
      ? req.session.struk.durasiHari
      : Math.max(1, Math.round((new Date(trx.tanggal_kembali) - new Date(trx.tanggal_pinjam)) / (1000 * 60 * 60 * 24)));
    delete req.session.struk;

    res.render('user/struk', {
      trx,
      durasiHari,
      jumlahBuku: 1,
      petugas: req.session.user.username,
      waktuCetak: new Date(),
      message,
      error,
      title: 'Struk Peminjaman',
    });
  } catch (e) {
    req.session.error = 'Gagal memuat struk: ' + e.message;
    res.redirect('/user/peminjaman');
  }
}
