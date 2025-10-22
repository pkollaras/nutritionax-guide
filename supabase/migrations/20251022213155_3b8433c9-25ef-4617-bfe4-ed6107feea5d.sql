-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add subscription status fields to nutritionists table
ALTER TABLE public.nutritionists 
ADD COLUMN IF NOT EXISTS subscription_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_next_billing_date date,
ADD COLUMN IF NOT EXISTS subscription_last_checked_at timestamp with time zone;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_nutritionists_subscription_active 
ON public.nutritionists(subscription_active);

-- Schedule the job to run every night at 02:00 Athens time
SELECT cron.schedule(
  'update-subscription-status-nightly',
  '0 2 * * *', -- At 02:00 every day
  $$
  SELECT net.http_post(
    url := 'https://kigmecfevnbzmobvmumm.supabase.co/functions/v1/update-subscription-status',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'source', 'cron',
      'timestamp', now()
    ),
    timeout_milliseconds := 120000
  ) as request_id;
  $$
);