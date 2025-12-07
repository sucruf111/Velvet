import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service client for storage operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getAuthenticatedUser(_request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      // Try single file upload
      const singleFile = formData.get('image') as File;
      if (singleFile) {
        files.push(singleFile);
      } else {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }
    }

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 5MB.`);
        continue;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${user.id}/${timestamp}-${randomString}.${extension}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { error } = await supabaseAdmin.storage
        .from('profile-images')
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        errors.push(`${file.name}: Upload failed - ${error.message}`);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('profile-images')
        .getPublicUrl(filename);

      uploadedUrls.push(urlData.publicUrl);
    }

    if (uploadedUrls.length === 0 && errors.length > 0) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete images
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }

    const errors: string[] = [];

    for (const url of urls) {
      // Extract path from URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/profile-images/');
      if (pathParts.length < 2) {
        errors.push(`Invalid URL format: ${url}`);
        continue;
      }

      const filePath = pathParts[1];

      // Verify user owns the file (path starts with user ID)
      if (!filePath.startsWith(user.id)) {
        errors.push(`Unauthorized to delete: ${url}`);
        continue;
      }

      const { error } = await supabaseAdmin.storage
        .from('profile-images')
        .remove([filePath]);

      if (error) {
        errors.push(`Failed to delete: ${url}`);
      }
    }

    return NextResponse.json({
      success: true,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
