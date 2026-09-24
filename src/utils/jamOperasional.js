import { supabase } from '../config/db.js';

const DEFAULT_JAM = { jamBuka: '08:00', jamTutup: '16:00', hariOperasional: 'Senin - Jumat' };

export async function getJamOperasional() {
  const jam = { ...DEFAULT_JAM };
  try {
    const { data } = await supabase.from('pengaturan').select('key, value');
    for (const row of data || []) {
      if (row.key === 'jam_buka' && row.value) jam.jamBuka = row.value;
      else if (row.key === 'jam_tutup' && row.value) jam.jamTutup = row.value;
      else if (row.key === 'hari_operasional' && row.value) jam.hariOperasional = row.value;
    }
  } catch {
    // tabel pengaturan belum ada -> pakai default
  }
  jam.teks = jam.hariOperasional + ' · ' + jam.jamBuka + ' - ' + jam.jamTutup + ' WIB';
  return jam;
}