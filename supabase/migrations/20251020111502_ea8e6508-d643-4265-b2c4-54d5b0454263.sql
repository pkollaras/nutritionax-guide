-- Update existing guidelines to be owned by admin if any exist with NULL user_id
UPDATE public.guidelines 
SET user_id = (SELECT id FROM auth.users WHERE email = 'nutritionax@gmail.com' LIMIT 1)
WHERE user_id IS NULL;

-- Make the column NOT NULL if it isn't already
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guidelines' 
    AND column_name = 'user_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.guidelines ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own guidelines" ON public.guidelines;
DROP POLICY IF EXISTS "Users can manage own guidelines" ON public.guidelines;
DROP POLICY IF EXISTS "Everyone can view guidelines" ON public.guidelines;
DROP POLICY IF EXISTS "Admins can manage guidelines" ON public.guidelines;

-- Create new per-user RLS policies
CREATE POLICY "Users can view own guidelines"
ON public.guidelines
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage own guidelines"
ON public.guidelines
FOR ALL
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_guidelines_user_id ON public.guidelines(user_id);