import { NextResponse } from 'next/server';
import { getApprovedBacklinksPaged, insertBacklinkSafe } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, getEmoji } from '@/lib/constants';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// URL validation helper
const isValidHttpUrl = (urlStr: string) => {
  try {
    const url = new URL(urlStr);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

// GET: Retrieve paginated approved backlinks
// Query params: page, limit, search, category, sort
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, Number(searchParams.get('page')     || '1'));
    const limit    = Math.min(48, Math.max(1, Number(searchParams.get('limit') || '12')));
    const search   = searchParams.get('search')   || '';
    const category = searchParams.get('category') || '';
    const sort     = searchParams.get('sort')     || 'newest';

    const { data, count, error } = await getApprovedBacklinksPaged(page, limit, search, category, sort);

    if (error) {
      console.error('Supabase query error:', (error as any).message);
      return NextResponse.json({ error: 'Failed to retrieve listings' }, { status: 500 });
    }

    const totalPages = Math.max(1, Math.ceil((count || 0) / limit));
    return NextResponse.json({ data: data || [], total: count || 0, page, totalPages });
  } catch (err: any) {
    console.error('API route exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add new backlink listing with robust validation and duplicate checking (defaults to approved = false)
export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { name, email, sitename, url, desc, category } = body;

    // 1. Field presence validation
    if (!name || !email || !sitename || !url || !desc || !category) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // 2. Data format validation
    const trimmedName     = name.trim();
    const trimmedEmail    = email.trim();
    const trimmedSitename = sitename.trim();
    const trimmedUrl      = url.trim();
    const trimmedDesc     = desc.trim();

    if (trimmedName.length === 0 || trimmedSitename.length === 0) {
      return NextResponse.json({ error: 'Name and website name cannot be empty.' }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!isValidHttpUrl(trimmedUrl)) {
      return NextResponse.json({ error: 'Please enter a valid URL starting with http:// or https://' }, { status: 400 });
    }

    if (trimmedDesc.length > 160) {
      return NextResponse.json({ error: 'Description must be 160 characters or less.' }, { status: 400 });
    }

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category selected.' }, { status: 400 });
    }

    // 3. Duplicate check (prevent listing the same URL twice)
    const { data: duplicates, error: dupError } = await supabase
      .from('backlinks')
      .select('id')
      .eq('url', trimmedUrl);

    if (dupError) {
      console.error('Supabase duplicate check query error:', dupError.message);
    } else if (duplicates && duplicates.length > 0) {
      return NextResponse.json({ error: 'This website URL is already listed in our directory.' }, { status: 400 });
    }

    // 4. Emoji resolver
    const emoji = getEmoji(trimmedSitename);

    // 5. Database Insertion
    const { data: newRecord, error } = await insertBacklinkSafe({
      name: trimmedSitename,
      url: trimmedUrl,
      description: trimmedDesc,
      category,
      emoji,
      submitted_by: trimmedName,
      submitted_email: trimmedEmail
    });

    if (error) {
      console.error('Supabase insert query error:', (error as any).message);
      return NextResponse.json({ error: 'Database submission failed. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: newRecord
    }, { status: 201 });

  } catch (err: any) {
    console.error('API route exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
