-- Create function to automatically assign admin role to nutritionax@gmail.com
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user is nutritionax@gmail.com
  IF NEW.email = 'nutritionax@gmail.com' THEN
    -- Delete any existing 'user' role for this account
    DELETE FROM public.user_roles 
    WHERE user_id = NEW.id AND role = 'user';
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
CREATE TRIGGER assign_admin_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email = 'nutritionax@gmail.com')
  EXECUTE FUNCTION public.assign_admin_role();

COMMENT ON FUNCTION public.assign_admin_role() IS 'Automatically assigns admin role to nutritionax@gmail.com';
