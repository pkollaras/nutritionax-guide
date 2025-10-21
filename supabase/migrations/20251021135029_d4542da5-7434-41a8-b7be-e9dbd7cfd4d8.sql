-- Allow clients to view their nutritionists info (id, name) via client_nutritionists relationship
-- This fixes the issue where UserDiet.tsx join with nutritionists table returns null

CREATE POLICY "Clients can view their nutritionists info"
ON public.nutritionists
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT nutritionist_id 
    FROM public.client_nutritionists 
    WHERE client_id = auth.uid()
  )
);