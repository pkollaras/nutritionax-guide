-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  nutritionist_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
CREATE INDEX idx_appointments_nutritionist ON public.appointments(nutritionist_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Nutritionists can manage appointments for their own clients
CREATE POLICY "Nutritionists can manage appointments for own clients"
ON public.appointments
FOR ALL
TO authenticated
USING (
  nutritionist_id IN (
    SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
  )
  AND client_id IN (
    SELECT client_id FROM public.client_nutritionists
    WHERE nutritionist_id IN (
      SELECT id FROM public.nutritionists WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policy: Clients can view their own appointments
CREATE POLICY "Clients can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  client_id = auth.uid()
  AND nutritionist_id IN (
    SELECT nutritionist_id FROM public.client_nutritionists
    WHERE client_id = auth.uid()
  )
);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();