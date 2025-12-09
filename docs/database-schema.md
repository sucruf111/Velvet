# Velvet Berlin - Supabase Database Schema

## Existing Tables

### `profiles`
Main table for escort profiles.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique profile identifier |
| name | TEXT | Display name |
| agencyId | TEXT | Reference to agency (optional) |
| age | INTEGER | Age |
| district | TEXT | Berlin district (enum) |
| priceStart | DECIMAL | Starting price per hour |
| languages | TEXT[] | Array of languages spoken |
| services | TEXT[] | Array of service types |
| description | TEXT | Bio/description |
| images | TEXT[] | Array of image URLs |
| isPremium | BOOLEAN | Premium listing status |
| isNew | BOOLEAN | New badge status |
| isVerified | BOOLEAN | Verification status |
| isVelvetChoice | BOOLEAN | Velvet Choice badge |
| isDisabled | BOOLEAN | Profile disabled/hidden |
| clicks | INTEGER | Total profile views |
| contactClicks | INTEGER | Contact button clicks |
| searchAppearances | INTEGER | Search result appearances |
| phone | TEXT | Phone number |
| whatsapp | TEXT | WhatsApp number |
| telegram | TEXT | Telegram handle |
| height | INTEGER | Height in cm |
| dressSize | TEXT | Dress size |
| shoeSize | INTEGER | Shoe size |
| braSize | TEXT | Bra size |
| reviews | JSONB | Array of reviews |
| availability | TEXT[] | Available days/times |
| showSchedule | BOOLEAN | Show schedule publicly |
| lastActive | TIMESTAMPTZ | Last activity timestamp |
| isOnline | BOOLEAN | Currently online status |
| createdAt | TIMESTAMPTZ | Profile creation date |
| visitType | TEXT | 'incall', 'outcall', or 'both' |
| email | TEXT | Contact email |
| subscription_status | TEXT | 'active', 'expired', 'suspended', etc. |
| subscription_plan | TEXT | Current plan type |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

### `agencies`
Table for escort agencies.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique agency identifier |
| userId | TEXT | Owner user ID |
| name | TEXT | Agency name |
| description | TEXT | Agency description |
| logo | TEXT | Logo URL |
| banner | TEXT | Banner image URL |
| image | TEXT | Main image URL |
| website | TEXT | Website URL |
| phone | TEXT | Phone number |
| whatsapp | TEXT | WhatsApp number |
| telegram | TEXT | Telegram handle |
| email | TEXT | Contact email |
| district | TEXT | Berlin district |
| isFeatured | BOOLEAN | Featured agency status |
| reviews | JSONB | Array of reviews |

---

### `subscriptions`
Subscription records for paid plans.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Subscription ID |
| user_id | TEXT | Reference to profiles.id |
| ccbill_subscription_id | TEXT | CCBill subscription ID |
| plan_type | TEXT | 'model-basic', 'model-premium', etc. |
| plan_name | TEXT | Human-readable plan name |
| status | TEXT | 'active', 'cancelled', 'expired', 'suspended' |
| current_period_start | TIMESTAMPTZ | Billing period start |
| current_period_end | TIMESTAMPTZ | Billing period end |
| amount | DECIMAL | Monthly amount |
| currency | TEXT | Currency code (EUR) |
| cancelled_at | TIMESTAMPTZ | Cancellation timestamp |
| cancellation_reason | TEXT | Reason for cancellation |
| created_at | TIMESTAMPTZ | Record creation |
| updated_at | TIMESTAMPTZ | Last update |

---

## Tables to Create

### `transactions`
Payment transaction records (from CCBill webhooks).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Transaction ID (auto-generated) |
| user_id | TEXT | Reference to profiles.id |
| ccbill_transaction_id | TEXT | CCBill transaction ID |
| ccbill_subscription_id | TEXT | CCBill subscription ID |
| type | TEXT | 'new_sale', 'renewal', 'refund', 'chargeback' |
| amount | DECIMAL(10,2) | Transaction amount (negative for refunds) |
| currency | TEXT | Currency code (default: 'EUR') |
| status | TEXT | 'pending', 'completed', 'failed', 'refunded' |
| plan_type | TEXT | Plan type at time of transaction |
| created_at | TIMESTAMPTZ | Transaction timestamp |

---

### `verification_applications`
Verification requests from escorts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Application ID (auto-generated) |
| profile_id | TEXT | Reference to profiles.id |
| user_id | UUID | Reference to auth.users.id |
| status | TEXT | 'pending', 'approved', 'rejected' |
| id_photo_url | TEXT | ID document photo URL |
| selfie_with_id_url | TEXT | Selfie with ID photo URL |
| notes | TEXT | User notes/comments |
| admin_notes | TEXT | Admin notes/rejection reason |
| reviewed_at | TIMESTAMPTZ | Review timestamp |
| reviewed_by | UUID | Admin user ID who reviewed |
| createdAt | TIMESTAMPTZ | Submission timestamp |
| updatedAt | TIMESTAMPTZ | Last update timestamp |

---

## SQL Used to Create Tables (for reference)

```sql
-- TRANSACTIONS TABLE
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  ccbill_transaction_id TEXT,
  ccbill_subscription_id TEXT,
  type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  plan_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (true);
CREATE POLICY "transactions_service_role" ON transactions FOR ALL USING (auth.role() = 'service_role');


-- VERIFICATION_APPLICATIONS TABLE
CREATE TABLE verification_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT NOT NULL,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  id_photo_url TEXT,
  selfie_with_id_url TEXT,
  notes TEXT,
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verif_profile_id ON verification_applications(profile_id);
CREATE INDEX idx_verif_status ON verification_applications(status);

ALTER TABLE verification_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verif_select_all" ON verification_applications FOR SELECT USING (true);
CREATE POLICY "verif_insert_all" ON verification_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "verif_update_all" ON verification_applications FOR UPDATE USING (true);
CREATE POLICY "verif_service_role" ON verification_applications FOR ALL USING (auth.role() = 'service_role');
```

---

## Notes

1. **profiles.id is TEXT, not UUID** - This affects foreign key references
2. **subscriptions.user_id is TEXT** - References profiles.id, not auth.users.id
3. **No foreign keys to profiles** - Avoided to prevent type mismatch errors
4. **Service role policies** - Allow webhooks and admin operations to bypass RLS
5. **camelCase columns** - `createdAt`/`updatedAt` in verification_applications to match TypeScript interface
