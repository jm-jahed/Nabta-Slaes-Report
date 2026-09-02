import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder')
  );
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export async function isServerTokenValid(tokenStr: string): Promise<boolean> {
  if (!tokenStr || !isSupabaseConfigured()) return false;
  const { data } = await supabase
    .from('nabta_tokens')
    .select('token, is_active')
    .eq('token', tokenStr)
    .eq('is_active', true)
    .maybeSingle();
  return Boolean(data);
}
