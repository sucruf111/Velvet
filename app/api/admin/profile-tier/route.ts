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

  // Check user metadata for admin role
  const role = user.user_metadata?.role;
  if (role !== 'admin') {
    return null;
  }

  return user;
}

// PATCH /api/admin/profile-tier - Update a profile's tier
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
    const { profileId, tier, expiresAt, notes } = await request.json();

    // Notes are logged for audit purposes
    if (notes) {
      console.log(`[ADMIN] Tier change notes for ${profileId}: ${notes}`);
    }

    // Validate required fields
    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    if (!tier || !['free', 'premium', 'elite'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be free, premium, or elite' },
        { status: 400 }
      );
    }

    // Get the current profile
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, tier, name')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const oldTier = profile.tier || 'free';

    // Prepare update data
    const updateData: Record<string, unknown> = {
      tier: tier as ModelTier,
      // Set isPremium flag for backward compatibility
      isPremium: tier === 'premium' || tier === 'elite',
    };

    // Set subscription expiry if provided
    if (expiresAt) {
      updateData.subscription_expires_at = expiresAt;
    }

    // Reset boosts when upgrading tier
    if (tier !== oldTier) {
      const limits = TIER_LIMITS[tier as ModelTier];
      // Set initial boosts based on new tier
      updateData.boosts_remaining = limits.boostsPerMonth === Infinity ? 999 : limits.boostsPerMonth;
    }

    // Update the profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', profileId);

    if (updateError) {
      console.error('Error updating profile tier:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile tier' },
        { status: 500 }
      );
    }

    // Log the tier change for audit trail
    console.log(`[ADMIN] Profile tier changed: ${profile.name} (${profileId}) ${oldTier} -> ${tier} by ${admin.email}`);

    // Optionally store the note in a separate log/audit table (if needed in future)

    return NextResponse.json({
      success: true,
      profileId,
      oldTier,
      newTier: tier,
      expiresAt: expiresAt || null,
      message: `Profile tier updated from ${oldTier} to ${tier}`
    });

  } catch (error) {
    console.error('Admin profile-tier error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/profile-tier?profileId=xxx - Get profile tier details
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
      .select('id, name, tier, isPremium, boosts_remaining, boosted_until, subscription_expires_at')
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

    return NextResponse.json({
      profileId: profile.id,
      name: profile.name,
      tier,
      isPremium: profile.isPremium,
      boostsRemaining: limits.boostsPerMonth === Infinity ? 'unlimited' : (profile.boosts_remaining || 0),
      boostsPerMonth: limits.boostsPerMonth === Infinity ? 'unlimited' : limits.boostsPerMonth,
      boostedUntil: profile.boosted_until,
      subscriptionExpiresAt: profile.subscription_expires_at
    });

  } catch (error) {
    console.error('Admin get profile-tier error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
