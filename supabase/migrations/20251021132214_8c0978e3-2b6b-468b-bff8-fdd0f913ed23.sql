-- Clean up user role for super admin
DELETE FROM public.user_roles 
WHERE user_id = 'da7d7530-5f52-42c9-a7f1-26b3f4f2aeca' 
AND role = 'user'::app_role;

-- Update handle_new_user to not assign user role to super admin
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
    -- Don't assign user role to super admin or original admin
    IF NEW.email != 'nutritionax@gmail.com' AND NEW.email != 'advisable@nutritionax.com' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user');
    END IF;
  END IF;
  
  -- Don't copy guidelines for super admin, original admin, or nutritionists
  IF NEW.raw_user_meta_data->>'account_type' != 'nutritionist' 
     AND NEW.email != 'nutritionax@gmail.com'
     AND NEW.email != 'advisable@nutritionax.com' THEN
    PERFORM copy_default_guidelines(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;