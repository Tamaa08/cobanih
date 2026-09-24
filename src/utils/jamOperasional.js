import { supabase } from '../config/db.js';

export const DAFTAR_HARI = [
  { key: 'senin', label: 'Senin' },
  { key: 'selasa', label: 'Selasa' },
  { key: 'rabu', label: 'Rabu' },
  { key: 'kamis', label: 'Kamis' },
  { key: 'jumat', label: 'Jumat' },
  { key: 'sabtu', label: 'Sabtu' },
  { key: 'minggu', label: 'Minggu' },
];

export const DEFAULT_JAM_OPERASIONAL = {
  senin: { buka: '08:00', tutup: '16:00' },
  selasa: { buka: '08:00', tutup: '16:00' },
  rabu: { buka: '08:00', tutup: '16:00' },
  kamis: { buka: '08:00', tutup: '16:00' },
  jumat: { buka: '08:00', tutup: '16:00' },
  sabtu: { buka: '08:00', tutup: '12:00' },
};

const HARI_KEY_EN = {
  Monday: 'senin',
  Tuesday: 'selasa',
  Wednesday: 'rabu',
  Thursday: 'kamis',
  Friday: 'jumat',
  Saturday: 'sabtu',
  Sunday: 'minggu',
};

function todayHariKey() {
  try {
    const name = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
    }).format(new Date());
    return HARI_KEY_EN[name] || null;
  } catch {
    return null;
  }
}

function parseValue(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function formatJam(v) {
  const [h, m] = String(v || '').split(':');
  return `${h}.${m}`;
}

/** Baca jam operasional per hari. Graceful: milik default bila belum ada. */
export async function getJamOperasional() {
  let saved = {};
  let tableReady = true;
  try {
    const { data } = await supabase
      .from('pengaturan')
      .select('value')
      .eq('key', 'jam_operasional')
      .maybeSingle();
    if (data && data.value) saved = parseValue(data.value);
  } catch (e) {
    if (/schema cache|could not find the table/i.test(e.message || '')) {
      tableReady = false;
    }
  }

  const today = todayHariKey();
  const rows = DAFTAR_HARI.map((d) => {
    const s = saved[d.key];
    const def = DEFAULT_JAM_OPERASIONAL[d.key];
    const libur = !s;
    return {
      key: d.key,
      label: d.label,
      libur,
      buka: (s && s.buka) || (def && def.buka) || '08:00',
      tutup: (s && s.tutup) || (def && def.tutup) || '16:00',
      isToday: d.key === today,
      text: libur
        ? null
        : `${formatJam(s.buka)} - ${formatJam(s.tutup)} WIB`,
    };
  });

  return { rows, tableReady };
}