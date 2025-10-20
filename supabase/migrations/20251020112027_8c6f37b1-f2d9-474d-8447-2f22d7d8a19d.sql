-- Add is_default column to guidelines table
ALTER TABLE public.guidelines 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Create function to copy default guidelines to new user
CREATE OR REPLACE FUNCTION public.copy_default_guidelines(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _default_content TEXT;
BEGIN
  -- Find the most recent default guideline from any admin
  SELECT g.content INTO _default_content
  FROM public.guidelines g
  INNER JOIN public.user_roles ur ON g.user_id = ur.user_id
  WHERE g.is_default = true 
    AND ur.role = 'admin'
  ORDER BY g.updated_at DESC
  LIMIT 1;
  
  -- If default guidelines exist, copy them to the new user
  IF _default_content IS NOT NULL THEN
    INSERT INTO public.guidelines (user_id, content, is_default)
    VALUES (_user_id, _default_content, false);
  END IF;
END;
$$;

-- Update the handle_new_user trigger function to copy guidelines
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for all users
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  -- Only assign 'user' role if NOT nutritionax@gmail.com
  -- (admin role is handled by assign_admin_role trigger)
  IF NEW.email != 'nutritionax@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  -- Copy default guidelines to new user
  PERFORM copy_default_guidelines(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Drop the old policy that might conflict
DROP POLICY IF EXISTS "Users can manage own guidelines" ON public.guidelines;

-- Create updated policy that allows admins to set is_default
CREATE POLICY "Users can manage own guidelines"
ON public.guidelines
FOR ALL
USING (
  (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
  AND (
    -- Regular users can't set is_default to true
    (NOT is_default) OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Create index for faster queries on is_default
CREATE INDEX IF NOT EXISTS idx_guidelines_is_default ON public.guidelines(is_default) WHERE is_default = true;