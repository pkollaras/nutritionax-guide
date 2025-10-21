-- Add Advisable Services integration columns to nutritionists table
ALTER TABLE public.nutritionists 
ADD COLUMN services_customer_id integer,
ADD COLUMN services_api_token text;

-- Create index for faster lookups
CREATE INDEX idx_nutritionists_services_customer_id 
ON public.nutritionists(services_customer_id);

-- Add comments for documentation
COMMENT ON COLUMN public.nutritionists.services_customer_id 
IS 'Customer ID from Advisable Services API';

COMMENT ON COLUMN public.nutritionists.services_api_token 
IS 'API Token for Advisable Services - used for future API calls';