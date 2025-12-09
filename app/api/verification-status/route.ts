import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Create admin client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
    }

    // Verify the requesting user owns this profile
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('userId')
      .eq('id', profileId)
      .single();

    if (!profile || profile.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch verification application using admin client (bypasses RLS)
    const { data: verApp, error } = await supabaseAdmin
      .from('verification_applications')
      .select('*')
      .eq('profileId', profileId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching verification:', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({ data: verApp });
  } catch (error) {
    console.error('Verification status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
