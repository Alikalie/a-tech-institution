import type { jsPDF } from "jspdf";

export const documentColors = { blue: [12, 73, 157], deep: [4, 29, 75], yellow: [248, 192, 31], paper: [255, 255, 255] } as const;
export function brandFrame(doc: jsPDF, title: string, subtitle: string) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setFillColor(...documentColors.deep);
  doc.rect(0, 0, width, 44, "F");
  doc.setFillColor(...documentColors.blue);
  doc.lines([[width, 0], [0, 17], [-width, 24]], 0, 0, [1, 1], "F", true);
  doc.setDrawColor(...documentColors.yellow);
  doc.setLineWidth(2);
  doc.line(0, 45, width, 38);
  doc.setFillColor(...documentColors.deep);
  doc.triangle(0, height - 25, 0, height, 33, height, "F");
  doc.triangle(width, height - 32, width, height, width - 42, height, "F");
  doc.setDrawColor(...documentColors.yellow);
  doc.line(0, height - 26, 34, height);
  doc.line(width - 43, height, width, height - 33);
  doc.setTextColor(...documentColors.paper);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("A-TECH", width > 250 ? 15 : 34, 17);
  doc.setFontSize(5.5);
  doc.text("INTEGRATED TECHNOLOGY", 15, 32);
  doc.text("& DATA ANALYSIS", 15, 36);
  doc.setTextColor(...documentColors.yellow);
  doc.setFont("times", "bold");
  doc.setFontSize(width > 250 ? 33 : 24);
  doc.text(title, width > 250 ? 85 : 85, 21);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(width > 250 ? 13 : 9);
  doc.setTextColor(...documentColors.paper);
  doc.text(subtitle, 85, 30);
}

export async function loadBrandLogo() {
  const response = await fetch("/atech-mark.jpg");
  if (!response.ok) return null;
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Logo could not load"));
    reader.readAsDataURL(blob);
  });
}