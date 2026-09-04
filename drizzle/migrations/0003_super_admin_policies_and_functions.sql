CREATE OR REPLACE FUNCTION public.claim_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'super_admin') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET verified = true WHERE id = auth.uid();
  RETURN true;
END;
$$;

DROP POLICY IF EXISTS "roles read" ON public.user_roles;
CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

CREATE POLICY "roles super admin insert" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(),'super_admin'::app_role));

CREATE POLICY "roles super admin update" ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(),'super_admin'::app_role));

CREATE POLICY "roles super admin delete" ON public.user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(),'super_admin'::app_role));

GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "courses admin write" ON public.courses;
CREATE POLICY "courses admin write" ON public.courses FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

DROP POLICY IF EXISTS "schedule admin write" ON public.schedules;
CREATE POLICY "schedule admin write" ON public.schedules FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));