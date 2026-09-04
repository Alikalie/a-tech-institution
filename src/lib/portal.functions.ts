import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: Function }; userId: string };

async function hasRole(context: Ctx, role: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (context.supabase as any).rpc("has_role", {
    _user_id: context.userId,
    _role: role,
  });
  return Boolean(data);
}

async function assertAdmin(context: Ctx) {
  if (!(await hasRole(context, "admin")) && !(await hasRole(context, "super_admin"))) {
    throw new Error("Forbidden: administrator access required");
  }
}

async function assertSuperAdmin(context: Ctx) {
  if (!(await hasRole(context, "super_admin"))) {
    throw new Error("Forbidden: super administrator access required");
  }
}

function sixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Any signed-in user may claim administrator ONLY while no admin exists. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_first_admin");
    if (error) throw new Error(error.message);
    return { claimed: Boolean(data) };
  });

/** Any signed-in user may claim super administrator ONLY while none exists. */
export const claimSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (context.supabase as any).rpc("claim_super_admin");
    if (error) throw new Error(error.message);
    return { claimed: Boolean(data) };
  });

/** Applicant enters the payment code issued by the administrator, bound to their name. */
export const verifyPaymentCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    const code = String(input?.code ?? "").trim();
    if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code issued by A-TECH.");
    return { code };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", context.userId)
      .eq("status", "paid")
      .eq("code", data.code)
      .maybeSingle();
    if (!payment) {
      return {
        ok: false,
        message:
          "That code doesn't match an account in your name. Codes are issued to one named applicant only.",
      };
    }
    if (payment.code_used) {
      return { ok: false, message: "That code has already been used and cannot be reused." };
    }
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();
    const boundName = String(payment.code_name ?? "").trim().toLowerCase();
    const myName = String(profile?.full_name ?? "").trim().toLowerCase();
    if (boundName && myName && boundName !== myName) {
      return {
        ok: false,
        message: `This code was issued to ${payment.code_name}. It cannot be used by another applicant.`,
      };
    }
    await supabaseAdmin
      .from("payments")
      .update({ code_used: true })
      .eq("id", payment.id);
    await supabaseAdmin.from("profiles").update({ verified: true }).eq("id", context.userId);
    await supabaseAdmin.from("notifications").insert({
      user_id: context.userId,
      title: "Account verified",
      message: "Your A-TECH account is verified. You can now apply for courses.",
    });
    await supabaseAdmin.from("activity_log").insert({
      actor_id: context.userId,
      action: "Account verified",
      detail: `Payment ${payment.reference}`,
    });
    return { ok: true, message: "Account verified." };
  });


/** Admin confirms a payment and the system generates the verification code. */
export const confirmPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { paymentId: string }) => ({ paymentId: String(input.paymentId) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = sixDigitCode();
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .update({ status: "paid", code, paid_at: new Date().toISOString() })
      .eq("id", data.paymentId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("notifications").insert({
      user_id: payment.user_id,
      title: "Payment confirmed",
      message: `Your payment was confirmed. Your verification code is ${code}. Enter it to activate your account.`,
    });
    await supabaseAdmin.from("activity_log").insert({
      actor_id: context.userId,
      action: "Payment confirmed",
      detail: `Reference ${payment.reference}`,
    });
    return { code };
  });

/** Admin accepts or rejects an application. Acceptance issues an A-TECH Student ID. */
export const decideApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string; decision: "accepted" | "rejected" }) => ({
    applicationId: String(input.applicationId),
    decision: input.decision === "accepted" ? ("accepted" as const) : ("rejected" as const),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app, error: appErr } = await supabaseAdmin
      .from("applications")
      .select("*")
      .eq("id", data.applicationId)
      .single();
    if (appErr) throw new Error(appErr.message);

    if (data.decision === "rejected") {
      await supabaseAdmin
        .from("applications")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", app.id);
      await supabaseAdmin.from("notifications").insert({
        user_id: app.user_id,
        title: "Application update",
        message: `Your application ${app.reference} was not successful on this occasion.`,
      });
      await supabaseAdmin.from("activity_log").insert({
        actor_id: context.userId,
        action: "Application rejected",
        detail: app.reference,
      });
      return { status: "rejected" as const, studentId: null };
    }

    let studentId = app.student_id as string | null;
    if (!studentId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("student_id")
        .eq("id", app.user_id)
        .maybeSingle();
      studentId = profile?.student_id ?? null;
    }
    if (!studentId) {
      const { data: generated, error: genErr } = await supabaseAdmin.rpc("next_student_id");
      if (genErr) throw new Error(genErr.message);
      studentId = generated as string;
    }

    await supabaseAdmin
      .from("applications")
      .update({ status: "accepted", student_id: studentId, reviewed_at: new Date().toISOString() })
      .eq("id", app.id);
    await supabaseAdmin.from("profiles").update({ student_id: studentId }).eq("id", app.user_id);
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: app.user_id, role: "student" }, { onConflict: "user_id,role" });
    await supabaseAdmin.from("notifications").insert({
      user_id: app.user_id,
      title: "Application accepted",
      message: `Congratulations! You have been accepted. Your A-TECH Student ID is ${studentId}. Download your acceptance letter from My Applications.`,
    });
    await supabaseAdmin.from("activity_log").insert({
      actor_id: context.userId,
      action: "Application accepted",
      detail: `${app.reference} → ${studentId}`,
    });
    return { status: "accepted" as const, studentId };
  });

/** Grant or remove a role. Admin/super-admin roles may only be changed by a super administrator. */
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      userId: string;
      role: "super_admin" | "admin" | "tutor" | "student";
      grant: boolean;
    }) => ({
      userId: String(input.userId),
      role: input.role,
      grant: Boolean(input.grant),
    }),
  )
  .handler(async ({ data, context }) => {
    const elevated = data.role === "admin" || data.role === "super_admin";
    if (elevated) await assertSuperAdmin(context);
    else await assertAdmin(context);

    if (data.userId === context.userId && data.role === "super_admin" && !data.grant) {
      throw new Error("You cannot remove your own super administrator role.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (data.role === "super_admin") {
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      }
      if (data.role !== "student") {
        await supabaseAdmin.from("profiles").update({ verified: true }).eq("id", data.userId);
      }
    } else {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
    }
    await supabaseAdmin.from("activity_log").insert({
      actor_id: context.userId,
      action: data.grant ? "Role granted" : "Role removed",
      detail: `${data.role} for ${data.userId}`,
    });
    return { ok: true };
  });

/** Super administrator strips every role from an account (demote to an empty user). */
export const clearUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => ({ userId: String(input.userId) }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot demote your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("activity_log").insert({
      actor_id: context.userId,
      action: "All roles removed",
      detail: `Account ${data.userId} demoted to empty user`,
    });
    return { ok: true };
  });


/** Admin view: every account with roles, verification state, student ID and payment code. */
export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }, { data: payments }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("payments")
        .select("id, user_id, reference, status, code, code_name, code_used, paid_at")
        .order("created_at", { ascending: false }),
    ]);
    return (profiles ?? []).map((p) => ({
      ...p,
      roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
      payment: (payments ?? []).find((pay) => pay.user_id === p.id) ?? null,
    }));
  });

/** Admin generates (or regenerates) the payment verification code for one account. */
export const issuePaymentCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    const userId = String(input?.userId ?? "").trim();
    if (!userId) throw new Error("Select an account.");
    return { userId };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = sixDigitCode();
    const now = new Date().toISOString();

    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", data.userId)
      .maybeSingle();
    const codeName = String(target?.full_name ?? "").trim() || String(target?.email ?? "");

    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id, reference")
      .eq("user_id", data.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let reference = existing?.reference ?? "";
    if (existing) {
      const { error } = await supabaseAdmin
        .from("payments")
        .update({ status: "paid", code, code_name: codeName, code_used: false, paid_at: now, code_issued_at: now })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      reference = `ATP-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabaseAdmin
        .from("payments")
        .insert({ user_id: data.userId, reference, status: "paid", code, code_name: codeName, code_used: false, paid_at: now, code_issued_at: now });
      if (error) throw new Error(error.message);
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: data.userId,
      title: "Payment verification code issued",
      message: `Your A-TECH payment verification code is ${code}. It is issued to ${codeName} only and cannot be used by anyone else. Enter it in the portal to verify your account and unlock the application form.`,
    });
    await supabaseAdmin.from("activity_log").insert({
      actor_id: context.userId,
      action: "Payment code generated",
      detail: `Reference ${reference} issued to ${codeName}`,
    });
    return { code, reference, codeName };
  });

/** Admin view: all submitted applications. */
export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("applications")
      .select("*")
      .order("submitted_at", { ascending: false });
    return data ?? [];
  });


/** Tutor uploads a grade against an A-TECH Student ID. */
export const uploadGrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      studentId: string;
      courseCode: string;
      assessment: string;
      score: number;
      grade: string;
      remarks: string;
    }) => {
      const studentId = String(input.studentId ?? "").trim();
      if (!studentId) throw new Error("Student ID is required.");
      if (!input.courseCode) throw new Error("Select a course.");
      if (!String(input.assessment ?? "").trim()) throw new Error("Assessment title is required.");
      return {
        studentId,
        courseCode: String(input.courseCode),
        assessment: String(input.assessment).trim().slice(0, 120),
        score: Number(input.score) || 0,
        grade: String(input.grade ?? "").slice(0, 4),
        remarks: String(input.remarks ?? "").slice(0, 400),
      };
    },
  )
  .handler(async ({ data, context }) => {
    const { data: isTutor } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "tutor",
    });
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isTutor && !isAdmin) throw new Error("Forbidden: tutor access required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: student } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, student_id")
      .eq("student_id", data.studentId)
      .maybeSingle();
    if (!student) return { ok: false, message: "No student found with that A-TECH Student ID." };

    const { error } = await supabaseAdmin.from("grades").insert({
      student_user_id: student.id,
      student_id: data.studentId,
      course_code: data.courseCode,
      assessment: data.assessment,
      score: data.score,
      grade: data.grade,
      remarks: data.remarks,
      tutor_id: context.userId,
    });
    if (error) throw new Error(error.message);

    const { data: me } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();

    await supabaseAdmin.from("notifications").insert({
      user_id: student.id,
      title: "New result published",
      message: `A result for ${data.assessment} has been uploaded to your account.`,
    });
    await supabaseAdmin.from("activity_log").insert({
      actor_id: context.userId,
      actor_name: me?.full_name ?? "",
      action: "Grade uploaded",
      detail: `${data.assessment} for ${data.studentId}`,
    });
    return { ok: true, message: `Result recorded for ${student.full_name}.` };
  });

/** Tutor view: all students with an issued A-TECH Student ID. */
export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isTutor } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "tutor",
    });
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isTutor && !isAdmin) throw new Error("Forbidden: tutor access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, email, student_id")
      .not("student_id", "is", null)
      .order("student_id");
    return data ?? [];
  });
