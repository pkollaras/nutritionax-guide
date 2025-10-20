-- Create shopping_lists table to store AI-generated shopping lists
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start_date date NOT NULL,
  generated_content text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- Users can view own shopping lists
CREATE POLICY "Users can view own shopping lists"
  ON public.shopping_lists
  FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Users can manage own shopping lists
CREATE POLICY "Users can manage own shopping lists"
  ON public.shopping_lists
  FOR ALL
  USING (auth.uid() = user_id);

-- Admins can view all shopping lists
CREATE POLICY "Admins can view all shopping lists"
  ON public.shopping_lists
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();