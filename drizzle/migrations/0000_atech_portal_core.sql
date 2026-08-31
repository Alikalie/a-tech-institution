-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','tutor','student','applicant');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  verified BOOLEAN NOT NULL DEFAULT false,
  student_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- COURSES
CREATE TABLE public.courses (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses public read" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses admin write" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.courses (code,name,duration,sort_order) VALUES
 ('C1','Introduction to Computer & Windows OS','3 Days',1),
 ('C2','WordPad & Microsoft Word','4 Days',2),
 ('C3','Microsoft PowerPoint & Google Slides','3 Days',3),
 ('C4','Microsoft Publisher','2 Days',4),
 ('C5','Microsoft OneNote','2 Days',5),
 ('C6','Microsoft Access','4 Days',6),
 ('C7','Microsoft Excel & Google Sheets','5 Days',7),
 ('C8','Microsoft Outlook','2 Days',8),
 ('C9','Basic Introduction to IoT','2 Days',9),
 ('C10','Basic Introduction to Graphic Design','6 Days',10),
 ('C11','Video Editing (CapCut & InShot)','3 Days',11);

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments own read" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "payments own insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "payments admin update" ON public.payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  course_code TEXT NOT NULL REFERENCES public.courses(code),
  full_name TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  previous_education TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  student_id TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apps own read" ON public.applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "apps own insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "apps admin update" ON public.applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- GRADES
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL,
  student_id TEXT NOT NULL,
  course_code TEXT NOT NULL REFERENCES public.courses(code),
  assessment TEXT NOT NULL,
  score NUMERIC(5,2),
  grade TEXT,
  remarks TEXT,
  tutor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grades TO authenticated;
GRANT ALL ON public.grades TO service_role;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grades read" ON public.grades FOR SELECT TO authenticated
  USING (student_user_id = auth.uid() OR tutor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "grades tutor insert" ON public.grades FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'tutor') OR public.has_role(auth.uid(),'admin')) AND tutor_id = auth.uid());
CREATE POLICY "grades tutor update" ON public.grades FOR UPDATE TO authenticated
  USING (tutor_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (tutor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- SCHEDULE
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL REFERENCES public.courses(code),
  title TEXT NOT NULL,
  day_label TEXT NOT NULL,
  time_label TEXT NOT NULL,
  venue TEXT NOT NULL DEFAULT 'A-TECH, Moriba Town, Impere Junction',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schedules TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.schedules TO authenticated;
GRANT ALL ON public.schedules TO service_role;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedule read" ON public.schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedule admin write" ON public.schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'A-TECH',
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif own read" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "notif own update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ACTIVITY LOG
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity read" ON public.activity_log FOR SELECT TO authenticated
  USING (actor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- NEW USER TRIGGER: profile + applicant role + pending payment reference
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref TEXT;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name',''),
          COALESCE(NEW.raw_user_meta_data->>'phone',''),
          COALESCE(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'applicant')
  ON CONFLICT DO NOTHING;

  ref := 'PAY-' || upper(substr(replace(NEW.id::text,'-',''),1,8));
  INSERT INTO public.payments (user_id, reference) VALUES (NEW.id, ref)
  ON CONFLICT (reference) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STUDENT ID SEQUENCE
CREATE SEQUENCE public.student_id_seq START 1;
GRANT USAGE ON SEQUENCE public.student_id_seq TO service_role;