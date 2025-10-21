-- Add UPDATE policy for nutritionists to update their own profile
CREATE POLICY "Nutritionists can update own profile"
ON public.nutritionists
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());