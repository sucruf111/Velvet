import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint is meant to be called by a cron job service (e.g., Vercel Cron, GitHub Actions)
// It handles:
// 1. Expired subscriptions - downgrade profiles to free tier
// 2. Monthly boost resets - reset boosts_remaining on the 1st of each month

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Verify cron secret to prevent unauthorized access
// SECURITY FIX: Make CRON_SECRET mandatory
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new Error('CRON_SECRET is not configured - cron endpoint protection is mandatory');
  }

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const results: Record<string, unknown> = { timestamp: now.toISOString() };

    // Action: Check expired subscriptions
    if (!action || action === 'check-subscriptions' || action === 'all') {
      const expiredResult = await handleExpiredSubscriptions(supabase, now);
      results.expiredSubscriptions = expiredResult;
    }

    // Action: Reset monthly boosts (run on 1st of month)
    if (!action || action === 'reset-boosts' || action === 'all') {
      const isFirstOfMonth = now.getDate() === 1;
      if (isFirstOfMonth || action === 'reset-boosts') {
        const boostResult = await handleMonthlyBoostReset(supabase);
        results.boostReset = boostResult;
      } else {
        results.boostReset = { skipped: true, reason: 'Not first of month' };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle expired subscriptions - downgrade profiles to free tier
async function handleExpiredSubscriptions(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  now: Date
) {
  // Find expired active subscriptions
  const { data: expiredSubs, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, user_id, profile_id, plan')
    .eq('status', 'active')
    .lt('end_date', now.toISOString());

  if (fetchError) {
    console.error('Error fetching expired subscriptions:', fetchError);
    return { error: fetchError.message };
  }

  if (!expiredSubs || expiredSubs.length === 0) {
    return { processed: 0, message: 'No expired subscriptions found' };
  }

  const processed: string[] = [];
  const errors: string[] = [];

  for (const sub of expiredSubs) {
    try {
      // Update subscription status to expired
      await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: now.toISOString()
        })
        .eq('id', sub.id);

      // Downgrade profile to free tier
      if (sub.profile_id) {
        await supabase
          .from('profiles')
          .update({
            tier: 'free',
            boosts_remaining: 0,
            // Note: We don't delete photos/services beyond limits
            // They're hidden on the frontend based on tier limits
          })
          .eq('id', sub.profile_id);
      }

      processed.push(sub.id);
    } catch (err) {
      errors.push(`${sub.id}: ${err}`);
    }
  }

  return {
    processed: processed.length,
    profilesDowngraded: processed,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Reset monthly boosts for Premium and Elite users
async function handleMonthlyBoostReset(
  supabase: ReturnType<typeof getSupabaseAdmin>
) {
  // Reset Premium users to 2 boosts
  const { data: premiumData, error: premiumError } = await supabase
    .from('profiles')
    .update({ boosts_remaining: 2 })
    .eq('tier', 'premium')
    .select('id');

  // Reset Elite users to 999 (unlimited)
  const { data: eliteData, error: eliteError } = await supabase
    .from('profiles')
    .update({ boosts_remaining: 999 })
    .eq('tier', 'elite')
    .select('id');

  if (premiumError || eliteError) {
    return {
      error: premiumError?.message || eliteError?.message,
      premiumReset: premiumError ? 'failed' : (premiumData?.length || 0),
      eliteReset: eliteError ? 'failed' : (eliteData?.length || 0)
    };
  }

  return {
    success: true,
    premiumReset: premiumData?.length || 0,
    eliteReset: eliteData?.length || 0
  };
}

// POST endpoint for manual triggers or webhook-based cron
export async function POST(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action;

    const supabase = getSupabaseAdmin();
    const now = new Date();

    if (action === 'expire-subscription') {
      // Manually expire a specific subscription
      const { subscriptionId, profileId } = body;

      if (subscriptionId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired', updated_at: now.toISOString() })
          .eq('id', subscriptionId);
      }

      if (profileId) {
        await supabase
          .from('profiles')
          .update({ tier: 'free', boosts_remaining: 0 })
          .eq('id', profileId);
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription expired and profile downgraded'
      });
    }

    if (action === 'upgrade-profile') {
      // Upgrade a profile to a specific tier (called after payment success)
      const { profileId, tier, boosts } = body;

      if (!profileId || !tier) {
        return NextResponse.json({ error: 'Missing profileId or tier' }, { status: 400 });
      }

      const defaultBoosts = tier === 'elite' ? 999 : tier === 'premium' ? 2 : 0;

      await supabase
        .from('profiles')
        .update({
          tier,
          boosts_remaining: boosts ?? defaultBoosts
        })
        .eq('id', profileId);

      return NextResponse.json({
        success: true,
        message: `Profile upgraded to ${tier}`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Cron POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
