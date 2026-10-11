const logoAsset = { url: "/atech-mark.jpg" };
import { supabase } from "@/integrations/supabase/client";

export type IdCard = {
  id: string;
  user_id: string;
  student_id: string;
  full_name: string;
  programme: string;
  dob: string | null;
  photo_path: string | null;
  issued_at: string;
  valid_until: string;
};

async function toDataUrl(url?: string | null) {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const b = await r.blob();
    return await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(b);
    });
  } catch {
    return null;
  }
}

function fmt(d?: string | null) {
  if (!d) return "-";
  const x = new Date(d);
  return Number.isNaN(x.getTime())
    ? d
    : x.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

/** CR80 portrait ID card (54 x 85.6 mm) matching the A-TECH navy/gold style, with QR code. */
export async function downloadIdCard(card: IdCard) {
  const [{ jsPDF }, QR] = await Promise.all([import("jspdf"), import("qrcode")]);
  let photoUrl: string | null = null;
  if (card.photo_path) {
    const s = await supabase.storage.from("application-documents").createSignedUrl(card.photo_path, 300);
    photoUrl = s.data?.signedUrl ?? null;
  }
  const [logo, photo] = await Promise.all([toDataUrl(logoAsset.url), toDataUrl(photoUrl)]);
  const qr = await QR.toDataURL(
    JSON.stringify({ org: "A-TECH", id: card.student_id, name: card.full_name, valid: card.valid_until }),
    { margin: 0, width: 300, color: { dark: "#1F3864", light: "#FFFFFF" } },
  );

  const W = 54, H = 85.6;
  const doc = new jsPDF({ unit: "mm", format: [W, H], orientation: "portrait" });
  const navy: [number, number, number] = [31, 56, 100];
  const blue: [number, number, number] = [26, 82, 160];
  const gold: [number, number, number] = [245, 180, 30];

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 34, "F");
  // side blue wedges
  doc.setFillColor(...blue);
  doc.triangle(0, 30, 18, 38, 0, 44, "F");
  doc.triangle(W, 30, W - 18, 38, W, 44, "F");
  // gold chevron
  doc.setFillColor(...gold);
  doc.triangle(0, 24, W / 2, 41, 0, 30, "F");
  doc.triangle(0, 30, W / 2, 41, W / 2, 47, "F");
  doc.triangle(W, 24, W / 2, 41, W, 30, "F");
  doc.triangle(W, 30, W / 2, 41, W / 2, 47, "F");

  if (logo) doc.addImage(logo, "JPEG", W / 2 - 4, 2.5, 8, 8);
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("A-TECH", W / 2, 13.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.6);
  doc.text("INTEGRATED TECHNOLOGY & DATA ANALYSIS", W / 2, 16, { align: "center" });

  // photo frame (hexagon-like: navy border + white square)
  const px = W / 2 - 10, py = 18, ps = 20;
  doc.setFillColor(...navy);
  doc.rect(px - 1, py - 1, ps + 2, ps + 4, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(px, py, ps, ps + 2, "F");
  if (photo) {
    const fmtType = photo.startsWith("data:image/png") ? "PNG" : "JPEG";
    doc.addImage(photo, fmtType, px + 0.5, py + 0.5, ps - 1, ps + 1);
  } else {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(4);
    doc.text("PHOTO", W / 2, py + 11, { align: "center" });
  }

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.text("Name:", W / 2, 50.5, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(card.full_name.length > 22 ? 6.5 : 8.5);
  doc.text(card.full_name, W / 2, 55, { align: "center", maxWidth: W - 6 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.6);
  const lines = [
    `ID Number: ${card.student_id}`,
    ...doc.splitTextToSize(`Programme: ${card.programme || "-"}`, W - 8),
    `Date of Birth: ${fmt(card.dob)}`,
    `Valid Until: ${fmt(card.valid_until)}`,
  ];
  let y = 59.5;
  for (const l of lines.slice(0, 5)) {
    doc.text(l, W / 2, y, { align: "center" });
    y += 2.4;
  }
  doc.addImage(qr, "PNG", W / 2 - 6.5, H - 15, 13, 13);
  doc.setFontSize(3);
  doc.text("Scan to verify", W / 2, H - 1, { align: "center" });

  doc.save(`ATECH_ID_${card.student_id.replace(/\//g, "-")}.pdf`);
}
