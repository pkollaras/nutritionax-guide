-- Fix infinite recursion in RLS policies for nutritionists table
-- Remove the problematic policy that causes circular dependency
DROP POLICY IF EXISTS "Clients can view their nutritionists info" ON public.nutritionists;

-- Remove duplicate policies (they do the same thing)
DROP POLICY IF EXISTS "Nutritionists can view own profile" ON public.nutritionists;
DROP POLICY IF EXISTS "Nutritionists view own profile" ON public.nutritionists;

-- Create a security definer function to check client-nutritionist relationship
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.client_can_view_nutritionist(_nutritionist_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_nutritionists
    WHERE nutritionist_id = _nutritionist_id
      AND client_id = _client_id
  )
$$;

-- Create a comprehensive policy using the security definer function
-- This allows both nutritionists to view their own profile and clients to view their nutritionists
CREATE POLICY "Nutritionists and clients can view nutritionist profiles"
ON public.nutritionists
FOR SELECT
TO authenticated
USING (
  -- Nutritionists can view own profile
  user_id = auth.uid()
  OR
  -- Clients can view their assigned nutritionists
  public.client_can_view_nutritionist(id, auth.uid())
);