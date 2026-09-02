import { supabase } from '../config/db.js';
import { buatDendaTelat } from '../utils/fungsiDenda.js';

export async function showTransaksi(req, res) {
  const search = req.query.search || '';
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    let query = supabase
      .from('transaksi')
      .select('*, buku(judul, penulis), anggota(nama, nis)')
      .order('tanggal_pinjam', { ascending: false });

    if (search) {
      const idSearch = parseInt(search);
      if (!isNaN(idSearch)) {
        query = query.or(`id.eq.${idSearch},status.ilike.%${search}%`);
      } else {
        query = query.or(`status.ilike.%${search}%`);
      }
    }

    const { data: transaksi, error: err } = await query;
    if (err) throw err;

    const { data: buku, error: bukuErr } = await supabase
      .from('buku')
      .select('id, judul, penulis')
      .order('judul');
    if (bukuErr) throw bukuErr;

    const { data: anggota, error: anggotaErr } = await supabase
      .from('anggota')
      .select('id, nama, nis')
      .order('nama');
    if (anggotaErr) throw anggotaErr;

    res.render('admin/transaksi', {
      transaksi,
      buku,
      anggota,
      search,
      message,
      error,
      title: 'Manajemen Transaksi',
    });
  } catch (e) {
    res.render('admin/transaksi', {
      transaksi: [],
      buku: [],
      anggota: [],
      search,
      message: null,
      error: e.message,
      title: 'Manajemen Transaksi',
    });
  }
}

export async function createPeminjamanAdmin(req, res) {
  const { id_anggota, id_buku, tanggal_pinjam } = req.body;

  if (!id_anggota || !id_buku) {
    req.session.error = 'Anggota dan buku wajib dipilih';
    return res.redirect('/admin/transaksi');
  }

  try {
    const { data: buku } = await supabase.from('buku').select('*').eq('id', id_buku).single();
    if (!buku) {
      req.session.error = 'Buku tidak ditemukan';
      return res.redirect('/admin/transaksi');
    }

    const { data: aktif } = await supabase
      .from('transaksi')
      .select('id')
      .eq('id_buku', id_buku)
      .eq('status', 'dipinjam');

    if (aktif && aktif.length > 0) {
      req.session.error = 'Buku tersebut sedang dipinjam';
      return res.redirect('/admin/transaksi');
    }

    if (buku.stok <= 0) {
      req.session.error = 'Stok buku habis';
      return res.redirect('/admin/transaksi');
    }

    const pinjamDate = tanggal_pinjam ? new Date(tanggal_pinjam) : new Date();
    const tanggalKembali = new Date(pinjamDate);
    tanggalKembali.setDate(tanggalKembali.getDate() + 7);

    const { error: err } = await supabase.from('transaksi').insert([
      {
        id_anggota,
        id_buku,
        tanggal_pinjam: pinjamDate.toISOString(),
        tanggal_kembali: tanggalKembali.toISOString(),
        status: 'dipinjam',
      },
    ]);

    if (err) throw err;

    const { error: stokErr } = await supabase
      .from('buku')
      .update({ stok: buku.stok - 1 })
      .eq('id', id_buku);

    if (stokErr) throw stokErr;
    req.session.message = 'Peminjaman berhasil dibuat';
  } catch (e) {
    req.session.error = 'Gagal membuat peminjaman: ' + e.message;
  }
  res.redirect('/admin/transaksi');
}

export async function updateStatusPengembalian(req, res) {
  const { id } = req.params;

  try {
    const { data: trx } = await supabase.from('transaksi').select('*').eq('id', id).single();
    if (!trx) {
      req.session.error = 'Transaksi tidak ditemukan';
      return res.redirect('/admin/transaksi');
    }

    if (trx.status !== 'dipinjam') {
      req.session.error = 'Transaksi sudah dikembalikan';
      return res.redirect('/admin/transaksi');
    }

    const { error: err } = await supabase
      .from('transaksi')
      .update({ status: 'dikembalikan', tanggal_kembali_aktual: new Date().toISOString() })
      .eq('id', id);

    if (err) throw err;

    const { data: buku } = await supabase.from('buku').select('stok').eq('id', trx.id_buku).single();
    const { error: stokErr } = await supabase
      .from('buku')
      .update({ stok: buku.stok + 1 })
      .eq('id', trx.id_buku);

    if (stokErr) throw stokErr;

    try {
      const denda = await buatDendaTelat(trx);
      req.session.message = denda
        ? 'Buku berhasil dikembalikan, anggota terkena denda keterlambatan'
        : 'Buku berhasil dikembalikan';
    } catch {
      req.session.message = 'Buku berhasil dikembalikan';
    }
  } catch (e) {
    req.session.error = 'Gagal memproses pengembalian: ' + e.message;
  }
  res.redirect('/admin/transaksi');
}

export async function deleteTransaksi(req, res) {
  const { id } = req.params;
  try {
    const { data: trx } = await supabase.from('transaksi').select('*').eq('id', id).single();

    if (trx && trx.status === 'dipinjam') {
      const { data: buku } = await supabase
        .from('buku')
        .select('stok')
        .eq('id', trx.id_buku)
        .single();
      if (buku) {
        await supabase.from('buku').update({ stok: buku.stok + 1 }).eq('id', trx.id_buku);
      }
    }

    const { error: err } = await supabase.from('transaksi').delete().eq('id', id);
    if (err) throw err;
    req.session.message = 'Transaksi berhasil dihapus';
  } catch (e) {
    req.session.error = 'Gagal menghapus transaksi: ' + e.message;
  }
  res.redirect('/admin/transaksi');
}
