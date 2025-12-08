import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const ccbillSalt = process.env.CCBILL_SALT || '';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Plan mapping from CCBill form IDs to plan types
const planMapping: Record<string, { type: string; name: string; price: number }> = {
  // Model plans
  'model-basic': { type: 'model-basic', name: 'Model Basic', price: 29 },
  'model-premium': { type: 'model-premium', name: 'Model Premium', price: 59 },
  'model-vip': { type: 'model-vip', name: 'Model VIP', price: 99 },
  // Agency plans
  'agency-starter': { type: 'agency-starter', name: 'Agency Starter', price: 149 },
  'agency-professional': { type: 'agency-professional', name: 'Agency Professional', price: 299 },
  'agency-enterprise': { type: 'agency-enterprise', name: 'Agency Enterprise', price: 499 },
};

function verifySignature(data: Record<string, string>, receivedHash: string): boolean {
  if (!ccbillSalt) {
    console.warn('CCBILL_SALT not configured, skipping signature verification');
    return true;
  }

  const sortedKeys = Object.keys(data).sort();
  const stringToHash = sortedKeys.map(key => `${key}=${data[key]}`).join('&') + ccbillSalt;
  const calculatedHash = crypto.createHash('sha256').update(stringToHash).digest('hex');

  return calculatedHash === receivedHash;
}

async function handleNewSale(data: Record<string, string>) {
  const supabase = getSupabaseAdmin();
  const { subscriptionId, email, formName, transactionId, initialPrice, recurringPrice } = data;

  const plan = planMapping[formName] || { type: formName, name: formName, price: parseFloat(initialPrice) || 0 };

  // Find user by email
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (!users) {
    console.error('User not found for email:', email);
    return;
  }

  const userId = users.id;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Create subscription record
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    ccbill_subscription_id: subscriptionId,
    plan_type: plan.type,
    plan_name: plan.name,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    amount: parseFloat(recurringPrice) || plan.price,
    currency: 'EUR',
    updated_at: now.toISOString(),
  }, {
    onConflict: 'user_id',
  });

  // Update user's subscription status in profiles
  await supabase.from('profiles').update({
    subscription_status: 'active',
    subscription_plan: plan.type,
    updated_at: now.toISOString(),
  }).eq('id', userId);

  // Record the transaction
  await supabase.from('transactions').insert({
    user_id: userId,
    ccbill_transaction_id: transactionId,
    ccbill_subscription_id: subscriptionId,
    type: 'new_sale',
    amount: parseFloat(initialPrice) || plan.price,
    currency: 'EUR',
    status: 'completed',
    plan_type: plan.type,
    created_at: now.toISOString(),
  });

  console.log(`New sale processed: ${email}, plan: ${plan.type}`);
}

async function handleRenewal(data: Record<string, string>) {
  const supabase = getSupabaseAdmin();
  const { subscriptionId, transactionId, billedAmount } = data;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('ccbill_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    console.error('Subscription not found:', subscriptionId);
    return;
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Update subscription period
  await supabase.from('subscriptions').update({
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    status: 'active',
    updated_at: now.toISOString(),
  }).eq('ccbill_subscription_id', subscriptionId);

  // Record the transaction
  await supabase.from('transactions').insert({
    user_id: subscription.user_id,
    ccbill_transaction_id: transactionId,
    ccbill_subscription_id: subscriptionId,
    type: 'renewal',
    amount: parseFloat(billedAmount) || subscription.amount,
    currency: 'EUR',
    status: 'completed',
    plan_type: subscription.plan_type,
    created_at: now.toISOString(),
  });

  console.log(`Renewal processed for subscription: ${subscriptionId}`);
}

async function handleCancellation(data: Record<string, string>) {
  const supabase = getSupabaseAdmin();
  const { subscriptionId, reason } = data;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('ccbill_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    console.error('Subscription not found:', subscriptionId);
    return;
  }

  const now = new Date();

  // Update subscription status
  await supabase.from('subscriptions').update({
    status: 'cancelled',
    cancelled_at: now.toISOString(),
    cancellation_reason: reason || 'user_requested',
    updated_at: now.toISOString(),
  }).eq('ccbill_subscription_id', subscriptionId);

  // Note: Profile subscription_status stays active until period_end
  console.log(`Cancellation processed for subscription: ${subscriptionId}`);
}

async function handleExpiration(data: Record<string, string>) {
  const supabase = getSupabaseAdmin();
  const { subscriptionId } = data;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('ccbill_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    console.error('Subscription not found:', subscriptionId);
    return;
  }

  const now = new Date();

  // Update subscription status
  await supabase.from('subscriptions').update({
    status: 'expired',
    updated_at: now.toISOString(),
  }).eq('ccbill_subscription_id', subscriptionId);

  // Update user's subscription status
  await supabase.from('profiles').update({
    subscription_status: 'expired',
    updated_at: now.toISOString(),
  }).eq('id', subscription.user_id);

  console.log(`Expiration processed for subscription: ${subscriptionId}`);
}

async function handleChargeback(data: Record<string, string>) {
  const supabase = getSupabaseAdmin();
  const { subscriptionId, transactionId, amount } = data;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('ccbill_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    console.error('Subscription not found:', subscriptionId);
    return;
  }

  const now = new Date();

  // Update subscription status
  await supabase.from('subscriptions').update({
    status: 'suspended',
    updated_at: now.toISOString(),
  }).eq('ccbill_subscription_id', subscriptionId);

  // Update user's subscription status
  await supabase.from('profiles').update({
    subscription_status: 'suspended',
    updated_at: now.toISOString(),
  }).eq('id', subscription.user_id);

  // Record the chargeback
  await supabase.from('transactions').insert({
    user_id: subscription.user_id,
    ccbill_transaction_id: transactionId,
    ccbill_subscription_id: subscriptionId,
    type: 'chargeback',
    amount: -(parseFloat(amount) || 0),
    currency: 'EUR',
    status: 'completed',
    plan_type: subscription.plan_type,
    created_at: now.toISOString(),
  });

  console.log(`Chargeback processed for subscription: ${subscriptionId}`);
}

async function handleRefund(data: Record<string, string>) {
  const supabase = getSupabaseAdmin();
  const { subscriptionId, transactionId, amount } = data;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('ccbill_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    console.error('Subscription not found:', subscriptionId);
    return;
  }

  const now = new Date();

  // Record the refund
  await supabase.from('transactions').insert({
    user_id: subscription.user_id,
    ccbill_transaction_id: transactionId,
    ccbill_subscription_id: subscriptionId,
    type: 'refund',
    amount: -(parseFloat(amount) || 0),
    currency: 'EUR',
    status: 'completed',
    plan_type: subscription.plan_type,
    created_at: now.toISOString(),
  });

  console.log(`Refund processed for subscription: ${subscriptionId}`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const data: Record<string, string> = {};

    params.forEach((value, key) => {
      data[key] = value;
    });

    console.log('CCBill webhook received:', data.eventType);

    // Verify signature if provided
    if (data.responseDigest && !verifySignature(data, data.responseDigest)) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const eventType = data.eventType || data['X-Event-Type'] || '';

    switch (eventType) {
      case 'NewSaleSuccess':
        await handleNewSale(data);
        break;
      case 'RenewalSuccess':
        await handleRenewal(data);
        break;
      case 'Cancellation':
        await handleCancellation(data);
        break;
      case 'Expiration':
        await handleExpiration(data);
        break;
      case 'Chargeback':
        await handleChargeback(data);
        break;
      case 'Refund':
        await handleRefund(data);
        break;
      default:
        console.log('Unknown event type:', eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CCBill webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also handle GET for CCBill's postback verification
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  return NextResponse.json({ status: 'CCBill webhook endpoint active' });
}
