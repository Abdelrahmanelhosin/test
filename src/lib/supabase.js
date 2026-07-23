import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xledmhxdjxswaxynsfmr.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_z1o0Y5ZVgucL71u73K12_g_4kZk9zR7';

export const supabase = createClient(supabaseUrl, supabaseKey);

