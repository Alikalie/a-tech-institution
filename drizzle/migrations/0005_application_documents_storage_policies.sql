CREATE POLICY "app docs own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'application-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')));

CREATE POLICY "app docs own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'application-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "app docs own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'application-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
