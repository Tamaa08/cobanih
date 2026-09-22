import { supabase } from '../config/db.js';

function isMissingColumn(err) {
  return !!err && (/could not find the 'alamat' column|could not find the 'tanggal_lahir' column|column .* does not exist/i.test(err.message || ''));
}

export function formatTanggalLahir(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export async function identitasTersedia() {
  try {
    const { error } = await supabase.from('anggota').select('alamat').limit(1);
    return !isMissingColumn(error);
  } catch (e) {
    return !isMissingColumn(e);
  }
}