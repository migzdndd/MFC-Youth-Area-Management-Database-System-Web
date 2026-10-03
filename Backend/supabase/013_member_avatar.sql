/*
  Migration 013: Member and Profile Avatar URL Support

  What it Does: Simple non IT Terms
  Adds a photo link column to the member and user tables so members can display
  their profile pictures throughout the application.
*/
alter table public.members add column if not exists avatar_url text;

-- Add profile picture column to user_profiles table (nullable)
alter table public.user_profiles add column if not exists avatar_url text;

-- Note: These columns store the URL of the profile picture. 
-- The frontend should use these URLs for displaying profile pictures.
-- Existing users will have NULL for this field until they upload a new profile picture.
