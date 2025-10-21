-- Drop the duplicate trigger that was causing double execution of handle_new_user()
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- The original trigger on_auth_user_created_handle remains and will continue to work correctly
-- This ensures handle_new_user() is called only once per new user