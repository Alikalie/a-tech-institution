import classroom from "@/assets/education-classroom.jpg";
import study from "@/assets/education-study.jpg";

export const educationImages = { classroom, study };
export const pageSettings = [
  ["home", "Home"], ["about", "About A-TECH"], ["courses", "Courses"],
  ["admissions", "Admission"], ["contact", "Contact"], ["application", "Application form"],
] as const;

export function imageSource(value: string | undefined, fallback = classroom) {
  if (value === "study") return study;
  if (!value || value === "classroom") return fallback;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : fallback; }
  catch { return fallback; }
}

export function publicLink(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : undefined; }
  catch { return undefined; }
}