-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Order Details
  first_name text NOT NULL,
  last_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_phone_2 text,
  email text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  address text NOT NULL,
  region text NOT NULL,
  country text NOT NULL DEFAULT 'Greece',
  county text,
  
  -- Invoicing Details
  tax_reference_number text,
  tax_office text,
  profession text,
  company_name text,
  company_address text,
  
  -- Order status
  status text NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Nutritionists can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (nutritionist_id IN (
    SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
  ));

CREATE POLICY "Super admins can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for faster queries
CREATE INDEX idx_orders_nutritionist_id ON public.orders(nutritionist_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);