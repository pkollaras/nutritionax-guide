-- Fix security issue: Restrict profiles table access
-- Users can only view their own profile, admins can view all profiles

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restrictive policy
CREATE POLICY "Users can view own profile and admins can view all"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = id) OR has_role(auth.uid(), 'admin'::app_role)
);