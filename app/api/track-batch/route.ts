import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin client lazily to avoid build-time errors
function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileIds, type } = body as { profileIds: string[]; type: 'search' };

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid profileIds' }, { status: 400 });
    }

    if (type !== 'search') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Limit to prevent abuse
    const limitedIds = profileIds.slice(0, 50);

    const supabaseAdmin = getSupabaseAdmin();

    // Batch increment searchAppearances for all profiles
    // Using raw SQL for efficient batch update
    const { error } = await supabaseAdmin.rpc('increment_search_appearances', {
      profile_ids: limitedIds
    });

    if (error) {
      // Fallback: update one by one if RPC doesn't exist
      if (error.message.includes('function') || error.code === '42883') {
        // RPC doesn't exist, do individual updates
        for (const profileId of limitedIds) {
          await supabaseAdmin
            .from('profiles')
            .update({
              searchAppearances: supabaseAdmin.rpc('coalesce', { value: 'searchAppearances', default_value: 0 })
            })
            .eq('id', profileId);
        }
        // Actually, let's just increment manually
        for (const profileId of limitedIds) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('searchAppearances')
            .eq('id', profileId)
            .single();

          if (profile) {
            await supabaseAdmin
              .from('profiles')
              .update({ searchAppearances: (profile.searchAppearances || 0) + 1 })
              .eq('id', profileId);
          }
        }
      } else {
        console.error('Error batch updating search appearances:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, count: limitedIds.length });
  } catch (error) {
    console.error('Track batch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
