import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, isValidUUID } from '@/lib/rate-limit';

// Create admin client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TrackType = 'view' | 'contact' | 'search';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 60 requests per minute per IP
    const rateLimitResult = rateLimit(request, { limit: 60, keyPrefix: 'track' });
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const { profileId, type } = body as { profileId: string; type: TrackType };

    if (!profileId || !type) {
      return NextResponse.json({ error: 'Missing profileId or type' }, { status: 400 });
    }

    // Validate profileId format
    if (!isValidUUID(profileId)) {
      return NextResponse.json({ error: 'Invalid profileId format' }, { status: 400 });
    }

    // Validate type
    if (!['view', 'contact', 'search'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Determine which field to increment
    let field: string;
    switch (type) {
      case 'view':
        field = 'clicks';
        break;
      case 'contact':
        field = 'contactClicks';
        break;
      case 'search':
        field = 'searchAppearances';
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Use atomic RPC function to increment (prevents race conditions)
    const { error: rpcError } = await supabase.rpc('increment_profile_field', {
      p_profile_id: profileId,
      p_field_name: field,
      p_amount: 1
    });

    if (rpcError) {
      // Fallback to read-then-write if RPC doesn't exist yet
      if (rpcError.code === '42883' || rpcError.message?.includes('function')) {
        console.warn('RPC function not found, using fallback:', rpcError.message);

        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select(field)
          .eq('id', profileId)
          .single();

        if (fetchError || !profile) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const currentValue = (profile as unknown as Record<string, number>)[field] || 0;
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ [field]: currentValue + 1 })
          .eq('id', profileId);

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
        }
      } else {
        console.error('Error incrementing field:', rpcError);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
