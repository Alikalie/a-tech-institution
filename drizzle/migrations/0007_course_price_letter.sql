ALTER TABLE public.courses ADD COLUMN price text NOT NULL DEFAULT '';
ALTER TABLE public.courses ADD COLUMN active boolean NOT NULL DEFAULT true;