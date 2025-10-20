-- Add user_id column to guidelines table
ALTER TABLE public.guidelines 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id NOT NULL for future entries (existing rows can stay NULL temporarily)
-- Update existing guidelines to be owned by admin if any exist
UPDATE public.guidelines 
SET user_id = (SELECT id FROM auth.users WHERE email = 'nutritionax@gmail.com' LIMIT 1)
WHERE user_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE public.guidelines 
ALTER COLUMN user_id SET NOT NULL;

-- Drop old RLS policies
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