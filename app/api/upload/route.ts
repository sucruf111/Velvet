import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Directory where uploads will be stored (inside public folder for serving)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'profile-images');

async function getAuthenticatedUser() {
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

// Ensure upload directory exists
async function ensureUploadDir(userId: string) {
  const userDir = path.join(UPLOAD_DIR, userId);
  if (!existsSync(userDir)) {
    await mkdir(userDir, { recursive: true });
  }
  return userDir;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getAuthenticatedUser();
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

    // Ensure user's upload directory exists
    const userDir = await ensureUploadDir(user.id);

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
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `${timestamp}-${randomString}.${extension}`;
      const filePath = path.join(userDir, filename);

      try {
        // Convert File to Buffer and save
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filePath, buffer);

        // Generate public URL (relative to public folder)
        const publicUrl = `/uploads/profile-images/${user.id}/${filename}`;
        uploadedUrls.push(publicUrl);
      } catch (writeError) {
        console.error('Write error:', writeError);
        errors.push(`${file.name}: Failed to save file`);
      }
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
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }

    const errors: string[] = [];

    for (const url of urls) {
      try {
        // Extract path from URL (e.g., /uploads/profile-images/user-id/filename.jpg)
        const urlPath = url.startsWith('/') ? url : new URL(url).pathname;
        const pathParts = urlPath.split('/uploads/profile-images/');

        if (pathParts.length < 2) {
          errors.push(`Invalid URL format: ${url}`);
          continue;
        }

        const relativePath = pathParts[1]; // user-id/filename.jpg

        // Verify user owns the file (path starts with user ID)
        if (!relativePath.startsWith(user.id)) {
          errors.push(`Unauthorized to delete: ${url}`);
          continue;
        }

        // Construct full file path
        const filePath = path.join(UPLOAD_DIR, relativePath);

        // Check if file exists and delete
        if (existsSync(filePath)) {
          await unlink(filePath);
        } else {
          errors.push(`File not found: ${url}`);
        }
      } catch (deleteError) {
        console.error('Delete error:', deleteError);
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
