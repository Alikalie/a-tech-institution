ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS code_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS code_used BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS code_issued_at TIMESTAMPTZ;