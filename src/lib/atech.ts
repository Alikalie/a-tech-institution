import logoAsset from "@/assets/atech-logo.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";

export async function loadLetterSettings() {
  const { data } = await supabase.from("site_content").select("key, value");
  const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return {
    body: m["acceptance_body"],
    signatoryName: m["signatory_name"],
    signatoryTitle: m["signatory_title"],
    phone: m["contact_phone"],
    email: m["contact_email"],
  };
}

export const ATECH = {
  name: "A-TECH Computer Training",
  tagline: "Integrated Technology & Data Analysis",
  address: "Moriba Town, Impere Junction",
} as const;

export type Course = { code: string; name: string; duration: string; price?: string | null };

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
  prefix?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  nationality?: string | null;
  marital_status?: string | null;
  id_number?: string | null;
  whatsapp?: string | null;
  emergency_phone?: string | null;
  country?: string | null;
  province?: string | null;
  district?: string | null;
  city?: string | null;
  street?: string | null;
  kin_name?: string | null;
  kin_relationship?: string | null;
  kin_address?: string | null;
  kin_email?: string | null;
  kin_phone?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  blood_group?: string | null;
  disability?: string | null;
  disability_details?: string | null;
  education_level?: string | null;
  qualification?: string | null;
  computer_level?: string | null;
  has_laptop?: boolean | null;
  preferred_time?: string | null;
  payment_method?: string | null;
  guarantor_first_name?: string | null;
  guarantor_last_name?: string | null;
  guarantor_relationship?: string | null;
  guarantor_phone?: string | null;
  guarantor_whatsapp?: string | null;
  guarantor_address?: string | null;
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

async function imageDataUrl(url?: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function value(v?: string | boolean | null) {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return v?.trim() || "-";
}

type DocumentSection = { title: string; rows: Array<[string, string | boolean | null | undefined]> };

function applicationSections(app: ApplicationRecord, courseName: string): DocumentSection[] {
  return [
    {
      title: "PERSONAL INFORMATION",
      rows: [
        ["First Name", app.first_name], ["Middle Name", app.middle_name], ["Last Name", app.last_name],
        ["Previous Name", "-"], ["Email", app.email], ["ID / Passport", app.id_number],
        ["Nationality", app.nationality], ["Phone", app.phone], ["Gender", app.gender],
        ["Date of Birth", app.dob], ["Marital Status", app.marital_status],
      ],
    },
    {
      title: "CURRENT ADDRESS",
      rows: [
        ["Country", app.country], ["Province / Region", app.province], ["District", app.district],
        ["City / Town", app.city], ["Street", app.street], ["Address", app.address],
      ],
    },
    {
      title: "CONTACT INFORMATION",
      rows: [
        ["Email", app.email], ["Phone", app.phone], ["WhatsApp", app.whatsapp],
        ["Parent / Guardian Phone", app.guardian_phone], ["Emergency / Reference Phone", app.emergency_phone],
      ],
    },
    {
      title: "MEDICAL & DISABILITY",
      rows: [["Blood Group", app.blood_group], ["Disability", app.disability], ["Disability Details", app.disability_details]],
    },
    {
      title: "NEXT OF KIN / GUARDIAN",
      rows: [
        ["Name", app.kin_name], ["Relationship", app.kin_relationship], ["Address", app.kin_address],
        ["Email", app.kin_email], ["Telephone", app.kin_phone],
      ],
    },
    {
      title: "PARENT / GUARDIAN DETAILS",
      rows: [["Father's Name", app.father_name], ["Mother's Name", app.mother_name], ["Parent / Guardian Phone", app.guardian_phone]],
    },
    {
      title: "PROGRAMME SOUGHT",
      rows: [
        ["Course / Programme", courseName], ["Course Code", app.course_code],
        ["Preferred Time", app.preferred_time], ["Application Status", app.status.toUpperCase()],
        ["A-TECH Student ID", app.student_id],
      ],
    },
    {
      title: "EDUCATION & TECHNOLOGY",
      rows: [
        ["Education Level", app.education_level], ["Qualification", app.qualification],
        ["Previous Education", app.previous_education], ["Computer Literacy", app.computer_level],
        ["Owns a Laptop", app.has_laptop],
      ],
    },
    {
      title: "SPONSOR / GUARANTOR & PAYMENT",
      rows: [
        ["Sponsor / Guarantor", [app.guarantor_first_name, app.guarantor_last_name].filter(Boolean).join(" ")],
        ["Relationship", app.guarantor_relationship], ["Phone", app.guarantor_phone],
        ["WhatsApp", app.guarantor_whatsapp], ["Address", app.guarantor_address],
        ["Payment Method", app.payment_method], ["Submitted", formatDate(app.submitted_at)],
      ],
    },
  ];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addImage(doc: any, data: string | null, x: number, y: number, w: number, h: number) {
  if (!data) return false;
  try {
    doc.addImage(data, data.includes("image/png") ? "PNG" : "JPEG", x, y, w, h, undefined, "FAST");
    return true;
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function overviewHeader(doc: any, ref: string, logo: string | null, photo: string | null) {
  addImage(doc, logo, 15, 10, 24, 24);
  if (!addImage(doc, photo, 169, 9, 25, 30)) {
    doc.setDrawColor(150, 150, 150);
    doc.rect(169, 9, 25, 30);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("PASSPORT", 181.5, 23, { align: "center" });
    doc.text("PHOTO", 181.5, 27, { align: "center" });
  }
  doc.setTextColor(24, 27, 33);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("A-TECH COMPUTER TRAINING", 105, 17, { align: "center" });
  doc.setFontSize(12);
  doc.text("APPLICATION OVERVIEW", 105, 26, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(ATECH.tagline, 105, 32, { align: "center" });
  doc.setTextColor(31, 56, 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Application Code: ${ref}`, 105, 47, { align: "center" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function footer(doc: any, ref: string, page?: number) {
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const pageText = page ? `Page ${page}  |  ` : "";
  doc.text(`${pageText}${ref}  |  Generated ${new Date().toLocaleString()}  |  A-TECH`, 105, 289, { align: "center" });
}

export async function downloadApplicationPDF(app: ApplicationRecord, courseName: string, photoUrl?: string | null) {
  const doc = await newDoc();
  const [logo, photo] = await Promise.all([imageDataUrl(logoAsset.url), imageDataUrl(photoUrl)]);
  const sections = applicationSections(app, courseName);
  let page = 1;
  let y = 57;
  overviewHeader(doc, app.reference, logo, photo);
  for (const section of sections) {
    const required = 10 + section.rows.length * 6.5;
    if (y + required > 278) {
      footer(doc, app.reference, page);
      doc.addPage();
      page += 1;
      overviewHeader(doc, app.reference, logo, photo);
      y = 57;
    }
    doc.setFillColor(229, 229, 229);
    doc.setDrawColor(95, 95, 95);
    doc.rect(14, y, 182, 8, "FD");
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(section.title, 16, y + 5.5);
    y += 13;
    for (const [label, raw] of section.rows) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`${label}:`, 16, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(value(raw), 118);
      doc.text(lines.slice(0, 2), 73, y);
      y += Math.max(6.5, lines.slice(0, 2).length * 4.5);
    }
    y += 3;
  }
  footer(doc, app.reference, page);
  doc.save(`ATECH_Application_${app.reference}.pdf`);
}

export type LetterSettings = {
  body?: string | undefined;
  signatoryName?: string | undefined;
  signatoryTitle?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
};

export function fillTemplate(tpl: string, app: ApplicationRecord, course: Course) {
  return tpl
    .replace(/\{name\}/g, app.full_name)
    .replace(/\{course\}/g, course.name)
    .replace(/\{duration\}/g, course.duration || "-")
    .replace(/\{price\}/g, course.price?.trim() || "To be confirmed")
    .replace(/\{student_id\}/g, app.student_id ?? "-")
    .replace(/\{reference\}/g, app.reference);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function poly(doc: any, pts: [number, number][], rgb: [number, number, number]) {
  doc.setFillColor(...rgb);
  const [x0, y0] = pts[0]!;
  const rel = pts.slice(1).map((p, i) => [p[0] - pts[i]![0], p[1] - pts[i]![1]]);
  doc.lines(rel, x0, y0, [1, 1], "F", true);
}

const NAVY: [number, number, number] = [31, 56, 100];
const GOLD: [number, number, number] = [201, 162, 39];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function corporateLetterhead(doc: any, logo: string | null, s: LetterSettings) {
  poly(doc, [[0, 12], [92, 12], [82, 34], [0, 34]], NAVY);
  poly(doc, [[96, 12], [210, 12], [210, 34], [86, 34]], GOLD);
  poly(doc, [[84, 12], [95, 12], [85, 34], [80, 34]], [255, 255, 255]);
  addImage(doc, logo, 8, 14, 18, 18);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("A-TECH", 30, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(228, 196, 88);
  doc.text(ATECH.tagline.toUpperCase(), 30, 27);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Address", 100, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(ATECH.address, 100, 24);
  doc.text("Sierra Leone", 100, 28.5);
  doc.text(`Tel: ${s.phone || "+23277864684"}`, 150, 21);
  doc.text(`Email: ${s.email || "fofanahalikalie0@gmail.com"}`, 150, 26);
  // footer bars
  poly(doc, [[0, 284], [150, 284], [145, 290], [0, 290]], GOLD);
  poly(doc, [[154, 284], [210, 284], [210, 290], [149, 290]], NAVY);
}

export async function downloadAcceptancePDF(app: ApplicationRecord, course: Course, settings: LetterSettings = {}) {
  const doc = await newDoc();
  const logo = await imageDataUrl(logoAsset.url);
  corporateLetterhead(doc, logo, settings);

  doc.setTextColor(20, 24, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(app.full_name, 18, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text("Admitted Student", 18, 54.5);
  const meta: [string, string][] = [
    ["ID", app.student_id ?? "-"],
    ["E", app.email ?? "-"],
    ["P", app.phone ?? "-"],
  ];
  meta.forEach(([k, v], i) => {
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.text(k, 18, 60 + i * 4.5);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`:  ${v}`, 25, 60 + i * 4.5);
  });
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, 192, 69, { align: "right" });

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("LETTER OF ACCEPTANCE", 105, 84, { align: "center" });
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(70, 87, 140, 87);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");
  let y = 98;
  doc.text(`Dear ${app.full_name},`, 18, y);
  y += 9;
  const body = fillTemplate(settings.body?.trim() || DEFAULT_ACCEPTANCE, app, course);
  for (const para of body.split(/\n/)) {
    if (!para.trim()) { y += 3; continue; }
    const lines = doc.splitTextToSize(para, 174);
    doc.text(lines, 18, y, { lineHeightFactor: 1.5 });
    y += lines.length * 5.6;
  }
  y = Math.max(y + 12, 225);
  doc.text("Yours faithfully,", 18, y);
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text(settings.signatoryName || "A-TECH Administration", 18, y + 14);
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.line(18, y + 17, 80, y + 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(settings.signatoryName || "A-TECH Administration", 18, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text(settings.signatoryTitle || "Director", 18, y + 26.5);

  doc.save(`ATECH_Acceptance_${(app.student_id ?? app.reference).replace(/\//g, "-")}.pdf`);
}

export const DEFAULT_ACCEPTANCE = `Congratulations! We are pleased to inform you that your application to A-TECH has been ACCEPTED for the course {course}.

Course duration: {duration}
Course fee: {price}
Your A-TECH Student ID: {student_id}

We look forward to having you in class.`;

/* ------------------------ Word (.doc) export ------------------------ */

export async function downloadApplicationDoc(app: ApplicationRecord, courseName: string, photoUrl?: string | null) {
  const [logo, photo] = await Promise.all([imageDataUrl(logoAsset.url), imageDataUrl(photoUrl)]);
  const esc = (input: string) => input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c] ?? c);
  const sections = applicationSections(app, courseName);
  const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head>
  <body style="font-family:Arial,sans-serif;color:#181b21;margin:28px">
    <table style="width:100%;border-collapse:collapse"><tr>
      <td style="width:18%">${logo ? `<img src="${logo}" width="82" height="82"/>` : ""}</td>
      <td style="width:64%;text-align:center"><div style="font-size:22px;font-weight:bold">A-TECH COMPUTER TRAINING</div><div style="font-size:17px;font-weight:bold;margin-top:10px">APPLICATION OVERVIEW</div><div style="font-size:11px;margin-top:6px">${ATECH.tagline}</div></td>
      <td style="width:18%;text-align:right">${photo ? `<img src="${photo}" width="90" height="105"/>` : `<div style="display:inline-block;border:1px solid #777;width:90px;height:105px;text-align:center;font-size:10px;line-height:105px">PASSPORT PHOTO</div>`}</td>
    </tr></table>
    <p style="text-align:center;color:#1F3864;font-size:16px;font-weight:bold">Application Code: ${esc(app.reference)}</p>
    ${sections.map((section) => `<div style="page-break-inside:avoid"><h3 style="background:#E5E5E5;border:1px solid #666;padding:6px;font-size:14px;margin:18px 0 6px">${section.title}</h3><table cellpadding="4" style="border-collapse:collapse;width:100%;font-size:12px">${section.rows.map(([k, v]) => `<tr><td style="width:32%;font-weight:bold">${esc(k)}:</td><td>${esc(value(v))}</td></tr>`).join("")}</table></div>`).join("")}
    <p style="margin-top:28px;text-align:center;color:#777;font-size:9px">${esc(app.reference)} | Generated ${new Date().toLocaleString()} | A-TECH Computer Training</p>
  </body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ATECH_Application_${app.reference}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
