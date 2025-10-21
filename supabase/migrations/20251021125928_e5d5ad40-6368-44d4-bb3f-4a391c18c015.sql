-- ============================================
-- MULTI-TENANT ARCHITECTURE MIGRATION
-- ============================================

-- Step 1: Create nutritionists table
CREATE TABLE public.nutritionists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.nutritionists ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_nutritionists_updated_at 
  BEFORE UPDATE ON public.nutritionists 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 2: Create client_nutritionists junction table
CREATE TABLE public.client_nutritionists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, nutritionist_id)
);

ALTER TABLE public.client_nutritionists ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_client_nutritionists_client ON public.client_nutritionists(client_id);
CREATE INDEX idx_client_nutritionists_nutritionist ON public.client_nutritionists(nutritionist_id);

-- Step 3: Add nutritionist_id to data tables
ALTER TABLE public.diet_plans 
  ADD COLUMN nutritionist_id UUID REFERENCES public.nutritionists(id) ON DELETE CASCADE;

CREATE INDEX idx_diet_plans_nutritionist ON public.diet_plans(nutritionist_id);

ALTER TABLE public.guidelines 
  ADD COLUMN nutritionist_id UUID REFERENCES public.nutritionists(id) ON DELETE CASCADE;

CREATE INDEX idx_guidelines_nutritionist ON public.guidelines(nutritionist_id);

ALTER TABLE public.default_guidelines 
  ADD COLUMN nutritionist_id UUID REFERENCES public.nutritionists(id) ON DELETE CASCADE;

CREATE INDEX idx_default_guidelines_nutritionist ON public.default_guidelines(nutritionist_id);

-- Step 4: Create helper functions
CREATE OR REPLACE FUNCTION public.is_clients_nutritionist(
  _nutritionist_user_id UUID,
  _client_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_nutritionists cn
    JOIN public.nutritionists n ON cn.nutritionist_id = n.id
    WHERE n.user_id = _nutritionist_user_id
      AND cn.client_id = _client_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_nutritionist_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.nutritionists WHERE user_id = _user_id LIMIT 1
$$;

-- Step 5: Data migration - Create nutritionist for super admin
INSERT INTO public.nutritionists (user_id, name, email)
SELECT id, name, email 
FROM public.profiles 
WHERE email = 'nutritionax@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Assign all existing diet_plans to super admin
UPDATE public.diet_plans
SET nutritionist_id = (
  SELECT id FROM public.nutritionists 
  WHERE email = 'nutritionax@gmail.com' 
  LIMIT 1
)
WHERE nutritionist_id IS NULL;

-- Assign all existing guidelines to super admin
UPDATE public.guidelines
SET nutritionist_id = (
  SELECT id FROM public.nutritionists 
  WHERE email = 'nutritionax@gmail.com' 
  LIMIT 1
)
WHERE nutritionist_id IS NULL;

-- Assign all existing default_guidelines to super admin
UPDATE public.default_guidelines
SET nutritionist_id = (
  SELECT id FROM public.nutritionists 
  WHERE email = 'nutritionax@gmail.com' 
  LIMIT 1
)
WHERE nutritionist_id IS NULL;

-- Link all existing clients to super admin
INSERT INTO public.client_nutritionists (client_id, nutritionist_id)
SELECT p.id, n.id
FROM public.profiles p
CROSS JOIN public.nutritionists n
WHERE n.email = 'nutritionax@gmail.com'
  AND p.id IN (SELECT user_id FROM public.user_roles WHERE role = 'user')
ON CONFLICT (client_id, nutritionist_id) DO NOTHING;

-- Make nutritionist_id NOT NULL after migration
ALTER TABLE public.diet_plans 
  ALTER COLUMN nutritionist_id SET NOT NULL;

ALTER TABLE public.guidelines 
  ALTER COLUMN nutritionist_id SET NOT NULL;

ALTER TABLE public.default_guidelines 
  ALTER COLUMN nutritionist_id SET NOT NULL;

-- Step 6: Update UNIQUE constraint on diet_plans
ALTER TABLE public.diet_plans 
  DROP CONSTRAINT IF EXISTS diet_plans_user_id_day_of_week_key;

ALTER TABLE public.diet_plans 
  ADD CONSTRAINT diet_plans_user_day_nutritionist_unique 
  UNIQUE (user_id, day_of_week, nutritionist_id);

-- Step 7: RLS Policies for nutritionists table
CREATE POLICY "Nutritionists can view own profile"
  ON public.nutritionists FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Super admin can manage nutritionists"
  ON public.nutritionists FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Step 8: RLS Policies for client_nutritionists table
CREATE POLICY "Nutritionists can view own clients"
  ON public.client_nutritionists FOR SELECT
  USING (
    nutritionist_id IN (
      SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view own nutritionists"
  ON public.client_nutritionists FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Nutritionists can manage client relationships"
  ON public.client_nutritionists FOR ALL
  USING (
    nutritionist_id IN (
      SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
    )
  );

-- Step 9: Update RLS Policies for diet_plans
DROP POLICY IF EXISTS "Admins can manage all diet plans" ON public.diet_plans;
DROP POLICY IF EXISTS "Users can manage own diet plans" ON public.diet_plans;
DROP POLICY IF EXISTS "Users can view own diet plans" ON public.diet_plans;

CREATE POLICY "Nutritionists can manage own diets for own clients"
  ON public.diet_plans FOR ALL
  USING (
    nutritionist_id IN (
      SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
    )
    AND user_id IN (
      SELECT client_id FROM public.client_nutritionists 
      WHERE nutritionist_id IN (
        SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Clients can view diets from their nutritionists"
  ON public.diet_plans FOR SELECT
  USING (
    user_id = auth.uid()
    AND nutritionist_id IN (
      SELECT nutritionist_id FROM public.client_nutritionists 
      WHERE client_id = auth.uid()
    )
  );

-- Step 10: Update RLS Policies for guidelines
DROP POLICY IF EXISTS "Users can manage own guidelines" ON public.guidelines;
DROP POLICY IF EXISTS "Users can view own guidelines" ON public.guidelines;

CREATE POLICY "Nutritionists can manage guidelines for own clients"
  ON public.guidelines FOR ALL
  USING (
    nutritionist_id IN (
      SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
    )
    AND user_id IN (
      SELECT client_id FROM public.client_nutritionists 
      WHERE nutritionist_id IN (
        SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Clients can view guidelines from their nutritionists"
  ON public.guidelines FOR SELECT
  USING (
    user_id = auth.uid()
    AND nutritionist_id IN (
      SELECT nutritionist_id FROM public.client_nutritionists 
      WHERE client_id = auth.uid()
    )
  );

-- Step 11: Update RLS Policies for default_guidelines
DROP POLICY IF EXISTS "Everyone can view default guidelines" ON public.default_guidelines;
DROP POLICY IF EXISTS "Only admins can manage default guidelines" ON public.default_guidelines;

CREATE POLICY "Nutritionists can manage own default guidelines"
  ON public.default_guidelines FOR ALL
  USING (
    nutritionist_id IN (
      SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
    )
  );

-- Step 12: Update RLS Policies for progress_reports
DROP POLICY IF EXISTS "Admins can view all progress" ON public.progress_reports;
DROP POLICY IF EXISTS "Users can manage own progress" ON public.progress_reports;
DROP POLICY IF EXISTS "Users can view own progress" ON public.progress_reports;

CREATE POLICY "Clients can manage own progress"
  ON public.progress_reports FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Nutritionists can view client progress"
  ON public.progress_reports FOR SELECT
  USING (
    user_id IN (
      SELECT client_id FROM public.client_nutritionists 
      WHERE nutritionist_id IN (
        SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
      )
    )
  );

-- Step 13: Update RLS Policies for profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.profiles;

CREATE POLICY "Users can view and update own profile"
  ON public.profiles FOR ALL
  USING (id = auth.uid());

CREATE POLICY "Nutritionists can view their clients profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT client_id FROM public.client_nutritionists 
      WHERE nutritionist_id IN (
        SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
      )
    )
  );

-- Step 14: Update RLS Policies for shopping_lists (no changes needed, already user-owned)
-- Shopping lists remain owned by clients, nutritionists can view them

-- Step 15: Update triggers
DROP FUNCTION IF EXISTS public.assign_admin_role() CASCADE;

CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email = 'nutritionax@gmail.com' THEN
    DELETE FROM public.user_roles 
    WHERE user_id = NEW.id AND role = 'user';
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    INSERT INTO public.nutritionists (user_id, name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  IF NEW.raw_user_meta_data->>'account_type' = 'nutritionist' THEN
    INSERT INTO public.nutritionists (user_id, name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    IF NEW.email != 'nutritionax@gmail.com' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user');
    END IF;
  END IF;
  
  IF NEW.raw_user_meta_data->>'account_type' != 'nutritionist' 
     AND NEW.email != 'nutritionax@gmail.com' THEN
    PERFORM copy_default_guidelines(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_handle
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 16: Update copy_default_guidelines function to handle nutritionist context
DROP FUNCTION IF EXISTS public.copy_default_guidelines(uuid);

CREATE OR REPLACE FUNCTION public.copy_default_guidelines(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _default_content TEXT;
  _nutritionist_id UUID;
BEGIN
  -- Get the default guideline content from the first available nutritionist
  -- (or super admin if no other nutritionists exist)
  SELECT content, nutritionist_id INTO _default_content, _nutritionist_id
  FROM public.default_guidelines
  ORDER BY updated_at DESC
  LIMIT 1;
  
  IF _default_content IS NOT NULL AND _nutritionist_id IS NOT NULL THEN
    INSERT INTO public.guidelines (user_id, content, nutritionist_id)
    VALUES (_user_id, _default_content, _nutritionist_id);
  END IF;
END;
$$;