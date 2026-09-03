import { supabase } from '../config/db.js';
import { formatRupiah } from '../utils/fungsiDenda.js';

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hariTerakhir(jumlahHari) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const labels = [];
  const map = new Map();
  for (let i = jumlahHari - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    labels.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
    map.set(key, 0);
  }
  return { labels, map, dates: [...map.keys()] };
}

export async function showStatistik(req, res) {
  try {
    const { data: trx, error: errTrx } = await supabase
      .from('transaksi')
      .select('*, buku(judul, kategori), anggota(nama, nis, kelas)')
      .limit(10000);
    if (errTrx) throw errTrx;
    const data = trx || [];

    // 1. Grafik peminjaman per hari (14 hari terakhir)
    const { labels, map } = hariTerakhir(14);
    for (const t of data) {
      const key = toDateKey(new Date(t.tanggal_pinjam));
      if (map.has(key)) map.set(key, map.get(key) + 1);
    }
    const dailyValues = [...map.values()];

    // 2. Peminjaman per buku (Top 10)
    const bukuMap = new Map();
    for (const t of data) {
      const id = t.id_buku;
      const nama = (t.buku && t.buku.judul) || 'Tidak diketahui';
      bukuMap.set(id, { nama, count: (bukuMap.get(id)?.count || 0) + 1 });
    }
    const byBook = [...bukuMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

    // 3. Peminjaman per anggota (Top 10)
    const anggotaMap = new Map();
    for (const t of data) {
      const id = t.id_anggota;
      const nama = (t.anggota && t.anggota.nama) || 'Tidak diketahui';
      anggotaMap.set(id, { nama, count: (anggotaMap.get(id)?.count || 0) + 1 });
    }
    const byMember = [...anggotaMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

    // 4. Status transaksi (donut)
    const status = {
      dipinjam: data.filter((t) => t.status === 'dipinjam').length,
      dikembalikan: data.filter((t) => t.status === 'dikembalikan').length,
    };

    // 5. Kategori buku paling dipinjam (pie)
    const katMap = new Map();
    for (const t of data) {
      const kategori = (t.buku && t.buku.kategori) || 'Lainnya';
      katMap.set(kategori, (katMap.get(kategori) || 0) + 1);
    }
    const byCategory = [...katMap.entries()].map(([kategori, nilai]) => ({ kategori, nilai }));

    // Buku paling dipinjam
    const topBook = byBook[0] || { nama: '-', count: 0 };

    // Siapa yang sedang meminjam sekarang (belum dikembalikan)
    const { data: active, error: errActive } = await supabase
      .from('transaksi')
      .select('*, buku(judul, cover_url, penulis, kategori), anggota(nama, nis, kelas)')
      .eq('status', 'dipinjam')
      .order('tanggal_pinjam', { ascending: false });
    if (errActive) throw errActive;

    const now = Date.now();
    const loans = (active || []).map((t) => ({
      ...t,
      overdue: new Date(t.tanggal_kembali).getTime() < now,
      sisaHari: Math.ceil((new Date(t.tanggal_kembali).getTime() - now) / (1000 * 60 * 60 * 24)),
    }));

    const { data: dendaAll } = await supabase.from('denda').select('status, jumlah');
    const dendaRows = dendaAll || [];
    const dendaStats = {
      belum: dendaRows.filter((d) => d.status === 'belum_bayar').length,
      lunas: dendaRows.filter((d) => d.status === 'lunas').length,
      nominalBelum: dendaRows.filter((d) => d.status === 'belum_bayar').reduce((s, d) => s + (d.jumlah || 0), 0),
      nominalLunas: dendaRows.filter((d) => d.status === 'lunas').reduce((s, d) => s + (d.jumlah || 0), 0),
    };

    res.render('admin/statistik', {
      title: 'Statistik & Grafik Peminjaman',
      totalTransaksi: data.length,
      totalDipinjam: status.dipinjam,
      totalDikembalikan: status.dikembalikan,
      topBook,
      dendaStats,
      formatRupiah,
      chart: {
        labels,
        daily: dailyValues,
        byBook,
        byMember,
        status,
        byCategory,
      },
      loans,
      user: req.session.user,
    });
  } catch (e) {
    res.render('admin/statistik', {
      title: 'Statistik & Grafik Peminjaman',
      totalTransaksi: 0,
      totalDipinjam: 0,
      totalDikembalikan: 0,
      topBook: { nama: '-', count: 0 },
      dendaStats: { belum: 0, lunas: 0, nominalBelum: 0, nominalLunas: 0 },
      formatRupiah,
      chart: { labels: [], daily: [], byBook: [], byMember: [], status: { dipinjam: 0, dikembalikan: 0 }, byCategory: [] },
      loans: [],
      error: e.message,
      user: req.session.user,
    });
  }
}