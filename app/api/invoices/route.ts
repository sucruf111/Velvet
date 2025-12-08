import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getAuthenticatedUser(_request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

async function isAdmin(userId: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return data?.role === 'admin';
}

// GET - Get user's invoices/transactions
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Admin can get all invoices
    if (all) {
      const admin = await isAdmin(user.id);
      if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: transactions, error, count } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
      }

      return NextResponse.json({
        invoices: transactions,
        total: count,
        limit,
        offset,
      });
    }

    // Get user's own transactions/invoices
    const { data: transactions, error, count } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching user transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    return NextResponse.json({
      invoices: transactions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Invoices GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET single invoice by ID
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, invoiceId } = await request.json();

    if (action === 'get-invoice') {
      // Get specific invoice
      const { data: invoice, error } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            name,
            company_name,
            address,
            city,
            postal_code,
            country
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Verify user owns the invoice or is admin
      const admin = await isAdmin(user.id);
      if (invoice.user_id !== user.id && !admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({ invoice });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Invoices POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
