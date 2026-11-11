import { useSiteContent } from "@/hooks/useSiteContent";
import { imageSource } from "@/lib/site-settings";

export function EducationHero({ page, title, description }: { page: string; title: string; description?: string }) {
  const { data } = useSiteContent();
  return <section className="education-hero relative isolate overflow-hidden border-b-4 border-accent px-5 py-12 sm:py-20">
    <img src={imageSource(data?.[`${page}_background`])} alt="" width={1536} height={1024} className="absolute inset-0 -z-20 h-full w-full object-cover object-right" />
    <div className="education-shade absolute inset-0 -z-10" />
    <div className="mx-auto max-w-6xl"><h1 className="max-w-2xl break-words text-3xl font-bold text-primary-foreground sm:text-4xl">{data?.[`${page}_title`] || title}</h1>
      {(data?.[`${page}_intro`] || description) && <p className="mt-4 max-w-xl whitespace-pre-line text-primary-foreground">{data?.[`${page}_intro`] || description}</p>}
    </div>
  </section>;
}