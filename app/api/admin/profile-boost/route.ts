import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ModelTier } from '@/lib/types';
import { TIER_LIMITS } from '@/lib/packages';

// Create admin Supabase client lazily
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key);
}

// Verify admin user
async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const role = user.user_metadata?.role;
  if (role !== 'admin') {
    return null;
  }

  return user;
}

type BoostAction = 'reset' | 'grant' | 'activate' | 'deactivate';

// PATCH /api/admin/profile-boost - Manage profile boosts
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { profileId, action } = await request.json() as { profileId: string; action: BoostAction };

    // Validate required fields
    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    if (!action || !['reset', 'grant', 'activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be reset, grant, activate, or deactivate' },
        { status: 400 }
      );
    }

    // Get the current profile
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, tier, boosts_remaining, boosted_until')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const tier = (profile.tier as ModelTier) || 'free';
    const limits = TIER_LIMITS[tier];
    const updateData: Record<string, unknown> = {};
    let message = '';

    switch (action) {
      case 'reset':
        // Reset boosts to tier default
        const defaultBoosts = limits.boostsPerMonth === Infinity ? 999 : limits.boostsPerMonth;
        updateData.boosts_remaining = defaultBoosts;
        message = `Boosts reset to ${defaultBoosts === 999 ? 'unlimited' : defaultBoosts}`;
        break;

      case 'grant':
        // Add +1 boost
        const currentBoosts = profile.boosts_remaining || 0;
        updateData.boosts_remaining = currentBoosts + 1;
        message = `Added 1 boost (now ${currentBoosts + 1})`;
        break;

      case 'activate':
        // Manually boost profile for 24 hours
        const boostUntil = new Date();
        boostUntil.setHours(boostUntil.getHours() + 24);
        updateData.boosted_until = boostUntil.toISOString();
        message = `Profile boosted until ${boostUntil.toLocaleString()}`;
        break;

      case 'deactivate':
        // Remove active boost
        updateData.boosted_until = null;
        message = 'Boost deactivated';
        break;
    }

    // Update the profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', profileId);

    if (updateError) {
      console.error('Error updating profile boost:', updateError);
      return NextResponse.json(
        { error: 'Failed to update boost' },
        { status: 500 }
      );
    }

    // Log the action
    console.log(`[ADMIN] Boost action: ${action} on ${profile.name} (${profileId}) by ${admin.email}`);

    // Fetch updated profile
    const { data: updatedProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, boosts_remaining, boosted_until')
      .eq('id', profileId)
      .single();

    return NextResponse.json({
      success: true,
      action,
      profileId,
      boostsRemaining: updatedProfile?.boosts_remaining || 0,
      boostedUntil: updatedProfile?.boosted_until || null,
      message
    });

  } catch (error) {
    console.error('Admin profile-boost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/profile-boost?profileId=xxx - Get boost status
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, tier, boosts_remaining, boosted_until')
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
      profileId: profile.id,
      name: profile.name,
      tier,
      boostsRemaining: limits.boostsPerMonth === Infinity ? 'unlimited' : (profile.boosts_remaining || 0),
      boostsPerMonth: limits.boostsPerMonth === Infinity ? 'unlimited' : limits.boostsPerMonth,
      isBoosted,
      boostedUntil: isBoosted ? boostedUntil?.toISOString() : null
    });

  } catch (error) {
    console.error('Admin get profile-boost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
