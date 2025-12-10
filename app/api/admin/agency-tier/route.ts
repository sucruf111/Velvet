import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AgencyTier } from '@/lib/types';

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

// PATCH /api/admin/agency-tier - Update an agency's tier
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
    const { agencyId, tier, modelLimit, expiresAt } = await request.json();

    // Validate required fields
    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    if (!tier || !['none', 'starter', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be none, starter, or pro' },
        { status: 400 }
      );
    }

    // Get the current agency
    const { data: agency, error: fetchError } = await supabaseAdmin
      .from('agencies')
      .select('id, name, subscriptionTier')
      .eq('id', agencyId)
      .single();

    if (fetchError || !agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    const oldTier = agency.subscriptionTier || 'none';

    // Prepare update data
    const updateData: Record<string, unknown> = {
      subscriptionTier: tier as AgencyTier,
      modelLimit: modelLimit || 0,
    };

    // Set subscription expiry if provided
    if (expiresAt) {
      updateData.subscriptionExpiresAt = expiresAt;
    }

    // Update the agency
    const { error: updateError } = await supabaseAdmin
      .from('agencies')
      .update(updateData)
      .eq('id', agencyId);

    if (updateError) {
      console.error('Error updating agency tier:', updateError);
      return NextResponse.json(
        { error: 'Failed to update agency tier' },
        { status: 500 }
      );
    }

    // Log the tier change for audit trail
    console.log(`[ADMIN] Agency tier changed: ${agency.name} (${agencyId}) ${oldTier} -> ${tier} by ${admin.email}`);

    return NextResponse.json({
      success: true,
      agencyId,
      oldTier,
      newTier: tier,
      modelLimit: modelLimit || 0,
      expiresAt: expiresAt || null,
      message: `Agency tier updated from ${oldTier} to ${tier}`
    });

  } catch (error) {
    console.error('Admin agency-tier error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/agency-tier?agencyId=xxx - Get agency tier details
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
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    const { data: agency, error } = await supabaseAdmin
      .from('agencies')
      .select('id, name, subscriptionTier, modelLimit, subscriptionExpiresAt')
      .eq('id', agencyId)
      .single();

    if (error || !agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      agencyId: agency.id,
      name: agency.name,
      tier: agency.subscriptionTier || 'none',
      modelLimit: agency.modelLimit || 0,
      subscriptionExpiresAt: agency.subscriptionExpiresAt
    });

  } catch (error) {
    console.error('Admin get agency-tier error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
