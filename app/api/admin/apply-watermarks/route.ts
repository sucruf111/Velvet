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

const UPLOAD_DIR = path.join(process.cwd(), 'public');

// POST /api/admin/apply-watermarks - Apply watermarks to existing images
export async function POST(request: NextRequest) {
  try {
    // Temporarily allow all authenticated users (for initial watermark batch)
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
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
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

    // Get already watermarked images to avoid duplicates
    const { data: alreadyWatermarked } = await supabaseAdmin
      .from('watermarked_images')
      .select('image_url');

    const watermarkedSet = new Set(
      (alreadyWatermarked || []).map(w => w.image_url)
    );

    const results = {
      processed: 0,
      skipped: 0,
      alreadyWatermarked: 0,
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

        // Skip already watermarked images (prevents duplicate watermarks!)
        if (watermarkedSet.has(imageUrl)) {
          results.alreadyWatermarked++;
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

            // Track this image as watermarked to prevent future duplicates
            await supabaseAdmin.from('watermarked_images').upsert({
              image_url: imageUrl,
              profile_id: profile.id,
              watermarked_at: new Date().toISOString()
            });
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

    console.log(`[ADMIN] Watermarks applied by ${user.email}: ${results.processed} processed, ${results.alreadyWatermarked} already done, ${results.skipped} skipped, ${results.errors.length} errors`);

    return NextResponse.json({
      success: true,
      dryRun,
      ...results,
      message: dryRun
        ? `Dry run: Would process ${results.processed} images (${results.alreadyWatermarked} already watermarked)`
        : `Processed ${results.processed} images with watermarks (${results.alreadyWatermarked} already watermarked, skipped)`
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
    // Temporarily allow all authenticated users (for initial watermark batch)
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
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
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

    // Get already watermarked images
    const { data: alreadyWatermarked } = await supabaseAdmin
      .from('watermarked_images')
      .select('image_url');

    const watermarkedSet = new Set(
      (alreadyWatermarked || []).map(w => w.image_url)
    );

    let totalImages = 0;
    let localImages = 0;
    let externalImages = 0;
    let missingFiles = 0;
    let alreadyWatermarkedCount = 0;
    let needsWatermarking = 0;
    const profilesWithImages: { name: string; count: number; needsWatermark: number }[] = [];

    for (const profile of profiles || []) {
      const images = profile.images as string[] || [];
      let profileLocalImages = 0;
      let profileNeedsWatermark = 0;

      for (const imageUrl of images) {
        totalImages++;

        if (imageUrl.startsWith('/uploads/')) {
          localImages++;
          profileLocalImages++;

          const filePath = path.join(UPLOAD_DIR, imageUrl);
          if (!existsSync(filePath)) {
            missingFiles++;
          } else if (watermarkedSet.has(imageUrl)) {
            alreadyWatermarkedCount++;
          } else if (!imageUrl.toLowerCase().endsWith('.gif')) {
            needsWatermarking++;
            profileNeedsWatermark++;
          }
        } else {
          externalImages++;
        }
      }

      if (profileLocalImages > 0) {
        profilesWithImages.push({
          name: profile.name || profile.id,
          count: profileLocalImages,
          needsWatermark: profileNeedsWatermark
        });
      }
    }

    return NextResponse.json({
      totalImages,
      localImages,
      externalImages,
      missingFiles,
      alreadyWatermarked: alreadyWatermarkedCount,
      needsWatermarking,
      profilesWithImages,
      message: `Found ${needsWatermarking} images needing watermarks (${alreadyWatermarkedCount} already done)`
    });

  } catch (error) {
    console.error('Admin get watermark stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
