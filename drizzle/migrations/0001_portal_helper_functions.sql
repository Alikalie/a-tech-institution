CREATE OR REPLACE FUNCTION public.next_student_id()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n BIGINT;
BEGIN
  n := nextval('public.student_id_seq');
  RETURN 'ATECH/' || to_char(now(), 'YYYY') || '/' || lpad(n::text, 4, '0');
END;
$$;
REVOKE ALL ON FUNCTION public.next_student_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_student_id() TO service_role;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET verified = true WHERE id = auth.uid();
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated, service_role;