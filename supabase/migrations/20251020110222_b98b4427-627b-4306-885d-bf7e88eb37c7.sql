-- Clean up: Remove 'user' role from nutritionax@gmail.com (keep only admin)
DELETE FROM public.user_roles 
WHERE role = 'user' 
AND user_id IN (
  SELECT id FROM auth.users WHERE email = 'nutritionax@gmail.com'
);

-- Update handle_new_user trigger to skip nutritionax@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  RETURN NEW;
END;
$$;