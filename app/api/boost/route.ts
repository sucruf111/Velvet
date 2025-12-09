import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canBoost, TIER_LIMITS } from '@/lib/packages';
import { ModelTier } from '@/lib/types';

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
    const supabase = getSupabaseClient();
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Get the profile
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

    // Check if already boosted
    if (boostedUntil && boostedUntil > new Date()) {
      const remainingHours = Math.ceil((boostedUntil.getTime() - Date.now()) / (1000 * 60 * 60));
      return NextResponse.json(
        { error: `Profile is already boosted. ${remainingHours} hours remaining.` },
        { status: 400 }
      );
    }

    // Check tier allows boosts
    if (!canBoost(tier)) {
      return NextResponse.json(
        { error: 'Your tier does not support boosts. Upgrade to Premium or Elite.' },
        { status: 403 }
      );
    }

    // Check if elite (unlimited boosts) or if boosts remaining
    const limits = TIER_LIMITS[tier];
    if (limits.boostsPerMonth !== Infinity && boostsRemaining <= 0) {
      return NextResponse.json(
        { error: 'No boosts remaining this month. Wait for next month or upgrade to Elite for unlimited boosts.' },
        { status: 403 }
      );
    }

    // Calculate new boosted_until (24 hours from now)
    const newBoostedUntil = new Date();
    newBoostedUntil.setHours(newBoostedUntil.getHours() + 24);

    // Update profile
    const updateData: Record<string, unknown> = {
      boosted_until: newBoostedUntil.toISOString()
    };

    // Decrement boosts_remaining only for non-elite tiers
    if (limits.boostsPerMonth !== Infinity) {
      updateData.boosts_remaining = boostsRemaining - 1;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate boost' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      boostedUntil: newBoostedUntil.toISOString(),
      boostsRemaining: limits.boostsPerMonth === Infinity ? 'unlimited' : boostsRemaining - 1,
      message: 'Boost activated! Your profile will appear at the top of search results for 24 hours.'
    });

  } catch (error) {
    console.error('Boost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/boost?profileId=xxx - Get boost status
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
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
