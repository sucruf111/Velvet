import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Create admin Supabase client with service role
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key);
}

// Verify the requesting user is admin or the user themselves
async function verifyAuthorization(targetUserId: string): Promise<{ authorized: boolean; isAdmin: boolean; currentUserId?: string }> {
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
    return { authorized: false, isAdmin: false };
  }

  // Check if admin (from env whitelist)
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
  const isAdmin = adminUserIds.includes(user.id);

  // User can delete themselves, or admin can delete anyone
  const authorized = isAdmin || user.id === targetUserId;

  return { authorized, isAdmin, currentUserId: user.id };
}

// DELETE /api/admin/delete-user - Delete a user completely from auth and all tables
export async function DELETE(request: NextRequest) {
  try {
    const { userId, profileId, agencyId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify authorization
    const auth = await verifyAuthorization(userId);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const errors: string[] = [];

    // 1. Delete profile if exists
    if (profileId) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        errors.push(`Profile: ${profileError.message}`);
      }
    }

    // 2. Delete agency if exists
    if (agencyId) {
      // First unlink any profiles from this agency
      await supabaseAdmin
        .from('profiles')
        .update({ agencyId: null })
        .eq('agencyId', agencyId);

      const { error: agencyError } = await supabaseAdmin
        .from('agencies')
        .delete()
        .eq('id', agencyId);

      if (agencyError) {
        console.error('Error deleting agency:', agencyError);
        errors.push(`Agency: ${agencyError.message}`);
      }
    }

    // 3. Delete from custom users table
    const { error: usersTableError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (usersTableError) {
      console.error('Error deleting from users table:', usersTableError);
      errors.push(`Users table: ${usersTableError.message}`);
    }

    // 4. Delete subscriptions
    const { error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subscriptionsError) {
      console.error('Error deleting subscriptions:', subscriptionsError);
      // Non-critical, continue
    }

    // 5. Delete transactions
    const { error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('user_id', userId);

    if (transactionsError) {
      console.error('Error deleting transactions:', transactionsError);
      // Non-critical, continue
    }

    // 6. Delete activity logs
    const { error: activityError } = await supabaseAdmin
      .from('activity_logs')
      .delete()
      .eq('user_id', userId);

    if (activityError) {
      console.error('Error deleting activity logs:', activityError);
      // Non-critical, continue
    }

    // 7. Finally, delete from auth.users (this is the key step!)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      errors.push(`Auth: ${authError.message}`);

      // This is critical - if auth delete fails, return error
      return NextResponse.json(
        { error: 'Failed to delete user from authentication system', details: authError.message },
        { status: 500 }
      );
    }

    // Log the deletion
    console.log(`[USER_DELETE] User ${userId} deleted by ${auth.isAdmin ? 'admin' : 'self'} (${auth.currentUserId})`);

    return NextResponse.json({
      success: true,
      message: 'User and all associated data deleted successfully',
      warnings: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/delete-user/bulk - Bulk delete users (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    // Verify admin authorization
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

    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    if (!adminUserIds.includes(user.id)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const userId of userIds) {
      try {
        // Delete from all tables
        await supabaseAdmin.from('profiles').delete().eq('userId', userId);
        await supabaseAdmin.from('agencies').delete().eq('userId', userId);
        await supabaseAdmin.from('users').delete().eq('id', userId);
        await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
        await supabaseAdmin.from('transactions').delete().eq('user_id', userId);

        // Delete from auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
          results.push({ userId, success: false, error: authError.message });
        } else {
          results.push({ userId, success: true });
        }
      } catch (err) {
        results.push({ userId, success: false, error: String(err) });
      }
    }

    console.log(`[BULK_DELETE] ${results.filter(r => r.success).length}/${userIds.length} users deleted by admin ${user.id}`);

    return NextResponse.json({
      success: true,
      results,
      deleted: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
