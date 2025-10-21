-- Step 2: Update functions and policies to use super_admin role

-- Update has_role function to support super_admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'super_admin'::app_role)
  )
$$;

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
  )
$$;

-- Update assign_admin_role to handle super admin
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Super admin account
  IF NEW.email = 'advisable' THEN
    DELETE FROM public.user_roles 
    WHERE user_id = NEW.id AND role != 'super_admin'::app_role;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Super admin is also a nutritionist
    INSERT INTO public.nutritionists (user_id, name, email)
    VALUES (
      NEW.id,
      'Super Admin',
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
  -- Original super admin (nutritionax@gmail.com)
  ELSIF NEW.email = 'nutritionax@gmail.com' THEN
    DELETE FROM public.user_roles 
    WHERE user_id = NEW.id AND role = 'user'::app_role;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
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

-- Update RLS policies for nutritionists table
DROP POLICY IF EXISTS "Super admin can manage nutritionists" ON public.nutritionists;
DROP POLICY IF EXISTS "Super admin can manage all nutritionists" ON public.nutritionists;
DROP POLICY IF EXISTS "Regular admins can view nutritionists" ON public.nutritionists;
DROP POLICY IF EXISTS "Regular admins can view own profile" ON public.nutritionists;

CREATE POLICY "Super admin full access to nutritionists"
  ON public.nutritionists FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Nutritionists view own profile"
  ON public.nutritionists FOR SELECT
  USING (user_id = auth.uid());

-- Update client_nutritionists policies
DROP POLICY IF EXISTS "Super admin can manage all client relationships" ON public.client_nutritionists;
DROP POLICY IF EXISTS "Super admin can manage all relationships" ON public.client_nutritionists;
DROP POLICY IF EXISTS "Nutritionists can manage own client relationships" ON public.client_nutritionists;
DROP POLICY IF EXISTS "Nutritionists manage own relationships" ON public.client_nutritionists;

CREATE POLICY "Super admin all client relationships"
  ON public.client_nutritionists FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Nutritionists own relationships"
  ON public.client_nutritionists FOR INSERT
  WITH CHECK (
    nutritionist_id IN (
      SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
    )
  );

-- Update profiles policies
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin views all profiles" ON public.profiles;

CREATE POLICY "Super admin all profiles access"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin(auth.uid()));