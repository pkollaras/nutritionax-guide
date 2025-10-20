-- Add RLS policy to allow users to manage their own diet plans
CREATE POLICY "Users can manage own diet plans"
ON public.diet_plans
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);