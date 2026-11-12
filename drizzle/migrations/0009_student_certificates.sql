CREATE TABLE public.certificates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 application_id uuid NOT NULL REFERENCES public.applications(id),
 user_id uuid NOT NULL,
 values jsonb NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued')),
 issued_by uuid NOT NULL,
 issued_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(application_id),
 CHECK (status <> 'issued' OR issued_at IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin') AND EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = certificates.user_id AND a.status = 'accepted'));
CREATE POLICY "recipients read issued certificates" ON public.certificates FOR SELECT TO authenticated USING (user_id = auth.uid() AND status = 'issued');
CREATE INDEX certificates_recipient_idx ON public.certificates(user_id, status);