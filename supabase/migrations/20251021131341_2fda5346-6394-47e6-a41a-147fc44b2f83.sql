-- Update assign_admin_role to use valid email format for super admin
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Super admin account (using advisable@nutritionax.com as valid email)
  IF NEW.email = 'advisable@nutritionax.com' THEN
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