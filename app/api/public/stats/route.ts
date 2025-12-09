import { NextResponse } from 'next/server';
import { getProfiles } from '@/lib/supabase';

// Public endpoint to get basic platform statistics
// No authentication required - only returns public-safe data
export async function GET() {
  try {
    const profiles = await getProfiles();
    const activeCount = profiles.length;

    return NextResponse.json({
      activeProfiles: activeCount,
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json({ activeProfiles: 0 });
  }
}
