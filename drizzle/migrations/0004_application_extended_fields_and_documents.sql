ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS prefix TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS id_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
  ADD COLUMN IF NOT EXISTS kin_name TEXT,
  ADD COLUMN IF NOT EXISTS kin_relationship TEXT,
  ADD COLUMN IF NOT EXISTS kin_address TEXT,
  ADD COLUMN IF NOT EXISTS kin_email TEXT,
  ADD COLUMN IF NOT EXISTS kin_phone TEXT,
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS mother_name TEXT,
  ADD COLUMN IF NOT EXISTS blood_group TEXT,
  ADD COLUMN IF NOT EXISTS disability TEXT,
  ADD COLUMN IF NOT EXISTS disability_details TEXT,
  ADD COLUMN IF NOT EXISTS education_level TEXT,
  ADD COLUMN IF NOT EXISTS qualification TEXT,
  ADD COLUMN IF NOT EXISTS computer_level TEXT,
  ADD COLUMN IF NOT EXISTS has_laptop BOOLEAN,
  ADD COLUMN IF NOT EXISTS preferred_time TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS guarantor_first_name TEXT,
  ADD COLUMN IF NOT EXISTS guarantor_last_name TEXT,
  ADD COLUMN IF NOT EXISTS guarantor_relationship TEXT,
  ADD COLUMN IF NOT EXISTS guarantor_phone TEXT,
  ADD COLUMN IF NOT EXISTS guarantor_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS guarantor_address TEXT,
  ADD COLUMN IF NOT EXISTS declaration BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;

ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs own read" ON public.application_documents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "docs own insert" ON public.application_documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "docs own delete" ON public.application_documents FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
