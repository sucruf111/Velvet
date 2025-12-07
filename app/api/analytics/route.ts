import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return data?.role === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await isAdmin(user.id);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'overview':
        return await getOverview();
      case 'timeline':
        return await getTimeline(searchParams);
      case 'plans':
        return await getPlanBreakdown();
      case 'top-customers':
        return await getTopCustomers();
      case 'lifecycle':
        return await getLifecycleMetrics();
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getOverview() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Total active subscriptions
  const { count: activeSubscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Total revenue this month
  const { data: thisMonthRevenue } = await supabaseAdmin
    .from('transactions')
    .select('amount')
    .gte('created_at', startOfMonth.toISOString())
    .in('type', ['new_sale', 'renewal'])
    .eq('status', 'completed');

  const totalRevenueThisMonth = thisMonthRevenue?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  // Total revenue last month
  const { data: lastMonthRevenue } = await supabaseAdmin
    .from('transactions')
    .select('amount')
    .gte('created_at', startOfLastMonth.toISOString())
    .lt('created_at', endOfLastMonth.toISOString())
    .in('type', ['new_sale', 'renewal'])
    .eq('status', 'completed');

  const totalRevenueLastMonth = lastMonthRevenue?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  // New subscriptions this month
  const { count: newSubscriptionsThisMonth } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());

  // Cancelled subscriptions this month
  const { count: cancelledThisMonth } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .gte('cancelled_at', startOfMonth.toISOString());

  // Calculate MRR (Monthly Recurring Revenue)
  const { data: activeSubsForMRR } = await supabaseAdmin
    .from('subscriptions')
    .select('amount')
    .eq('status', 'active');

  const mrr = activeSubsForMRR?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

  // Churn rate
  const churnRate = activeSubscriptions && activeSubscriptions > 0
    ? ((cancelledThisMonth || 0) / activeSubscriptions * 100).toFixed(2)
    : '0.00';

  return NextResponse.json({
    overview: {
      activeSubscriptions: activeSubscriptions || 0,
      revenueThisMonth: totalRevenueThisMonth,
      revenueLastMonth: totalRevenueLastMonth,
      revenueGrowth: totalRevenueLastMonth > 0
        ? (((totalRevenueThisMonth - totalRevenueLastMonth) / totalRevenueLastMonth) * 100).toFixed(2)
        : '0.00',
      newSubscriptionsThisMonth: newSubscriptionsThisMonth || 0,
      cancelledThisMonth: cancelledThisMonth || 0,
      mrr,
      churnRate,
    },
  });
}

async function getTimeline(searchParams: URLSearchParams) {
  const days = parseInt(searchParams.get('days') || '30');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('amount, type, created_at')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')
    .order('created_at', { ascending: true });

  // Group by date
  const timeline: Record<string, { revenue: number; newSales: number; renewals: number }> = {};

  transactions?.forEach((t) => {
    const date = t.created_at.split('T')[0];
    if (!timeline[date]) {
      timeline[date] = { revenue: 0, newSales: 0, renewals: 0 };
    }
    if (t.type === 'new_sale') {
      timeline[date].revenue += t.amount || 0;
      timeline[date].newSales += 1;
    } else if (t.type === 'renewal') {
      timeline[date].revenue += t.amount || 0;
      timeline[date].renewals += 1;
    }
  });

  return NextResponse.json({ timeline });
}

async function getPlanBreakdown() {
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_type, plan_name, amount, status')
    .eq('status', 'active');

  const breakdown: Record<string, { count: number; revenue: number; name: string }> = {};

  subscriptions?.forEach((s) => {
    if (!breakdown[s.plan_type]) {
      breakdown[s.plan_type] = { count: 0, revenue: 0, name: s.plan_name };
    }
    breakdown[s.plan_type].count += 1;
    breakdown[s.plan_type].revenue += s.amount || 0;
  });

  return NextResponse.json({ breakdown });
}

async function getTopCustomers() {
  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select(`
      user_id,
      amount,
      profiles:user_id (
        email,
        name
      )
    `)
    .in('type', ['new_sale', 'renewal'])
    .eq('status', 'completed');

  // Group by user
  const customerTotals: Record<string, { total: number; email: string; name: string }> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions?.forEach((t: any) => {
    if (!customerTotals[t.user_id]) {
      customerTotals[t.user_id] = {
        total: 0,
        email: t.profiles?.email || 'Unknown',
        name: t.profiles?.name || 'Unknown',
      };
    }
    customerTotals[t.user_id].total += t.amount || 0;
  });

  // Sort and get top 10
  const topCustomers = Object.entries(customerTotals)
    .map(([userId, data]) => ({
      userId,
      ...data,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return NextResponse.json({ topCustomers });
}

async function getLifecycleMetrics() {
  // Average subscription duration for cancelled subscriptions
  const { data: cancelledSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('created_at, cancelled_at')
    .eq('status', 'cancelled')
    .not('cancelled_at', 'is', null);

  let totalDays = 0;
  let count = 0;

  cancelledSubs?.forEach((s) => {
    if (s.cancelled_at) {
      const start = new Date(s.created_at);
      const end = new Date(s.cancelled_at);
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += days;
      count += 1;
    }
  });

  const avgSubscriptionDuration = count > 0 ? Math.round(totalDays / count) : 0;

  // Subscription status distribution
  const { data: allSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('status');

  const statusDistribution: Record<string, number> = {};
  allSubs?.forEach((s) => {
    statusDistribution[s.status] = (statusDistribution[s.status] || 0) + 1;
  });

  return NextResponse.json({
    lifecycle: {
      avgSubscriptionDurationDays: avgSubscriptionDuration,
      statusDistribution,
      totalCancelled: count,
    },
  });
}
