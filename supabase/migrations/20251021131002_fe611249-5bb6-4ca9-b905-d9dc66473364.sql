-- Step 1: Add super_admin role to app_role enum ONLY
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'super_admin') THEN
    ALTER TYPE app_role ADD VALUE 'super_admin';
  END IF;
END $$;