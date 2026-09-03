import { supabase } from '../config/db.js';
import { formatRupiah } from '../utils/fungsiDenda.js';
import {
  INFO_QRIS,
  INFO_REKENING,
  METODE_PEMBAYARAN,
} from '../config/konstantaDenda.js';

async function ambilAnggota(userId) {
  const { data } = await supabase
    .from('anggota')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function showDendaUser(req, res) {
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    const anggota = await ambilAnggota(req.session.user.id);

    let denda = [];
    if (anggota) {
      const { data } = await supabase
        .from('denda')
        .select('*, buku(judul, cover_url, penulis, kategori), transaksi(tanggal_pinjam, tanggal_kembali, tanggal_kembali_aktual)')
        .eq('id_anggota', anggota.id)
        .order('created_at', { ascending: false });
      denda = data || [];
    }

    const totalBelumBayar = denda
      .filter((d) => d.status === 'belum_bayar')
      .reduce((s, d) => s + (d.jumlah || 0), 0);

    res.render('user/denda', {
      denda,
      totalBelumBayar,
      message,
      error,
      title: 'Denda Saya',
    });
  } catch (e) {
    res.render('user/denda', {
      denda: [],
      totalBelumBayar: 0,
      message: null,
      error: e.message,
      title: 'Denda Saya',
    });
  }
}

export async function showBayarDenda(req, res) {
  const { id } = req.params;
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    const anggota = await ambilAnggota(req.session.user.id);

    const { data: denda } = await supabase
      .from('denda')
      .select('*, buku(judul, cover_url, penulis, kategori), transaksi(tanggal_pinjam, tanggal_kembali, tanggal_kembali_aktual)')
      .eq('id', id)
      .single();

    if (!denda) {
      req.session.error = 'Denda tidak ditemukan';
      return res.redirect('/user/denda');
    }

    if (!anggota || denda.id_anggota !== anggota.id) {
      req.session.error = 'Anda tidak berhak mengakses denda ini';
      return res.redirect('/user/denda');
    }

    if (denda.status === 'lunas') {
      req.session.message = 'Denda ini sudah lunas';
      return res.redirect('/user/denda');
    }

    res.render('user/bayar-denda', {
      denda,
      infoQris: INFO_QRIS,
      infoRekening: INFO_REKENING,
      metodeList: METODE_PEMBAYARAN,
      message,
      error,
      title: 'Bayar Denda',
    });
  } catch (e) {
    req.session.error = 'Gagal memuat halaman pembayaran: ' + e.message;
    res.redirect('/user/denda');
  }
}

export async function prosesBayarDenda(req, res) {
  const { id } = req.params;
  const { metode } = req.body;

  if (!['cash', 'qris', 'transfer'].includes(metode)) {
    req.session.error = 'Pilih metode pembayaran yang valid (Cash / QRIS / Transfer)';
    return res.redirect(`/user/denda/${id}/bayar`);
  }

  try {
    const anggota = await ambilAnggota(req.session.user.id);

    const { data: denda } = await supabase
      .from('denda')
      .select('*')
      .eq('id', id)
      .single();

    if (!denda) {
      req.session.error = 'Denda tidak ditemukan';
      return res.redirect('/user/denda');
    }

    if (!anggota || denda.id_anggota !== anggota.id) {
      req.session.error = 'Anda tidak berhak membayar denda ini';
      return res.redirect('/user/denda');
    }

    if (denda.status === 'lunas') {
      req.session.message = 'Denda ini sudah lunas sebelumnya';
      return res.redirect('/user/denda');
    }

    const { error: err } = await supabase
      .from('denda')
      .update({
        status: 'lunas',
        metode,
        tanggal_bayar: new Date().toISOString(),
        keterangan: `${denda.keterangan || 'Denda'}. Dibayar via ${METODE_PEMBAYARAN[metode]} pada ${new Date().toLocaleString('id-ID')}`,
      })
      .eq('id', id);

    if (err) throw err;
    req.session.message = `Denda ${formatRupiah(denda.jumlah)} berhasil dibayar via ${METODE_PEMBAYARAN[metode]}`;
  } catch (e) {
    req.session.error = 'Gagal memproses pembayaran: ' + e.message;
  }
  res.redirect('/user/denda');
}