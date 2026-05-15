import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xledmhxdjxswaxynsfmr.supabase.co';
const supabaseKey = 'sb_publishable_z1o0Y5ZVgucL71u73K12_g_4kZk9zR7';

export const supabase = createClient(supabaseUrl, supabaseKey);
