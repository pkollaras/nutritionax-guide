-- Create body_measurements table
CREATE TABLE public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  nutritionist_id UUID NOT NULL,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Δερματοπτυχές (2 μετρήσεις η καθεμία)
  triceps_1 NUMERIC(5,1),
  triceps_2 NUMERIC(5,1),
  waist_1 NUMERIC(5,1),
  waist_2 NUMERIC(5,1),
  back_1 NUMERIC(5,1),
  back_2 NUMERIC(5,1),
  armpit_1 NUMERIC(5,1),
  armpit_2 NUMERIC(5,1),
  chest_1 NUMERIC(5,1),
  chest_2 NUMERIC(5,1),
  abdomen_1 NUMERIC(5,1),
  abdomen_2 NUMERIC(5,1),
  thigh_1 NUMERIC(5,1),
  thigh_2 NUMERIC(5,1),
  
  -- Υπολογισμένα αποτελέσματα
  body_fat_percentage NUMERIC(5,2),
  body_mass_percentage NUMERIC(5,2),
  fat_mass NUMERIC(6,2),
  lean_body_mass NUMERIC(6,2),
  
  -- Custom πεδία (JSON)
  custom_fields JSONB DEFAULT '[]'::jsonb,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_body_measurements_client ON public.body_measurements(client_id);
CREATE INDEX idx_body_measurements_nutritionist ON public.body_measurements(nutritionist_id);
CREATE INDEX idx_body_measurements_date ON public.body_measurements(measurement_date);

-- Enable RLS
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Nutritionists can manage measurements for their own clients
CREATE POLICY "Nutritionists can manage measurements for own clients"
ON public.body_measurements
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

-- RLS Policy: Clients can view their own measurements
CREATE POLICY "Clients can view own measurements"
ON public.body_measurements
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
CREATE TRIGGER update_body_measurements_updated_at
  BEFORE UPDATE ON public.body_measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();