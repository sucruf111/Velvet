import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TrackType = 'view' | 'contact' | 'search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, type } = body as { profileId: string; type: TrackType };

    if (!profileId || !type) {
      return NextResponse.json({ error: 'Missing profileId or type' }, { status: 400 });
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

    // First get current value
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select(field)
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Increment the value
    const currentValue = (profile as unknown as Record<string, number>)[field] || 0;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [field]: currentValue + 1 })
      .eq('id', profileId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
