import { supabase } from '../config/db.js';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';

const STATUS_LABEL = { dipinjam: 'Dipinjam', dikembalikan: 'Dikembalikan' };

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function fmtTanggal(value) {
  if (!value) return '-';
  const d = new Date(value);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtTanggalOnly(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

async function queryLaporan({ tanggal_mulai, tanggal_selesai, status }) {
  const mulai = parseDate(tanggal_mulai);
  const selesai = parseDate(tanggal_selesai);

  let query = supabase
    .from('transaksi')
    .select('*, buku(judul, penulis, kategori), anggota(nama, nis, kelas)')
    .order('tanggal_pinjam', { ascending: false });

  if (mulai) query = query.gte('tanggal_pinjam', mulai.toISOString());
  if (selesai) {
    const end = new Date(selesai);
    end.setDate(end.getDate() + 1); // sampai akhir hari
    query = query.lte('tanggal_pinjam', end.toISOString());
  }
  if (status) query = query.eq('status', status);

  const { data: transaksi, error: err } = await query;
  if (err) throw err;
  return { data: transaksi || [], mulai, selesai, status };
}

function namaFile(prefix, mulai, selesai, ext) {
  return `${prefix}-${mulai ? mulai.toISOString().slice(0, 10) : 'semua'}-${selesai ? selesai.toISOString().slice(0, 10) : 'semua'}.${ext}`;
}

export async function showLaporan(req, res) {
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  res.render('admin/laporan', { message, error, title: 'Laporan Peminjaman Buku' });
}

export async function generateLaporanExcel(req, res) {
  try {
    const { data, mulai, selesai } = await queryLaporan(req.query);

    const periode = mulai || selesai
      ? `${mulai ? fmtTanggalOnly(mulai) : 'Awal'} s/d ${selesai ? fmtTanggalOnly(selesai) : 'Sekarang'}`
      : 'Semua Periode';

    const totalDenda = data.reduce((s, t) => {
      if (t.status === 'dipinjam' && t.tanggal_kembali && new Date(t.tanggal_kembali).getTime() < Date.now()) {
        const telat = Math.ceil((Date.now() - new Date(t.tanggal_kembali).getTime()) / (1000 * 60 * 60 * 24));
        return s + Math.max(0, telat) * 10000;
      }
      return s;
    }, 0);

    const wsData = [
      ['LAPORAN TRANSAKSI PERPUSTAKAAN SMA N 1 SLEMAN'],
      [`Periode: ${periode}`],
      [`Total Transaksi: ${data.length}`, `Total Denda: Rp ${totalDenda.toLocaleString('id-ID')}`],
      [],
      ['No', 'Tgl Pinjam', 'Jatuh Tempo', 'Tgl Kembali', 'Peminjam', 'Kelas', 'Buku', 'Status', 'Denda'],
    ];

    data.forEach((t, i) => {
      wsData.push([
        i + 1,
        fmtTanggalOnly(t.tanggal_pinjam),
        fmtTanggalOnly(t.tanggal_kembali),
        t.tanggal_kembali_aktual ? fmtTanggalOnly(t.tanggal_kembali_aktual) : '-',
        t.anggota ? t.anggota.nama : '-',
        t.anggota ? t.anggota.kelas : '-',
        t.buku ? t.buku.judul : '-',
        STATUS_LABEL[t.status] || t.status,
        'Rp ' + formatRupiah(dendaTransaksi(t)),
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 5 }, ...[{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 34 }, { wch: 14 }, { wch: 14 }]];
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${namaFile('laporan-transaksi', mulai, selesai, 'xlsx')}"`);
    res.send(buffer);
  } catch (e) {
    res.status(500).send('Gagal membuat laporan Excel: ' + e.message);
  }
}

export async function renderLaporanCetak(req, res) {
  try {
    const { data, mulai, selesai, status } = await queryLaporan(req.query);
    const rows = data.map((t) => ({ ...t, denda_total: dendaTransaksi(t) }));
    const totalDenda = rows.reduce((s, t) => s + t.denda_total, 0);
    const dipinjam = rows.filter((t) => t.status === 'dipinjam').length;
    const dikembalikan = rows.filter((t) => t.status === 'dikembalikan').length;

    res.render('admin/laporan-cetak', {
      data: rows,
      total: rows.length,
      dipinjam,
      dikembalikan,
      totalDenda,
      statusLabel: status || 'Semua',
      tanggalCetak: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      mulai: mulai ? fmtTanggalOnly(mulai) : 'Awal',
      selesai: selesai ? fmtTanggalOnly(selesai) : 'Sekarang',
    });
  } catch (e) {
    res.status(500).send('Gagal membuat halaman cetak: ' + e.message);
  }
}

function dendaTransaksi(t) {
  if (t.status === 'dipinjam' && t.tanggal_kembali && new Date(t.tanggal_kembali).getTime() < Date.now()) {
    const telat = Math.ceil((Date.now() - new Date(t.tanggal_kembali).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, telat) * 10000;
  }
  if (t.status === 'dikembalikan' && t.tanggal_kembali_aktual && t.tanggal_kembali) {
    const telat = Math.ceil((new Date(t.tanggal_kembali_aktual).getTime() - new Date(t.tanggal_kembali).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, telat) * 10000;
  }
  return 0;
}

function formatRupiah(n) {
  return (n || 0).toLocaleString('id-ID');
}

export async function generateLaporanPdf(req, res) {
  try {
    const { data, mulai, selesai } = await queryLaporan(req.query);
    const transaksi = data;

    const doc = new PDFDocument({ size: 'A4', margins: { top: 45, bottom: 45, left: 40, right: 40 } });

    const filename = `laporan-peminjaman-${mulai ? mulai.toISOString().slice(0, 10) : 'semua'}-${selesai ? selesai.toISOString().slice(0, 10) : 'semua'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // --- Header ---
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#1e3f73')
      .text('PERPUSTAKAAN SMA N 1 SLEMAN', { align: 'center' })
      .moveDown(0.2);
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#333')
      .text('LAPORAN PEMINJAMAN BUKU', { align: 'center' })
      .moveDown(0.2);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#666')
      .text('SMA Negeri 1 Sleman · Jl. Kemasan No. 36, Triharjo, Sleman, Yogyakarta', { align: 'center' })
      .moveDown(0.4);

    const periode = `Periode: ${mulai ? fmtTanggalOnly(mulai) : 'Awal'} s/d ${selesai ? fmtTanggalOnly(selesai) : 'Sekarang'}`;
    const statusLabel = status ? ` | Status: ${status}` : '';
    doc.fontSize(10).fillColor('#555').text(`${periode}${statusLabel}`, { align: 'center' });
    doc
      .fontSize(9)
      .fillColor('#999')
      .text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, { align: 'center' })
      .moveDown(1);

    // --- Ringkasan ---
    const total = data.length;
    const dipinjam = data.filter((t) => t.status === 'dipinjam').length;
    const kembali = data.filter((t) => t.status === 'dikembalikan').length;

    doc.fontSize(10).fillColor('#333');
    doc.text(`Total Transaksi : ${total}`, { continued: true });
    doc.text(`   Dipinjam: ${dipinjam}   Kembali: ${kembali}`).moveDown(0.8);

    // --- Table ---
    const startY = doc.y;
    const tableLeft = 40;
    const tableWidth = 515;
    const colNo = 28;
    const colBuku = 150;
    const colAnggota = 120;
    const colPinjam = 85;
    const colKembali = 82;
    const colStatus = 50;

    function drawHeader(y) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
      const bg = '#2c5aa0';
      const cells = [
        ['No', tableLeft, colNo],
        ['Buku', tableLeft + colNo, colBuku],
        ['Anggota', tableLeft + colNo + colBuku, colAnggota],
        ['Tgl Pinjam', tableLeft + colNo + colBuku + colAnggota, colPinjam],
        ['Tgl Kembali', tableLeft + colNo + colBuku + colAnggota + colPinjam, colKembali],
        ['Status', tableLeft + colNo + colBuku + colAnggota + colPinjam + colKembali, colStatus],
      ];
      doc.rect(tableLeft, y, tableWidth, 16).fill(bg);
      for (const [label, x, w] of cells) {
        doc.fillColor('#fff').text(label, x + 4, y + 5, { width: w - 8 });
      }
      return y + 16;
    }

    let y = drawHeader(startY);
    const rowH = 26;
    let row = 0;

    if (data.length === 0) {
      doc.font('Helvetica').fontSize(9).fillColor('#666');
      doc.text('Tidak ada transaksi pada periode/filter ini.', tableLeft, y + 8);
    } else {
      for (const t of data) {
        if (y + rowH > 790) {
          doc.addPage();
          y = drawHeader(45);
        }
        if (row % 2 === 0) {
          doc.rect(tableLeft, y, tableWidth, rowH).fill('#f0f4fa');
        }
        doc.font('Helvetica').fontSize(8).fillColor('#333');
        doc.text(String(row + 1), tableLeft + 4, y + 9, { width: colNo - 8 });
        doc.text(t.buku ? t.buku.judul : '-', tableLeft + colNo + 4, y + 9, { width: colBuku - 8 });
        doc.text(t.anggota ? t.anggota.nama : '-', tableLeft + colNo + colBuku + 4, y + 9, { width: colAnggota - 8 });
        doc.text(fmtTanggal(t.tanggal_pinjam), tableLeft + colNo + colBuku + colAnggota + 4, y + 9, { width: colPinjam - 8 });
        const tglKembali = t.tanggal_kembali_aktual || t.tanggal_kembali;
        doc.text(fmtTanggalOnly(tglKembali), tableLeft + colNo + colBuku + colAnggota + colPinjam + 4, y + 9, { width: colKembali - 8 });
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(t.status === 'dipinjam' ? '#b26a00' : '#2e7d32')
          .text(t.status, tableLeft + colNo + colBuku + colAnggota + colPinjam + colKembali + 4, y + 9, { width: colStatus - 8 });
        y += rowH;
        row += 1;
      }
    }

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555')
      .moveDown(1.5)
      .text(`Jumlah data tampil: ${data.length}`, { align: 'left' });

    // --- Footer ttd ---
    const ttdY = doc.y + 30;
    doc.font('Helvetica').fontSize(10).fillColor('#333');
    doc.text('Mengetahui,', 40, ttdY);
    doc.text('Kepala Perpustakaan', 300, ttdY);
    doc.text('( __________________ )', 300, ttdY + 45);

    doc.end();
  } catch (e) {
    res.status(500).send('Gagal membuat laporan: ' + e.message);
  }
}