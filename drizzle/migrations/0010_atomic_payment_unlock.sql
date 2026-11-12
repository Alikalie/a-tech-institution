CREATE OR REPLACE FUNCTION public.issue_application_payment_code(_user_id uuid, _payment_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.payments%ROWTYPE; person public.profiles%ROWTYPE; new_code text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Administrator access required'; END IF;
 SELECT * INTO person FROM public.profiles WHERE id=_user_id FOR UPDATE;
 IF NOT FOUND OR btrim(person.full_name)='' THEN RAISE EXCEPTION 'Applicant must have a full name'; END IF;
 IF _payment_id IS NOT NULL THEN SELECT * INTO p FROM public.payments WHERE id=_payment_id AND user_id=_user_id FOR UPDATE;
 ELSE SELECT * INTO p FROM public.payments WHERE user_id=_user_id ORDER BY created_at DESC LIMIT 1 FOR UPDATE; END IF;
 new_code := (100000 + (('x'||substr(replace(gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint % 900000))::text;
 IF p.id IS NULL THEN
 INSERT INTO public.payments(user_id,reference,status,code,code_name,code_used,paid_at,code_issued_at) VALUES (_user_id,'ATP-'||upper(substr(gen_random_uuid()::text,1,8)), 'paid',new_code,btrim(person.full_name),false,now(),now()) RETURNING * INTO p;
 ELSE
 UPDATE public.payments SET status='paid',code=new_code,code_name=btrim(person.full_name),code_used=false,paid_at=now(),code_issued_at=now() WHERE id=p.id RETURNING * INTO p;
 END IF;
 INSERT INTO public.notifications(user_id,title,message) VALUES (_user_id,'Payment verification code issued','Your A-TECH payment verification code is '||new_code||'. Issued to '||person.full_name||' only. Enter it to unlock your application.');
 INSERT INTO public.activity_log(actor_id,action,detail) VALUES (auth.uid(),'Payment code generated','Reference '||p.reference||' issued to '||person.full_name);
 RETURN jsonb_build_object('code',new_code,'reference',p.reference,'codeName',person.full_name);
END $$;
REVOKE ALL ON FUNCTION public.issue_application_payment_code(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.issue_application_payment_code(uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.redeem_application_payment_code(_code text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.payments%ROWTYPE; person public.profiles%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to verify your code'; END IF;
 IF _code !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'Enter the 6-digit code issued by A-TECH'; END IF;
 SELECT * INTO person FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Your applicant profile is missing'; END IF;
 SELECT * INTO p FROM public.payments WHERE user_id=auth.uid() AND status='paid' AND code=_code ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'message','That code does not match a confirmed payment for your account.'); END IF;
 IF p.code_used THEN RETURN jsonb_build_object('ok',false,'message','That code has already been used.'); END IF;
 IF p.code_name IS NULL OR lower(btrim(p.code_name))<>lower(btrim(person.full_name)) THEN RETURN jsonb_build_object('ok',false,'message','That code does not match the name on your account. Ask A-TECH to issue a new code.'); END IF;
 UPDATE public.payments SET code_used=true WHERE id=p.id;
 UPDATE public.profiles SET verified=true WHERE id=auth.uid();
 INSERT INTO public.notifications(user_id,title,message) VALUES(auth.uid(),'Account verified','Your payment is verified. You can now apply for courses.');
 INSERT INTO public.activity_log(actor_id,action,detail) VALUES(auth.uid(),'Account verified','Payment '||p.reference);
 RETURN jsonb_build_object('ok',true,'message','Payment verified. Your application is unlocked.');
END $$;
REVOKE ALL ON FUNCTION public.redeem_application_payment_code(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.redeem_application_payment_code(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.protect_application_payment_fields() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF current_user IN ('authenticated','anon') AND NOT public.is_staff(auth.uid()) THEN
 IF TG_TABLE_NAME='profiles' THEN
  IF TG_OP='INSERT' THEN IF NEW.verified OR NEW.student_id IS NOT NULL THEN RAISE EXCEPTION 'Verification is controlled by A-TECH'; END IF;
  ELSIF NEW.verified IS DISTINCT FROM OLD.verified OR NEW.student_id IS DISTINCT FROM OLD.student_id THEN RAISE EXCEPTION 'Verification is controlled by A-TECH'; END IF;
 ELSE
  IF TG_OP='INSERT' THEN IF NEW.status<>'pending' OR NEW.code IS NOT NULL OR NEW.code_used THEN RAISE EXCEPTION 'Payment confirmation is controlled by A-TECH'; END IF;
  ELSE RAISE EXCEPTION 'Payment confirmation is controlled by A-TECH'; END IF;
 END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_profile_payment_unlock BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_application_payment_fields();
CREATE TRIGGER protect_payment_confirmation BEFORE INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.protect_application_payment_fields();
CREATE OR REPLACE FUNCTION public.require_verified_application() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=NEW.user_id AND verified=true) AND NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Verify your payment code before submitting an application'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER require_payment_before_application BEFORE INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.require_verified_application();