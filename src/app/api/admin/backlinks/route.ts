import { NextResponse } from 'next/server';
import { supabase, getAllBacklinksAdminPaged } from '@/lib/supabase';

// Helper to authenticate admin request
const authenticate = (request: Request) => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const headerPassword = request.headers.get('x-admin-password');
  return headerPassword === adminPassword;
};

// GET: Retrieve paginated backlinks for admin
// Query params: tab (pending|approved), page, limit
export async function GET(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tab   = (searchParams.get('tab')   || 'pending') as 'pending' | 'approved';
    const page  = Math.max(1, Number(searchParams.get('page')  || '1'));
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') || '10')));

    const { data, count, error } = await getAllBacklinksAdminPaged(page, limit, tab);

    if (error) {
      console.error('Supabase admin GET error:', (error as any).message);
      return NextResponse.json({ error: 'Failed to retrieve admin listings' }, { status: 500 });
    }

    const totalPages = Math.max(1, Math.ceil((count || 0) / limit));
    return NextResponse.json({ data: data || [], total: count || 0, page, totalPages });
  } catch (err: any) {
    console.error('Admin GET route exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Approve / change approval status or update priority of a backlink listing
export async function PATCH(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { id, approved, priority } = body;

    if (id === undefined) {
      return NextResponse.json({ error: 'Backlink ID is required' }, { status: 400 });
    }

    // Build update object
    const updateData: any = {};
    if (approved !== undefined) updateData.approved = approved;
    if (priority !== undefined) updateData.priority = Number(priority);

    const { data, error } = await supabase
      .from('backlinks')
      .update(updateData)
      .eq('id', Number(id))
      .select();

    if (error) {
      console.error('Supabase admin PATCH error:', error.message);
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('approved') || errorMsg.includes('priority') || errorMsg.includes('column')) {
        return NextResponse.json({ 
          error: 'Database migration incomplete. Please run the SQL statements in your Supabase SQL Editor to add the missing "approved" and "priority" columns.' 
        }, { status: 400 });
      }
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: 'No rows were updated. This usually happens if the record does not exist or if Row Level Security (RLS) policies are blocking updates. Please ensure you have created the UPDATE policy for public.backlinks.' 
      }, { status: 400 });
    }

    const updatedRecord = data && data[0] ? data[0] : null;

    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (err: any) {
    console.error('Admin PATCH route exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Reject and remove a backlink listing from the directory
export async function DELETE(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Backlink ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('backlinks')
      .delete()
      .eq('id', Number(id))
      .select();

    if (error) {
      console.error('Supabase admin DELETE error:', error.message);
      return NextResponse.json({ error: 'Database deletion failed' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: 'No rows were deleted. This usually happens if the record does not exist or if Row Level Security (RLS) policies are blocking deletions. Please ensure you have created the DELETE policy for public.backlinks.' 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin DELETE route exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
