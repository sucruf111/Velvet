import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { applyWatermark } from '@/lib/watermark';

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

const UPLOAD_DIR = path.join(process.cwd(), 'public');

// POST /api/admin/apply-watermarks - Apply watermarks to existing images
export async function POST(request: NextRequest) {
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
    const { dryRun = false } = await request.json().catch(() => ({}));

    // Get all profiles with images
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, images')
      .not('images', 'is', null);

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as string[],
      details: [] as { profileName: string; images: number }[]
    };

    for (const profile of profiles || []) {
      const images = profile.images as string[] || [];
      let profileProcessed = 0;

      for (const imageUrl of images) {
        // Skip external URLs (only process local uploads)
        if (!imageUrl.startsWith('/uploads/')) {
          results.skipped++;
          continue;
        }

        // Skip GIFs to preserve animation
        if (imageUrl.toLowerCase().endsWith('.gif')) {
          results.skipped++;
          continue;
        }

        const filePath = path.join(UPLOAD_DIR, imageUrl);

        if (!existsSync(filePath)) {
          results.errors.push(`File not found: ${imageUrl}`);
          continue;
        }

        try {
          if (!dryRun) {
            // Read the original image
            const originalBuffer = await readFile(filePath);

            // Apply watermark
            const watermarkedBuffer = await applyWatermark(originalBuffer);

            // Write back to same location
            await writeFile(filePath, watermarkedBuffer);
          }

          results.processed++;
          profileProcessed++;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          results.errors.push(`${imageUrl}: ${errorMsg}`);
        }
      }

      if (profileProcessed > 0) {
        results.details.push({
          profileName: profile.name || profile.id,
          images: profileProcessed
        });
      }
    }

    console.log(`[ADMIN] Watermarks applied by ${admin.email}: ${results.processed} images, ${results.skipped} skipped, ${results.errors.length} errors`);

    return NextResponse.json({
      success: true,
      dryRun,
      ...results,
      message: dryRun
        ? `Dry run: Would process ${results.processed} images`
        : `Processed ${results.processed} images with watermarks`
    });

  } catch (error) {
    console.error('Admin apply-watermarks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/apply-watermarks - Get stats about images that need watermarking
export async function GET() {
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

    // Get all profiles with images
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, images')
      .not('images', 'is', null);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    let totalImages = 0;
    let localImages = 0;
    let externalImages = 0;
    let missingFiles = 0;
    const profilesWithImages: { name: string; count: number }[] = [];

    for (const profile of profiles || []) {
      const images = profile.images as string[] || [];
      let profileLocalImages = 0;

      for (const imageUrl of images) {
        totalImages++;

        if (imageUrl.startsWith('/uploads/')) {
          localImages++;
          profileLocalImages++;

          const filePath = path.join(UPLOAD_DIR, imageUrl);
          if (!existsSync(filePath)) {
            missingFiles++;
          }
        } else {
          externalImages++;
        }
      }

      if (profileLocalImages > 0) {
        profilesWithImages.push({
          name: profile.name || profile.id,
          count: profileLocalImages
        });
      }
    }

    return NextResponse.json({
      totalImages,
      localImages,
      externalImages,
      missingFiles,
      profilesWithImages,
      message: `Found ${localImages} local images that can be watermarked`
    });

  } catch (error) {
    console.error('Admin get watermark stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
