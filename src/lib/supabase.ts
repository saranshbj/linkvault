import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const isValidUrl = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://');
};

const isConfigured = 
  supabaseUrl && 
  supabasePublishableKey && 
  isValidUrl(supabaseUrl) && 
  !supabaseUrl.includes('SUBSTITUTE');

if (!isConfigured) {
  console.warn(
    'Supabase URL or Publishable Key is missing or invalid. LinkVault is running in Local-Only Fallback Mode.'
  );
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : {
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => Promise.resolve({ data: null, error: null })
      })
    } as any;

// Helper to check if database is configured
export function isSupabaseConfigured() {
  return !!isConfigured;
}

// Resilient helper to fetch approved backlinks (all — used for SSR first-load only)
export async function getApprovedBacklinksSafe() {
  if (!isConfigured) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('backlinks')
      .select('id, name, url, description, category, emoji, submitted_by, created_at, approved, priority')
      .eq('approved', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('approved') || errorMsg.includes('priority') || errorMsg.includes('column')) {
        console.warn('Supabase columns approved/priority missing, falling back.');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('backlinks')
          .select('id, name, url, description, category, emoji, submitted_by, created_at')
          .order('created_at', { ascending: false });
        if (fallbackError) return { data: null, error: fallbackError };
        const mapped = (fallbackData || []).map((item: any) => ({ ...item, approved: true, priority: 0 }));
        return { data: mapped, error: null };
      }
      return { data: null, error };
    }
    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ── PAGINATED: Public directory listing ──────────────────────────────────────
export async function getApprovedBacklinksPaged(
  page: number,
  limit: number,
  search: string,
  category: string,
  sort: string
) {
  if (!isConfigured) return { data: [], count: 0, error: null };
  try {
    let query = supabase
      .from('backlinks')
      .select('id, name, url, description, category, emoji, submitted_by, created_at, approved, priority', { count: 'exact' })
      .eq('approved', true);

    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%,url.ilike.%${s}%,category.ilike.%${s}%`);
    }
    if (category && category !== 'All Categories') {
      query = query.eq('category', category);
    }

    query = query.order('priority', { ascending: false });
    if (sort === 'oldest') query = query.order('created_at', { ascending: true });
    else if (sort === 'az') query = query.order('name', { ascending: true });
    else if (sort === 'za') query = query.order('name', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) return { data: null, count: 0, error };
    return { data: data || [], count: count ?? 0, error: null };
  } catch (err: any) {
    return { data: null, count: 0, error: err };
  }
}

// ── PAGINATED: Admin panel ────────────────────────────────────────────────────
export async function getAllBacklinksAdminPaged(
  page: number,
  limit: number,
  tab: 'pending' | 'approved'
) {
  if (!isConfigured) return { data: [], count: 0, error: null };
  try {
    const approved = tab === 'approved';
    const from = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('backlinks')
      .select('*', { count: 'exact' })
      .eq('approved', approved)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) return { data: null, count: 0, error };

    const mapped = (data || []).map((item: any) => ({
      ...item,
      approved: item.approved !== undefined ? item.approved : true,
      priority: item.priority !== undefined ? item.priority : 0
    }));
    return { data: mapped, count: count ?? 0, error: null };
  } catch (err: any) {
    return { data: null, count: 0, error: err };
  }
}

// Resilient helper to fetch all backlinks for admin (legacy / non-paginated)
export async function getAllBacklinksAdminSafe() {
  if (!isConfigured) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('backlinks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    const mapped = (data || []).map((item: any) => ({
      ...item,
      approved: item.approved !== undefined ? item.approved : true,
      priority: item.priority !== undefined ? item.priority : 0
    }));
    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// Resilient helper to insert a new backlink
export async function insertBacklinkSafe(item: {
  name: string;
  url: string;
  description: string;
  category: string;
  emoji: string;
  submitted_by: string;
  submitted_email: string;
}) {
  if (!isConfigured) return { data: null, error: null };
  try {
    const { data, error } = await supabase
      .from('backlinks')
      .insert([{
        name: item.name,
        url: item.url,
        description: item.description,
        category: item.category,
        emoji: item.emoji,
        submitted_by: item.submitted_by,
        submitted_email: item.submitted_email,
        approved: false,
        priority: 0
      }])
      .select('id, name, url, description, category, emoji, submitted_by, created_at, approved, priority');

    if (error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('approved') || errorMsg.includes('priority') || errorMsg.includes('column')) {
        console.warn('Inserting without approved/priority columns due to database missing columns.');
        const { data: fbData, error: fbError } = await supabase
          .from('backlinks')
          .insert([{
            name: item.name, url: item.url, description: item.description,
            category: item.category, emoji: item.emoji,
            submitted_by: item.submitted_by, submitted_email: item.submitted_email
          }])
          .select('id, name, url, description, category, emoji, submitted_by, created_at');
        if (fbError) return { data: null, error: fbError };
        const newRecord = fbData && fbData[0] ? { ...fbData[0], approved: true, priority: 0 } : null;
        return { data: newRecord, error: null };
      }
      return { data: null, error };
    }
    return { data: data && data[0] ? data[0] : null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
