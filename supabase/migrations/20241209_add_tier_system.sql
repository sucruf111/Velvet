-- Migration: Add 3-tier package system fields to profiles table
-- Run this in your Supabase SQL Editor

-- Add new tier system columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boosts_remaining INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_contact TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_boosted ON profiles(boosted_until) WHERE boosted_until > NOW();

-- Migrate existing isPremium profiles to premium tier
-- This preserves existing premium status
UPDATE profiles
SET tier = 'premium'
WHERE "isPremium" = true AND (tier IS NULL OR tier = 'free');

-- Add constraint to ensure tier is valid
ALTER TABLE profiles ADD CONSTRAINT valid_tier CHECK (tier IN ('free', 'premium', 'elite'));

-- Add constraint to ensure primary_contact is valid
ALTER TABLE profiles ADD CONSTRAINT valid_primary_contact CHECK (primary_contact IS NULL OR primary_contact IN ('phone', 'whatsapp', 'telegram'));

-- Set default boosts for existing premium profiles
UPDATE profiles
SET boosts_remaining = 2
WHERE tier = 'premium' AND (boosts_remaining IS NULL OR boosts_remaining = 0);

-- Comment explaining the tier system
COMMENT ON COLUMN profiles.tier IS 'User subscription tier: free (€0), premium (€99/mo), elite (€149/mo)';
COMMENT ON COLUMN profiles.boosts_remaining IS 'Number of profile boosts remaining this month (2 for premium, 999 for elite)';
COMMENT ON COLUMN profiles.boosted_until IS 'Timestamp when current boost expires (boosts last 24 hours)';
COMMENT ON COLUMN profiles.video_urls IS 'Array of video URLs (1 for premium, 3 for elite)';
COMMENT ON COLUMN profiles.primary_contact IS 'Primary contact method for free tier users (phone, whatsapp, or telegram)';
