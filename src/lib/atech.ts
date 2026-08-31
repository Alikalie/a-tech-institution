export const ATECH = {
  name: "A-TECH Computer Training",
  tagline: "Integrated Technology & Data Analysis",
  address: "Moriba Town, Impere Junction",
} as const;

export type Course = { code: string; name: string; duration: string };

export type ApplicationRecord = {
  id: string;
  reference: string;
  course_code: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  previous_education: string | null;
  status: string;
  student_id: string | null;
  submitted_at: string;
};

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function statusTone(status: string) {
  if (status === "accepted") return "text-success";
  if (status === "rejected") return "text-destructive";
  if (status === "paid" || status === "verified") return "text-success";
  return "text-warning";
}

/* ------------------------ PDF documents (jsPDF) ------------------------ */

async function newDoc() {
  const { jsPDF } = await import("jspdf");
  return new jsPDF();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function header(doc: any, title: string) {
  doc.setFillColor(31, 56, 100);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("A-TECH COMPUTER TRAINING", 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(228, 196, 88);
  doc.text(`${ATECH.tagline} — ${ATECH.address}`, 14, 18);
  doc.setTextColor(20, 24, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 14, 36);
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.6);
  doc.line(14, 40, 196, 40);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function footer(doc: any, ref: string) {
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Ref: ${ref}   |   Generated ${new Date().toLocaleDateString()}`, 14, 289);
}

export async function downloadApplicationPDF(app: ApplicationRecord, courseName: string) {
  const doc = await newDoc();
  header(doc, "COURSE APPLICATION FORM");
  let y = 50;
  const line = (label: string, value?: string | null) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(90, 95, 105);
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 24, 28);
    doc.text(String(value || "-").slice(0, 70), 75, y);
    y += 9;
  };
  line("Application Ref", app.reference);
  line("Status", app.status.toUpperCase());
  line("Course Applied For", courseName);
  line("Full Name", app.full_name);
  line("Date of Birth", app.dob);
  line("Gender", app.gender);
  line("Phone", app.phone);
  line("Email", app.email);
  line("Address", app.address);
  line("Guardian Name", app.guardian_name);
  line("Guardian Phone", app.guardian_phone);
  line("Previous Education", app.previous_education);
  line("Submitted On", formatDate(app.submitted_at));
  if (app.student_id) line("A-TECH Student ID", app.student_id);
  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, 196, y);
  y += 16;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("This is a system-generated application form and is valid without signature.", 14, y);
  footer(doc, app.reference);
  doc.save(`ATECH_Application_${app.reference}.pdf`);
}

export async function downloadAcceptancePDF(app: ApplicationRecord, course: Course) {
  const doc = await newDoc();
  header(doc, "LETTER OF ACCEPTANCE");
  let y = 55;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 24, 28);
  const body = [
    `Dear ${app.full_name},`,
    "",
    "Congratulations! We are pleased to inform you that your application to A-TECH",
    "Computer Training has been ACCEPTED for the course:",
    "",
    `     ${course.name} (${course.duration})`,
    "",
    `Your A-TECH Student ID has been generated as: ${app.student_id ?? "-"}`,
    "",
    "Please keep this ID safe — you will use it to track your grades and results,",
    "view your class schedule, and receive notifications throughout the programme.",
    "Orientation details will be shared in your notifications inbox.",
    "",
    "We look forward to having you in class.",
    "",
    "The A-TECH Team",
  ];
  body.forEach((l) => {
    doc.text(l, 14, y);
    y += 7;
  });
  footer(doc, app.student_id ?? app.reference);
  doc.save(`ATECH_Acceptance_${(app.student_id ?? app.reference).replace(/\//g, "-")}.pdf`);
}

/* ------------------------ Word (.doc) export ------------------------ */

export function downloadApplicationDoc(app: ApplicationRecord, courseName: string) {
  const rows: Array<[string, string]> = [
    ["Application Ref", app.reference],
    ["Status", app.status.toUpperCase()],
    ["Course Applied For", courseName],
    ["Full Name", app.full_name],
    ["Date of Birth", app.dob ?? "-"],
    ["Gender", app.gender ?? "-"],
    ["Phone", app.phone ?? "-"],
    ["Email", app.email ?? "-"],
    ["Address", app.address ?? "-"],
    ["Guardian Name", app.guardian_name ?? "-"],
    ["Guardian Phone", app.guardian_phone ?? "-"],
    ["Previous Education", app.previous_education ?? "-"],
    ["Submitted On", formatDate(app.submitted_at)],
    ["A-TECH Student ID", app.student_id ?? "-"],
  ];
  const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head>
  <body style="font-family:Arial,sans-serif;color:#20242c">
    <div style="background:#1F3864;color:#fff;padding:14px">
      <div style="font-family:Georgia,serif;font-size:19px;font-weight:bold">A-TECH COMPUTER TRAINING</div>
      <div style="color:#E4C458;font-size:11px">${ATECH.tagline} — ${ATECH.address}</div>
    </div>
    <h2 style="border-bottom:2px solid #C9A227;padding-bottom:6px">COURSE APPLICATION FORM</h2>
    <table cellpadding="6" style="border-collapse:collapse;width:100%">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="width:200px;color:#5B6270;font-weight:bold;border-bottom:1px solid #eee">${k}</td><td style="border-bottom:1px solid #eee">${v}</td></tr>`,
        )
        .join("")}
    </table>
    <p style="color:#888;font-style:italic;font-size:11px">This is a system-generated application form and is valid without signature.</p>
  </body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ATECH_Application_${app.reference}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
