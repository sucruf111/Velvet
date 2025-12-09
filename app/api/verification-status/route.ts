import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
    }

    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      // Return empty data instead of error - verification status is optional
      return NextResponse.json({ data: null });
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

    // Get admin client
    const supabaseAdmin = getSupabaseAdmin();

    // Check if user owns this profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('userId')
      .eq('id', profileId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ data: null });
    }

    if (!profile || profile.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch verification application using admin client (bypasses RLS)
    // Note: Table uses snake_case column names (profile_id, not profileId)
    const { data: verApp, error } = await supabaseAdmin
      .from('verification_applications')
      .select('*')
      .eq('profile_id', profileId)
      .order('"createdAt"', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching verification:', error);
      // Return null instead of error - this is not critical
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: verApp });
  } catch (error) {
    console.error('Verification status error:', error);
    // Return null data on error so the page doesn't break
    return NextResponse.json({ data: null });
  }
}
