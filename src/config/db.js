import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    '[config:db] SUPABASE_URL dan/atau SUPABASE_ANON_KEY belum disetel. ' +
      'Pastikan Environment Variables dikonfigurasi di Vercel/.env.'
  );
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key'
);
