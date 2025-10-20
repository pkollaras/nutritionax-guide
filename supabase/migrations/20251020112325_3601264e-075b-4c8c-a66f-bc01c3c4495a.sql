-- Create default_guidelines table
CREATE TABLE IF NOT EXISTS public.default_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on default_guidelines
ALTER TABLE public.default_guidelines ENABLE ROW LEVEL SECURITY;

-- Create policies for default_guidelines
CREATE POLICY "Everyone can view default guidelines"
ON public.default_guidelines
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage default guidelines"
ON public.default_guidelines
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop the policy that depends on is_default FIRST
DROP POLICY IF EXISTS "Users can manage own guidelines" ON public.guidelines;

-- Now remove is_default column from guidelines table
ALTER TABLE public.guidelines 
DROP COLUMN IF EXISTS is_default;

-- Recreate the simplified policy
CREATE POLICY "Users can manage own guidelines"
ON public.guidelines
FOR ALL
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Update copy_default_guidelines function to use new table
CREATE OR REPLACE FUNCTION public.copy_default_guidelines(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _default_content TEXT;
BEGIN
  -- Get the default guideline content
  SELECT content INTO _default_content
  FROM public.default_guidelines
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If default guidelines exist, copy them to the new user
  IF _default_content IS NOT NULL THEN
    INSERT INTO public.guidelines (user_id, content)
    VALUES (_user_id, _default_content);
  END IF;
END;
$$;

-- Create trigger for updated_at on default_guidelines
CREATE TRIGGER update_default_guidelines_updated_at
BEFORE UPDATE ON public.default_guidelines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();