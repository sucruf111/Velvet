import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return data?.role === 'admin';
}

// GET - Get user's subscription or all subscriptions (admin)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    // Admin can get all subscriptions
    if (all) {
      const admin = await isAdmin(user.id);
      if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: subscriptions, error } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
      }

      return NextResponse.json({ subscriptions });
    }

    // Get user's own subscription
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    return NextResponse.json({ subscription: subscription || null });
  } catch (error) {
    console.error('Subscription GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Cancel subscription
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'cancel') {
      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError || !subscription) {
        return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
      }

      if (subscription.status !== 'active') {
        return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
      }

      const now = new Date();

      // Update subscription status
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          cancellation_reason: 'user_requested',
          updated_at: now.toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Error cancelling subscription:', updateError);
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled. Access continues until ' + subscription.current_period_end,
      });
    }

    if (action === 'verify-payment') {
      // This endpoint is called after CCBill redirect
      // The actual subscription is created via webhook
      // This just checks if it's been processed
      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !subscription) {
        return NextResponse.json({
          verified: false,
          message: 'Payment still processing. Please wait a moment.',
        });
      }

      return NextResponse.json({
        verified: true,
        subscription,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Subscription POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
