CREATE OR REPLACE FUNCTION public.is_staff(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'admin') OR public.has_role(_uid,'super_admin') $$;

CREATE TABLE public.programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.programmes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programmes TO authenticated;
GRANT ALL ON public.programmes TO service_role;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "programmes read" ON public.programmes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "programmes staff write" ON public.programmes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

ALTER TABLE public.courses ADD COLUMN programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD COLUMN description text NOT NULL DEFAULT '';

CREATE TABLE public.nav_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_cta boolean NOT NULL DEFAULT false,
  visible boolean NOT NULL DEFAULT true,
  location text NOT NULL DEFAULT 'header',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nav_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_links TO authenticated;
GRANT ALL ON public.nav_links TO service_role;
ALTER TABLE public.nav_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nav read" ON public.nav_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "nav staff write" ON public.nav_links FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
INSERT INTO public.nav_links (label,url,sort_order,is_cta) VALUES
 ('Home','/',1,false),('Admission','/admissions',2,false),('Courses','/courses',3,false),
 ('About','/about',4,false),('Contact','/contact',5,false);

CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content read" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "content staff write" ON public.site_content FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
INSERT INTO public.site_content (key,value) VALUES
 ('hero_title','Train. Apply. Graduate with A-TECH.'),
 ('hero_subtitle','The official A-TECH course application and student management portal. Apply online, track your admission, download your application form and manage your grades, results and timetable in one place.'),
 ('about_text','A-TECH Integrated Technology & Data Analysis trains students in practical computer skills, data analysis and modern technology.'),
 ('announcement',''),
 ('footer_text','A-TECH Integrated Technology & Data Analysis. All rights reserved.'),
 ('contact_phone','+23277864684 / +23279926121'),
 ('contact_email','fofanahalikalie0@gmail.com');

CREATE TABLE public.form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key text NOT NULL UNIQUE,
  label text NOT NULL,
  section text NOT NULL DEFAULT 'Additional information',
  field_type text NOT NULL DEFAULT 'text',
  options text NOT NULL DEFAULT '',
  required boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_fields TO authenticated;
GRANT ALL ON public.form_fields TO service_role;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fields read" ON public.form_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "fields staff write" ON public.form_fields FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

ALTER TABLE public.applications ADD COLUMN custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.id_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  student_id text NOT NULL,
  full_name text NOT NULL,
  programme text NOT NULL DEFAULT '',
  dob date,
  photo_path text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  valid_until date NOT NULL,
  issued_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.id_cards TO authenticated;
GRANT ALL ON public.id_cards TO service_role;
ALTER TABLE public.id_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idcard read" ON public.id_cards FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "idcard staff write" ON public.id_cards FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- staff full CRUD on core tables
CREATE POLICY "apps staff all" ON public.applications FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "payments staff all" ON public.payments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "grades staff all" ON public.grades FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "notif staff all" ON public.notifications FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "profiles staff all" ON public.profiles FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "docs staff all" ON public.application_documents FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications, public.payments, public.grades, public.notifications, public.profiles, public.application_documents TO authenticated;