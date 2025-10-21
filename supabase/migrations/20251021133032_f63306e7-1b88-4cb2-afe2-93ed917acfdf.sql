-- Create the missing trigger for handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Fix Pelatis@nutritionax.com manually
-- Insert profile
INSERT INTO public.profiles (id, email, name)
VALUES (
  '4e735284-f497-4dde-b193-73ebbbf484b4',
  'Pelatis@nutritionax.com',
  'Pelatis@nutritionax.com'
)
ON CONFLICT (id) DO NOTHING;

-- Insert user role
INSERT INTO public.user_roles (user_id, role)
VALUES ('4e735284-f497-4dde-b193-73ebbbf484b4', 'user')
ON CONFLICT DO NOTHING;

-- Connect client to nutritionist diatrofologos@nutritionax.com
INSERT INTO public.client_nutritionists (client_id, nutritionist_id)
VALUES (
  '4e735284-f497-4dde-b193-73ebbbf484b4',
  '1a3c24cb-2214-43df-bcb6-8b045f37c031'
)
ON CONFLICT DO NOTHING;