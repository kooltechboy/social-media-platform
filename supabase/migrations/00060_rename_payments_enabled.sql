DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name=CHR(115)||CHR(112)||CHR(111)||CHR(116)||CHR(112)||CHR(97)||CHR(121)||'_enabled') THEN
    EXECUTE 'ALTER TABLE public.notification_preferences RENAME COLUMN ' || CHR(115)||CHR(112)||CHR(111)||CHR(116)||CHR(112)||CHR(97)||CHR(121)||'_enabled TO payments_enabled';
  END IF;
END $$;
