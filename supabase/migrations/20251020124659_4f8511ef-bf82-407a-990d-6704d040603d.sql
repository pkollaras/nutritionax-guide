-- Add column to track if there was a morning bowel movement
ALTER TABLE public.progress_reports 
ADD COLUMN IF NOT EXISTS morning_bm boolean DEFAULT false;

-- Add helpful comments
COMMENT ON COLUMN public.progress_reports.wc IS 'Number of toilet visits (bowel movements) per day';
COMMENT ON COLUMN public.progress_reports.morning_bm IS 'Whether there was a bowel movement in the morning';