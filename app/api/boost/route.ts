import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canBoost, TIER_LIMITS } from '@/lib/packages';
import { ModelTier } from '@/lib/types';
import { rateLimit, isValidUUID } from '@/lib/rate-limit';

// Create Supabase client lazily to avoid build-time errors
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key);
}

// POST /api/boost - Activate a boost for a profile
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute per IP
    const rateLimitResult = rateLimit(request, { limit: 10, keyPrefix: 'boost' });
    if (rateLimitResult) return rateLimitResult;

    const supabase = getSupabaseClient();
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Validate profileId format
    if (!isValidUUID(profileId)) {
      return NextResponse.json(
        { error: 'Invalid profileId format' },
        { status: 400 }
      );
    }

    // Use atomic RPC function to activate boost (prevents race conditions)
    const { data, error: rpcError } = await supabase.rpc('use_boost', {
      p_profile_id: profileId,
      p_boost_duration_hours: 24
    });

    if (rpcError) {
      // Fallback to old implementation if RPC doesn't exist
      if (rpcError.code === '42883' || rpcError.message?.includes('function')) {
        console.warn('RPC function not found, using fallback:', rpcError.message);
        return fallbackBoostActivation(supabase, profileId);
      }

      console.error('Error activating boost:', rpcError);
      return NextResponse.json(
        { error: 'Failed to activate boost' },
        { status: 500 }
      );
    }

    // Parse the JSON result from the database function
    const result = data as {
      success: boolean;
      error?: string;
      error_code?: string;
      boosted_until?: string;
      boosts_remaining?: string;
      message?: string;
    };

    if (!result.success) {
      const statusCode =
        result.error_code === 'NOT_FOUND' ? 404 :
        result.error_code === 'TIER_NOT_ALLOWED' ? 403 :
        result.error_code === 'NO_BOOSTS_REMAINING' ? 403 :
        result.error_code === 'ALREADY_BOOSTED' ? 400 :
        500;

      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      boostedUntil: result.boosted_until,
      boostsRemaining: result.boosts_remaining,
      message: result.message
    });

  } catch (error) {
    console.error('Boost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fallback function for backward compatibility (has race condition)
async function fallbackBoostActivation(supabase: ReturnType<typeof getSupabaseClient>, profileId: string) {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, tier, boosts_remaining, boosted_until')
    .eq('id', profileId)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    );
  }

  const tier = (profile.tier as ModelTier) || 'free';
  const boostsRemaining = profile.boosts_remaining || 0;
  const boostedUntil = profile.boosted_until ? new Date(profile.boosted_until) : null;

  if (boostedUntil && boostedUntil > new Date()) {
    const remainingHours = Math.ceil((boostedUntil.getTime() - Date.now()) / (1000 * 60 * 60));
    return NextResponse.json(
      { error: `Profile is already boosted. ${remainingHours} hours remaining.` },
      { status: 400 }
    );
  }

  if (!canBoost(tier)) {
    return NextResponse.json(
      { error: 'Your tier does not support boosts. Upgrade to Premium or Elite.' },
      { status: 403 }
    );
  }

  const limits = TIER_LIMITS[tier];
  if (limits.boostsPerMonth !== Infinity && boostsRemaining <= 0) {
    return NextResponse.json(
      { error: 'No boosts remaining this month.' },
      { status: 403 }
    );
  }

  const newBoostedUntil = new Date();
  newBoostedUntil.setHours(newBoostedUntil.getHours() + 24);

  const updateData: Record<string, unknown> = {
    boosted_until: newBoostedUntil.toISOString()
  };

  if (limits.boostsPerMonth !== Infinity) {
    updateData.boosts_remaining = boostsRemaining - 1;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profileId);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to activate boost' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    boostedUntil: newBoostedUntil.toISOString(),
    boostsRemaining: limits.boostsPerMonth === Infinity ? 'unlimited' : boostsRemaining - 1,
    message: 'Boost activated!'
  });
}

// GET /api/boost?profileId=xxx - Get boost status
export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute per IP
    const rateLimitResult = rateLimit(request, { limit: 10, keyPrefix: 'boost-get' });
    if (rateLimitResult) return rateLimitResult;

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    if (!isValidUUID(profileId)) {
      return NextResponse.json(
        { error: 'Invalid profileId format' },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, tier, boosts_remaining, boosted_until')
      .eq('id', profileId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const tier = (profile.tier as ModelTier) || 'free';
    const limits = TIER_LIMITS[tier];
    const boostedUntil = profile.boosted_until ? new Date(profile.boosted_until) : null;
    const isBoosted = boostedUntil && boostedUntil > new Date();

    return NextResponse.json({
      tier,
      canBoost: canBoost(tier),
      isBoosted,
      boostedUntil: isBoosted ? boostedUntil?.toISOString() : null,
      boostsRemaining: limits.boostsPerMonth === Infinity ? 'unlimited' : (profile.boosts_remaining || 0),
      boostsPerMonth: limits.boostsPerMonth === Infinity ? 'unlimited' : limits.boostsPerMonth
    });

  } catch (error) {
    console.error('Get boost status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
