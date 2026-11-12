import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { certificateSchema, canIssueCertificate } from "./certificate-rules";

export const saveCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ applicationId: z.string().uuid(), values: certificateSchema, issue: z.boolean() }))
  .handler(async ({ context, data }) => {
    const { data: superAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (roleError || !superAdmin) throw new Error("Super administrator access required");
    const { data: application, error } = await context.supabase.from("applications").select("id,user_id,status,student_id,reference").eq("id", data.applicationId).single();
    if (error || !application || !canIssueCertificate("super_admin", application.status)) throw new Error("Select an accepted student");
    const { data: existing, error: existingError } = await context.supabase.from("certificates").select("status").eq("application_id", application.id).maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing?.status === "issued" && !data.issue) throw new Error("This certificate is already issued. Publish the revision to update it.");
    const now = new Date().toISOString();
    const { data: saved, error: saveError } = await context.supabase.from("certificates").upsert({
      application_id: application.id, user_id: application.user_id,
      values: { ...data.values, studentId: application.student_id ?? "", reference: application.reference },
      status: data.issue ? "issued" : "draft", issued_by: context.userId,
      issued_at: data.issue ? now : null, updated_at: now,
    }, { onConflict: "application_id" }).select("id,status").single();
    if (saveError) throw new Error(saveError.message);
    return saved;
  });