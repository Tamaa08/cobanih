import { supabase } from '../config/db.js';
import { DENDATELAT_PER_HARI } from '../config/konstantaDenda.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function formatRupiah(n) {
  const num = Number(n);
  return isNaN(num) ? 'Rp 0' : 'Rp ' + num.toLocaleString('id-ID');
}

export function hitungHariTelat(transaksi) {
  const aktual = transaksi?.tanggal_kembali_aktual
    ? new Date(transaksi.tanggal_kembali_aktual)
    : new Date();
  const jatuhTempo = transaksi?.tanggal_kembali ? new Date(transaksi.tanggal_kembali) : null;
  if (!jatuhTempo) return 0;
  const hari = Math.floor((aktual - jatuhTempo) / MS_PER_DAY);
  return Math.max(0, hari);
}

export async function buatDendaTelat(transaksi) {
  const hari = hitungHariTelat(transaksi);
  if (hari <= 0) return null;

  const jumlah = hari * DENDATELAT_PER_HARI;
  const { data, error } = await supabase
    .from('denda')
    .insert({
      id_transaksi: transaksi.id,
      id_anggota: transaksi.id_anggota,
      id_buku: transaksi.id_buku,
      jenis: 'telat',
      jumlah,
      hari_keterlambatan: hari,
      status: 'belum_bayar',
      keterangan: `Telat mengembalikan ${hari} hari (denda ${formatRupiah(DENDATELAT_PER_HARI)} / hari)`,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}