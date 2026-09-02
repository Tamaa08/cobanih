import { supabase } from '../config/db.js';
import { DENDARUSAK_HILANG } from '../config/konstantaDenda.js';

export async function showDenda(req, res) {
  const filter = req.query.status || '';
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    let query = supabase
      .from('denda')
      .select('*, buku(judul), anggota(nama, nis, kelas), transaksi(tanggal_pinjam, tanggal_kembali, tanggal_kembali_aktual)')
      .order('created_at', { ascending: false });

    if (filter === 'belum_bayar' || filter === 'lunas') {
      query = query.eq('status', filter);
    }

    const { data: denda, error: err } = await query;
    if (err) throw err;

    const { data: transaksiDikembalikan } = await supabase
      .from('transaksi')
      .select('id, buku(judul), anggota(nama, nis)')
      .eq('status', 'dikembalikan')
      .order('tanggal_kembali_aktual', { ascending: false });

    res.render('admin/denda', {
      denda: denda || [],
      transaksiDikembalikan: transaksiDikembalikan || [],
      filter,
      message,
      error,
      title: 'Data Denda',
    });
  } catch (e) {
    res.render('admin/denda', {
      denda: [],
      transaksiDikembalikan: [],
      filter,
      message: null,
      error: e.message,
      title: 'Data Denda',
    });
  }
}

export async function createDendaRusakHilang(req, res) {
  const { id_transaksi, jumlah, keterangan } = req.body;

  if (!id_transaksi) {
    req.session.error = 'Pilih transaksi peminjaman terlebih dahulu';
    return res.redirect('/admin/denda');
  }

  try {
    const { data: trx } = await supabase
      .from('transaksi')
      .select('*')
      .eq('id', id_transaksi)
      .single();

    if (!trx) {
      req.session.error = 'Transaksi tidak ditemukan';
      return res.redirect('/admin/denda');
    }

    if (trx.status !== 'dikembalikan') {
      req.session.error = 'Denda rusak/hilang hanya bisa dibuat untuk transaksi yang sudah dikembalikan';
      return res.redirect('/admin/denda');
    }

    const { data: existing } = await supabase
      .from('denda')
      .select('id')
      .eq('id_transaksi', id_transaksi)
      .eq('jenis', 'rusak_hilang')
      .maybeSingle();

    if (existing) {
      req.session.error = 'Denda rusak/hilang untuk transaksi ini sudah dibuat';
      return res.redirect('/admin/denda');
    }

    const nominal = parseInt(jumlah) || DENDARUSAK_HILANG;

    const { error: err } = await supabase.from('denda').insert({
      id_transaksi: trx.id,
      id_anggota: trx.id_anggota,
      id_buku: trx.id_buku,
      jenis: 'rusak_hilang',
      jumlah: nominal,
      status: 'belum_bayar',
      keterangan: keterangan || 'Buku rusak/hilang, wajib mengganti Rp 5.000.000',
    });

    if (err) throw err;
    req.session.message = 'Denda rusak/hilang berhasil ditambahkan';
  } catch (e) {
    req.session.error = 'Gagal menambahkan denda: ' + e.message;
  }
  res.redirect('/admin/denda');
}

export async function markDendaLunas(req, res) {
  const { id } = req.params;

  try {
    const { error: err } = await supabase
      .from('denda')
      .update({
        status: 'lunas',
        metode: 'cash',
        tanggal_bayar: new Date().toISOString(),
        keterangan: 'Dibayar tunai ke admin perpustakaan',
      })
      .eq('id', id);

    if (err) throw err;
    req.session.message = 'Denda ditandai lunas (bayar tunai)';
  } catch (e) {
    req.session.error = 'Gagal menandai lunas: ' + e.message;
  }
  res.redirect('/admin/denda');
}

export async function deleteDenda(req, res) {
  const { id } = req.params;

  try {
    const { error: err } = await supabase.from('denda').delete().eq('id', id);
    if (err) throw err;
    req.session.message = 'Denda berhasil dihapus';
  } catch (e) {
    req.session.error = 'Gagal menghapus denda: ' + e.message;
  }
  res.redirect('/admin/denda');
}